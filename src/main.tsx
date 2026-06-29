import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { registerServiceWorker, startReminderSyncLoop } from '@/services/notificationService'

function AppBootstrap() {
  useEffect(() => {
    void registerServiceWorker()
    return startReminderSyncLoop()
  }, [])

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppBootstrap />
  </StrictMode>,
)