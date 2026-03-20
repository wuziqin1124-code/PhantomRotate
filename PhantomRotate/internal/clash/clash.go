package clash

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"gopkg.in/yaml.v3"
)

type Manager struct {
	binPath   string
	configDir string
	process   *exec.Cmd
	mu        sync.RWMutex
	config    *ClashConfig
	apiPort   int
}

type ClashConfig struct {
	AllowLan      bool         `yaml:"allowLan"`
	MixedPort     int          `yaml:"mixed-port"`
	ExternalUI    string       `yaml:"external-ui"`
	ExternalUICmd string       `yaml:"external-uicmd"`
	Secret        string       `yaml:"secret"`
	ProxyGroups   []ProxyGroup `yaml:"proxy-groups"`
	Proxies       []Proxy      `yaml:"proxies"`
	Rules         []string     `yaml:"rules"`
}

type ProxyGroup struct {
	Name     string   `yaml:"name"`
	Type     string   `yaml:"type"`
	Proxies  []string `yaml:"proxies"`
	URL      string   `yaml:"url"`
	Interval int      `yaml:"interval"`
	Strategy string   `yaml:"strategy"`
}

type Proxy struct {
	Name     string `yaml:"name"`
	Type     string `yaml:"type"`
	Server   string `yaml:"server"`
	Port     int    `yaml:"port"`
	Password string `yaml:"password"`
	Cipher   string `yaml:"cipher"`
	SNI      string `yaml:"sni"`
	Peer     string `yaml:"peer"`
	SkipCert bool   `yaml:"skip-cert-verify"`
	UDP      bool   `yaml:"udp"`
}

type ProxyStatus struct {
	Name    string `json:"name"`
	Type    string `json:"type"`
	Server  string `json:"server"`
	Port    int    `json:"port"`
	Latency int    `json:"latency"`
	Alive   bool   `json:"alive"`
}

type APIResponse struct {
	Proxies map[string]ProxyInfo `json:"proxies"`
}

type ProxyInfo struct {
	Name       string `json:"name"`
	Type       string `json:"type"`
	UDP        bool   `json:"udp"`
	X443       bool   `json:"x443"`
	Server     string `json:"server"`
	Port       int    `json:"port"`
	Password   string `json:"password,omitempty"`
	Cipher     string `json:"cipher,omitempty"`
	NameStr    string `json:"name"`
	Encryption string `json:"encryption"`
	ClientKey  string `json:"clientKey,omitempty"`
	Discovery  bool   `json:"discovery,omitempty"`
	Shortcut   string `json:"shortcut"`
	Alive      bool   `json:"alive"`
	Connection int    `json:"connection"`
	// add other fields as needed
}

func NewManager(binPath, configDir string) *Manager {
	return &Manager{
		binPath:   binPath,
		configDir: configDir,
		apiPort:   9090,
	}
}

func (m *Manager) Start() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	clashConfigPath := filepath.Join(m.configDir, "clash-config.yaml")
	if _, err := os.Stat(clashConfigPath); os.IsNotExist(err) {
		if err := m.generateDefaultConfig(); err != nil {
			return fmt.Errorf("failed to generate default config: %w", err)
		}
	}

	cmd := exec.Command(m.binPath, "-f", clashConfigPath, "-d", m.configDir)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start clash: %w", err)
	}

	m.process = cmd

	time.Sleep(2 * time.Second)

	return nil
}

func (m *Manager) Stop() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.process != nil && m.process.Process != nil {
		return m.process.Process.Kill()
	}
	return nil
}

func (m *Manager) Restart() error {
	if err := m.Stop(); err != nil {
		return err
	}
	time.Sleep(1 * time.Second)
	return m.Start()
}

func (m *Manager) GetConfig() (*ClashConfig, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	return m.config, nil
}

func (m *Manager) UpdateConfig(cfg *ClashConfig) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.config = cfg

	clashConfigPath := filepath.Join(m.configDir, "clash-config.yaml")
	data, err := yaml.Marshal(cfg)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	if err := os.WriteFile(clashConfigPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write config: %w", err)
	}

	return m.reloadConfig()
}

func (m *Manager) reloadConfig() error {
	client := &http.Client{Timeout: 5 * time.Second}
	_, err := client.Get(fmt.Sprintf("http://127.0.0.1:%d/configs", m.apiPort))
	return err
}

func (m *Manager) GetProxies() ([]ProxyStatus, error) {
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(fmt.Sprintf("http://127.0.0.1:%d/proxies", m.apiPort))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var apiResp APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, err
	}

	var proxies []ProxyStatus
	for name, info := range apiResp.Proxies {
		proxies = append(proxies, ProxyStatus{
			Name:   name,
			Type:   info.Type,
			Server: info.Server,
			Port:   info.Port,
			Alive:  info.Alive,
		})
	}

	return proxies, nil
}

func (m *Manager) SelectProxy(groupName, proxyName string) error {
	client := &http.Client{Timeout: 5 * time.Second}
	req, _ := http.NewRequest("PUT", fmt.Sprintf("http://127.0.0.1:%d/proxies/%s", m.apiPort, groupName), nil)
	req.Header.Set("Content-Type", "application/json")

	body := map[string]string{"name": proxyName}
	json.Marshal(body)

	client.Do(req)
	return nil
}

func (m *Manager) generateDefaultConfig() error {
	if err := os.MkdirAll(m.configDir, 0755); err != nil {
		return err
	}

	cfg := &ClashConfig{
		AllowLan:  false,
		MixedPort: 1080,
		ProxyGroups: []ProxyGroup{
			{
				Name:     "proxy_pool",
				Type:     "select",
				Proxies:  []string{},
				URL:      "https://www.google.com",
				Interval: 300,
			},
		},
		Proxies: []Proxy{},
	}

	data, err := yaml.Marshal(cfg)
	if err != nil {
		return err
	}

	configPath := filepath.Join(m.configDir, "clash-config.yaml")
	return os.WriteFile(configPath, data, 0644)
}

func (m *Manager) GetAPIURL() string {
	return fmt.Sprintf("http://127.0.0.1:%d", m.apiPort)
}
