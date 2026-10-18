package secrets

import (
	"strings"
	"sync"
)

// Broker manages short-lived scoped credentials and scrubs secrets from model-visible traffic
type Broker struct {
	mu           sync.RWMutex
	vault        map[string]string
	knownSecrets []string
}

// NewBroker creates a new Secrets Broker
func NewBroker() *Broker {
	return &Broker{
		vault:        make(map[string]string),
		knownSecrets: make([]string, 0),
	}
}

// SetSecret stores a credential securely in memory
func (b *Broker) SetSecret(key string, value string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.vault[key] = value
	b.knownSecrets = append(b.knownSecrets, value)
}

// GetSecret retrieves a credential for JIT injection into tool requests
func (b *Broker) GetSecret(key string) (string, bool) {
	b.mu.RLock()
	defer b.mu.RUnlock()
	val, ok := b.vault[key]
	return val, ok
}

// RedactTraffic scrubs all known credentials from text before it reaches the model
func (b *Broker) RedactTraffic(text string) string {
	b.mu.RLock()
	defer b.mu.RUnlock()

	redacted := text
	for _, secret := range b.knownSecrets {
		if len(secret) > 4 && strings.Contains(redacted, secret) {
			redacted = strings.ReplaceAll(redacted, secret, "[KYRON_REDACTED_SECRET]")
		}
	}
	return redacted
}
