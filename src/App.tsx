import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import AuthGuard, { GuestGuard } from '@/components/AuthGuard'
import SyncDialog from '@/components/SyncDialog'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import History from '@/pages/History'
import HistoryDetail from '@/pages/HistoryDetail'
import Settings from '@/pages/Settings'
import ShareView from '@/components/ShareView'
import { isShareUrl } from '@/utils/shareUtils'

export default function App() {
  // 分享链接：不需要登录，直接渲染只读视图
  if (isShareUrl()) {
    return <ShareView />
  }

  return (
    <AuthProvider>
      <Router>
        <SyncDialog />
        <Routes>
          {/* 未登录页面 */}
          <Route path="/login" element={<GuestGuard><Login /></GuestGuard>} />

          {/* 需登录页面 */}
          <Route path="/app" element={<AuthGuard><Home /></AuthGuard>} />
          <Route path="/history" element={<AuthGuard><History /></AuthGuard>} />
          <Route path="/history/:id" element={<AuthGuard><HistoryDetail /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />

          {/* 默认重定向 */}
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}