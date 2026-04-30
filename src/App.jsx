import { useStore } from './lib/store'
import Dashboard from './pages/Dashboard'
import Sidebar from './components/Sidebar'
import SettingsPage from './pages/SettingsPage'
import ReposPage from './pages/ReposPage'
import AnalysePage from './pages/AnalysePage'
import QAPage from './pages/QAPage'
import MasterPage from './pages/MasterPage'
import PitchPage from './pages/PitchPage'
import { Btn } from './components/UI'

const PAGES = [Dashboard, ReposPage, AnalysePage, QAPage, MasterPage, PitchPage]

export default function App() {
  const {
    currentStep, setStep, showSettings, repos, isDirty, projectName, saveProject,
    currentProjectId, analysedCount, masterPrd
  } = useStore()

  const Page = PAGES[currentStep] || Dashboard

  const canGoNext = () => {
    if (currentStep === 1) return repos.some(r => r.treeData?.length > 0)
    if (currentStep === 2) return repos.some(r => r.overview)
    if (currentStep === 4) return !!masterPrd
    if (currentStep >= 5) return false
    return true
  }

  const handleNext = () => {
    if (canGoNext()) setStep(currentStep + 1)
  }

  const handlePrev = () => {
    if (currentStep > 0) setStep(currentStep - 1)
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          <div className="stage-container">
            {showSettings ? (
              <div className="fade-in">
                <SettingsPage />
              </div>
            ) : (
              <div key={currentStep} className="fade-in">
                <Page />
              </div>
            )}
          </div>
        </div>

        {/* Global Footer Credit */}
        <footer style={{
          marginTop: 'auto', padding: '40px 0 20px 0',
          textAlign: 'center', opacity: 0.5,
          fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
          letterSpacing: '0.05em'
        }}>
          Open Source Project by Anuraag Jain of Growth Variable. Connect on LinkedIn:
          <a href="http://www.linkedin.com/in/anuraagjain" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', marginLeft: 6, textDecoration: 'none' }}>
            http://www.linkedin.com/in/anuraagjain
          </a>
        </footer>

        {/* Floating Navigation */}
        {!showSettings && currentStep > 0 && currentStep < 6 && (
          <div style={{
            position: 'fixed', top: 32, right: 32,
            display: 'flex', gap: 12, zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(12px)',
            padding: '8px', borderRadius: '12px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <Btn variant="secondary" onClick={handlePrev} style={{ padding: '10px 20px', fontSize: 11 }}>
              ← PREV
            </Btn>
            {currentStep < 5 && (
              <Btn onClick={handleNext} disabled={!canGoNext()} style={{ padding: '10px 20px', fontSize: 11 }}>
                NEXT →
              </Btn>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
