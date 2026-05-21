# Supabase 数据库策略修复

## 问题描述

注册时出现 `406 Not Acceptable` 错误，并且在数据库中看不到新注册的用户。

## 原因分析

`users` 表的 RLS（行级安全策略）没有允许 INSERT 操作，导致：
1. 客户端注册时无法插入用户数据
2. 查询用户数据时也被拒绝

## 解决方案

需要在 Supabase 数据库中执行以下 SQL 命令来更新 RLS 策略：

### 1. 删除旧的 users 表策略

```sql
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
```

### 2. 创建新的 users 表策略

```sql
-- 允许任何人查看所有用户
CREATE POLICY "Anyone can view users" ON users
  FOR SELECT USING (true);

-- 允许用户更新自己的资料
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 允许插入用户记录（用于注册）
CREATE POLICY "Anyone can insert users" ON users
  FOR INSERT WITH CHECK (true);
```

## 执行步骤

### 方法 1：通过 Supabase Dashboard

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 复制上述 SQL 命令并执行
5. 刷新页面查看结果

### 方法 2：通过 Supabase CLI

```bash
# 登录 Supabase
supabase login

# 链接本地项目
supabase link --project-ref your-project-ref

# 执行迁移
supabase db push
```

## 验证修复

### 测试注册功能

1. 访问应用首页
2. 点击"开始免费创作"
3. 点击"立即注册"
4. 填写注册信息：
   - 显示名称：Test User
   - 邮箱：test@example.com（使用真实邮箱）
   - 密码：Password123!
5. 点击"免费注册"

### 检查数据库

在 Supabase Dashboard 中：

1. 进入 **Table Editor**
2. 选择 `users` 表
3. 应该能看到新注册的用户记录，包含：
   - id：用户的 UUID
   - email：注册的邮箱
   - display_name：显示名称
   - credits：100（新用户赠送积分）

## 常见问题

### Q: 执行 SQL 时报错 "permission denied"

解决方案：确保你使用的是具有管理员权限的账号，或者使用 service_role key 连接数据库。

### Q: 仍然出现 406 错误

可能原因：
1. 策略未正确应用
2. 浏览器缓存了旧的策略

解决方案：
1. 在 Supabase Dashboard 中检查策略是否已创建
2. 清除浏览器缓存或使用无痕模式测试
3. 重新部署应用到 Vercel

### Q: 注册成功但积分显示为 0

可能原因：
1. users 表插入成功，但初始积分未设置
2. 前端显示逻辑问题

解决方案：
检查 users 表中 credits 列的值是否为 100。

## 安全说明

添加的策略 "Anyone can insert users" 和 "Anyone can view users" 是必要的，因为：
- 用户注册时必须能够插入自己的数据
- 某些公开功能需要查看用户信息

但这些策略暴露了基本的用户信息（邮箱），如果需要更高的隐私保护，可以考虑：
- 限制 SELECT 查询只返回必要的字段
- 使用 API Routes 而不是直接客户端访问
- 实现服务端注册流程

## 下一步

注册功能正常后，请测试：
1. 用户注册
2. 用户登录
3. 登录后跳转到工作台
4. 积分显示正确
