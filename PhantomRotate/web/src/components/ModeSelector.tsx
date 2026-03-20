import { Globe, Shield, List } from 'lucide-react'

interface ModeSelectorProps {
  selected: 'system' | 'global' | 'rule'
  onChange: (mode: 'system' | 'global' | 'rule') => void
}

const modes = [
  { id: 'system' as const, label: 'System', icon: Globe, desc: 'System Proxy' },
  { id: 'global' as const, label: 'Global', icon: Shield, desc: 'Global Proxy' },
  { id: 'rule' as const, label: 'Rule', icon: List, desc: 'Rule-based' },
]

export function ModeSelector({ selected, onChange }: ModeSelectorProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-medium text-slate-700">Proxy Mode</h2>
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
                flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-200 hover:border-slate-300 bg-white'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`} />
              <div className="text-left">
                <div className={`font-medium ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                  {mode.label}
                </div>
                <div className="text-xs text-slate-500">{mode.desc}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
