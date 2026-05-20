-- PostgreSQL 自定义函数

-- 检查当前用户是否为管理员（使用 SECURITY DEFINER 避免无限递归）
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

-- 授予执行权限
GRANT EXECUTE ON FUNCTION update_credits(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION has_enough_credits(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_generation_with_credits(UUID, TEXT, TEXT, JSONB, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_generations_batch(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO authenticated;
