-- =============================================
-- Supabase 数据库完整初始化脚本
-- 请在 Supabase 控制台 > SQL Editor 中执行
-- =============================================

-- 第一步：删除旧的策略（如果存在）
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own generations" ON generations;
DROP POLICY IF EXISTS "Users can create generations" ON generations;
DROP POLICY IF EXISTS "Users can delete their own generations" ON generations;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view their own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can create api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can view their own generation history" ON generation_history;

-- 第二步：创建管理员检查函数（必须在创建策略之前）
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  SELECT is_admin INTO admin_status
  FROM users
  WHERE id = auth.uid();
  
  RETURN COALESCE(admin_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 第三步：创建新的 RLS 策略

-- users 表策略
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- generations 表策略
CREATE POLICY "Users can view their own generations" ON generations
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create generations" ON generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generations" ON generations
  FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- transactions 表策略
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- api_keys 表策略
CREATE POLICY "Users can view their own api keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create api keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own api keys" ON api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own api keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- generation_history 表策略
CREATE POLICY "Users can view their own generation history" ON generation_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM generations 
      WHERE generations.id = generation_history.generation_id 
      AND (generations.user_id = auth.uid() OR is_admin())
    )
  );

-- 第四步：授予函数执行权限
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION update_credits(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION has_enough_credits(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_generation_with_credits(UUID, TEXT, TEXT, JSONB, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_generations_batch(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO authenticated;

-- 完成！
SELECT 'Database initialized successfully!' as status;
