package authority

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"sync"
	"time"
)

// RulingType specifies the outcome of an authority evaluation (C6)
type RulingType string

const (
	RulingAllow        RulingType = "allow"
	RulingDeny         RulingType = "deny"
	RulingNeedApproval RulingType = "need_approval"
)

// Ruling represents the deterministic authority verdict for a proposed tool execution
type Ruling struct {
	Decision      RulingType `json:"decision"`
	Reason        string     `json:"reason"`
	Lease         *Lease     `json:"lease,omitempty"`
	EscalationURL string     `json:"escalation_url,omitempty"`
}

// Service implements the Call-Scoped Authority Service (C6)
type Service struct {
	pubKey          ed25519.PublicKey
	privKey         ed25519.PrivateKey
	leases          sync.Map // string (leaseID) -> *Lease
	restrictedTools sync.Map // string (toolName) -> bool
	policyVersion   uint32
	mu              sync.RWMutex
}

// NewService creates a new Authority Service, generating an Ed25519 keypair if none provided
func NewService(pub ed25519.PublicKey, priv ed25519.PrivateKey) (*Service, error) {
	if len(pub) == 0 || len(priv) == 0 {
		newPub, newPriv, err := ed25519.GenerateKey(rand.Reader)
		if err != nil {
			return nil, fmt.Errorf("failed to generate authority Ed25519 keypair: %w", err)
		}
		pub = newPub
		priv = newPriv
	}

	return &Service{
		pubKey:        pub,
		privKey:       priv,
		policyVersion: 1,
	}, nil
}

// PublicKey returns the authority public key for signature verification
func (s *Service) PublicKey() ed25519.PublicKey {
	return s.pubKey
}

// RequireLease marks a tool as requiring an authenticated capability lease before execution
func (s *Service) RequireLease(toolName string) {
	s.restrictedTools.Store(toolName, true)
}

// ReleaseLeaseRequirement removes the capability lease requirement for a tool
func (s *Service) ReleaseLeaseRequirement(toolName string) {
	s.restrictedTools.Delete(toolName)
}

// IsLeaseRequired checks whether a tool requires an explicit capability lease
func (s *Service) IsLeaseRequired(toolName string) bool {
	if val, ok := s.restrictedTools.Load(toolName); ok {
		if b, ok := val.(bool); ok && b {
			return true
		}
	}

	var required bool
	s.restrictedTools.Range(func(key, value interface{}) bool {
		pat, ok := key.(string)
		if !ok {
			return true
		}
		b, ok := value.(bool)
		if ok && b && matchToolPattern(pat, toolName) {
			required = true
			return false
		}
		return true
	})
	return required
}

func matchToolPattern(pattern, target string) bool {
	if pattern == "*" || pattern == target {
		return true
	}
	if strings.HasSuffix(pattern, "*") {
		prefix := strings.TrimSuffix(pattern, "*")
		return strings.HasPrefix(target, prefix)
	}
	if strings.HasPrefix(pattern, "*") {
		suffix := strings.TrimPrefix(pattern, "*")
		return strings.HasSuffix(target, suffix)
	}
	return false
}

// IssueLease creates, signs, and registers a new capability lease
func (s *Service) IssueLease(
	trajectoryID string,
	action string,
	maxCalls uint32,
	ttlSeconds uint32,
	recipientGroup []string,
) (*Lease, error) {
	randomBytes := make([]byte, 8)
	if _, err := rand.Read(randomBytes); err != nil {
		return nil, fmt.Errorf("failed to generate random lease id: %w", err)
	}
	leaseID := fmt.Sprintf("lease-%s", hex.EncodeToString(randomBytes))

	s.mu.RLock()
	policyVer := s.policyVersion
	s.mu.RUnlock()

	lease, err := NewLease(
		leaseID,
		trajectoryID,
		action,
		recipientGroup,
		maxCalls,
		ttlSeconds,
		policyVer,
		s.privKey,
	)
	if err != nil {
		return nil, err
	}

	s.leases.Store(leaseID, lease)
	return lease, nil
}

