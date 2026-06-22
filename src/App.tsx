import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import ShareView from '@/components/ShareView'
import { isShareUrl } from '@/utils/shareUtils'

export default function App() {
  // 检测分享链接：如果 hash 以 #share= 开头，直接渲染只读分享视图
  if (isShareUrl()) {
    return <ShareView />
  }

  return (
    <Router>
      <Routes>
        <Route path="/*" element={<Home />} />
      </Routes>
    </Router>
  )
}