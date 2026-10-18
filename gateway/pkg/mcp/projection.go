package mcp

import (
	"encoding/json"
	"fmt"
	"sync"
)

// RegisteredTool represents a tool known to the Kyron Registry Firewall
type RegisteredTool struct {
	ServerID               string          `json:"server_id"`
	Name                   string          `json:"name"`
	State                  string          `json:"state"` // "approved", "scanned", "quarantined", "blocked", "revoked"
	RiskScore              float32         `json:"risk_score"`
	RiskReasons            []string        `json:"risk_reasons"`
	ModelFacingDescription string          `json:"model_facing_description"`
	InputSchema            json.RawMessage `json:"input_schema"`
}

// ToolRegistry manages registered tools and applies dynamic tool projection
type ToolRegistry struct {
	tools map[string]*RegisteredTool
	mu    sync.RWMutex
}

// NewToolRegistry instantiates a new thread-safe tool registry
func NewToolRegistry() *ToolRegistry {
	return &ToolRegistry{
		tools: make(map[string]*RegisteredTool),
	}
}

// RegisterTool registers or updates a tool in the firewall registry
func (tr *ToolRegistry) RegisterTool(tool *RegisteredTool) {
	tr.mu.Lock()
	defer tr.mu.Unlock()
	tr.tools[tool.Name] = tool
}

// GetTool retrieves a registered tool by name
func (tr *ToolRegistry) GetTool(name string) (*RegisteredTool, bool) {
	tr.mu.RLock()
	defer tr.mu.RUnlock()
	t, ok := tr.tools[name]
	return t, ok
}

// AllTools returns a slice of all registered tools
func (tr *ToolRegistry) AllTools() []*RegisteredTool {
	tr.mu.RLock()
	defer tr.mu.RUnlock()
	list := make([]*RegisteredTool, 0, len(tr.tools))
	for _, t := range tr.tools {
		list = append(list, t)
	}
	return list
}


// ProjectTools applies Dynamic Tool Projection (F19, F03, F04) to a list of raw tools.
// - Filters out quarantined, blocked, or revoked tools so they are invisible to the model.
// - Rewrites raw descriptions with TRUSTDESC canonical descriptions so the model is insulated
//   from prompt injection in tool metadata.
func (tr *ToolRegistry) ProjectTools(rawTools []Tool) []Tool {
	tr.mu.RLock()
	defer tr.mu.RUnlock()

	var projected []Tool

	for _, rt := range rawTools {
		reg, exists := tr.tools[rt.Name]
		if !exists {
			// Newly discovered tool without prior registration:
			// If not pre-approved, we synthesize a clean safe description and include it in scanned mode
			canonical := fmt.Sprintf("Tool '%s': Executes tool according to declared parameter schema.", rt.Name)
			projected = append(projected, Tool{
				Name:        rt.Name,
				Description: canonical,
				InputSchema: rt.InputSchema,
			})
			continue
		}

		// Filter out non-admissible tools
		switch reg.State {
		case "quarantined", "blocked", "revoked":
			// Tool is suppressed: never projected into the model context
			continue
		case "approved", "scanned", "active":
			// Tool is permitted: deliver canonical description
			desc := reg.ModelFacingDescription
			if desc == "" {
				desc = fmt.Sprintf("Tool '%s': Executes declared functionality.", rt.Name)
			}
			projected = append(projected, Tool{
				Name:        rt.Name,
				Description: desc,
				InputSchema: rt.InputSchema,
			})
		default:
			// Fail-closed on any unrecognized state
			continue
		}
	}

	return projected
}
