-- Storage Bucket 配置

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('generated', 'generated', true),
  ('temp', 'temp', false)
ON CONFLICT (id) DO NOTHING;

-- 创建存储策略

-- generated 桶 - 用户可以访问自己生成的图像
CREATE POLICY "Users can view their own generated images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'generated' AND 
    auth.uid() = (storage.filename(name)).parts[1]::UUID
  );

CREATE POLICY "Users can upload generated images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'generated' AND 
    auth.uid() = (storage.filename(name)).parts[1]::UUID
  );

CREATE POLICY "Users can delete their own generated images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'generated' AND 
    auth.uid() = (storage.filename(name)).parts[1]::UUID
  );

-- temp 桶 - 仅允许管理员上传临时文件
CREATE POLICY "Admins can manage temp files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'temp' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- 创建文件夹结构（可选）
-- Supabase Storage 不需要预创建文件夹，路径会自动创建

-- 设置 CORS 规则
-- 这通常在 Supabase 控制台中配置，但可以通过 SQL 配置
-- 注意：实际的 CORS 配置需要通过 API 或控制台完成
