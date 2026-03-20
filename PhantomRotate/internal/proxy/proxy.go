package proxy

import (
	"PhantomRotate/internal/clash"
	"PhantomRotate/internal/config"
	"PhantomRotate/internal/utils"
	"fmt"
	"strings"
	"sync"
	"time"

	"gopkg.in/yaml.v3"
)

type Manager struct {
	clashMgr *clash.Manager
	config   *config.Config
	nodes    []utils.Node
	mu       sync.RWMutex
	current  int
}

type NodePool struct {
	Nodes      []utils.Node `json:"nodes"`
	Total      int          `json:"total"`
	AliveCount int          `json:"alive_count"`
}

func NewManager(clashMgr *clash.Manager, cfg *config.Config) *Manager {
	return &Manager{
		clashMgr: clashMgr,
		config:   cfg,
		nodes:    []utils.Node{},
		current:  0,
	}
}

func (m *Manager) LoadNodesFromFile(filePath string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	lines, err := utils.ReadLines(filePath)
	if err != nil {
		return fmt.Errorf("failed to read nodes file: %w", err)
	}

	m.nodes = []utils.Node{}
	for i, line := range lines {
		line = utils.TrimSpace(line)
		if line == "" {
			continue
		}

		node, err := utils.ParseProxyURL(line)
		if err != nil {
			continue
		}

		node.ID = fmt.Sprintf("node-%d", i+1)
		m.nodes = append(m.nodes, node)
	}

	return m.updateClashConfig()
}

func (m *Manager) LoadNodesFromSubscription(url string) error {
	content, err := utils.FetchURL(url)
	if err != nil {
		return fmt.Errorf("failed to fetch subscription: %w", err)
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	m.nodes = []utils.Node{}

	content = strings.TrimSpace(content)

	if strings.Contains(content, "proxies:") || strings.HasPrefix(content, "port:") || strings.HasPrefix(content, "mixed-port:") {
		var subCfg struct {
			Proxies []map[string]interface{} `yaml:"proxies"`
		}
		if err := yaml.Unmarshal([]byte(content), &subCfg); err == nil && len(subCfg.Proxies) > 0 {
			for i, p := range subCfg.Proxies {
				node := utils.Node{
					ID:   fmt.Sprintf("node-%d", i+1),
					Name: getString(p, "name", fmt.Sprintf("Node-%d", i+1)),
					Type: getString(p, "type", "trojan"),
				}
				switch node.Type {
				case "trojan":
					node.Server = getString(p, "server", "")
					node.Password = getString(p, "password", "")
					node.SNI = getString(p, "sni", "")
					node.Peer = getString(p, "peer", "")
					if skip, ok := p["skip-cert-verify"].(bool); ok {
						node.SkipCert = skip
					}
				case "ss":
					node.Server = getString(p, "server", "")
					node.Password = getString(p, "password", "")
					node.Cipher = getString(p, "cipher", "")
					node.Server = getString(p, "server", "")
				case "vmess":
					node.Server = getString(p, "address", getString(p, "add", ""))
					node.Password = getString(p, "uuid", getString(p, "id", ""))
					node.Type = "vmess"
				}
				if node.Server != "" {
					m.nodes = append(m.nodes, node)
				}
			}
			fmt.Printf("Loaded %d nodes from Clash config subscription\n", len(m.nodes))
			return m.updateClashConfig()
		}
	}

	lines := utils.SplitLines(content)
	for i, line := range lines {
		line = utils.TrimSpace(line)
		if line == "" {
			continue
		}

		node, err := utils.ParseProxyURL(line)
		if err != nil {
			continue
		}

		node.ID = fmt.Sprintf("node-%d", i+1)
		m.nodes = append(m.nodes, node)
	}

	fmt.Printf("Loaded %d nodes from subscription\n", len(m.nodes))
	return m.updateClashConfig()
}

func getString(m map[string]interface{}, key, defaultVal string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return defaultVal
}

func (m *Manager) AddNode(nodeURL string) error {
	node, err := utils.ParseProxyURL(nodeURL)
	if err != nil {
		return fmt.Errorf("invalid proxy URL: %w", err)
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	node.ID = fmt.Sprintf("node-%d", len(m.nodes)+1)
	m.nodes = append(m.nodes, node)

	return m.updateClashConfig()
}

func (m *Manager) RemoveNode(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	for i, node := range m.nodes {
		if node.ID == id {
			m.nodes = append(m.nodes[:i], m.nodes[i+1:]...)
			return m.updateClashConfig()
		}
	}

	return fmt.Errorf("node not found: %s", id)
}

func (m *Manager) GetNodes() []utils.Node {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := make([]utils.Node, len(m.nodes))
	copy(result, m.nodes)
	return result
}

func (m *Manager) GetPool() *NodePool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	aliveCount := 0
	for _, n := range m.nodes {
		if n.Alive {
			aliveCount++
		}
	}

	return &NodePool{
		Nodes:      m.nodes,
		Total:      len(m.nodes),
		AliveCount: aliveCount,
	}
}

func (m *Manager) GetNextNode() *utils.Node {
	m.mu.Lock()
	defer m.mu.Unlock()

	if len(m.nodes) == 0 {
		return nil
	}

	node := m.nodes[m.current%len(m.nodes)]
	m.current++
	return &node
}

func (m *Manager) HealthCheck() {
	m.mu.RLock()
	nodes := m.nodes
	m.mu.RUnlock()

	for i := range nodes {
		go func(idx int) {
			latency, alive := utils.CheckProxy(nodes[idx])
			m.mu.Lock()
			m.nodes[idx].Latency = latency
			m.nodes[idx].Alive = alive
			m.mu.Unlock()
		}(i)
	}
}

func (m *Manager) StartHealthCheck(interval time.Duration) {
	go func() {
		ticker := time.NewTicker(interval)
		for range ticker.C {
			m.HealthCheck()
		}
	}()
}

func (m *Manager) updateClashConfig() error {
	if len(m.nodes) == 0 {
		return nil
	}

	cfg := &clash.ClashConfig{
		AllowLan:  false,
		MixedPort: m.config.MixedPort,
		ProxyGroups: []clash.ProxyGroup{
			{
				Name:     "proxy_pool",
				Type:     "select",
				Proxies:  []string{},
				URL:      m.config.HealthCheck.URL,
				Interval: m.config.HealthCheck.Interval,
			},
		},
		Proxies: []clash.Proxy{},
	}

	for _, n := range m.nodes {
		proxy := clash.Proxy{
			Name:     n.Name,
			Type:     n.Type,
			Server:   n.Server,
			Port:     n.Port,
			Password: n.Password,
			Cipher:   n.Cipher,
			SNI:      n.SNI,
			Peer:     n.Peer,
			SkipCert: n.SkipCert,
		}
		cfg.Proxies = append(cfg.Proxies, proxy)
		cfg.ProxyGroups[0].Proxies = append(cfg.ProxyGroups[0].Proxies, n.Name)
	}

	cfg.Rules = []string{"MATCH,proxy_pool"}

	return m.clashMgr.UpdateConfig(cfg)
}
