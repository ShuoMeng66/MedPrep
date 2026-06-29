import { supabase } from '@/lib/supabaseClient'
import type { VisitData } from '@/utils/visitStore'

const SHARES_TABLE = 'shares'

/** 生成短 UUID（8 位 hex） */
function generateShortId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 10)
}

/** 创建分享记录，返回短 UUID */
export async function createShare(data: VisitData): Promise<{ uuid: string } | { error: string }> {
  try {
    const uuid = generateShortId()
    const { error } = await supabase
      .from(SHARES_TABLE)
      .insert({
        id: uuid,
        visit_data: data,
      })

    if (error) {
      // 表不存在时静默降级
      if (error.message?.includes('does not exist') || error.message?.includes('Could not find')) {
        return { error: 'shares_table_not_found' }
      }
      return { error: error.message }
    }

    return { uuid }
  } catch (e: any) {
    return { error: e?.message || '未知错误' }
  }
}

/** 根据短 UUID 获取分享数据 */
export async function getShare(uuid: string): Promise<{ data: VisitData } | { error: string }> {
  try {
    const { data, error } = await supabase
      .from(SHARES_TABLE)
      .select('visit_data')
      .eq('id', uuid)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { error: '分享已过期或不存在' }
      }
      return { error: error.message }
    }

    if (!data?.visit_data) {
      return { error: '分享数据为空' }
    }

    return { data: data.visit_data as VisitData }
  } catch (e: any) {
    return { error: e?.message || '未知错误' }
  }
}