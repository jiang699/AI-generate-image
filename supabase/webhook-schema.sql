-- Webhook 支持数据库更新脚本
-- 请在 Supabase SQL 编辑器中执行此脚本

-- 1. 添加 replicate_id 字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'replicate_id'
  ) THEN
    ALTER TABLE generations ADD COLUMN replicate_id TEXT;
    COMMENT ON COLUMN generations.replicate_id IS 'Replicate 预测 ID，用于 Webhook 回调';
  END IF;
END $$;

-- 2. 创建 generation_history 表（如果不存在）
CREATE TABLE IF NOT EXISTS generation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_generation_history_generation_id 
  ON generation_history(generation_id);

CREATE INDEX IF NOT EXISTS idx_generation_history_status 
  ON generation_history(status);

CREATE INDEX IF NOT EXISTS idx_generations_replicate_id 
  ON generations(replicate_id) WHERE replicate_id IS NOT NULL;

-- 4. 添加 RLS 策略
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;

-- drop 再 create（避免RLS（行级安全）策略重复创建导致错误）
drop policy if exists "Users can view their own generation history"
on public.generation_history;

CREATE POLICY "Users can view their own generation history" ON generation_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM generations 
      WHERE generations.id = generation_history.generation_id 
      AND generations.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert generation history" ON generation_history
  FOR INSERT WITH CHECK (true);

-- 5. 创建更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_generations_updated_at ON generations;
CREATE TRIGGER update_generations_updated_at
  BEFORE UPDATE ON generations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. 验证更新
SELECT 
  'generations' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'generations'
  AND column_name IN ('id', 'replicate_id', 'status', 'updated_at')
ORDER BY column_name;

SELECT 'generation_history' as table_name, COUNT(*) as count FROM generation_history;

-- 完成！
SELECT 'Webhook database schema updated successfully!' as status;
