import { useState } from 'react'
import { X, Loader2, CloudDownload } from 'lucide-react'

interface SubscriptionDialogProps {
  onClose: () => void
  onLoad: (url: string) => void
}

export function SubscriptionDialog({ onClose, onLoad }: SubscriptionDialogProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    
    setLoading(true)
    try {
      await onLoad(url.trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <CloudDownload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">订阅导入</h2>
              <p className="text-xs text-slate-500">从订阅地址批量导入节点</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              订阅地址
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/sub"
              className="input"
              autoFocus
            />
            <p className="mt-2 text-xs text-slate-500">
              输入机场订阅链接，系统将自动解析并导入所有节点
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="btn-primary"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? '导入中...' : '导入'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
