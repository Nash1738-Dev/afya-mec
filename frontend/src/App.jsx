import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import AuthGuard from './components/shared/AuthGuard'
import Dashboard from './pages/Dashboard'
import Registration from './pages/registration/Registration'
import PreChoice from './pages/screening/PreChoice'
import MECScreener from './pages/screening/MECScreener'
import MethodChoice from './pages/methods/MethodChoice'
import PostChoice from './pages/counselling/PostChoice'
import SessionSummary from './pages/summary/SessionSummary'
import PrintReport from './pages/summary/PrintReport'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import { SessionProvider } from './hooks/useSession.jsx'
import FacilitySettings from './pages/FacilitySettings'
import Reports from './pages/Reports'
import ManageUsers from './pages/ManageUsers'
import Login from './pages/Login'
import SMSReminders from './pages/SMSReminders'
import MultiFacility from './pages/MultiFacility'
import Resources from './pages/Resources'
import BCSAlgorithm from './pages/BCSAlgorithm'
import AnonymousEntry from './pages/AnonymousEntry'
import MOH711Report from './pages/MOH711Report'
import DISCProject from './pages/DISCProject'
import DHIS2Integration from './pages/DHIS2Integration'
import MOH747A from './pages/MOH747A'
import MOH512Report from './pages/MOH512Report'
import NotFound from './pages/NotFound'
import MethodsResource from './pages/MethodsResource'
import MECWheel from './pages/MECWheel'
import AfyaMentor from './pages/AfyaMentor'

export default function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="settings" element={<FacilitySettings />} />
          <Route path="settings/users" element={<ManageUsers />} />
          <Route path="settings/sms" element={<SMSReminders />} />
          <Route path="settings/multi-facility" element={<MultiFacility />} />
          <Route path="settings/dhis2" element={<DHIS2Integration />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/moh711" element={<MOH711Report />} />
          <Route path="reports/disc" element={<DISCProject />} />
          <Route path="reports/moh747a" element={<MOH747A />} />
          <Route path="reports/moh512" element={<MOH512Report />} />
          <Route path="resources" element={<Resources />} />
          <Route path="methods" element={<MethodsResource />} />
          <Route path="mec-wheel" element={<MECWheel />} />
          <Route path="mentor" element={<AfyaMentor />} />
          <Route path="bcs-algorithm" element={<BCSAlgorithm />} />
          <Route path="anonymous-entry" element={<AnonymousEntry />} />
          <Route path="session/registration" element={<Registration />} />
          <Route path="session/pre-choice" element={<PreChoice />} />
          <Route path="session/screener" element={<MECScreener />} />
          <Route path="session/methods" element={<MethodChoice />} />
          <Route path="session/counselling" element={<PostChoice />} />
          <Route path="session/summary" element={<SessionSummary />} />
          <Route path="session/print" element={<PrintReport />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </SessionProvider>
  )
}