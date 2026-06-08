/* ============================================================
   Hub — the dashboard shell. A single top navbar holding the
   section tabs, with the active section's content filling the
   full width below it.
   ============================================================ */
import React from 'react'
import NavBar from './NavBar'
import DashboardView from './DashboardView'
import CoursesView from './CoursesView'
import SettingsView from './SettingsView'
import { useNavStore, type HubSection } from '../../store/navStore'
import { T } from '../../theme/tokens'

const Hub: React.FC = () => {
  const view = useNavStore((s) => s.view)
  const section: HubSection = view.kind === 'hub' ? view.section : 'courses'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden', background: T.surface0 }}>
      <NavBar />
      <main style={{ flex: 1, overflowY: 'auto', background: T.surface0 }}>
        {section === 'dashboard' && <DashboardView />}
        {section === 'courses' && <CoursesView />}
        {section === 'settings' && <SettingsView />}
      </main>
    </div>
  )
}

export default Hub
