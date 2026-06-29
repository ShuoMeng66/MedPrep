-- =====================================================
-- 陪诊锦囊 MedPrep — Supabase 数据库初始化 SQL
-- 请在 Supabase Dashboard → SQL Editor 中执行此文件
-- =====================================================

-- 1. profiles 表 — 用户资料
-- =====================================================
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname    text NOT NULL DEFAULT '用户',
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. visits 表 — 就诊历史
-- =====================================================
CREATE TABLE public.visits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT '',
  visit_data  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 索引：按用户查询并按时间排序
CREATE INDEX idx_visits_user_created ON public.visits (user_id, created_at DESC);

-- 3. 触发器：新用户注册时自动创建 profile
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  random_suffix text;
BEGIN
  -- 生成随机 4 位数字后缀
  random_suffix := lpad(floor(random() * 10000)::text, 4, '0');
  INSERT INTO public.profiles (id, nickname)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nickname', '用户' || random_suffix)
  );
  RETURN NEW;
END;
$$;

-- 绑定触发器
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. RLS 策略
-- =====================================================

-- profiles 表：仅本人可读写
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- visits 表：仅本人可增删改查
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visits_select_own" ON public.visits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "visits_insert_own" ON public.visits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "visits_update_own" ON public.visits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "visits_delete_own" ON public.visits
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Storage bucket：avatars（公开读，仅本人路径可写）
-- =====================================================
-- 注意：Storage bucket 建议通过 Supabase Dashboard 手动创建
-- 路径：Storage → New Bucket → 名称 "avatars" → 勾选 "Public bucket"
-- 创建后，在 SQL Editor 执行以下 RLS 策略：

-- 公开读取
-- CREATE POLICY "avatars_select_public" ON storage.objects
--   FOR SELECT USING (bucket_id = 'avatars');

-- 仅本人可上传/更新自己的头像
-- CREATE POLICY "avatars_insert_own" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'avatars'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );

-- 仅本人可删除自己的头像
-- CREATE POLICY "avatars_delete_own" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'avatars'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );

-- 6. shares 表 — 分享数据（短链接用）
-- =====================================================
CREATE TABLE public.shares (
  id          text PRIMARY KEY,
  visit_data  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 索引：按创建时间排序（用于清理过期数据）
CREATE INDEX idx_shares_created ON public.shares (created_at);

-- RLS：允许所有人读取（分享链接无需登录）
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shares_select_public" ON public.shares
  FOR SELECT USING (true);

CREATE POLICY "shares_insert_authenticated" ON public.shares
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 清理 7 天前过期分享（可在 SQL Editor 手动执行，或通过 pg_cron / Edge Function 定时调用）
CREATE OR REPLACE FUNCTION public.cleanup_expired_shares()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.shares WHERE created_at < now() - interval '7 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;