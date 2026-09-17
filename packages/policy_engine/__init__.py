"""
MCPShield Policy Engine
Deterministic authorization rule evaluation for Model Context Protocol (MCP) infrastructure.
"""

from typing import Any, Dict, List, Optional, Tuple
from enum import Enum
from pydantic import BaseModel, Field
import re
import yaml


class PolicyAction(str, Enum):
    ALLOW = "allow"
    DENY = "deny"
    REQUIRE_APPROVAL = "require_approval"
    REDACT = "redact"


class ComparisonOperator(str, Enum):
    EQ = "eq"
    NEQ = "neq"
    GT = "gt"
    GTE = "gte"
    LT = "lt"
    LTE = "lte"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    IN = "in"
    NOT_IN = "not_in"
    MATCHES_REGEX = "matches_regex"
    STARTS_WITH = "starts_with"
    ENDS_WITH = "ends_with"


class RuleCondition(BaseModel):
    field: str
    operator: ComparisonOperator
    value: Any


class PolicyRule(BaseModel):
    id: Optional[str] = None
    description: Optional[str] = None
    when: Optional[Dict[str, Any]] = None  # Syntactic sugar e.g. {"amount_gt": 500}
    conditions: Optional[List[RuleCondition]] = Field(default_factory=list)
    action: PolicyAction
    priority: int = 100  # Lower number = higher priority


class PolicySubject(BaseModel):
    agent: Optional[str] = None  # wildcard '*' or agent id/name
    user: Optional[str] = None
    team: Optional[str] = None
    environment: Optional[str] = None


class PolicyResource(BaseModel):
    server: Optional[str] = None  # wildcard '*' or server slug
    tool: Optional[str] = None  # wildcard '*' or tool name
    resource_uri: Optional[str] = None


