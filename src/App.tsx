import React, { useEffect } from 'react'
import Hub from './components/hub/Hub'
import CourseEditor from './components/editor/CourseEditor'
import { useCanvasStore } from './store/canvasStore'
import { useNavStore } from './store/navStore'
import { useThemeSync } from './theme/useTheme'

const App: React.FC = () => {
  useThemeSync()

  const view = useNavStore((s) => s.view)

  // Canvas keyboard shortcuts are only relevant inside the editor.
  const undo = useCanvasStore((s) => s.undo)
  const redo = useCanvasStore((s) => s.redo)
  const deleteSelectedElements = useCanvasStore((s) => s.deleteSelectedElements)
  const selectedIds = useCanvasStore((s) => s.selectedIds)

  const inEditor = view.kind === 'editor'

  useEffect(() => {
    if (!inEditor) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable === true
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z': e.preventDefault(); e.shiftKey ? redo() : undo(); break
          case 'y': e.preventDefault(); redo(); break
        }
      } else if (!isInput) {
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
          e.preventDefault()
          deleteSelectedElements()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [inEditor, undo, redo, deleteSelectedElements, selectedIds])

  if (view.kind === 'editor') {
    return <CourseEditor courseId={view.courseId} pageId={view.pageId} />
  }
  return <Hub />
}

export default App
