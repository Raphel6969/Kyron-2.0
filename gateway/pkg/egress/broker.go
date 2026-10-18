package egress

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

// Default quotas for data sources
const (
	DefaultMaxBytesPerSource  = 1024 * 1024 // 1 MB
	DefaultMaxCallsPerSource  = 50
	DefaultMaxDestsPerSource  = 5
	DefaultMaxRedirects       = 3
	DefaultRequestTimeout     = 10 * time.Second
)

// Private/Link-Local CIDRs blocked from egress (anti-SSRF and cloud metadata protection)
var blockedIPNets []*net.IPNet

func init() {
	cidrs := []string{
		"127.0.0.0/8",          // Loopback
		"10.0.0.0/8",           // Private RFC 1918
		"172.16.0.0/12",        // Private RFC 1918
		"192.168.0.0/16",       // Private RFC 1918
		"169.254.0.0/16",       // Link-Local / Cloud Metadata (AWS/GCP/Azure)
		"::1/128",              // IPv6 Loopback
		"fc00::/7",             // IPv6 Unique Local
		"fe80::/10",            // IPv6 Link-Local
	}
	for _, cidr := range cidrs {
		_, ipNet, err := net.ParseCIDR(cidr)
		if err == nil {
			blockedIPNets = append(blockedIPNets, ipNet)
		}
	}
}

// SourceBudget defines limits for a specific data source category
type SourceBudget struct {
	MaxBytes        int64 `json:"max_bytes"`
	MaxCalls        int   `json:"max_calls"`
	MaxDestinations int   `json:"max_destinations"`
}

// TrajectorySourceState tracks consumption per (trajectory, source)
type TrajectorySourceState struct {
	ConsumedBytes int64
	CallCount     int
	Destinations  map[string]bool
	LastCall      time.Time
}

// ForwardRequest represents an outbound HTTP forward request payload
type ForwardRequest struct {
	TrajectoryID   string            `json:"trajectory_id"`
	DataSource     string            `json:"data_source"`
	DestinationURL string            `json:"destination_url"`
	Method         string            `json:"method"`
	Headers        map[string]string `json:"headers,omitempty"`
	Body           string            `json:"body,omitempty"`
}

// ForwardResponse returned by forward proxy
type ForwardResponse struct {
	Allowed         bool              `json:"allowed"`
	StatusCode      int               `json:"status_code,omitempty"`
	Reason          string            `json:"reason,omitempty"`
	BytesUsed       int64             `json:"bytes_used"`
	BudgetRemaining int64             `json:"budget_remaining"`
	Headers         map[string]string `json:"headers,omitempty"`
	Body            string            `json:"body,omitempty"`
}

// Broker enforces source-attributed network egress limits across multi-call trajectories (C8, F25)
type Broker struct {
	mu           sync.RWMutex
	state        map[string]*TrajectorySourceState // key: "trajectoryID:dataSource"
	budgets      map[string]SourceBudget           // key: dataSource, fallback: "default"
	allowedHosts map[string]bool
	httpClient   *http.Client
}

// NewBroker creates a new Egress Broker with specified default quotas and allowed hosts
func NewBroker(maxBytes int64, maxCalls int, allowedHosts []string) *Broker {
	hosts := make(map[string]bool)
	for _, h := range allowedHosts {
		hosts[strings.ToLower(strings.TrimSpace(h))] = true
	}

	b := &Broker{
		state:        make(map[string]*TrajectorySourceState),
		budgets:      make(map[string]SourceBudget),
		allowedHosts: hosts,
	}

	// Register default fallback budget
	b.budgets["default"] = SourceBudget{
		MaxBytes:        maxBytes,
		MaxCalls:        maxCalls,
		MaxDestinations: DefaultMaxDestsPerSource,
	}

	// Configure secure HTTP client with DNS pinning and SSRF protection
	b.httpClient = &http.Client{
		Timeout: DefaultRequestTimeout,
		Transport: &http.Transport{
			DialContext:           b.secureDialContext,
			ResponseHeaderTimeout: 5 * time.Second,
			MaxIdleConns:          50,
			IdleConnTimeout:       30 * time.Second,
		},
		CheckRedirect: b.checkRedirect,
	}

	return b
}

// SetSourceBudget overrides the budget for a specific data source (e.g. "crm_pii", "db_financial")
func (b *Broker) SetSourceBudget(dataSource string, budget SourceBudget) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.budgets[dataSource] = budget
}

