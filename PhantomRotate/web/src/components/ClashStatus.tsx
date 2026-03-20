import { Activity, Server, Clock } from 'lucide-react'

export function ClashStatus() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200">
        <Activity className="w-4 h-4 text-green-500" />
        <span className="text-sm text-slate-600">
          Clash 内核: <span className="font-medium text-green-600">运行中</span>
        </span>
      </div>
      
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200">
        <Server className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-slate-600">
          端口: <span className="font-medium text-slate-800">1080</span>
        </span>
      </div>
      
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200">
        <Clock className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-600">
          轮换策略: <span className="font-medium text-slate-800">Round Robin</span>
        </span>
      </div>
    </div>
  )
}