class PolicyDefinition(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    enabled: bool = True
    subject: PolicySubject
    resource: PolicyResource
    rules: List[PolicyRule] = Field(default_factory=list)
    default_action: Optional[PolicyAction] = None


class PolicyEvaluationContext(BaseModel):
    organization_id: str
    workspace_id: str
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    user_id: Optional[str] = None
    server_slug: str
    tool_name: Optional[str] = None
    method: str = "tools/call"
    environment: str = "production"
    arguments: Dict[str, Any] = Field(default_factory=dict)
    risk_score: int = 0
    client_ip: Optional[str] = None
    time_of_day_utc: Optional[str] = None  # HH:MM


class PolicyDecision(BaseModel):
    action: PolicyAction
    matched_policy_id: Optional[str] = None
    matched_policy_name: Optional[str] = None
    matched_rule_id: Optional[str] = None
    reason: str
    risk_score: int = 0
    redacted_fields: List[str] = Field(default_factory=list)


class PolicyEngine:
    """
    Deterministic rule engine that resolves access decisions for MCP requests.
    Supports priorities, deny-overrides, and granular argument comparisons.
    """

    def __init__(self, default_mode: str = "deny"):
        self.default_mode = PolicyAction.DENY if default_mode == "deny" else PolicyAction.ALLOW

    def parse_yaml_policy(self, yaml_str: str) -> PolicyDefinition:
        data = yaml.safe_load(yaml_str)
        return self._normalize_policy(data)

    def _normalize_policy(self, data: Dict[str, Any]) -> PolicyDefinition:
        rules = []
        for raw_rule in data.get("rules", []):
            conditions = []
            # Check explicit conditions list
            for raw_cond in raw_rule.get("conditions", []):
                if isinstance(raw_cond, dict):
                    op_val = raw_cond.get("operator", "eq")
                    try:
                        op = ComparisonOperator(op_val.lower())
                    except ValueError:
                        op = ComparisonOperator.EQ
                    conditions.append(RuleCondition(
                        field=raw_cond.get("field", ""),
                        operator=op,
                        value=raw_cond.get("value")
                    ))
                elif isinstance(raw_cond, RuleCondition):
                    conditions.append(raw_cond)

            # Check syntactic sugar 'when'
            when = raw_rule.get("when", {})
            if isinstance(when, dict):
                for key, val in when.items():
                    cond = self._parse_shorthand_condition(key, val)
                    if cond:
                        conditions.append(cond)

            rule = PolicyRule(
                id=raw_rule.get("id"),
                description=raw_rule.get("description"),
                when=when if isinstance(when, dict) else {},
                conditions=conditions,
                action=PolicyAction(raw_rule.get("action", "deny")),
                priority=raw_rule.get("priority", 100),
            )
            rules.append(rule)

        subject = PolicySubject(**data.get("subject", {}))
        resource = PolicyResource(**data.get("resource", {}))

        return PolicyDefinition(
            id=data.get("id"),
            name=data.get("name", "unnamed-policy"),
            description=data.get("description", ""),
            enabled=data.get("enabled", True),
            subject=subject,
            resource=resource,
            rules=rules,
            default_action=PolicyAction(data["default_action"]) if "default_action" in data else None,
        )

    def _parse_shorthand_condition(self, key: str, val: Any) -> Optional[RuleCondition]:
        op_map = {
            "_gt": ComparisonOperator.GT,
            "_gte": ComparisonOperator.GTE,
            "_lt": ComparisonOperator.LT,
            "_lte": ComparisonOperator.LTE,
            "_eq": ComparisonOperator.EQ,
            "_neq": ComparisonOperator.NEQ,
            "_contains": ComparisonOperator.CONTAINS,
            "_regex": ComparisonOperator.MATCHES_REGEX,
            "_in": ComparisonOperator.IN,
        }
        for suffix, op in op_map.items():
            if key.endswith(suffix):
                field_name = key[: -len(suffix)]
                return RuleCondition(field=field_name, operator=op, value=val)

        # Exact match fallback
        return RuleCondition(field=key, operator=ComparisonOperator.EQ, value=val)

    def _evaluate_condition(self, cond: RuleCondition, context: PolicyEvaluationContext) -> bool:
        # Resolve target value from arguments or context securely
        val = None
        if cond.field.startswith("context."):
            ctx_field = cond.field[8:]
            if hasattr(context, ctx_field):
                val = getattr(context, ctx_field)
        elif cond.field in ("tool", "tool_name"):
            val = context.tool_name
        elif cond.field in context.arguments:
            val = context.arguments[cond.field]
        elif hasattr(context, cond.field) and cond.field not in ("arguments",):
            val = getattr(context, cond.field)

        if val is None:
            return False

        try:
            if cond.operator == ComparisonOperator.EQ:
                return str(val).lower() == str(cond.value).lower()
            elif cond.operator == ComparisonOperator.NEQ:
                return str(val).lower() != str(cond.value).lower()
            elif cond.operator == ComparisonOperator.GT:
                return float(val) > float(cond.value)
            elif cond.operator == ComparisonOperator.GTE:
                return float(val) >= float(cond.value)
            elif cond.operator == ComparisonOperator.LT:
                return float(val) < float(cond.value)
            elif cond.operator == ComparisonOperator.LTE:
                return float(val) <= float(cond.value)
            elif cond.operator == ComparisonOperator.CONTAINS:
                return str(cond.value).lower() in str(val).lower()
            elif cond.operator == ComparisonOperator.NOT_CONTAINS:
                return str(cond.value).lower() not in str(val).lower()
            elif cond.operator == ComparisonOperator.IN:
                return val in cond.value if isinstance(cond.value, list) else False
            elif cond.operator == ComparisonOperator.NOT_IN:
                return val not in cond.value if isinstance(cond.value, list) else True
            elif cond.operator == ComparisonOperator.MATCHES_REGEX:
                return bool(re.search(str(cond.value), str(val), re.IGNORECASE))
        except (ValueError, TypeError):
            return False

        return False

    def _matches_subject(self, sub: PolicySubject, ctx: PolicyEvaluationContext) -> bool:
        if sub.agent and sub.agent != "*":
            agent_candidates = [a.lower() for a in [ctx.agent_id, ctx.agent_name] if a]
            if sub.agent.lower() not in agent_candidates:
                return False
        if sub.user and sub.user != "*":
            if not ctx.user_id or sub.user.lower() != ctx.user_id.lower():
                return False
        if sub.environment and sub.environment != "*":
            if sub.environment.lower() != ctx.environment.lower():
                return False
        return True

    def _matches_resource(self, res: PolicyResource, ctx: PolicyEvaluationContext) -> bool:
        if res.server and res.server != "*":
            if res.server.lower() != ctx.server_slug.lower():
                return False
        if res.tool and res.tool != "*":
            if not ctx.tool_name or res.tool.lower() != ctx.tool_name.lower():
                return False
        return True

    def evaluate(self, policies: List[PolicyDefinition], context: PolicyEvaluationContext) -> PolicyDecision:
        """
        Evaluates active policies against context.
        Precedence:
        1. Explicit DENY with highest priority
        2. REQUIRE_APPROVAL
        3. ALLOW
        4. Configured default action (Default: DENY)
        """
        matched_rules: List[Tuple[int, PolicyDefinition, PolicyRule]] = []

        for policy in policies:
            if not policy.enabled:
                continue
            if not self._matches_subject(policy.subject, context):
                continue
            if not self._matches_resource(policy.resource, context):
                continue

            for rule in policy.rules:
                all_met = True
                if rule.conditions:
                    for cond in rule.conditions:
                        if not self._evaluate_condition(cond, context):
                            all_met = False
                            break

                if all_met:
                    matched_rules.append((rule.priority, policy, rule))

        if not matched_rules:
            # Fallback to default
            return PolicyDecision(
                action=self.default_mode,
                reason=f"No matching policy rule found. Applying workspace default '{self.default_mode.value}'.",
                risk_score=context.risk_score,
            )

        # Sort by priority ascending (lower number = higher priority)
        matched_rules.sort(key=lambda x: x[0])

        # Check if any matching rule denies
        for prio, pol, rule in matched_rules:
            if rule.action == PolicyAction.DENY:
                return PolicyDecision(
                    action=PolicyAction.DENY,
                    matched_policy_id=pol.id,
                    matched_policy_name=pol.name,
                    matched_rule_id=rule.id,
                    reason=rule.description or f"Explicit DENY rule in policy '{pol.name}' matched.",
                    risk_score=context.risk_score,
                )

        # Check if any matching rule requires human approval
        for prio, pol, rule in matched_rules:
            if rule.action == PolicyAction.REQUIRE_APPROVAL:
                return PolicyDecision(
                    action=PolicyAction.REQUIRE_APPROVAL,
                    matched_policy_id=pol.id,
                    matched_policy_name=pol.name,
                    matched_rule_id=rule.id,
                    reason=rule.description or f"Approval required by policy '{pol.name}'.",
                    risk_score=context.risk_score,
                )

        # Otherwise pick the highest priority matching rule
        prio, pol, rule = matched_rules[0]
        return PolicyDecision(
            action=rule.action,
            matched_policy_id=pol.id,
            matched_policy_name=pol.name,
            matched_rule_id=rule.id,
            reason=rule.description or f"Action '{rule.action.value}' granted by policy '{pol.name}'.",
            risk_score=context.risk_score,
        )
