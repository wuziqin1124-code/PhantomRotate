import { Node } from '../lib/api'
import { Trash2, CheckCircle, XCircle, Clock, Server, ChevronRight } from 'lucide-react'

interface NodeTableProps {
  nodes: Node[]
  onDelete: (id: string) => void
  loading: boolean
}

const getTypeBadgeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'trojan':
      return 'bg-purple-100 text-purple-700'
    case 'ss':
      return 'bg-blue-100 text-blue-700'
    case 'vmess':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const getLatencyColor = (latency: number) => {
  if (latency === 0) return 'text-slate-400'
  if (latency < 100) return 'text-green-600'
  if (latency < 300) return 'text-yellow-600'
  return 'text-red-600'
}

export function NodeTable({ nodes, onDelete, loading }: NodeTableProps) {
  if (nodes.length === 0 && !loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <Server className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-700 mb-2">暂无节点</h3>
        <p className="text-slate-500">添加节点或导入订阅以开始使用</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">节点名称</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">协议</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">服务器</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">延迟</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {nodes.map((node) => (
            <tr key={node.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-4 py-3.5">
                {node.alive ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-600 font-medium">在线</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xs text-red-500 font-medium">离线</span>
                  </div>
                )}
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{node.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </td>
              <td className="px-4 py-3.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(node.type)}`}>
                  {node.type.toUpperCase()}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <span className="text-sm text-slate-600 font-mono">{node.server}:{node.port}</span>
              </td>
              <td className="px-4 py-3.5">
                {node.latency > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className={`text-sm font-medium ${getLatencyColor(node.latency)}`}>
                      {node.latency} ms
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">-</span>
                )}
              </td>
              <td className="px-4 py-3.5 text-right">
                <button
                  onClick={() => onDelete(node.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
            <span className="text-sm text-slate-600">加载中...</span>
          </div>
        </div>
      )}
    </div>
  )
}
