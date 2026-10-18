package policy

import (
	"fmt"
	"os"
	"sync"
	"sync/atomic"

	"kyron.dev/gateway/pkg/authority"
)

// ReloadHook is invoked whenever a new policy bundle is atomically activated
type ReloadHook func(oldBundle, newBundle *PolicyBundle)

// Manager manages declarative TOML policy bundles with lockless atomic hot-reloading (C3, F35)
type Manager struct {
	active    atomic.Pointer[PolicyBundle]
	filePath  string
	hooks     []ReloadHook
	mu        sync.Mutex // guards hooks and reload orchestration
	authority *authority.Service
}

// NewManager creates a new policy manager initialized with an optional initial bundle
func NewManager(initial *PolicyBundle) *Manager {
	m := &Manager{
		hooks: make([]ReloadHook, 0),
	}
	if initial != nil {
		m.active.Store(initial)
	}
	return m
}

// SetAuthority links the AuthorityService to receive synchronized capability lease rules
func (m *Manager) SetAuthority(auth *authority.Service) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.authority = auth
	if active := m.Active(); active != nil && auth != nil {
		m.applyToAuthority(active)
	}
}

// LoadFile reads, parses, and activates a TOML policy bundle from disk
func (m *Manager) LoadFile(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("failed to read policy file '%s': %w", path, err)
	}

	bundle, err := ParseTOML(data)
	if err != nil {
		return fmt.Errorf("failed to compile policy from '%s': %w", path, err)
	}

	m.mu.Lock()
	m.filePath = path
	m.mu.Unlock()

	m.Activate(bundle)
	return nil
}

// Reload re-reads the configured policy file and hot-reloads it with zero downtime
func (m *Manager) Reload() error {
	m.mu.Lock()
	path := m.filePath
	m.mu.Unlock()

	if path == "" {
		return fmt.Errorf("cannot reload policy: no source file path configured")
	}

	return m.LoadFile(path)
}

// LoadTOML parses and activates a policy bundle from raw TOML bytes
func (m *Manager) LoadTOML(data []byte) error {
	bundle, err := ParseTOML(data)
	if err != nil {
		return err
	}
	m.Activate(bundle)
	return nil
}

// Activate atomically swaps the active policy bundle and fires reload callbacks
func (m *Manager) Activate(newBundle *PolicyBundle) {
	m.mu.Lock()
	defer m.mu.Unlock()

	oldBundle := m.active.Swap(newBundle)

	// Update authority service if attached
	if m.authority != nil {
		m.applyToAuthority(newBundle)
	}

	// Trigger registered reload hooks
	for _, hook := range m.hooks {
		hook(oldBundle, newBundle)
	}
}

// Active returns the currently active policy bundle with lock-free atomic read
func (m *Manager) Active() *PolicyBundle {
	return m.active.Load()
}

// OnReload registers a callback hook to be triggered on hot-reload
func (m *Manager) OnReload(hook ReloadHook) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.hooks = append(m.hooks, hook)
}

// applyToAuthority updates authority lease requirements according to tool rules
func (m *Manager) applyToAuthority(bundle *PolicyBundle) {
	for _, rule := range bundle.Tools {
		if rule.Action == "require_lease" {
			m.authority.RequireLease(rule.Pattern)
		} else if rule.Action == "allow" || rule.Action == "block" {
			m.authority.ReleaseLeaseRequirement(rule.Pattern)
		}
	}
}
