package audit

import (
	"bufio"
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"sync"
	"time"
)

const GenesisHash = "0000000000000000000000000000000000000000000000000000000000000000"

// Event represents an immutable, hash-chained audit event (C11, F33)
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

// CanonicalSigningPayload derives the deterministic byte sequence signed by Ed25519
func CanonicalSigningPayload(prevHash, sessionID, trajectoryID, callHash, toolID, verdict string, policyVersion uint32, timestamp time.Time) []byte {
	str := fmt.Sprintf("%s:%s:%s:%s:%s:%s:%d:%s",
		prevHash, sessionID, trajectoryID, callHash, toolID, verdict, policyVersion, timestamp.UTC().Format(time.RFC3339Nano),
	)
	return []byte(str)
}

// ComputeEventHash calculates SHA-256 hash of the canonical JSON event representation
func ComputeEventHash(ev *Event) (string, error) {
	data, err := json.Marshal(ev)
	if err != nil {
		return "", err
	}
	hasher := sha256.New()
	hasher.Write(data)
	return hex.EncodeToString(hasher.Sum(nil)), nil
}

// VerificationResult contains the cryptographic audit assessment
type VerificationResult struct {
	Valid          bool      `json:"valid"`
	TotalEvents    int       `json:"total_events"`
	FirstEventTime time.Time `json:"first_event_time,omitempty"`
	LastEventTime  time.Time `json:"last_event_time,omitempty"`
	BrokenAtIndex  *int      `json:"broken_at_index,omitempty"`
	FailureReason  string    `json:"failure_reason,omitempty"`
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
		lastHash:   GenesisHash,
		privateKey: priv,
		publicKey:  pub,
		events:     make([]Event, 0),
	}, nil
}

// NewEmitterWithKey initializes the emitter with a pre-existing private key
func NewEmitterWithKey(priv ed25519.PrivateKey) *Emitter {
	return &Emitter{
		lastHash:   GenesisHash,
		privateKey: priv,
		publicKey:  priv.Public().(ed25519.PublicKey),
		events:     make([]Event, 0),
	}
}

// PublicKeyHex returns the hex-encoded Ed25519 public key
func (e *Emitter) PublicKeyHex() string {
	return hex.EncodeToString(e.publicKey)
}

// PublicKey returns the raw Ed25519 public key
func (e *Emitter) PublicKey() ed25519.PublicKey {
	return e.publicKey
}

// Emit appends a new signed, hash-chained event to the in-memory audit store
func (e *Emitter) Emit(sessionID, trajectoryID, callHash, toolID, verdict string, reasons []string, policyVersion uint32) (*Event, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	now := time.Now().UTC()
	eventID := fmt.Sprintf("ev_%d", now.UnixNano())

	dataToSign := CanonicalSigningPayload(e.lastHash, sessionID, trajectoryID, callHash, toolID, verdict, policyVersion, now)
	sig := ed25519.Sign(e.privateKey, dataToSign)

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

	h, err := ComputeEventHash(&event)
	if err != nil {
		return nil, fmt.Errorf("failed to compute event hash: %w", err)
	}
	e.lastHash = h

	e.events = append(e.events, event)
	return &event, nil
}

// Events returns a copy of all emitted events
func (e *Emitter) Events() []Event {
	e.mu.Lock()
	defer e.mu.Unlock()
	res := make([]Event, len(e.events))
	copy(res, e.events)
	return res
}

// ExportJSONL exports all recorded events in newline-delimited JSON format for EU AI Act compliance
func (e *Emitter) ExportJSONL(w io.Writer) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	for _, ev := range e.events {
		line, err := json.Marshal(ev)
		if err != nil {
			return err
		}
		if _, err := w.Write(append(line, '\n')); err != nil {
			return err
		}
	}
	return nil
}

// LoadJSONL parses a stream of newline-delimited JSON events
func LoadJSONL(r io.Reader) ([]Event, error) {
	scanner := bufio.NewScanner(r)
	var events []Event
	lineNum := 0

	for scanner.Scan() {
		lineNum++
		text := strings.TrimSpace(scanner.Text())
		if len(text) == 0 {
			continue
		}
		var ev Event
		if err := json.Unmarshal([]byte(text), &ev); err != nil {
			return nil, fmt.Errorf("line %d: invalid event JSON: %w", lineNum, err)
		}
		events = append(events, ev)
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return events, nil
}

// VerifyEventStream verifies hash chaining and cryptographic Ed25519 signatures across an event stream
func VerifyEventStream(events []Event, pubKey ed25519.PublicKey) (*VerificationResult, error) {
	if len(events) == 0 {
		return &VerificationResult{
			Valid:       true,
			TotalEvents: 0,
		}, nil
	}

	expectedPrev := GenesisHash
	for i, ev := range events {
		// 1. Verify hash chaining
		if ev.PrevHash != expectedPrev {
			idx := i
			return &VerificationResult{
				Valid:         false,
				TotalEvents:   len(events),
				BrokenAtIndex: &idx,
				FailureReason: fmt.Sprintf("Hash chain broken at event %s (index %d): expected prev_hash '%s', got '%s'", ev.ID, i, expectedPrev, ev.PrevHash),
			}, nil
		}

		// 2. Verify Ed25519 digital signature
		dataSigned := CanonicalSigningPayload(
			ev.PrevHash,
			ev.SessionID,
			ev.TrajectoryID,
			ev.CallHash,
			ev.ToolID,
			ev.Verdict,
			ev.PolicyVersion,
			ev.Timestamp,
		)

		sigBytes, err := hex.DecodeString(ev.Signature)
		if err != nil || len(sigBytes) != ed25519.SignatureSize {
			idx := i
			return &VerificationResult{
				Valid:         false,
				TotalEvents:   len(events),
				BrokenAtIndex: &idx,
				FailureReason: fmt.Sprintf("Malformed signature at event %s (index %d)", ev.ID, i),
			}, nil
		}

		if !ed25519.Verify(pubKey, dataSigned, sigBytes) {
			idx := i
			return &VerificationResult{
				Valid:         false,
				TotalEvents:   len(events),
				BrokenAtIndex: &idx,
				FailureReason: fmt.Sprintf("Cryptographic signature mismatch at event %s (index %d)", ev.ID, i),
			}, nil
		}

		// 3. Compute hash for next link
		h, err := ComputeEventHash(&ev)
		if err != nil {
			return nil, err
		}
		expectedPrev = h
	}

	return &VerificationResult{
		Valid:          true,
		TotalEvents:    len(events),
		FirstEventTime: events[0].Timestamp,
		LastEventTime:  events[len(events)-1].Timestamp,
	}, nil
}

// VerifyChain checks that every event in the emitter is untampered
func (e *Emitter) VerifyChain() bool {
	res, err := VerifyEventStream(e.Events(), e.publicKey)
	if err != nil {
		return false
	}
	return res.Valid
}
