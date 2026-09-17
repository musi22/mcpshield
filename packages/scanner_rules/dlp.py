"""
MCPShield Data Loss Prevention (DLP) and Prompt Injection Guard
Detects sensitive tokens, credentials, PII, and adversarial prompt injection payloads.
"""

from typing import Any, Dict, List, Tuple
from enum import Enum
from pydantic import BaseModel, Field
import re


class DLPAction(str, Enum):
    ALLOW = "allow"
    LOG = "log"
    REDACT = "redact"
    BLOCK = "block"


class SensitivityCategory(str, Enum):
    API_KEY = "api_key"
    AWS_CREDENTIAL = "aws_credential"
    GITHUB_TOKEN = "github_token"
    JWT_TOKEN = "jwt_token"
    PRIVATE_KEY = "private_key"
    CREDIT_CARD = "credit_card"
    SSN = "ssn"
    EMAIL = "email"
    PHONE = "phone"
    PROMPT_INJECTION = "prompt_injection"


class DLPMatch(BaseModel):
    category: SensitivityCategory
    pattern_name: str
    matched_text_masked: str
    field_path: str
    action_taken: DLPAction


class DLPResult(BaseModel):
    passed: bool
    action: DLPAction
    matches: List[DLPMatch] = Field(default_factory=list)
    sanitized_data: Any = None
    violation_reason: str = ""


# DLP Regex Patterns
PATTERNS = {
    SensitivityCategory.API_KEY: [
        ("OpenAI API Key", r"sk-[a-zA-Z0-9_-]{20,64}"),
        ("Stripe Key", r"(?:sk|pk)_(?:live|test)_[a-zA-Z0-9]{20,40}"),
        ("Generic Secret", r"(?i)(?:api_key|secret_key|private_key|auth_token)[\s=:\'\"`]{1,4}([a-zA-Z0-9_\-\.]{16,64})"),
    ],
    SensitivityCategory.AWS_CREDENTIAL: [
        ("AWS Access Key", r"(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}"),
    ],
    SensitivityCategory.GITHUB_TOKEN: [
        ("GitHub Personal Access Token", r"gh[pousr]_[a-zA-Z0-9]{36,255}"),
    ],
    SensitivityCategory.JWT_TOKEN: [
        ("JWT Access Token", r"ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*"),
    ],
    SensitivityCategory.PRIVATE_KEY: [
        ("Private Key Block", r"-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----(?:[\s\S]*?-----END (?:[A-Z0-9_-]+ )?PRIVATE KEY-----)?"),
    ],
    SensitivityCategory.CREDIT_CARD: [
        ("Credit Card Number", r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b"),
    ],
    SensitivityCategory.SSN: [
        ("US Social Security Number", r"\b\d{3}-\d{2}-\d{4}\b"),
    ],
    SensitivityCategory.EMAIL: [
        ("Email Address", r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b"),
    ],
    SensitivityCategory.PHONE: [
        ("Phone Number", r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"),
    ],
    SensitivityCategory.PROMPT_INJECTION: [
        ("Instruction Override", r"(?i)(ignore\s+(all\s+)?(previous\s+)?instructions|disregard\s+all\s+prior\s+rules|system\s+override\s+mode)"),
        ("System Prompt Extraction", r"(?i)(print\s+(your\s+)?system\s+prompt|repeat\s+the\s+instructions\s+above|reveal\s+secret\s+key)"),
        ("Tool Redirection Hijack", r"(?i)(call\s+tool\s+immediately|bypass\s+policy\s+engine|ignore\s+security\s+gateway)"),
    ]
}


class DLPInspector:
    """
    Scans and sanitizes inputs/outputs for sensitive tokens and adversarial payloads.
    """

    def __init__(self, default_action: DLPAction = DLPAction.BLOCK):
        self.default_action = default_action

    def _mask(self, val: str) -> str:
        if len(val) <= 6:
            return "***"
        return val[:3] + "..." + val[-3:]

    def inspect_and_sanitize(self, data: Any, enforce_action: DLPAction = DLPAction.BLOCK, path: str = "args") -> DLPResult:
        matches: List[DLPMatch] = []
        sanitized = self._process(data, matches, enforce_action, path)

        blocked = any(m.action_taken == DLPAction.BLOCK for m in matches)
        if blocked:
            reasons = [f"{m.pattern_name} in {m.field_path}" for m in matches if m.action_taken == DLPAction.BLOCK]
            return DLPResult(
                passed=False,
                action=DLPAction.BLOCK,
                matches=matches,
                sanitized_data=None,
                violation_reason=f"Security violation: Sensitive data detected [{', '.join(reasons)}]",
            )

        return DLPResult(
            passed=True,
            action=DLPAction.REDACT if any(m.action_taken == DLPAction.REDACT for m in matches) else DLPAction.ALLOW,
            matches=matches,
            sanitized_data=sanitized,
            violation_reason="",
        )

    def _process(self, item: Any, matches: List[DLPMatch], action: DLPAction, path: str) -> Any:
        if isinstance(item, dict):
            new_dict = {}
            for k, v in item.items():
                new_dict[k] = self._process(v, matches, action, f"{path}.{k}")
            return new_dict
        elif isinstance(item, list):
            return [self._process(v, matches, action, f"{path}[{i}]") for i, v in enumerate(item)]
        elif isinstance(item, str):
            res_str = item
            for category, pattern_list in PATTERNS.items():
                for name, regex in pattern_list:
                    compiled = re.compile(regex)
                    found = compiled.findall(item)
                    if found:
                        for match_val in found:
                            if isinstance(match_val, tuple):
                                match_val = match_val[0]
                            if not match_val:
                                continue

                            # If enforce_action is BLOCK, everything sensitive blocks.
                            # If enforce_action is REDACT, prompt injection still blocks, but secrets/PII are redacted.
                            item_action = action
                            if action == DLPAction.BLOCK:
                                item_action = DLPAction.BLOCK
                            elif category == SensitivityCategory.PROMPT_INJECTION:
                                item_action = DLPAction.BLOCK
                            else:
                                item_action = action

                            matches.append(
                                DLPMatch(
                                    category=category,
                                    pattern_name=name,
                                    matched_text_masked=self._mask(match_val),
                                    field_path=path,
                                    action_taken=item_action,
                                )
                            )
                            if item_action == DLPAction.REDACT:
                                res_str = res_str.replace(match_val, f"[REDACTED_{category.value.upper()}]")
            return res_str
        return item
