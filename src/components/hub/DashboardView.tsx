/* ============================================================
   Dashboard view — overview with quick stats and recent
   courses. Lightweight for now; a landing surface for the hub.
   ============================================================ */
import React from 'react'
import { BookOpen, FileText, Clock, Plus } from 'lucide-react'
import { useCoursesStore } from '../../store/coursesStore'
import { useNavStore } from '../../store/navStore'
import { T, R } from '../../theme/tokens'

const Stat: React.FC<{ icon: React.ReactNode; value: string | number; label: string }> = ({ icon, value, label }) => (
  <div style={{
    flex: 1, minWidth: 140, background: T.surface2, border: `1px solid ${T.border}`,
    borderRadius: R.lg, padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
  }}>
    <div style={{ color: 'var(--accent-text)' }}>{icon}</div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 700, color: T.text1 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: T.text3 }}>{label}</div>
    </div>
  </div>
)

const DashboardView: React.FC = () => {
  const courses = useCoursesStore((s) => s.courses)
  const createCourse = useCoursesStore((s) => s.createCourse)
  const openCourse = useNavStore((s) => s.openCourse)
  const goHub = useNavStore((s) => s.goHub)

  const totalPages = courses.reduce((n, c) => n + c.pages.length, 0)
  const recent = [...courses].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4)

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text1, margin: 0, letterSpacing: '-0.025em' }}>
        Tableau de bord
      </h1>
      <p style={{ fontSize: 14, color: T.text3, margin: '6px 0 28px' }}>
        Vue d'ensemble de vos cours et accès rapide.
      </p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
        <Stat icon={<BookOpen size={20} />} value={courses.length} label="Cours" />
        <Stat icon={<FileText size={20} />} value={totalPages} label="Pages" />
        <Stat icon={<Clock size={20} />} value={recent.length} label="Récents" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: T.text1, margin: 0 }}>Récemment modifiés</h2>
        <button
          onClick={() => goHub('courses')}
          style={{ background: 'transparent', border: 'none', color: 'var(--accent-text)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
        >
          Voir tout →
        </button>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {recent.map((c) => (
          <button
            key={c.id}
            onClick={() => openCourse(c.id, c.pages[0].id)}
            style={{
              textAlign: 'left', cursor: 'pointer',
              background: T.surface2, border: `1px solid ${T.border}`, borderRadius: R.md,
              padding: 14, fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.borderStrong)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text1, marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: T.text3 }}>{c.pages.length} page{c.pages.length > 1 ? 's' : ''}</div>
          </button>
        ))}
        <button
          onClick={() => { const c = createCourse(); openCourse(c.id, c.pages[0].id) }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            background: 'transparent', border: `1px dashed ${T.border}`, borderRadius: R.md,
            padding: 14, color: T.text3, fontFamily: 'inherit', fontSize: 13,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-text)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3 }}
        >
          <Plus size={16} /> Nouveau cours
        </button>
      </div>
    </div>
  )
}

export default DashboardView
