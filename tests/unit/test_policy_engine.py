"""
Unit tests for Policy Engine.
"""

import pytest
from packages.policy_engine import (
    PolicyEngine,
    PolicyEvaluationContext,
    PolicyAction
)


def test_policy_allow_under_threshold():
    engine = PolicyEngine(default_mode="deny")
    yaml_policy = """
name: refund-policy
subject:
  agent: FinanceAgent
resource:
  server: stripe
  tool: stripe.refund
rules:
  - description: Allow small refunds under $500
    when:
      amount_lte: 500
    action: allow
    priority: 10
  - description: Require approval for refunds above $500
    when:
      amount_gt: 500
      amount_lte: 5000
    action: require_approval
    priority: 20
  - description: Deny over $5000
    when:
      amount_gt: 5000
    action: deny
    priority: 5
"""
    pdef = engine.parse_yaml_policy(yaml_policy)

    # 1. Under $500 -> Allow
    ctx1 = PolicyEvaluationContext(
        organization_id="org1",
        workspace_id="ws1",
        agent_name="FinanceAgent",
        server_slug="stripe",
        tool_name="stripe.refund",
        arguments={"amount": 250, "customer_id": "cus_123"}
    )
    res1 = engine.evaluate([pdef], ctx1)
    assert res1.action == PolicyAction.ALLOW

    # 2. $2,500 -> Require Approval
    ctx2 = PolicyEvaluationContext(
        organization_id="org1",
        workspace_id="ws1",
        agent_name="FinanceAgent",
        server_slug="stripe",
        tool_name="stripe.refund",
        arguments={"amount": 2500, "customer_id": "cus_123"}
    )
    res2 = engine.evaluate([pdef], ctx2)
    assert res2.action == PolicyAction.REQUIRE_APPROVAL

    # 3. $10,000 -> Deny
    ctx3 = PolicyEvaluationContext(
        organization_id="org1",
        workspace_id="ws1",
        agent_name="FinanceAgent",
        server_slug="stripe",
        tool_name="stripe.refund",
        arguments={"amount": 10000, "customer_id": "cus_123"}
    )
    res3 = engine.evaluate([pdef], ctx3)
    assert res3.action == PolicyAction.DENY


def test_policy_deny_by_default():
    engine = PolicyEngine(default_mode="deny")
    ctx = PolicyEvaluationContext(
        organization_id="org1",
        workspace_id="ws1",
        agent_name="UnknownAgent",
        server_slug="stripe",
        tool_name="stripe.unknown",
        arguments={}
    )
    res = engine.evaluate([], ctx)
    assert res.action == PolicyAction.DENY
