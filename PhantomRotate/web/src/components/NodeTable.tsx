import { Node } from '../lib/api'
import { Trash2, CheckCircle, XCircle, Clock, Server } from 'lucide-react'

interface NodeTableProps {
  nodes: Node[]
  onDelete: (id: string) => void
  loading: boolean
}

export function NodeTable({ nodes, onDelete, loading }: NodeTableProps) {
  if (nodes.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Server className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-700 mb-2">No Nodes</h3>
        <p className="text-slate-500">Add nodes or load a subscription to get started</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Name</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Type</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Server</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Latency</th>
            <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {nodes.map((node) => (
            <tr key={node.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3">
                {node.alive ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </td>
              <td className="px-4 py-3">
                <span className="font-medium text-slate-800">{node.name}</span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 uppercase">
                  {node.type}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-slate-600">{node.server}:{node.port}</span>
              </td>
              <td className="px-4 py-3">
                {node.latency > 0 ? (
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <Clock className="w-4 h-4" />
                    {node.latency}ms
                  </span>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onDelete(node.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {loading && nodes.length > 0 && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  )
}
