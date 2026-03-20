import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { NodeTable } from './components/NodeTable'
import { PoolStats } from './components/PoolStats'
import { AddNodeDialog } from './components/AddNodeDialog'
import { SubscriptionDialog } from './components/SubscriptionDialog'
import { ModeSelector } from './components/ModeSelector'
import { ClashStatus } from './components/ClashStatus'
import { api, Node, NodePool } from './lib/api'
import { RefreshCw, Plus, Upload, Activity, Wifi } from 'lucide-react'

function App() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [pool, setPool] = useState<NodePool | null>(null)
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showSubDialog, setShowSubDialog] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'system' | 'global' | 'rule'>('rule')

  const loadData = async () => {
    try {
      const [poolData, nodesData] = await Promise.all([
        api.getPool(),
        api.getNodes(),
      ])
      setPool(poolData)
      setNodes(nodesData.nodes)
      setConnected(true)
    } catch (error) {
      console.error('Failed to load data:', error)
      setConnected(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleHealthCheck = async () => {
    setLoading(true)
    try {
      await api.triggerHealthCheck()
      await loadData()
    } catch (error) {
      console.error('Failed to trigger health check:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNode = async (url: string) => {
    try {
      await api.addNode(url)
      setShowAddDialog(false)
      await loadData()
    } catch (error) {
      console.error('Failed to add node:', error)
    }
  }

  const handleDeleteNode = async (id: string) => {
    try {
      await api.deleteNode(id)
      await loadData()
    } catch (error) {
      console.error('Failed to delete node:', error)
    }
  }

  const handleLoadSubscription = async (url: string) => {
    try {
      await api.loadSubscription(url)
      setShowSubDialog(false)
      await loadData()
    } catch (error) {
      console.error('Failed to load subscription:', error)
    }
  }

  const handleReloadClash = async () => {
    setLoading(true)
    try {
      await api.reloadClash()
      await loadData()
    } catch (error) {
      console.error('Failed to reload clash:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="scale-container" style={{ transform: 'scale(0.85)', marginBottom: '-15%' }}>
        <Header connected={connected} />
        
        <main className="container mx-auto px-6 py-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-slate-800">代理节点池</h1>
              {pool && <PoolStats pool={pool} />}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddDialog(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加节点
              </button>
              <button
                onClick={() => setShowSubDialog(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                订阅导入
              </button>
              <button
                onClick={handleHealthCheck}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                延迟检测
              </button>
            </div>
          </div>

          <ModeSelector
            selected={selectedMode}
            onChange={setSelectedMode}
          />

          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h2 className="font-medium text-slate-700">节点列表</h2>
            </div>
            <NodeTable
              nodes={nodes}
              onDelete={handleDeleteNode}
              loading={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <ClashStatus />
            
            <button
              onClick={handleReloadClash}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              重启 Clash
            </button>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Wifi className="w-4 h-4" />
              <span>代理服务端口: 1080 (HTTP/SOCKS5 混合)</span>
            </div>
          </div>
        </main>
      </div>

      {showAddDialog && (
        <AddNodeDialog
          onClose={() => setShowAddDialog(false)}
          onAdd={handleAddNode}
        />
      )}

      {showSubDialog && (
        <SubscriptionDialog
          onClose={() => setShowSubDialog(false)}
          onLoad={handleLoadSubscription}
        />
      )}
    </div>
  )
}

export default App
