package proxy

import (
	"PhantomRotate/internal/clash"
	"PhantomRotate/internal/config"
	"PhantomRotate/internal/utils"
	"fmt"
	"sync"
	"time"
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

	lines := utils.SplitLines(string(content))

	m.mu.Lock()
	defer m.mu.Unlock()

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
				Type:     "load-balance",
				Proxies:  []string{},
				URL:      m.config.HealthCheck.URL,
				Interval: m.config.HealthCheck.Interval,
				Strategy: "round-robin",
			},
		},
		Proxies: []clash.Proxy{},
		Rules:   []string{"MATCH,proxy_pool"},
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

	return m.clashMgr.UpdateConfig(cfg)
}