// AllowHost adds an approved destination host
func (b *Broker) AllowHost(host string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.allowedHosts[strings.ToLower(strings.TrimSpace(host))] = true
}

func (b *Broker) getBudget(dataSource string) SourceBudget {
	if budget, ok := b.budgets[dataSource]; ok {
		return budget
	}
	return b.budgets["default"]
}

// isPrivateOrMetadataIP returns true if the IP belongs to loopback, private, or metadata CIDRs
func isPrivateOrMetadataIP(ip net.IP) bool {
	if ip == nil {
		return true
	}
	for _, ipNet := range blockedIPNets {
		if ipNet.Contains(ip) {
			return true
		}
	}
	return false
}

// secureDialContext resolves DNS and ensures connections cannot connect to private or metadata IPs
func (b *Broker) secureDialContext(ctx context.Context, network, addr string) (net.Conn, error) {
	host, port, err := net.SplitHostPort(addr)
	if err != nil {
		return nil, fmt.Errorf("invalid host/port '%s': %w", addr, err)
	}

	// Resolve IPs
	ips, err := net.DefaultResolver.LookupIP(ctx, "ip", host)
	if err != nil {
		return nil, fmt.Errorf("DNS resolution failed for '%s': %w", host, err)
	}

	if len(ips) == 0 {
		return nil, fmt.Errorf("no IP addresses returned for '%s'", host)
	}

	// Filter out any private/metadata IPs
	var safeIP net.IP
	for _, ip := range ips {
		if !isPrivateOrMetadataIP(ip) {
			safeIP = ip
			break
		}
	}

	if safeIP == nil {
		return nil, fmt.Errorf("SSRF protection: destination '%s' resolves exclusively to blocked/private IP addresses (%v)", host, ips)
	}

	// Pin safe IP for the socket dial
	targetAddr := net.JoinHostPort(safeIP.String(), port)
	dialer := net.Dialer{Timeout: 5 * time.Second}
	return dialer.DialContext(ctx, network, targetAddr)
}

// checkRedirect validates every redirect hop against destination whitelist and redirect depth
func (b *Broker) checkRedirect(req *http.Request, via []*http.Request) error {
	if len(via) >= DefaultMaxRedirects {
		return fmt.Errorf("stopped after %d redirects", DefaultMaxRedirects)
	}

	destHost := strings.ToLower(req.URL.Hostname())
	b.mu.RLock()
	defer b.mu.RUnlock()

	if len(b.allowedHosts) > 0 && !b.allowedHosts[destHost] {
		return fmt.Errorf("redirect to undeclared host '%s' blocked by egress policy", destHost)
	}

	return nil
}

// CheckAndRecord evaluates outbound network egress and records consumption
func (b *Broker) CheckAndRecord(dataSource string, destinationHost string, byteCount int64) error {
	return b.CheckAndRecordTrajectory("default-session", dataSource, destinationHost, byteCount)
}

// CheckAndRecordTrajectory checks and records egress for a specific trajectory and data source
func (b *Broker) CheckAndRecordTrajectory(trajectoryID, dataSource, destinationHost string, byteCount int64) error {
	b.mu.Lock()
	defer b.mu.Unlock()

	normHost := strings.ToLower(strings.TrimSpace(destinationHost))
	if normHost == "" {
		return errors.New("destination host cannot be empty")
	}

	// Check 0: SSRF block on raw IP addresses targeting private ranges or metadata
	if parsedIP := net.ParseIP(normHost); parsedIP != nil {
		if isPrivateOrMetadataIP(parsedIP) {
			return fmt.Errorf("SSRF protection: outbound request to private/metadata IP '%s' is strictly blocked", normHost)
		}
	}

	// Check 1: Allowed destination whitelist
	if len(b.allowedHosts) > 0 && !b.allowedHosts[normHost] {
		return fmt.Errorf("egress to undeclared host '%s' is disallowed by whitelist policy", normHost)
	}

	key := fmt.Sprintf("%s:%s", trajectoryID, dataSource)
	state, exists := b.state[key]
	if !exists {
		state = &TrajectorySourceState{
			Destinations: make(map[string]bool),
		}
		b.state[key] = state
	}

	budget := b.getBudget(dataSource)

	// Check 2: Max calls per source (Scenario S4: stops sharded exfiltration across micro-calls)
	currentCalls := state.CallCount + 1
	if currentCalls > budget.MaxCalls {
		return fmt.Errorf("source '%s' exceeded distinct egress call budget (%d > %d calls)", dataSource, currentCalls, budget.MaxCalls)
	}

	// Check 3: Max bytes per source
	currentBytes := state.ConsumedBytes + byteCount
	if currentBytes > budget.MaxBytes {
		return fmt.Errorf("source '%s' exceeded cumulative egress byte budget (%d > %d bytes)", dataSource, currentBytes, budget.MaxBytes)
	}

	// Check 4: Max distinct destinations per source (catches covert channel IP spraying)
	if !state.Destinations[normHost] && len(state.Destinations)+1 > budget.MaxDestinations {
		return fmt.Errorf("source '%s' exceeded distinct destination budget (%d > %d unique hosts)", dataSource, len(state.Destinations)+1, budget.MaxDestinations)
	}

	state.CallCount = currentCalls
	state.ConsumedBytes = currentBytes
	state.Destinations[normHost] = true
	state.LastCall = time.Now()
	return nil
}

