import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import AppLayout from './pages/AppLayout'
import Dashboard from './pages/Dashboard'
import Environments from './pages/Environments'
import NewRun from './pages/NewRun'
import Console from './pages/Console'
import Report from './pages/Report'
import History from './pages/History'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<Auth mode="login" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="environments" element={<Environments />} />
        <Route path="new-run" element={<NewRun />} />
        <Route path="console" element={<Console />} />
        <Route path="report" element={<Report />} />
        <Route path="history" element={<History />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
