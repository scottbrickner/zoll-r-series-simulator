import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { SimulatorProvider, DEFAULT_SESSION } from './sync/SimulatorContext'
import Home from './views/Home'
import Learner from './views/Learner'
import Facilitator from './views/Facilitator'
import Report from './views/Report'
import ArtPreview from './views/ArtPreview'
import ControlsReview from './views/ControlsReview'
import ModeSelectorCompare from './views/ModeSelectorCompare'
import EnergySelectReview from './views/EnergySelectReview'
import SoftkeyReview from './views/SoftkeyReview'
import TypographyReview from './views/TypographyReview'
import DisplayFrameworkReview from './views/DisplayFrameworkReview'
import DisplayWidgetsReview from './views/DisplayWidgetsReview'

export default function App() {
  const [params] = useSearchParams()
  // Sync scope comes from the URL (?session=…). The launcher (/) assigns one.
  const sessionId = params.get('session') || DEFAULT_SESSION

  return (
    // key on sessionId so switching sessions remounts a fresh, scoped provider
    <SimulatorProvider key={sessionId} sessionId={sessionId}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learner" element={<Learner />} />
        <Route path="/facilitator" element={<Facilitator />} />
        <Route path="/report" element={<Report />} />
        <Route path="/art-preview" element={<ArtPreview />} />
        <Route path="/controls-review" element={<ControlsReview />} />
        <Route path="/mode-selector-compare" element={<ModeSelectorCompare />} />
        <Route path="/energy-select-review" element={<EnergySelectReview />} />
        <Route path="/softkey-review" element={<SoftkeyReview />} />
        <Route path="/typography-review" element={<TypographyReview />} />
        <Route path="/display-framework-review" element={<DisplayFrameworkReview />} />
        <Route path="/display-widgets-review" element={<DisplayWidgetsReview />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SimulatorProvider>
  )
}