// IssueLeaseWithResource creates, signs, and registers a capability lease bound to a resource identity (F26)
func (s *Service) IssueLeaseWithResource(
	trajectoryID string,
	action string,
	maxCalls uint32,
	ttlSeconds uint32,
	recipientGroup []string,
	resBinding *ResourceBinding,
) (*Lease, error) {
	randomBytes := make([]byte, 8)
	if _, err := rand.Read(randomBytes); err != nil {
		return nil, fmt.Errorf("failed to generate random lease id: %w", err)
	}
	leaseID := fmt.Sprintf("lease-%s", hex.EncodeToString(randomBytes))

	s.mu.RLock()
	policyVer := s.policyVersion
	s.mu.RUnlock()

	lease, err := NewLeaseWithResource(
		leaseID,
		trajectoryID,
		action,
		recipientGroup,
		maxCalls,
		ttlSeconds,
		policyVer,
		resBinding,
		s.privKey,
	)
	if err != nil {
		return nil, err
	}

	s.leases.Store(leaseID, lease)
	return lease, nil
}

// StoreLease registers an externally issued or received lease
func (s *Service) StoreLease(lease *Lease) {
	s.leases.Store(lease.ID, lease)
}

// GetLease retrieves an active lease by ID
func (s *Service) GetLease(leaseID string) (*Lease, bool) {
	val, ok := s.leases.Load(leaseID)
	if !ok {
		return nil, false
	}
	lease, ok := val.(*Lease)
	return lease, ok
}

// RevokeLease immediately revokes and removes a capability lease
func (s *Service) RevokeLease(leaseID string) bool {
	if _, ok := s.leases.Load(leaseID); ok {
		s.leases.Delete(leaseID)
		return true
	}
	return false
}

// EvaluateCall performs call-scoped authority verification against tool policies and capability leases
func (s *Service) EvaluateCall(
	sessionID string,
	trajectoryID string,
	toolName string,
	callHash string,
	leaseID string,
) (*Ruling, error) {
	leaseRequired := s.IsLeaseRequired(toolName)

	// If tool does not require a lease and no lease was provided, allow execution
	if !leaseRequired && leaseID == "" {
		return &Ruling{
			Decision: RulingAllow,
			Reason:   "Action does not require elevated capability lease",
		}, nil
	}

	// Tool requires a lease but none was provided
	if leaseRequired && leaseID == "" {
		return &Ruling{
			Decision:      RulingNeedApproval,
			Reason:        fmt.Sprintf("Tool '%s' requires an authenticated capability lease", toolName),
			EscalationURL: fmt.Sprintf("http://localhost:8001/v1/approvals/%s", sessionID),
		}, nil
	}

	// Validate provided lease
	lease, exists := s.GetLease(leaseID)
	if !exists {
		return &Ruling{
			Decision: RulingDeny,
			Reason:   fmt.Sprintf("Capability lease '%s' not found or revoked", leaseID),
		}, nil
	}

	// 1. Verify cryptographic signature
	if err := lease.Verify(s.pubKey); err != nil {
		return &Ruling{
			Decision: RulingDeny,
			Reason:   fmt.Sprintf("Capability lease signature invalid: %v", err),
		}, nil
	}

	// 2. Verify trajectory scope
	if lease.TrajectoryID != trajectoryID {
		return &Ruling{
			Decision: RulingDeny,
			Reason: fmt.Sprintf(
				"Capability lease trajectory mismatch: lease bound to '%s', call in '%s'",
				lease.TrajectoryID, trajectoryID,
			),
		}, nil
	}

	// 3. Verify action scope
	if lease.Action != "*" && lease.Action != toolName {
		return &Ruling{
			Decision: RulingDeny,
			Reason: fmt.Sprintf(
				"Capability lease action mismatch: lease covers '%s', requested tool is '%s'",
				lease.Action, toolName,
			),
		}, nil
	}

	// 4. Atomically consume lease invocation
	now := time.Now().UTC()
	_, err := lease.Consume(now)
	if err != nil {
		return &Ruling{
			Decision: RulingDeny,
			Reason:   fmt.Sprintf("Capability lease consumption failed: %v", err),
		}, nil
	}

	return &Ruling{
		Decision: RulingAllow,
		Reason:   fmt.Sprintf("Capability lease '%s' validated and consumed", lease.ID),
		Lease:    lease,
	}, nil
}
