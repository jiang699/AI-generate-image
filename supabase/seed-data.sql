-- 初始数据脚本

-- 插入测试用户（需要在认证后手动创建）
-- INSERT INTO users (id, email, display_name, credits, is_admin)
-- VALUES 
--   ('test-user-id', 'test@example.com', 'Test User', 100, false),
--   ('admin-user-id', 'admin@example.com', 'Admin User', 1000, true);

-- 插入积分套餐配置
-- 注意：实际的套餐信息应存储在应用层或单独的配置表中
-- 这里仅作为参考

-- Starter: $9.99 for 100 credits
-- Pro: $29.99 for 350 credits  
-- Enterprise: Custom

-- 创建支付套餐视图（可选）
CREATE VIEW IF NOT EXISTS credit_packages AS
SELECT * FROM (VALUES
  ('starter', 'Starter Package', 999, 100, 'Basic generation, standard resolution'),
  ('pro', 'Pro Package', 2999, 350, 'All features, high resolution, priority queue'),
  ('enterprise', 'Enterprise Package', 0, 0, 'Custom pricing, dedicated API, SLA guarantee')
) AS packages(id, name, price, credits, description);
