import { RotateCw, Github } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <RotateCw className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">PhantomRotate</h1>
            <p className="text-xs text-slate-500">Proxy Pool Manager</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">v0.5.0</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Github className="w-5 h-5 text-slate-600" />
          </a>
        </div>
      </div>
    </header>
  )
}
