package provenance

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"
)

// FieldProvenance associates fine-grained security labels with a JSON-Path (C7, F21)
type FieldProvenance struct {
	Path       string    `json:"path"`
	Readers    []string  `json:"readers"`
	Trust      uint8     `json:"trust"`
	SourceTool string    `json:"source_tool"`
	CallHash   string    `json:"call_hash"`
	TaggedAt   time.Time `json:"tagged_at"`
}

// Map maintains a thread-safe registry of field-level provenance labels
type Map struct {
	entries map[string]*FieldProvenance
	mu      sync.RWMutex
}

// NewMap initializes an empty FieldProvenance map
func NewMap() *Map {
	return &Map{
		entries: make(map[string]*FieldProvenance),
	}
}

// Assign registers a security label for an exact JSON path
func (m *Map) Assign(path string, readers []string, trust uint8, sourceTool, callHash string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.entries[path] = &FieldProvenance{
		Path:       path,
		Readers:    readers,
		Trust:      trust,
		SourceTool: sourceTool,
		CallHash:   callHash,
		TaggedAt:   time.Now().UTC(),
	}
}

// Get retrieves the field provenance for an exact JSON path
func (m *Map) Get(path string) (*FieldProvenance, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	entry, ok := m.entries[path]
	return entry, ok
}

// ResolveLabel resolves the effective readers and trust floor for a given path
func (m *Map) ResolveLabel(path string, defaultReaders []string, defaultTrust uint8) ([]string, uint8) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if entry, ok := m.entries[path]; ok {
		return entry.Readers, entry.Trust
	}

	// Check wildcard prefixes, e.g. "$.items[*]" or "$.items.*"
	for pattern, entry := range m.entries {
		if strings.HasSuffix(pattern, "[*]") {
			prefix := strings.TrimSuffix(pattern, "[*]")
			if strings.HasPrefix(path, prefix) {
				return entry.Readers, entry.Trust
			}
		} else if strings.HasSuffix(pattern, ".*") {
			prefix := strings.TrimSuffix(pattern, ".*")
			if strings.HasPrefix(path, prefix) {
				return entry.Readers, entry.Trust
			}
		}
	}

	return defaultReaders, defaultTrust
}

// isReaderAllowed evaluates if the target reader is permitted by the readers set
func isReaderAllowed(readers []string, target string) bool {
	for _, r := range readers {
		if r == "*" || r == target {
			return true
		}
	}
	return false
}

// FilterForReader prunes unauthorized fields from a JSON payload without over-tainting the entire response
func (m *Map) FilterForReader(jsonBytes []byte, reader string, defaultReaders []string, defaultTrust uint8) ([]byte, error) {
	var root interface{}
	if err := json.Unmarshal(jsonBytes, &root); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON payload: %w", err)
	}

	filtered := m.filterRecursive(root, "$", reader, defaultReaders, defaultTrust)
	return json.Marshal(filtered)
}

func (m *Map) filterRecursive(
	val interface{},
	currentPath string,
	reader string,
	defaultReaders []string,
	defaultTrust uint8,
) interface{} {
	readers, _ := m.ResolveLabel(currentPath, defaultReaders, defaultTrust)
	if !isReaderAllowed(readers, reader) && currentPath != "$" {
		return nil
	}

	switch v := val.(type) {
	case map[string]interface{}:
		filteredMap := make(map[string]interface{})
		for k, childVal := range v {
			childPath := fmt.Sprintf("%s.%s", currentPath, k)
			if currentPath == "$" {
				childPath = fmt.Sprintf("$.%s", k)
			}

			childReaders, childTrust := m.ResolveLabel(childPath, readers, defaultTrust)
			if isReaderAllowed(childReaders, reader) {
				cleaned := m.filterRecursive(childVal, childPath, reader, childReaders, childTrust)
				if cleaned != nil {
					filteredMap[k] = cleaned
				}
			}
		}
		return filteredMap

	case []interface{}:
		var filteredList []interface{}
		for i, childVal := range v {
			childPath := fmt.Sprintf("%s[%d]", currentPath, i)
			cleaned := m.filterRecursive(childVal, childPath, reader, defaultReaders, defaultTrust)
			if cleaned != nil {
				filteredList = append(filteredList, cleaned)
			}
		}
		return filteredList

	default:
		return v
	}
}

// TagLeafNodes traverses a JSON document and assigns the specified provenance label to all leaf nodes
func (m *Map) TagLeafNodes(jsonBytes []byte, sourceTool, callHash string, readers []string, trust uint8) error {
	var root interface{}
	if err := json.Unmarshal(jsonBytes, &root); err != nil {
		return fmt.Errorf("failed to parse JSON document: %w", err)
	}

	m.walkAndTag(root, "$", sourceTool, callHash, readers, trust)
	return nil
}

func (m *Map) walkAndTag(
	val interface{},
	path string,
	sourceTool, callHash string,
	readers []string,
	trust uint8,
) {
	switch v := val.(type) {
	case map[string]interface{}:
		for k, child := range v {
			childPath := fmt.Sprintf("%s.%s", path, k)
			if path == "$" {
				childPath = fmt.Sprintf("$.%s", k)
			}
			m.walkAndTag(child, childPath, sourceTool, callHash, readers, trust)
		}
	case []interface{}:
		for i, child := range v {
			childPath := fmt.Sprintf("%s[%d]", path, i)
			m.walkAndTag(child, childPath, sourceTool, callHash, readers, trust)
		}
	default:
		m.Assign(path, readers, trust, sourceTool, callHash)
	}
}
