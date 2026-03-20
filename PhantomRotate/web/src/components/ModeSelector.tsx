import { Globe, Shield, List, Check } from 'lucide-react'

interface ModeSelectorProps {
  selected: 'system' | 'global' | 'rule'
  onChange: (mode: 'system' | 'global' | 'rule') => void
}

const modes = [
  { id: 'system' as const, label: '系统代理', icon: Globe, desc: '自动代理' },
  { id: 'global' as const, label: '全局代理', icon: Shield, desc: '全部流量' },
  { id: 'rule' as const, label: '规则代理', icon: List, desc: '分流规则' },
]

export function ModeSelector({ selected, onChange }: ModeSelectorProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-medium text-slate-600">代理模式</h2>
      </div>
      
      <div className="flex gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon
          const isSelected = selected === mode.id
          
          return (
            <button
              key={mode.id}
              onClick={() => onChange(mode.id)}
              className={`
                flex-1 flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 transition-all duration-200
                ${isSelected 
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md shadow-blue-500/10' 
                  : 'border-slate-200 hover:border-slate-300 bg-white'
                }
              `}
            >
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${isSelected ? 'bg-blue-500' : 'bg-slate-100'}
              `}>
                <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <div className="text-left flex-1">
                <div className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                  {mode.label}
                </div>
                <div className="text-xs text-slate-500">{mode.desc}</div>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
