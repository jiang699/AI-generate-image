-- =============================================
-- Supabase 数据库完整初始化脚本（合并版）
-- 在 Supabase 控制台 > SQL Editor 中执行
-- 包含：建表、索引、RLS策略、函数、权限
-- =============================================

-- 第一步：删除旧策略（如果存在）
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
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

-- 第二步：建表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  credits INT DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT,
  mode TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount INT NOT NULL,
  stripe_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT UNIQUE NOT NULL,
  name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS generation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 第三步：创建索引
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_generation_id ON generation_history(generation_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);

-- 第四步：启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;

-- 第五步：创建管理员检查函数（必须在使用它的策略之前创建）
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

-- 第六步：创建 RLS 策略

-- users 表
-- INSERT: 允许任何人插入（注册时创建用户记录）
CREATE POLICY "Anyone can insert users" ON users
  FOR INSERT WITH CHECK (true);

-- SELECT: 任何人都能查看用户公开信息
CREATE POLICY "Anyone can view users" ON users
  FOR SELECT USING (true);

-- UPDATE: 用户只能更新自己的资料
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- generations 表
CREATE POLICY "Users can view their own generations" ON generations
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create generations" ON generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generations" ON generations
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can delete their own generations" ON generations
  FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- transactions 表
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- api_keys 表
CREATE POLICY "Users can view their own api keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create api keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own api keys" ON api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own api keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- generation_history 表
CREATE POLICY "Users can view their own generation history" ON generation_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM generations
      WHERE generations.id = generation_history.generation_id
      AND (generations.user_id = auth.uid() OR is_admin())
    )
  );

-- 第七步：触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_modtime ON users;
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_generations_modtime ON generations;
CREATE TRIGGER update_generations_modtime BEFORE UPDATE ON generations
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 第八步：数据库函数

-- 更新用户积分（原子操作）
CREATE OR REPLACE FUNCTION update_credits(user_id UUID, amount INT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users
  SET credits = credits + amount
  WHERE id = user_id;
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查用户积分是否足够
CREATE OR REPLACE FUNCTION has_enough_credits(user_id UUID, required INT)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INT;
BEGIN
  SELECT credits INTO current_credits
  FROM users
  WHERE id = user_id;
  RETURN current_credits >= required;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建生成任务并扣除积分
CREATE OR REPLACE FUNCTION create_generation_with_credits(
  p_user_id UUID,
  p_prompt TEXT,
  p_mode TEXT,
  p_settings JSONB,
  p_cost INT
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  IF NOT has_enough_credits(p_user_id, p_cost) THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  UPDATE users
  SET credits = credits - p_cost
  WHERE id = p_user_id;
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'consume', p_cost, 'Generation: ' || p_mode);
  INSERT INTO generations (id, user_id, prompt, mode, settings, status)
  VALUES (uuid_generate_v4(), p_user_id, p_prompt, p_mode, p_settings, 'pending')
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 批量删除生成记录
CREATE OR REPLACE FUNCTION delete_generations_batch(p_ids UUID[])
RETURNS INT AS $$
DECLARE
  deleted_count INT := 0;
BEGIN
  DELETE FROM generations
  WHERE id = ANY(p_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取用户统计信息
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_generations', COALESCE(gen_count.count, 0),
    'total_transactions', COALESCE(txn_count.count, 0),
    'total_credits_spent', COALESCE(spent.sum, 0),
    'total_credits_purchased', COALESCE(purchased.sum, 0)
  ) INTO stats
  FROM (SELECT COUNT(*) as count FROM generations WHERE user_id = p_user_id) gen_count,
       (SELECT COUNT(*) as count FROM transactions WHERE user_id = p_user_id) txn_count,
       (SELECT COALESCE(SUM(amount), 0) as sum FROM transactions WHERE user_id = p_user_id AND type = 'consume') spent,
       (SELECT COALESCE(SUM(amount), 0) as sum FROM transactions WHERE user_id = p_user_id AND type = 'purchase') purchased;
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 第九步：授予函数执行权限
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_credits(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION has_enough_credits(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_generation_with_credits(UUID, TEXT, TEXT, JSONB, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_generations_batch(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO authenticated;

-- 完成
SELECT 'Database initialized successfully!' as status;
