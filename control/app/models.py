from datetime import datetime, timezone
import json
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
)
from control.app.db import Base

class ToolModel(Base):
    __tablename__ = "tools"

    id = Column(String, primary_key=True)  # server_id + ":" + name
    server_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    hash = Column(String, nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_reasons_json = Column(Text, nullable=False, default="[]")
    state = Column(String, nullable=False, default="unregistered", index=True)
    approver_id = Column(String, nullable=True)
    signature = Column(String, nullable=True)
    model_facing = Column(Text, nullable=True)
    original_text = Column(Text, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    @property
    def risk_reasons(self):
        try:
            return json.loads(self.risk_reasons_json)
        except Exception:
            return []

    @risk_reasons.setter
    def risk_reasons(self, val):
        self.risk_reasons_json = json.dumps(val)

class PolicyModel(Base):
    __tablename__ = "policies"

    version = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    mode = Column(String, nullable=False, default="enforce")
    content = Column(Text, nullable=False)
    signature = Column(String, nullable=False)
    signed_by = Column(String, nullable=False)
    is_active = Column(Boolean, nullable=False, default=False, index=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

class AuditEventModel(Base):
    __tablename__ = "audit_events"

    id = Column(String, primary_key=True)
    prev_hash = Column(String, nullable=False)
    session_id = Column(String, nullable=False, index=True)
    trajectory_id = Column(String, nullable=False, index=True)
    call_hash = Column(String, nullable=False)
    tool_id = Column(String, nullable=False)
    verdict = Column(String, nullable=False, index=True)
    reasons_json = Column(Text, nullable=False, default="[]")
    policy_version = Column(Integer, nullable=False)
    model_tokens = Column(Integer, nullable=False, default=0)
    signature = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), index=True)

    @property
    def reasons(self):
        try:
            return json.loads(self.reasons_json)
        except Exception:
            return []

    @reasons.setter
    def reasons(self, val):
        self.reasons_json = json.dumps(val)

class LeaseModel(Base):
    __tablename__ = "leases"

    id = Column(String, primary_key=True)
    trajectory_id = Column(String, nullable=False, index=True)
    action_spec = Column(String, nullable=False)
    constraints_json = Column(Text, nullable=False, default="{}")
    policy_version = Column(Integer, nullable=False, default=1)
    signature = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    calls_used = Column(Integer, nullable=False, default=0)
    max_calls = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    @property
    def constraints(self):
        try:
            return json.loads(self.constraints_json)
        except Exception:
            return {}

    @constraints.setter
    def constraints(self, val):
        self.constraints_json = json.dumps(val)

class ApprovalRequestModel(Base):
    __tablename__ = "approval_requests"

    id = Column(String, primary_key=True)
    trajectory_id = Column(String, nullable=False, index=True)
    kind = Column(String, nullable=False)  # tool_approval | lease_request
    tool_id = Column(String, nullable=True)
    details_json = Column(Text, nullable=False, default="{}")
    status = Column(String, nullable=False, default="pending", index=True)
    decided_by = Column(String, nullable=True)
    decided_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    @property
    def details(self):
        try:
            return json.loads(self.details_json)
        except Exception:
            return {}

    @details.setter
    def details(self, val):
        self.details_json = json.dumps(val)
