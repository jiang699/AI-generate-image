# 部署配置说明

## ✅ 问题已修复

你已经解决了 `supabaseKey is required` 错误。问题是：
- **原因**：服务端密钥 `SUPABASE_SERVICE_KEY` 在客户端代码中被使用，但客户端无法访问它
- **解决方案**：将客户端代码（`lib/supabase.ts`）与服务端代码分离

## 📋 环境变量配置

### 本地开发环境 (.env.local)

确保 `.env.local` 文件包含：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Replicate API
REPLICATE_API_TOKEN=your-replicate-token

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚀 Vercel 部署配置

### 必需的环境变量

在 Vercel 项目设置中添加以下环境变量：

1. **Supabase 变量**（在 Project Settings → Environment Variables）：
   - `NEXT_PUBLIC_SUPABASE_URL` = 你的 Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 你的 Supabase Anon Key
   - `SUPABASE_SERVICE_KEY` = 你的 Supabase Service Role Key ⚠️ **重要**

2. **Replicate API**：
   - `REPLICATE_API_TOKEN` = 你的 Replicate API Token

3. **应用配置**：
   - `NEXT_PUBLIC_APP_URL` = https://your-app.vercel.app

### 设置步骤

1. 登录 Vercel Dashboard
2. 选择你的项目
3. 点击 "Settings" 标签
4. 在左侧菜单选择 "Environment Variables"
5. 添加所有必需的环境变量
6. 点击 "Save"
7. 重新部署（Redeploy）

## 🔒 重要安全说明

### 密钥分离原则

- **`NEXT_PUBLIC_*` 变量**：客户端（浏览器）可见，用于前端代码
- **普通变量（如 `SUPABASE_SERVICE_KEY`）**：仅服务端可见，用于 API routes

### 当前架构

✅ **客户端**（浏览器）：
- `lib/supabase.ts` - 只使用 `NEXT_PUBLIC_*` 变量
- `lib/hooks/useAuth.ts` - 客户端认证
- `components/auth-*.tsx` - 认证 UI 组件

✅ **服务端**（API Routes）：
- `lib/supabase-server.ts` - 服务端 Supabase 客户端（使用 `SUPABASE_SERVICE_KEY`）
- `app/api/**/route.ts` - 所有 API routes

## 🧪 本地测试

运行以下命令测试：

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

## 🌐 Vercel 部署

### 方法 1: 通过 GitHub 集成（推荐）

1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署

### 方法 2: 通过 Vercel CLI

```bash
# 登录
vercel login

# 部署
vercel

# 配置环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_KEY
vercel env add REPLICATE_API_TOKEN

# 生产环境部署
vercel --prod
```

## ✅ 检查清单

部署前确认：

- [ ] 所有 `NEXT_PUBLIC_*` 环境变量已设置
- [ ] `SUPABASE_SERVICE_KEY` 已设置（用于服务端）
- [ ] `REPLICATE_API_TOKEN` 已设置
- [ ] Supabase 数据库已创建
- [ ] Supabase Storage bucket 已创建（`generated`）
- [ ] RLS 策略已配置

## 🐛 常见问题

### 1. "supabaseKey is required"

**问题**：`SUPABASE_SERVICE_KEY` 未设置或为空  
**解决**：确保在 Vercel 环境变量中添加了此变量

### 2. 页面加载但 API 调用失败

**问题**：环境变量未正确设置  
**解决**：检查浏览器控制台的网络请求，确认 API 端点可访问

### 3. 用户无法登录/注册

**问题**：Supabase Auth 未正确配置  
**解决**：
- 检查 Supabase 项目设置
- 确认 Email templates 已配置
- 检查 Site URL 配置

### 4. 图像生成失败

**问题**：Replicate API Token 未设置或无效  
**解决**：
- 检查 `REPLICATE_API_TOKEN`
- 确认 API 余额充足
- 检查模型 ID 是否正确

## 📞 获取帮助

如果还有问题，请提供：
1. 完整的错误信息
2. 浏览器控制台截图
3. Vercel 部署日志
