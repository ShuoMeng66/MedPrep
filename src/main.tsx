import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { registerServiceWorker, startReminderSyncLoop } from '@/services/notificationService'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

// #region agent log
fetch('http://127.0.0.1:7428/ingest/d636c314-02d6-4115-b0ee-1835e9edea35',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'34f2c5'},body:JSON.stringify({sessionId:'34f2c5',location:'main.tsx:boot',message:'app bootstrap start',data:{isSupabaseConfigured},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{});
// #endregion

function AppBootstrap() {
  useEffect(() => {
    void registerServiceWorker()
    return startReminderSyncLoop()
  }, [])

  return <App />
}

const rootEl = document.getElementById('root')
// #region agent log
fetch('http://127.0.0.1:7428/ingest/d636c314-02d6-4115-b0ee-1835e9edea35',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'34f2c5'},body:JSON.stringify({sessionId:'34f2c5',location:'main.tsx:render',message:'createRoot',data:{hasRoot:Boolean(rootEl)},timestamp:Date.now(),hypothesisId:'B',runId:'post-fix'})}).catch(()=>{});
// #endregion

createRoot(rootEl!).render(
  <StrictMode>
    <AppBootstrap />
  </StrictMode>,
)