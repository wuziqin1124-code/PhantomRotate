import { NodePool } from '../lib/api'
import { Server, CheckCircle, XCircle } from 'lucide-react'

interface PoolStatsProps {
  pool: NodePool
}

export function PoolStats({ pool }: PoolStatsProps) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <Server className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-600">
          Total: <span className="font-medium text-slate-900">{pool.total}</span>
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span className="text-sm text-slate-600">
          Alive: <span className="font-medium text-green-600">{pool.alive_count}</span>
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <XCircle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-slate-600">
          Dead: <span className="font-medium text-red-600">{pool.total - pool.alive_count}</span>
        </span>
      </div>
    </div>
  )
}