// Forward executes an authorized outbound request through the secure pinned client
func (b *Broker) Forward(ctx context.Context, fwd *ForwardRequest) (*ForwardResponse, error) {
	parsedURL, err := url.Parse(fwd.DestinationURL)
	if err != nil {
		return &ForwardResponse{
			Allowed: false,
			Reason:  fmt.Sprintf("invalid destination URL: %v", err),
		}, nil
	}

	bodyBytes := []byte(fwd.Body)
	byteCount := int64(len(bodyBytes))

	// Check policy and record budget
	if err := b.CheckAndRecordTrajectory(fwd.TrajectoryID, fwd.DataSource, parsedURL.Hostname(), byteCount); err != nil {
		b.mu.RLock()
		budget := b.getBudget(fwd.DataSource)
		key := fmt.Sprintf("%s:%s", fwd.TrajectoryID, fwd.DataSource)
		used := int64(0)
		if st, ok := b.state[key]; ok {
			used = st.ConsumedBytes
		}
		b.mu.RUnlock()

		return &ForwardResponse{
			Allowed:         false,
			Reason:          err.Error(),
			BytesUsed:       used,
			BudgetRemaining: (budget.MaxBytes - used),
		}, nil
	}

	// Build outbound HTTP request
	method := strings.ToUpper(fwd.Method)
	if method == "" {
		method = http.MethodGet
	}

	var bodyReader io.Reader
	if len(bodyBytes) > 0 {
		bodyReader = strings.NewReader(fwd.Body)
	}

	req, err := http.NewRequestWithContext(ctx, method, fwd.DestinationURL, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("failed to create outbound request: %w", err)
	}

	for k, v := range fwd.Headers {
		req.Header.Set(k, v)
	}

	resp, err := b.httpClient.Do(req)
	if err != nil {
		return &ForwardResponse{
			Allowed: false,
			Reason:  fmt.Sprintf("egress transport error: %v", err),
		}, nil
	}
	defer resp.Body.Close()

	respBodyBytes, _ := io.ReadAll(resp.Body)
	respHeaders := make(map[string]string)
	for k, v := range resp.Header {
		if len(v) > 0 {
			respHeaders[k] = v[0]
		}
	}

	b.mu.RLock()
	budget := b.getBudget(fwd.DataSource)
	key := fmt.Sprintf("%s:%s", fwd.TrajectoryID, fwd.DataSource)
	used := b.state[key].ConsumedBytes
	b.mu.RUnlock()

	return &ForwardResponse{
		Allowed:         true,
		StatusCode:      resp.StatusCode,
		BytesUsed:       used,
		BudgetRemaining: budget.MaxBytes - used,
		Headers:         respHeaders,
		Body:            string(respBodyBytes),
	}, nil
}

// Reset clears budget counters for a fresh trajectory
func (b *Broker) Reset() {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.state = make(map[string]*TrajectorySourceState)
}

// ServeHTTP handles POST /egress/forward REST endpoint
func (b *Broker) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ForwardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	resp, err := b.Forward(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if !resp.Allowed {
		w.WriteHeader(http.StatusForbidden)
	} else {
		w.WriteHeader(http.StatusOK)
	}
	_ = json.NewEncoder(w).Encode(resp)
}
