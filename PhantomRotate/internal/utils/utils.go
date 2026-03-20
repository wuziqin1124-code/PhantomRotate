package utils

import (
	"bytes"
	"compress/gzip"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

func ReadLines(path string) ([]string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return SplitLines(string(content)), nil
}

func SplitLines(s string) []string {
	lines := strings.Split(s, "\n")
	result := make([]string, 0, len(lines))
	for _, line := range lines {
		line = strings.TrimRight(line, "\r")
		if line != "" {
			result = append(result, line)
		}
	}
	return result
}

func TrimSpace(s string) string {
	return strings.TrimSpace(s)
}

func FetchURL(targetURL string) (string, error) {
	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("User-Agent", "ClashForAndroid/2.5.12")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	cd := resp.Header.Get("Content-Encoding")
	if cd == "gzip" || cd == "br" {
		return decodeResponse(body, cd)
	}

	return string(body), nil
}

func decodeResponse(body []byte, encoding string) (string, error) {
	switch encoding {
	case "gzip":
		reader, err := gzip.NewReader(bytes.NewReader(body))
		if err != nil {
			return "", err
		}
		result, err := io.ReadAll(reader)
		reader.Close()
		return string(result), err
	default:
		return string(body), nil
	}
}

type Node struct {
	ID       string
	Name     string
	Type     string
	Server   string
	Port     int
	Password string
	Cipher   string
	SNI      string
	Peer     string
	SkipCert bool
	Alive    bool
	Latency  int
	Tag      string
}

func ParseProxyURL(proxyURL string) (Node, error) {
	u, err := url.Parse(proxyURL)
	if err != nil {
		return Node{}, err
	}

	node := Node{}

	switch u.Scheme {
	case "trojan":
		node.Type = "trojan"
		node.Server = u.Hostname()
		node.Port, _ = strconv.Atoi(u.Port())
		node.Password = u.User.Username()
		if sni := u.Query().Get("sni"); sni != "" {
			node.SNI = sni
		}
		if peer := u.Query().Get("peer"); peer != "" {
			node.Peer = peer
		}
		if skipCert := u.Query().Get("allowInsecure"); skipCert == "1" || skipCert == "true" {
			node.SkipCert = true
		}
		if name := u.Fragment; name != "" {
			node.Name, _ = url.QueryUnescape(name)
		} else {
			node.Name = fmt.Sprintf("Trojan-%s:%d", node.Server, node.Port)
		}

	case "ss":
		node.Type = "ss"
		node.Server = u.Hostname()
		node.Port, _ = strconv.Atoi(u.Port())
		if name := u.Fragment; name != "" {
			node.Name, _ = url.QueryUnescape(name)
		} else {
			node.Name = fmt.Sprintf("SS-%s:%d", node.Server, node.Port)
		}
		userInfo := u.User.String()
		if idx := strings.Index(userInfo, "@"); idx != -1 {
			node.Cipher = userInfo[:idx]
			node.Password = userInfo[idx+1:]
		}

	case "vmess":
		node.Type = "vmess"

	default:
		return Node{}, fmt.Errorf("unsupported scheme: %s", u.Scheme)
	}

	return node, nil
}

func CheckProxy(node Node) (int, bool) {
	switch node.Type {
	case "trojan":
		return checkTrojan(node)
	case "ss":
		return checkSS(node)
	default:
		return 0, false
	}
}

func checkTrojan(node Node) (int, bool) {
	start := time.Now()
	addr := fmt.Sprintf("%s:%d", node.Server, node.Port)

	conn, err := net.DialTimeout("tcp", addr, 5*time.Second)
	if err != nil {
		return 0, false
	}
	defer conn.Close()

	elapsed := time.Since(start).Milliseconds()
	return int(elapsed), true
}

func checkSS(node Node) (int, bool) {
	start := time.Now()
	addr := fmt.Sprintf("%s:%d", node.Server, node.Port)

	conn, err := net.DialTimeout("tcp", addr, 5*time.Second)
	if err != nil {
		return 0, false
	}
	defer conn.Close()

	elapsed := time.Since(start).Milliseconds()
	return int(elapsed), true
}
