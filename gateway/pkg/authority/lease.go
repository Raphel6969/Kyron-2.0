package authority

import (
	"crypto/ed25519"
	"encoding/hex"
	"errors"
	"fmt"
	"sync"
	"time"
)

var (
	ErrLeaseExpired       = errors.New("capability lease has expired")
	ErrLeaseExhausted     = errors.New("capability lease maximum invocations exhausted")
	ErrInvalidSignature   = errors.New("capability lease signature verification failed")
	ErrTrajectoryMismatch = errors.New("capability lease trajectory mismatch")
	ErrActionMismatch     = errors.New("capability lease action mismatch")
)

// Lease represents a single-use or scoped capability lease granting execution authority (F18)
type Lease struct {
	ID             string    `json:"id"`
	TrajectoryID   string    `json:"trajectory_id"`
	Action         string    `json:"action"` // Tool name or "*" for wildcard
	RecipientGroup []string  `json:"recipient_group"`
	MaxCalls       uint32    `json:"max_calls"`
	CallsUsed      uint32    `json:"calls_used"`
	TTLSeconds     uint32    `json:"ttl_seconds"`
	PolicyVersion  uint32    `json:"policy_version"`
	Signature      string    `json:"signature"`
	ExpiresAt      time.Time `json:"expires_at"`

	mu sync.Mutex `json:"-"`
}

// CanonicalPayload returns the deterministic string representation for cryptographic signing
func (l *Lease) CanonicalPayload() string {
	return fmt.Sprintf("%s:%s:%s:%d:%d:%d",
		l.ID,
		l.TrajectoryID,
		l.Action,
		l.MaxCalls,
		l.PolicyVersion,
		l.ExpiresAt.Unix(),
	)
}

// Sign generates an Ed25519 digital signature over the canonical lease payload
func (l *Lease) Sign(privKey ed25519.PrivateKey) error {
	if len(privKey) != ed25519.PrivateKeySize {
		return errors.New("invalid Ed25519 private key size")
	}
	payload := []byte(l.CanonicalPayload())
	sig := ed25519.Sign(privKey, payload)
	l.Signature = hex.EncodeToString(sig)
	return nil
}

// Verify validates the Ed25519 digital signature against the public key
func (l *Lease) Verify(pubKey ed25519.PublicKey) error {
	if len(pubKey) != ed25519.PublicKeySize {
		return errors.New("invalid Ed25519 public key size")
	}
	sigBytes, err := hex.DecodeString(l.Signature)
	if err != nil {
		return fmt.Errorf("failed to decode signature hex: %w", err)
	}
	payload := []byte(l.CanonicalPayload())
	if !ed25519.Verify(pubKey, payload, sigBytes) {
		return ErrInvalidSignature
	}
	return nil
}

// IsExpired evaluates whether the lease is past its valid UTC time-to-live
func (l *Lease) IsExpired(now time.Time) bool {
	return now.After(l.ExpiresAt) || now.Equal(l.ExpiresAt)
}

// IsExhausted checks whether the lease has reached its invocation limit
func (l *Lease) IsExhausted() bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	return l.CallsUsed >= l.MaxCalls
}

// Consume atomically verifies expiration and invocation count, incrementing usage by 1
func (l *Lease) Consume(now time.Time) (uint32, error) {
	l.mu.Lock()
	defer l.mu.Unlock()

	if now.After(l.ExpiresAt) || now.Equal(l.ExpiresAt) {
		return l.CallsUsed, ErrLeaseExpired
	}
	if l.CallsUsed >= l.MaxCalls {
		return l.CallsUsed, ErrLeaseExhausted
	}

	l.CallsUsed++
	return l.CallsUsed, nil
}

// NewLease constructs and signs a capability lease with an explicit TTL
func NewLease(
	id string,
	trajectoryID string,
	action string,
	recipientGroup []string,
	maxCalls uint32,
	ttlSeconds uint32,
	policyVersion uint32,
	privKey ed25519.PrivateKey,
) (*Lease, error) {
	now := time.Now().UTC()
	expiresAt := now.Add(time.Duration(ttlSeconds) * time.Second)

	lease := &Lease{
		ID:             id,
		TrajectoryID:   trajectoryID,
		Action:         action,
		RecipientGroup: recipientGroup,
		MaxCalls:       maxCalls,
		CallsUsed:      0,
		TTLSeconds:     ttlSeconds,
		PolicyVersion:  policyVersion,
		ExpiresAt:      expiresAt,
	}

	if err := lease.Sign(privKey); err != nil {
		return nil, fmt.Errorf("failed to sign capability lease: %w", err)
	}

	return lease, nil
}
