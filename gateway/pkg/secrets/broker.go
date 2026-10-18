package secrets

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"
)

// Standard redaction token
const RedactedPlaceholder = "[KYRON_REDACTED_SECRET]"

// Regular expressions detecting common credential shapes even if not pre-registered in the vault
var genericCredentialPatterns = []*regexp.Regexp{
	regexp.MustCompile(`AKIA[0-9A-Z]{16}`),                                                                                // AWS Access Key ID
	regexp.MustCompile(`ghp_[a-zA-Z0-9]{36}`),                                                                             // GitHub Personal Access Token
	regexp.MustCompile(`xoxb-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24}`),                                                  // Slack Bot Token
	regexp.MustCompile(`-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----[a-zA-Z0-9+/=\r\n]+-----END (?:[A-Z]+ )?PRIVATE KEY-----`), // PEM Private Keys
}

// VaultSecret represents an in-memory stored credential
type VaultSecret struct {
	Key       string
	Value     string
	Scope     string
	CreatedAt time.Time
	ExpiresAt *time.Time
}

// ScopedToken represents a short-lived JIT token minted for a specific tool execution
type ScopedToken struct {
	TokenID   string    `json:"token_id"`
	SecretRef string    `json:"secret_ref"`
	Value     string    `json:"value"`
	Scope     string    `json:"scope"`
	ExpiresAt time.Time `json:"expires_at"`
}

// Broker manages short-lived scoped credentials and scrubs secrets from model-visible traffic (C9, F31)
type Broker struct {
	mu           sync.RWMutex
	vault        map[string]*VaultSecret
	scopedTokens map[string]*ScopedToken
	knownSecrets []string
	encodedForms []string // base64, url-encoded versions of known secrets
}

// NewBroker creates a new Secrets Broker
func NewBroker() *Broker {
	return &Broker{
		vault:        make(map[string]*VaultSecret),
		scopedTokens: make(map[string]*ScopedToken),
		knownSecrets: make([]string, 0),
		encodedForms: make([]string, 0),
	}
}

// SetSecret stores a credential securely in memory
func (b *Broker) SetSecret(key string, value string) {
	b.SetScopedSecret(key, value, "*", nil)
}

// SetScopedSecret stores a credential with an explicit scope and optional TTL
func (b *Broker) SetScopedSecret(key string, value string, scope string, expiresAt *time.Time) {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.vault[key] = &VaultSecret{
		Key:       key,
		Value:     value,
		Scope:     scope,
		CreatedAt: time.Now(),
		ExpiresAt: expiresAt,
	}

	b.knownSecrets = append(b.knownSecrets, value)

	// Precompute alternative representations (Base64, URL-encoded)
	if len(value) >= 6 {
		b64 := base64.StdEncoding.EncodeToString([]byte(value))
		b.encodedForms = append(b.encodedForms, b64)

		uEnc := url.QueryEscape(value)
		if uEnc != value {
			b.encodedForms = append(b.encodedForms, uEnc)
		}
	}
}

// GetSecret retrieves a credential for JIT injection into tool requests
func (b *Broker) GetSecret(key string) (string, bool) {
	b.mu.RLock()
	defer b.mu.RUnlock()

	sec, ok := b.vault[key]
	if !ok {
		return "", false
	}

	if sec.ExpiresAt != nil && time.Now().After(*sec.ExpiresAt) {
		return "", false
	}

	return sec.Value, true
}

// Resolve mints a short-lived scoped token for a tool execution (F31)
func (b *Broker) Resolve(secretRef string, requiredScope string, ttl time.Duration) (*ScopedToken, error) {
	b.mu.Lock()
	defer b.mu.Unlock()

	sec, ok := b.vault[secretRef]
	if !ok {
		return nil, fmt.Errorf("secret reference '%s' not found in vault", secretRef)
	}

	if sec.ExpiresAt != nil && time.Now().After(*sec.ExpiresAt) {
		return nil, fmt.Errorf("secret '%s' has expired", secretRef)
	}

	// Verify scope compatibility
	if sec.Scope != "*" && sec.Scope != requiredScope && !strings.HasPrefix(requiredScope, sec.Scope) {
		return nil, fmt.Errorf("insufficient scope for secret '%s': requires '%s', held '%s'", secretRef, requiredScope, sec.Scope)
	}

	rawRand := make([]byte, 16)
	_, _ = rand.Read(rawRand)
	tokenID := "tok_" + hex.EncodeToString(rawRand)

	scoped := &ScopedToken{
		TokenID:   tokenID,
		SecretRef: secretRef,
		Value:     sec.Value,
		Scope:     requiredScope,
		ExpiresAt: time.Now().Add(ttl),
	}

	b.scopedTokens[tokenID] = scoped
	return scoped, nil
}

