import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { NodeTable } from './components/NodeTable'
import { PoolStats } from './components/PoolStats'
import { AddNodeDialog } from './components/AddNodeDialog'
import { SubscriptionDialog } from './components/SubscriptionDialog'
import { ModeSelector } from './components/ModeSelector'
import { api, Node, NodePool } from './lib/api'
import { RefreshCw, Plus, Upload, Activity } from 'lucide-react'

function App() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [pool, setPool] = useState<NodePool | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showSubDialog, setShowSubDialog] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'system' | 'global' | 'rule'>('rule')

  const loadData = async () => {
    setLoading(true)
    try {
      const [poolData, nodesData] = await Promise.all([
        api.getPool(),
        api.getNodes(),
      ])
      setPool(poolData)
      setNodes(nodesData.nodes)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
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
    try {
      await api.reloadClash()
      await loadData()
    } catch (error) {
      console.error('Failed to reload clash:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-slate-800">Proxy Pool</h1>
            {pool && (
              <PoolStats pool={pool} />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Node
            </button>
            <button
              onClick={() => setShowSubDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Subscription
            </button>
            <button
              onClick={handleHealthCheck}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Check
            </button>
          </div>
        </div>

        <ModeSelector
          selected={selectedMode}
          onChange={setSelectedMode}
        />

        <NodeTable
          nodes={nodes}
          onDelete={handleDeleteNode}
          loading={loading}
        />

        <div className="flex justify-end">
          <button
            onClick={handleReloadClash}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            <Activity className="w-4 h-4" />
            Reload Clash
          </button>
        </div>
      </main>

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
