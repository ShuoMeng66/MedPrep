import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn('[MedPrep] Supabase 凭证未配置，云同步与登录功能不可用')
}

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