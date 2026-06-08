import React from 'react'
import { Undo2, Redo2, Download, Home } from 'lucide-react'
import { useCanvasStore } from '../../store/canvasStore'
import { fitViewportToElements } from '../../utils/canvasUtils'

const TopBar: React.FC = () => {
  const viewport = useCanvasStore((s) => s.viewport)
  const elements = useCanvasStore((s) => s.elements)
  const history = useCanvasStore((s) => s.history)
  const historyIndex = useCanvasStore((s) => s.historyIndex)

  const setViewport = useCanvasStore((s) => s.setViewport)
  const undo = useCanvasStore((s) => s.undo)
  const redo = useCanvasStore((s) => s.redo)
  const exportJSON = useCanvasStore((s) => s.exportJSON)

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const goToOrigin = () => {
    setViewport({ x: 0, y: 0 })
  }

  const handleExport = () => {
    const json = exportJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tutor-ai-canvas.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const fitContent = () => {
    const vp = fitViewportToElements(elements, window.innerWidth - 64, window.innerHeight - 48)
    setViewport(vp)
  }

  return (
    <header className="topbar">
      {/* Left: brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">Tutor AI</span>
        </div>
        <div className="h-4 w-px bg-slate-700" />
        <span className="text-slate-500 text-xs">Infinite Canvas</span>
      </div>

      {/* Center: zoom & nav */}
      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 hover:text-white text-xs font-mono tabular-nums border border-slate-700"
          onClick={fitContent}
          title="Fit to content"
        >
          <span>{Math.round(viewport.zoom * 100)}%</span>
        </button>

        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white text-xs border border-slate-700"
          onClick={goToOrigin}
          title="Pan to origin (0, 0)"
        >
          <Home size={13} />
        </button>

        <div className="text-slate-600 text-xs font-mono">
          {Math.round(-viewport.x / viewport.zoom)}, {Math.round(-viewport.y / viewport.zoom)}
        </div>
      </div>

      {/* Right: undo/redo + export */}
      <div className="flex items-center gap-1.5">
        <button
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs transition-all border ${
            canUndo
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
          }`}
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={14} />
          <span>Undo</span>
        </button>

        <button
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs transition-all border ${
            canRedo
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
          }`}
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={14} />
          <span>Redo</span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-0.5" />

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          onClick={handleExport}
          title="Export canvas as JSON"
        >
          <Download size={13} />
          <span>Export JSON</span>
        </button>
      </div>
    </header>
  )
}

export default TopBar
