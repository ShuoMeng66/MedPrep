import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { getUnsyncedCount } from '@/utils/visitStore'
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

/**
 * 判断错误是否为"表不存在"（SQL 未执行）
 * 这类错误不应阻塞登录流程，应静默降级
 */
function isTableNotFoundError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return msg.includes('Could not find') || msg.includes('schema cache') || msg.includes('relation') && msg.includes('does not exist')
}

/** 从 user 对象生成一个本地 profile（不依赖数据库） */
function buildLocalProfile(user: User): Profile {
  return {
    id: user.id,
    nickname: user.user_metadata?.nickname || generateRandomNickname(),
    avatar_url: user.user_metadata?.avatar_url || null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  /** 未同步的本地记录数量（用于弹窗） */
  const [unsyncedCount, setUnsyncedCount] = useState(0)

  /**
   * 从 Supabase 获取 profile
   * 如果行不存在（老用户注册时触发器未触发），自动创建
   * 如果表不存在，静默降级为本地 profile（不影响登录）
   */
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        if (isTableNotFoundError(error)) {
          setProfile((prev) => prev || buildLocalProfile(user!))
          return
        }
        console.warn('[MedPrep] 读取 profile 失败:', error.message)
        setProfile((prev) => prev || buildLocalProfile(user!))
        return
      }

      if (data) {
        setProfile(data as Profile)
      } else {
        // 行不存在（老用户），尝试自动创建
        const localProfile = buildLocalProfile(user!)
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId, nickname: localProfile.nickname })
        if (insertError && !isTableNotFoundError(insertError)) {
          console.warn('[MedPrep] 自动创建 profile 失败:', insertError.message)
        }
        setProfile(localProfile)
      }
    } catch (e) {
      console.warn('[MedPrep] 读取 profile 异常:', e)
      setProfile((prev) => prev || buildLocalProfile(user!))
    }
  }, [user])

  // 监听认证状态变化
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        // 先用本地 profile 兜底，再异步拉取云端数据
        setProfile(buildLocalProfile(session.user))
        fetchProfile(session.user.id)
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
        // 先用本地 profile 兜底
        setProfile(buildLocalProfile(session.user))
        fetchProfile(session.user.id)
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
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        const msg = error.message.includes('Invalid login')
          ? '邮箱或密码错误'
          : error.message
        return { error: msg }
      }
      return {}
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('ISO-8859') || msg.includes('headers')) {
        return { error: '连接认证服务失败，请刷新页面重试' }
      }
      return { error: '登录失败，请稍后重试' }
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    try {
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      return { error: msg }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // 即使 signOut 失败也清除本地状态
    }
    setUser(null)
    setSession(null)
    setProfile(null)
  }, [])

  const signInAnonymously = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) {
        return { error: error.message }
      }
      // 匿名登录成功后，尝试插入 profile（表不存在时静默降级）
      if (data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            nickname: generateRandomNickname(),
          }, { onConflict: 'id' })
        } catch {
          // profiles 表不存在，静默降级，使用本地 profile
        }
      }
      return {}
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('ISO-8859') || msg.includes('headers')) {
        return { error: '连接认证服务失败，请刷新页面重试' }
      }
      return { error: '登录失败，请稍后重试' }
    }
  }, [])

  const updateProfile = useCallback(async (patch: Partial<Pick<Profile, 'nickname' | 'avatar_url'>>) => {
    if (!user) return { error: '未登录' }
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...patch }, { onConflict: 'id' })
      if (error) {
        if (isTableNotFoundError(error)) {
          // 表不存在，静默更新本地 profile
          setProfile((prev) => prev ? { ...prev, ...patch } : null)
          return {}
        }
        return { error: error.message }
      }
      setProfile((prev) => prev ? { ...prev, ...patch } : null)
      return {}
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      // 网络错误时仍然更新本地状态，但告知用户
      setProfile((prev) => prev ? { ...prev, ...patch } : null)
      return { error: msg.includes('Failed to fetch') ? '网络连接失败，请检查网络后重试' : msg }
    }
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
    try {
      const { error } = await supabase.auth.updateUser({ email, password })
      if (error) {
        return { error: error.message }
      }
      // 刷新 profile（表不存在时静默降级）
      fetchProfile(user.id)
      return {}
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return { error: msg }
    }
  }, [user, fetchProfile])

  // 上传头像到 Supabase Storage
  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) return { error: '未登录' }

    if (file.size > 2 * 1024 * 1024) {
      return { error: '图片大小不能超过 2MB' }
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return { error: '仅支持 JPG 和 PNG 格式' }
    }

    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const filePath = `${user.id}/avatar.${ext}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type })

      if (uploadError) {
        // bucket 不存在时给出明确提示
        if (uploadError.message.includes('not found') || uploadError.message.includes('bucket')) {
          return { error: '头像存储服务未配置，请在 Supabase 创建 avatars 存储桶' }
        }
        return { error: uploadError.message }
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      await updateProfile({ avatar_url: urlData.publicUrl })
      return { url: urlData.publicUrl }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return { error: msg }
    }
  }, [user, updateProfile])

  // 删除账户
  const deleteAccount = useCallback(async () => {
    if (!user) return { error: '未登录' }

    try {
      // 尝试删除 visits（表不存在时忽略）
      try { await supabase.from('visits').delete().eq('user_id', user.id) } catch {}
      // 尝试删除 profile（表不存在时忽略）
      try { await supabase.from('profiles').delete().eq('id', user.id) } catch {}
      // 尝试删除头像文件
      try { await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`]) } catch {}
    } catch {
      // 静默忽略所有清理错误
    }

    // 登出并清理本地数据
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    localStorage.removeItem('medprep_current_visit')
    localStorage.removeItem('medprep_visit_history')
    return {}
  }, [user])

  const checkUnsyncedData = useCallback(() => {
    const count = getUnsyncedCount()
    setUnsyncedCount(count)
    return count
  }, [])

  const syncLocalData = useCallback(async () => {
    if (!user) return { synced: 0, failed: 0 }
    const result = await batchSyncLocalHistory(user.id)
    if (result.synced > 0) {
      setUnsyncedCount(0)
    }
    return { synced: result.synced, failed: result.failed }
  }, [user])

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