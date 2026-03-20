import { NodePool } from '../lib/api'
import { Server, CheckCircle, XCircle, Gauge } from 'lucide-react'

interface PoolStatsProps {
  pool: NodePool
}

export function PoolStats({ pool }: PoolStatsProps) {
  const aliveRate = pool.total > 0 ? Math.round((pool.alive_count / pool.total) * 100) : 0

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
        <Server className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-600">
          共 <span className="font-semibold text-slate-800">{pool.total}</span> 个
        </span>
      </div>
      
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span className="text-sm text-green-600">
          <span className="font-semibold">{pool.alive_count}</span> 可用
        </span>
      </div>
      
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
        <XCircle className="w-4 h-4 text-red-400" />
        <span className="text-sm text-red-500">
          <span className="font-semibold">{pool.total - pool.alive_count}</span> 离线
        </span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
        <Gauge className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-blue-600">
          <span className="font-semibold">{aliveRate}%</span> 在线率
        </span>
      </div>
    </div>
  )
}
