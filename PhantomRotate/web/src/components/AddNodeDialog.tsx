import { useState } from 'react'
import { X, Link } from 'lucide-react'

interface AddNodeDialogProps {
  onClose: () => void
  onAdd: (url: string) => void
}

export function AddNodeDialog({ onClose, onAdd }: AddNodeDialogProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    
    setLoading(true)
    try {
      await onAdd(url.trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Link className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">添加节点</h2>
              <p className="text-xs text-slate-500">手动输入节点链接</p>
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
              节点链接
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="trojan://password@server:port#节点名称"
              className="input"
              autoFocus
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-md">Trojan</span>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md">Shadowsocks</span>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md">VMess</span>
            </div>
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
              {loading ? '添加中...' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