// InjectSecrets replaces template placeholders (e.g. `{{secret:KEY}}`) in JSON arguments with real vault secrets JIT
func (b *Broker) InjectSecrets(rawArgs json.RawMessage) (json.RawMessage, error) {
	if len(rawArgs) == 0 || bytes.Equal(rawArgs, []byte("{}")) || bytes.Equal(rawArgs, []byte("null")) {
		return rawArgs, nil
	}

	strArgs := string(rawArgs)
	if !strings.Contains(strArgs, "{{secret:") {
		return rawArgs, nil
	}

	b.mu.RLock()
	defer b.mu.RUnlock()

	re := regexp.MustCompile(`\{\{secret:([a-zA-Z0-9_\-]+)\}\}`)
	matches := re.FindAllStringSubmatch(strArgs, -1)

	for _, m := range matches {
		if len(m) < 2 {
			continue
		}
		placeholder := m[0]
		secretKey := m[1]

		sec, ok := b.vault[secretKey]
		if !ok {
			return nil, fmt.Errorf("unresolved secret placeholder '%s': key not in vault", placeholder)
		}
		if sec.ExpiresAt != nil && time.Now().After(*sec.ExpiresAt) {
			return nil, fmt.Errorf("secret '%s' has expired", secretKey)
		}

		strArgs = strings.ReplaceAll(strArgs, placeholder, sec.Value)
	}

	return json.RawMessage(strArgs), nil
}

// RedactTraffic scrubs all known credentials and pattern matches from text before it reaches the model
func (b *Broker) RedactTraffic(text string) string {
	b.mu.RLock()
	defer b.mu.RUnlock()

	redacted := text

	// 1. Scrub plaintext known secrets
	for _, secret := range b.knownSecrets {
		if len(secret) > 4 && strings.Contains(redacted, secret) {
			redacted = strings.ReplaceAll(redacted, secret, RedactedPlaceholder)
		}
	}

	// 2. Scrub encoded forms (Base64, URL-encoded)
	for _, enc := range b.encodedForms {
		if len(enc) > 6 && strings.Contains(redacted, enc) {
			redacted = strings.ReplaceAll(redacted, enc, RedactedPlaceholder)
		}
	}

	// 3. Scrub generic credential regex patterns
	for _, pat := range genericCredentialPatterns {
		redacted = pat.ReplaceAllString(redacted, RedactedPlaceholder)
	}

	return redacted
}

// RedactJSON traverses and redacts a JSON payload
func (b *Broker) RedactJSON(raw json.RawMessage) json.RawMessage {
	if len(raw) == 0 {
		return raw
	}
	var val interface{}
	if err := json.Unmarshal(raw, &val); err != nil {
		return raw
	}
	cleaned := b.redactValue(val)
	out, err := json.Marshal(cleaned)
	if err != nil {
		return raw
	}
	return out
}

func (b *Broker) redactValue(val interface{}) interface{} {
	switch v := val.(type) {
	case string:
		return b.RedactTraffic(v)
	case map[string]interface{}:
		res := make(map[string]interface{})
		for k, item := range v {
			res[k] = b.redactValue(item)
		}
		return res
	case []interface{}:
		res := make([]interface{}, len(v))
		for i, item := range v {
			res[i] = b.redactValue(item)
		}
		return res
	default:
		return v
	}
}

// ValidateClean asserts that a text payload contains no known or pattern-detected credentials
func (b *Broker) ValidateClean(text string) error {
	redacted := b.RedactTraffic(text)
	if strings.Contains(redacted, RedactedPlaceholder) {
		return errors.New("credential detected in payload")
	}
	return nil
}
