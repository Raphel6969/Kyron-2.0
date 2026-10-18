package egress

import (
	"fmt"
	"sync"
)

// Broker enforces source-attributed network egress limits across multi-call trajectories
type Broker struct {
	mu           sync.RWMutex
	sourceBytes  map[string]int64
	sourceCalls  map[string]int
	maxBytes     int64
	maxCalls     int
	allowedHosts map[string]bool
}

// NewBroker creates a new Egress Broker with specified quotas
func NewBroker(maxBytes int64, maxCalls int, allowedHosts []string) *Broker {
	hosts := make(map[string]bool)
	for _, h := range allowedHosts {
		hosts[h] = true
	}
	return &Broker{
		sourceBytes:  make(map[string]int64),
		sourceCalls:  make(map[string]int),
		maxBytes:     maxBytes,
		maxCalls:     maxCalls,
		allowedHosts: hosts,
	}
}

// CheckAndRecord evaluates outbound network egress and records consumption
func (b *Broker) CheckAndRecord(dataSource string, destinationHost string, byteCount int64) error {
	b.mu.Lock()
	defer b.mu.Unlock()

	// Check 1: Allowed destination
	if len(b.allowedHosts) > 0 && !b.allowedHosts[destinationHost] {
		return fmt.Errorf("egress to undeclared host '%s' is disallowed", destinationHost)
	}

	// Check 2: Max calls per source (stops sharded exfiltration across 40+ micro-calls)
	currentCalls := b.sourceCalls[dataSource] + 1
	if currentCalls > b.maxCalls {
		return fmt.Errorf("source '%s' exceeded distinct egress call budget (%d > %d)", dataSource, currentCalls, b.maxCalls)
	}

	// Check 3: Max bytes per source
	currentBytes := b.sourceBytes[dataSource] + byteCount
	if currentBytes > b.maxBytes {
		return fmt.Errorf("source '%s' exceeded cumulative egress byte budget (%d > %d bytes)", dataSource, currentBytes, b.maxBytes)
	}

	b.sourceCalls[dataSource] = currentCalls
	b.sourceBytes[dataSource] = currentBytes
	return nil
}

// Reset clears budget counters for a fresh trajectory
func (b *Broker) Reset() {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.sourceBytes = make(map[string]int64)
	b.sourceCalls = make(map[string]int)
}
