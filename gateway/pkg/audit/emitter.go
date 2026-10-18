package audit

import (
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// Event represents an immutable, hash-chained audit event
type Event struct {
	ID               string    `json:"id"`
	PrevHash         string    `json:"prev_hash"`
	SessionID        string    `json:"session_id"`
	TrajectoryID     string    `json:"trajectory_id"`
	CallHash         string    `json:"call_hash"`
	ToolID           string    `json:"tool_id"`
	Verdict          string    `json:"verdict"`
	Reasons          []string  `json:"reasons"`
	PolicyVersion    uint32    `json:"policy_version"`
	ModelTokensSpent uint32    `json:"model_tokens_spent"`
	Signature        string    `json:"signature"`
	Timestamp        time.Time `json:"timestamp"`
}

// Emitter manages the append-only cryptographic event chain
type Emitter struct {
	mu         sync.Mutex
	lastHash   string
	privateKey ed25519.PrivateKey
	publicKey  ed25519.PublicKey
	events     []Event
}

// NewEmitter creates an Emitter with an Ed25519 keypair
func NewEmitter() (*Emitter, error) {
	pub, priv, err := ed25519.GenerateKey(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to generate Ed25519 key: %w", err)
	}
	return &Emitter{
		lastHash:   "0000000000000000000000000000000000000000000000000000000000000000",
		privateKey: priv,
		publicKey:  pub,
		events:     make([]Event, 0),
	}, nil
}

// Emit appends a new signed, hash-chained event
func (e *Emitter) Emit(sessionID, trajectoryID, callHash, toolID, verdict string, reasons []string, policyVersion uint32) (*Event, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	now := time.Now().UTC()
	eventID := fmt.Sprintf("ev_%d", now.UnixNano())

	dataToSign := fmt.Sprintf("%s:%s:%s:%s:%s:%s:%d:%s",
		e.lastHash, sessionID, trajectoryID, callHash, toolID, verdict, policyVersion, now.Format(time.RFC3339Nano),
	)

	sig := ed25519.Sign(e.privateKey, []byte(dataToSign))

	event := Event{
		ID:               eventID,
		PrevHash:         e.lastHash,
		SessionID:        sessionID,
		TrajectoryID:     trajectoryID,
		CallHash:         callHash,
		ToolID:           toolID,
		Verdict:          verdict,
		Reasons:          reasons,
		PolicyVersion:    policyVersion,
		ModelTokensSpent: 0,
		Signature:        hex.EncodeToString(sig),
		Timestamp:        now,
	}

	// Update last hash
	serialized, _ := json.Marshal(event)
	hasher := sha256.New()
	hasher.Write(serialized)
	e.lastHash = hex.EncodeToString(hasher.Sum(nil))

	e.events = append(e.events, event)
	return &event, nil
}

// VerifyChain checks that every event in the chain is untampered
func (e *Emitter) VerifyChain() bool {
	e.mu.Lock()
	defer e.mu.Unlock()

	expectedPrev := "0000000000000000000000000000000000000000000000000000000000000000"
	for _, ev := range e.events {
		if ev.PrevHash != expectedPrev {
			return false
		}
		dataSigned := fmt.Sprintf("%s:%s:%s:%s:%s:%s:%d:%s",
			ev.PrevHash, ev.SessionID, ev.TrajectoryID, ev.CallHash, ev.ToolID, ev.Verdict, ev.PolicyVersion, ev.Timestamp.Format(time.RFC3339Nano),
		)
		sigBytes, err := hex.DecodeString(ev.Signature)
		if err != nil || !ed25519.Verify(e.publicKey, []byte(dataSigned), sigBytes) {
			return false
		}
		serialized, _ := json.Marshal(ev)
		hasher := sha256.New()
		hasher.Write(serialized)
		expectedPrev = hex.EncodeToString(hasher.Sum(nil))
	}
	return true
}
