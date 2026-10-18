package provenance

import (
	"encoding/json"
	"testing"
)

func TestFieldProvenanceAssignmentAndResolution(t *testing.T) {
	pMap := NewMap()

	defaultReaders := []string{"*"}
	defaultTrust := uint8(100)

	pMap.Assign("$.public_data", []string{"*"}, 100, "tool_pub", "h1")
	pMap.Assign("$.private_ssn", []string{"compliance"}, 10, "tool_priv", "h2")
	pMap.Assign("$.records[*]", []string{"internal"}, 50, "tool_records", "h3")

	// 1. Exact match
	readers, trust := pMap.ResolveLabel("$.public_data", defaultReaders, defaultTrust)
	if len(readers) != 1 || readers[0] != "*" || trust != 100 {
		t.Errorf("unexpected label for public_data: %v, %d", readers, trust)
	}

	// 2. Sensitive match
	readers, trust = pMap.ResolveLabel("$.private_ssn", defaultReaders, defaultTrust)
	if len(readers) != 1 || readers[0] != "compliance" || trust != 10 {
		t.Errorf("unexpected label for private_ssn: %v, %d", readers, trust)
	}

	// 3. Wildcard prefix match
	readers, trust = pMap.ResolveLabel("$.records[0].amount", defaultReaders, defaultTrust)
	if len(readers) != 1 || readers[0] != "internal" || trust != 50 {
		t.Errorf("unexpected wildcard label for records[0].amount: %v, %d", readers, trust)
	}
}

func TestFilterForReaderPreventsOvertainting(t *testing.T) {
	pMap := NewMap()
	defaultReaders := []string{"*"}
	defaultTrust := uint8(100)

	rawJSON := []byte(`{
		"public_title": "Monthly Security Report",
		"version": "2.0.0",
		"pii": {
			"ssn": "000-11-2222",
			"tax_id": "99-887766"
		},
		"metrics": {
			"total_scans": 1200,
			"confidential_score": 42
		}
	}`)

	// Tag fields
	pMap.Assign("$.public_title", []string{"*"}, 100, "tool1", "h1")
	pMap.Assign("$.version", []string{"*"}, 100, "tool1", "h1")
	pMap.Assign("$.metrics.total_scans", []string{"*"}, 100, "tool1", "h1")
	pMap.Assign("$.pii", []string{"compliance_auditor"}, 0, "tool1", "h1")
	pMap.Assign("$.metrics.confidential_score", []string{"risk_exec"}, 10, "tool1", "h1")

	// 1. Filter for public_agent: pii and confidential_score must be pruned
	filteredPublicBytes, err := pMap.FilterForReader(rawJSON, "public_agent", defaultReaders, defaultTrust)
	if err != nil {
		t.Fatalf("failed to filter for public_agent: %v", err)
	}

	var publicObj map[string]interface{}
	if err := json.Unmarshal(filteredPublicBytes, &publicObj); err != nil {
		t.Fatalf("failed to unmarshal filtered JSON: %v", err)
	}

	if publicObj["public_title"] != "Monthly Security Report" {
		t.Errorf("expected public_title to be retained")
	}
	if publicObj["pii"] != nil {
		t.Errorf("expected pii to be pruned for public_agent, got %v", publicObj["pii"])
	}

	metricsObj, ok := publicObj["metrics"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected metrics object to be retained")
	}
	if metricsObj["total_scans"] != float64(1200) {
		t.Errorf("expected total_scans 1200 to be retained")
	}
	if metricsObj["confidential_score"] != nil {
		t.Errorf("expected confidential_score to be pruned for public_agent")
	}

	// 2. Filter for compliance_auditor: pii is retained!
	filteredComplianceBytes, err := pMap.FilterForReader(rawJSON, "compliance_auditor", defaultReaders, defaultTrust)
	if err != nil {
		t.Fatalf("failed to filter for compliance_auditor: %v", err)
	}

	var compObj map[string]interface{}
	if err := json.Unmarshal(filteredComplianceBytes, &compObj); err != nil {
		t.Fatalf("failed to unmarshal compliance JSON: %v", err)
	}

	piiObj, ok := compObj["pii"].(map[string]interface{})
	if !ok || piiObj["ssn"] != "000-11-2222" {
		t.Errorf("expected pii to be visible to compliance_auditor, got %v", compObj["pii"])
	}
}

func TestTagLeafNodes(t *testing.T) {
	pMap := NewMap()
	rawJSON := []byte(`{
		"agent": {
			"name": "Kyron-Worker",
			"tier": "Production"
		}
	}`)

	err := pMap.TagLeafNodes(rawJSON, "worker_init", "hash_init", []string{"ops"}, 80)
	if err != nil {
		t.Fatalf("failed to tag leaf nodes: %v", err)
	}

	nameEntry, ok := pMap.Get("$.agent.name")
	if !ok || nameEntry.Trust != 80 || len(nameEntry.Readers) != 1 || nameEntry.Readers[0] != "ops" {
		t.Errorf("unexpected entry for $.agent.name: %+v", nameEntry)
	}

	tierEntry, ok := pMap.Get("$.agent.tier")
	if !ok || tierEntry.Trust != 80 {
		t.Errorf("unexpected entry for $.agent.tier: %+v", tierEntry)
	}
}
