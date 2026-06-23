import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 开发环境下提示缺失配置
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[MedPrep] Supabase 凭证未配置，请检查 .env 文件')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    // GitHub Pages 使用 HashRouter，URL hash 中可能包含非 ASCII 字符
    // 关闭此选项避免 Supabase 误解析 URL 导致 headers 编码错误
    detectSessionInUrl: false,
  },
})