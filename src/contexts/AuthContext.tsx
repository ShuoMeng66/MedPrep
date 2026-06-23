import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { getUnsyncedCount, getUnsyncedLocalHistory, markSynced } from '@/utils/visitStore'
import { batchSyncLocalHistory } from '@/services/visitService'

export interface Profile {
  id: string
  nickname: string
  avatar_url: string | null
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  /** 是否有未同步的本地数据等待用户确认 */
  unsyncedCount: number
  /** 登录后检查未同步数据 */
  checkUnsyncedData: () => number
  /** 执行批量同步 */
  syncLocalData: () => Promise<{ synced: number; failed: number }>
  /** 关闭同步弹窗 */
  dismissSyncDialog: () => void
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  signInAnonymously: () => Promise<{ error?: string }>
  sendPasswordResetEmail: (email: string) => Promise<{ error?: string }>
  sendMagicLink: (email: string) => Promise<{ error?: string }>
  bindEmail: (email: string, password: string) => Promise<{ error?: string }>
  uploadAvatar: (file: File) => Promise<{ error?: string; url?: string }>
  deleteAccount: () => Promise<{ error?: string }>
  updateProfile: (data: Partial<Pick<Profile, 'nickname' | 'avatar_url'>>) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function generateRandomNickname(): string {
  const chars = '0123456789'
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `用户${suffix}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  /** 未同步的本地记录数量（用于弹窗） */
  const [unsyncedCount, setUnsyncedCount] = useState(0)

  // 获取 profile
  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      setProfile(data as Profile)
    }
  }, [])

  // 监听认证状态变化
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        // 登录后检查是否有未同步的本地数据
        const count = getUnsyncedCount()
        if (count > 0) {
          setUnsyncedCount(count)
        }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        // SIGNED_IN 事件：登录成功时检查未同步数据
        if (event === 'SIGNED_IN') {
          const count = getUnsyncedCount()
          if (count > 0) {
            setUnsyncedCount(count)
          }
        }
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = error.message.includes('Invalid login')
        ? '邮箱或密码错误'
        : error.message
      return { error: msg }
    }
    return {}
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname: generateRandomNickname() },
        emailRedirectTo: `${window.location.origin}/MedPrep/#/app`,
      },
    })
    if (error) {
      return { error: error.message }
    }
    return {}
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }, [])

  const signInAnonymously = useCallback(async () => {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      return { error: error.message }
    }
    if (data.user) {
      // 确保 profiles 中有记录
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()
      if (!existing) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          nickname: generateRandomNickname(),
        })
      }
    }
    return {}
  }, [])

  const updateProfile = useCallback(async (patch: Partial<Pick<Profile, 'nickname' | 'avatar_url'>>) => {
    if (!user) return { error: '未登录' }
    const { error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', user.id)
    if (error) {
      return { error: error.message }
    }
    setProfile((prev) => prev ? { ...prev, ...patch } : null)
    return {}
  }, [user])

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/MedPrep/#/login`,
    })
    if (error) {
      return { error: error.message }
    }
    return {}
  }, [])

  const sendMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/MedPrep/#/app`,
      },
    })
    if (error) {
      return { error: error.message }
    }
    return {}
  }, [])

  // 匿名用户绑定邮箱：升级为正式账户
  const bindEmail = useCallback(async (email: string, password: string) => {
    if (!user?.is_anonymous) {
      return { error: '当前账户不是匿名账户' }
    }
    const { error } = await supabase.auth.updateUser({ email, password })
    if (error) {
      return { error: error.message }
    }
    // 刷新 profile
    await fetchProfile(user.id)
    return {}
  }, [user, fetchProfile])

  // 上传头像到 Supabase Storage
  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) return { error: '未登录' }

    // 校验
    if (file.size > 2 * 1024 * 1024) {
      return { error: '图片大小不能超过 2MB' }
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return { error: '仅支持 JPG 和 PNG 格式' }
    }

    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const filePath = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      return { error: uploadError.message }
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl
    await updateProfile({ avatar_url: avatarUrl })

    return { url: avatarUrl }
  }, [user, updateProfile])

  // 删除账户
  const deleteAccount = useCallback(async () => {
    if (!user) return { error: '未登录' }

    // 删除 visits
    await supabase.from('visits').delete().eq('user_id', user.id)
    // 删除 profile
    await supabase.from('profiles').delete().eq('id', user.id)
    // 删除头像文件
    await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`])

    // 删除 auth user（需要调用 Supabase Edge Function 或使用 admin API）
    // 前端 anon key 无法直接删除用户，这里用 signOut 作为替代
    // 如需彻底删除，需要在 Supabase Dashboard 创建 Edge Function
    const { error } = await supabase.rpc('delete_user') as { error?: { message: string } }
    if (error) {
      // 如果 RPC 不存在，至少登出并清理本地数据
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
      localStorage.removeItem('medprep_current_visit')
      localStorage.removeItem('medprep_visit_history')
      return {}
    }

    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    localStorage.removeItem('medprep_current_visit')
    localStorage.removeItem('medprep_visit_history')
    return {}
  }, [user])

  // 检查未同步数据（供外部调用）
  const checkUnsyncedData = useCallback(() => {
    const count = getUnsyncedCount()
    setUnsyncedCount(count)
    return count
  }, [])

  // 执行批量同步
  const syncLocalData = useCallback(async () => {
    if (!user) return { synced: 0, failed: 0 }
    const result = await batchSyncLocalHistory(user.id)
    if (result.synced > 0) {
      setUnsyncedCount(0)
    }
    return { synced: result.synced, failed: result.failed }
  }, [user])

  // 关闭同步弹窗
  const dismissSyncDialog = useCallback(() => {
    setUnsyncedCount(0)
  }, [])

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      unsyncedCount, checkUnsyncedData, syncLocalData, dismissSyncDialog,
      signIn, signUp, signOut, signInAnonymously,
      sendPasswordResetEmail, sendMagicLink,
      bindEmail, uploadAvatar, deleteAccount, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}