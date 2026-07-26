import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import VehicleList from './pages/VehicleList'
import VehicleDetail from './pages/VehicleDetail'
import AIAnalysis from './pages/AIAnalysis'
import ReturnAccept from './pages/ReturnAccept'
import Penalty from './pages/Penalty'
import AlertPage from './pages/AlertPage'
import Login from './pages/Login'

function Layout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '200px', flex: 1, minHeight: '100vh', background: '#f8f9fa' }}>
        {children}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/vehicles" element={<Layout><VehicleList /></Layout>} />
        <Route path="/vehicles/:id" element={<Layout><VehicleDetail /></Layout>} />
        <Route path="/analysis" element={<Layout><AIAnalysis /></Layout>} />
        <Route path="/return" element={<Layout><ReturnAccept /></Layout>} />
        <Route path="/penalty" element={<Layout><Penalty /></Layout>} />
        <Route path="/alert" element={<Layout><AlertPage /></Layout>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
