package ledger

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"sync"
	"time"
)

// EffectOutcome states (C7)
const (
	OutcomeCommitted     = "committed"
	OutcomeIndeterminate = "indeterminate"
	OutcomeAborted       = "aborted"
)

var (
	ErrPreconditionMustHave    = errors.New("precondition failure: required effect token missing")
	ErrPreconditionMustNotHave = errors.New("precondition failure: prohibited effect token already occurred")
)

// Effect records a side-effect committed by a tool execution
type Effect struct {
	Token          string    `json:"token"`
	CallHash       string    `json:"call_hash"`
	TrajectoryID   string    `json:"trajectory_id"`
	ToolName       string    `json:"tool_name"`
	Outcome        string    `json:"outcome"` // committed | indeterminate | aborted
	IdempotencyKey string    `json:"idempotency_key,omitempty"`
	EmittedEffects []string  `json:"emitted_effects,omitempty"`
	CachedResult   []byte    `json:"cached_result,omitempty"`
	CommittedAt    time.Time `json:"committed_at"`
}

// Ledger manages side-effect tokens, idempotency, and state reconciliation
type Ledger struct {
	effects          map[string]*Effect
	idempotencyIndex map[string]string // idempotency_key -> token
	mu               sync.RWMutex
}

// NewLedger initializes a new thread-safe Effect Ledger
func NewLedger() *Ledger {
	return &Ledger{
		effects:          make(map[string]*Effect),
		idempotencyIndex: make(map[string]string),
	}
}

// GenerateToken generates a cryptographically random effect token
func GenerateToken() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return fmt.Sprintf("eff-%s", hex.EncodeToString(b))
}

// Record registers an effect into the ledger
func (l *Ledger) Record(
	token, callHash, trajectoryID, toolName, outcome, idempotencyKey string,
	emittedEffects []string,
	cachedResult []byte,
) (*Effect, error) {
	if token == "" {
		token = GenerateToken()
	}

	effect := &Effect{
		Token:          token,
		CallHash:       callHash,
		TrajectoryID:   trajectoryID,
		ToolName:       toolName,
		Outcome:        outcome,
		IdempotencyKey: idempotencyKey,
		EmittedEffects: emittedEffects,
		CachedResult:   cachedResult,
		CommittedAt:    time.Now().UTC(),
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	l.effects[token] = effect
	if idempotencyKey != "" {
		l.idempotencyIndex[idempotencyKey] = token
	}

	return effect, nil
}

// Get retrieves an effect by its primary token
func (l *Ledger) Get(token string) (*Effect, bool) {
	l.mu.RLock()
	defer l.mu.RUnlock()

	eff, ok := l.effects[token]
	return eff, ok
}

// GetByIdempotencyKey retrieves an effect by its idempotency key
func (l *Ledger) GetByIdempotencyKey(key string) (*Effect, bool) {
	l.mu.RLock()
	defer l.mu.RUnlock()

	token, ok := l.idempotencyIndex[key]
	if !ok {
		return nil, false
	}
	eff, ok := l.effects[token]
	return eff, ok
}

// UpdateOutcome transitions an effect's outcome state
func (l *Ledger) UpdateOutcome(token string, newOutcome string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	if eff, ok := l.effects[token]; ok {
		eff.Outcome = newOutcome
		eff.CommittedAt = time.Now().UTC()
		return true
	}
	return false
}

// ReconcileIndeterminate executes a reconciliation job over all indeterminate effects
func (l *Ledger) ReconcileIndeterminate(resolver func(eff *Effect) string) []*Effect {
	l.mu.Lock()
	defer l.mu.Unlock()

	var reconciled []*Effect
	for _, eff := range l.effects {
		if eff.Outcome == OutcomeIndeterminate {
			resolved := resolver(eff)
			if resolved != "" && resolved != OutcomeIndeterminate {
				eff.Outcome = resolved
				eff.CommittedAt = time.Now().UTC()
				reconciled = append(reconciled, eff)
			}
		}
	}

	return reconciled
}

// VerifyPreconditions validates that mustHave happened and mustNotHave did not
func (l *Ledger) VerifyPreconditions(mustHave, mustNotHave, trajectoryEffects []string) error {
	effectSet := make(map[string]bool)
	for _, e := range trajectoryEffects {
		effectSet[e] = true
	}

	for _, req := range mustHave {
		if !effectSet[req] {
			return fmt.Errorf("%w: '%s'", ErrPreconditionMustHave, req)
		}
	}

	for _, dis := range mustNotHave {
		if effectSet[dis] {
			return fmt.Errorf("%w: '%s'", ErrPreconditionMustNotHave, dis)
		}
	}

	return nil
}

// Len returns total number of recorded effects
func (l *Ledger) Len() int {
	l.mu.RLock()
	defer l.mu.RUnlock()
	return len(l.effects)
}
