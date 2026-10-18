package mcp

import (
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
)

// Session tracks an active client agent connection and its trajectory lifecycle
type Session struct {
	ID            string
	TrajectoryID  string
	ClientName    string
	ClientVersion string
	CreatedAt     time.Time
	LastActive    time.Time
	Sequence      uint64
	EgressBytes   uint64
	ActiveLeases  map[string]string // toolName or "*" -> leaseID
	mu            sync.RWMutex
	Metadata      map[string]interface{}
}

// NextSequence increments and returns the monotonically increasing sequence number
func (s *Session) NextSequence() uint64 {
	return atomic.AddUint64(&s.Sequence, 1)
}

// AddEgressBytes atomically adds to the trajectory egress byte counter
func (s *Session) AddEgressBytes(n uint64) uint64 {
	return atomic.AddUint64(&s.EgressBytes, n)
}

// Touch updates the last active timestamp
func (s *Session) Touch() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.LastActive = time.Now()
}

// SetMeta stores arbitrary session metadata
func (s *Session) SetMeta(key string, val interface{}) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.Metadata[key] = val
}

// GetMeta retrieves session metadata
func (s *Session) GetMeta(key string) (interface{}, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	val, ok := s.Metadata[key]
	return val, ok
}

// AttachLease binds a capability lease to a tool or wildcard for this session
func (s *Session) AttachLease(toolName, leaseID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.ActiveLeases == nil {
		s.ActiveLeases = make(map[string]string)
	}
	s.ActiveLeases[toolName] = leaseID
}

// GetAttachedLease retrieves an attached lease ID for a tool name or wildcard
func (s *Session) GetAttachedLease(toolName string) string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.ActiveLeases == nil {
		return ""
	}
	if leaseID, ok := s.ActiveLeases[toolName]; ok {
		return leaseID
	}
	if leaseID, ok := s.ActiveLeases["*"]; ok {
		return leaseID
	}
	return ""
}

// SessionManager manages active sessions across stdio and HTTP/SSE transports
type SessionManager struct {
	sessions map[string]*Session
	mu       sync.RWMutex
}

// NewSessionManager instantiates a new thread-safe session manager
func NewSessionManager() *SessionManager {
	return &SessionManager{
		sessions: make(map[string]*Session),
	}
}

// CreateSession generates a new session and associated trajectory
func (sm *SessionManager) CreateSession(clientName, clientVersion string) *Session {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	sessionID := uuid.New().String()
	trajectoryID := uuid.New().String()

	now := time.Now()
	sess := &Session{
		ID:            sessionID,
		TrajectoryID:  trajectoryID,
		ClientName:    clientName,
		ClientVersion: clientVersion,
		CreatedAt:     now,
		LastActive:    now,
		ActiveLeases:  make(map[string]string),
		Metadata:      make(map[string]interface{}),
	}

	sm.sessions[sessionID] = sess
	return sess
}

// GetSession retrieves an active session by ID
func (sm *SessionManager) GetSession(sessionID string) (*Session, bool) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	sess, ok := sm.sessions[sessionID]
	if ok {
		sess.Touch()
	}
	return sess, ok
}

// RemoveSession deletes a session upon disconnect
func (sm *SessionManager) RemoveSession(sessionID string) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	delete(sm.sessions, sessionID)
}

// Count returns the number of active sessions
func (sm *SessionManager) Count() int {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	return len(sm.sessions)
}
