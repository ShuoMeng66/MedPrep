import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn('[MedPrep] Supabase 凭证未配置，云同步与登录功能不可用')
}

// #region agent log
fetch('http://127.0.0.1:7428/ingest/d636c314-02d6-4115-b0ee-1835e9edea35',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'34f2c5'},body:JSON.stringify({sessionId:'34f2c5',location:'supabaseClient.ts:init',message:'supabase client init',data:{isSupabaseConfigured,hasUrl:Boolean(supabaseUrl)},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{});
// #endregion

// 空 URL 会在模块加载时抛错导致整页白屏；占位值仅用于保证应用能启动
const clientUrl = supabaseUrl || 'https://placeholder.supabase.co'
const clientKey = supabaseAnonKey || 'placeholder-anon-key'

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    // GitHub Pages 使用 HashRouter，URL hash 中可能包含非 ASCII 字符
    // 关闭此选项避免 Supabase 误解析 URL 导致 headers 编码错误
    detectSessionInUrl: false,
  },
})