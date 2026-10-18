from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any

class ToolScanRequest(BaseModel):
    server_id: str
    name: str
    description: str
    input_schema: Optional[Dict[str, Any]] = None

class ToolApproveRequest(BaseModel):
    approver_id: str = "admin"
    canonical_description: Optional[str] = None

class ToolRejectRequest(BaseModel):
    reason: str

class ToolResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    server_id: str
    name: str
    hash: str
    risk_score: float
    risk_reasons: List[str]
    state: str
    approver_id: Optional[str] = None
    signature: Optional[str] = None
    model_facing: Optional[str] = None
    original_text: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class ToolDiffResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    tool_id: str
    has_drift: bool
    old_hash: str
    new_hash: str
    original_description: str
    model_facing_description: str
    semantic_diff: str

class PolicyCreateRequest(BaseModel):
    version: int
    name: str
    mode: str = "enforce"
    content: str
    signed_by: str = "security-team"

class PolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    version: int
    name: str
    mode: str
    content: str
    signature: str
    signed_by: str
    is_active: bool
    created_at: datetime

class PolicySimulateRequest(BaseModel):
    policy_content: str
    trace_events: List[Dict[str, Any]]

class PolicySimulateResponse(BaseModel):
    total_events: int
    would_allow_count: int
    would_block_count: int
    blocked_tools: List[str]

class LeaseCreateRequest(BaseModel):
    trajectory_id: str
    action_spec: str
    max_calls: int = 1
    ttl_seconds: int = 60
    recipient_group: Optional[List[str]] = None

class LeaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    trajectory_id: str
    action_spec: str
    policy_version: int
    signature: str
    expires_at: datetime
    calls_used: int
    max_calls: int
    created_at: datetime

class ApprovalCreateRequest(BaseModel):
    trajectory_id: str
    kind: str  # tool_approval | lease_request
    tool_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class ApprovalDecisionRequest(BaseModel):
    decided_by: str = "admin"
    reason: Optional[str] = None

class ApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    trajectory_id: str
    kind: str
    tool_id: Optional[str] = None
    details: Dict[str, Any]
    status: str
    decided_by: Optional[str] = None
    decided_at: Optional[datetime] = None
    created_at: datetime

class AuditEventCreate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    id: str
    prev_hash: str
    session_id: str
    trajectory_id: str
    call_hash: str
    tool_id: str
    verdict: str
    reasons: List[str] = []
    policy_version: int = 1
    model_tokens: int = 0
    signature: str

class AuditEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    prev_hash: str
    session_id: str
    trajectory_id: str
    call_hash: str
    tool_id: str
    verdict: str
    reasons: List[str]
    policy_version: int
    model_tokens: int
    signature: str
    created_at: datetime

class AuditExportResponse(BaseModel):
    session_id: str
    total_events: int
    events: List[AuditEventResponse]
    chain_valid: bool
    eu_ai_act_compliance: Dict[str, Any]

class StatusResponse(BaseModel):
    status: str
    version: str
    active_sessions: int
    active_leases: int
    quarantined_tools: int
    pending_approvals: int

class ReportsSummaryResponse(BaseModel):
    total_tools: int
    quarantined_tools: int
    approved_tools: int
    total_audit_events: int
    blocked_calls: int
    allowed_calls: int
