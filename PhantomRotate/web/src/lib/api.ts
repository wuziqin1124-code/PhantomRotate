const API_BASE = '/api'

export interface Node {
  id: string
  name: string
  type: string
  server: string
  port: number
  password?: string
  cipher?: string
  sni?: string
  peer?: string
  skip_cert?: boolean
  alive: boolean
  latency: number
  tag?: string
}

export interface NodePool {
  nodes: Node[]
  total: number
  alive_count: number
}

export interface ProxyStatus {
  name: string
  type: string
  server: string
  port: number
  latency: number
  alive: boolean
}

export const api = {
  async health(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/health`)
    return res.json()
  },

  async getNodes(): Promise<{ nodes: Node[] }> {
    const res = await fetch(`${API_BASE}/nodes`)
    return res.json()
  },

  async addNode(url: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    return res.json()
  },

  async deleteNode(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/nodes/${id}`, {
      method: 'DELETE',
    })
    return res.json()
  },

  async loadNodes(path: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/nodes/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    })
    return res.json()
  },

  async loadSubscription(url: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/nodes/subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    return res.json()
  },

  async getPool(): Promise<NodePool> {
    const res = await fetch(`${API_BASE}/pool`)
    return res.json()
  },

  async triggerHealthCheck(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/pool/healthcheck`, {
      method: 'POST',
    })
    return res.json()
  },

  async getClashProxies(): Promise<{ proxies: ProxyStatus[] }> {
    const res = await fetch(`${API_BASE}/clash/proxies`)
    return res.json()
  },

  async selectProxy(group: string, name: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/clash/proxies/${group}/${name}`, {
      method: 'PUT',
    })
    return res.json()
  },

  async reloadClash(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/clash/reload`, {
      method: 'POST',
    })
    return res.json()
  },
}
