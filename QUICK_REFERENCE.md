# 快速参考卡片

## API 端点速查

### 同步 API（直接返回结果）

| 方法 | 端点 | 消耗积分 | 说明 |
|------|------|----------|------|
| POST | `/api/generate/text` | 10 | 文生图 |
| POST | `/api/generate/image` | 15 | 图生图 |
| POST | `/api/generate/style-transfer` | 20 | 风格迁移 |
| POST | `/api/generate/optimize` | 5 | 图像优化 |

### 异步 API（返回任务 ID）

| 方法 | 端点 | 消耗积分 | 说明 |
|------|------|----------|------|
| POST | `/api/generate/text-async` | 10 | 文生图（异步） |
| POST | `/api/generate/image-async` | 15 | 图生图（异步） |
| POST | `/api/generate/style-transfer-async` | 20 | 风格迁移（异步） |

### 状态查询

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/generate/history` | 获取生成历史 |
| GET | `/api/generate/{id}` | 获取单个生成 |
| GET | `/api/generate/{id}/status` | 查询异步任务状态 |
| DELETE | `/api/generate/{id}` | 删除生成记录 |

### Webhook

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/webhooks/replicate` | Replicate Webhook 回调 |

---

## 状态值

### Generation Status
- `pending` - 等待处理
- `processing` - 处理中
- `completed` - 已完成
- `failed` - 失败

### Generation Mode
- `text` - 文生图
- `image` - 图生图
- `style` - 风格迁移
- `optimize` - 图像优化

### Transaction Type
- `purchase` - 积分购买
- `consume` - 积分消费
- `refund` - 积分退款

---

## 环境变量

### 必需变量

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Replicate
REPLICATE_API_TOKEN=xxx
```

### 可选变量

```bash
# Replicate 模型配置
REPLICATE_MODEL=stability-ai/stable-diffusion
REPLICATE_MODEL_VERSION=xxx
REPLICATE_WEBHOOK_SECRET=xxx

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 积分配置
CREDIT_COST_TEXT_TO_IMAGE=10
CREDIT_COST_IMAGE_TO_IMAGE=15
CREDIT_COST_STYLE_TRANSFER=20
CREDIT_COST_IMAGE_OPTIMIZE=5
```

---

## 错误代码

| 代码 | HTTP 状态 | 说明 |
|------|-----------|------|
| AUTH_REQUIRED | 401 | 需要认证 |
| INVALID_PARAMS | 400 | 参数无效 |
| USER_NOT_FOUND | 404 | 用户不存在 |
| INSUFFICIENT_CREDITS | 400 | 积分不足 |
| GENERATION_FAILED | 500 | 生成失败 |
| NOT_FOUND | 404 | 资源不存在 |
| INTERNAL_ERROR | 500 | 服务器错误 |

---

## 数据库表

### 主表
- `users` - 用户表
- `generations` - 生成记录表
- `transactions` - 交易记录表

### 辅助表
- `api_keys` - API 密钥表
- `generation_history` - 生成历史表

---

## 前端集成

### React Hook 示例

```typescript
// 查询生成状态
const { status, imageUrl } = useGenerationStatus(generationId);

// 发起生成
const handleGenerate = async () => {
  const res = await fetch('/api/generate/text-async', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ prompt })
  });
  const data = await res.json();
  setGenerationId(data.data.id);
};
```

---

## curl 命令模板

### 测试文生图

```bash
curl -X POST http://localhost:3000/api/generate/text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"prompt": "A beautiful sunset"}'
```

### 测试异步文生图

```bash
curl -X POST http://localhost:3000/api/generate/text-async \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"prompt": "A beautiful sunset"}'
```

### 查询状态

```bash
curl http://localhost:3000/api/generate/GENERATION_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 获取历史

```bash
curl "http://localhost:3000/api/generate/history?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 文件位置速查

| 功能 | 文件 |
|------|------|
| API 工具 | `lib/api.ts` |
| Supabase 客户端 | `lib/supabase.ts` |
| 服务端客户端 | `lib/supabase-server.ts` |
| Replicate 集成 | `lib/replicate.ts` |
| 数据库操作 | `lib/database.ts` |
| 数据库 schema | `supabase/schema.sql` |
| Webhook 处理器 | `app/api/webhooks/replicate/route.ts` |
| API 指南 | `API_GUIDE.md` |
| Webhook 指南 | `WEBHOOK_GUIDE.md` |
| 完整文档 | `README.md` |

---

## 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 执行数据库脚本
psql -f supabase/schema.sql
psql -f supabase/functions.sql
psql -f supabase/webhook-schema.sql
```

---

## 支持的图像格式

### 输入
- JPEG
- PNG
- WebP
- GIF

### 输出
- PNG（生成）
- JPEG/WebP（优化）

### 尺寸限制
- 最小：512 x 512
- 最大：2048 x 2048

---

## 联系和支持

- 文档：[README.md](./README.md)
- API 指南：[API_GUIDE.md](./API_GUIDE.md)
- Webhook 指南：[WEBHOOK_GUIDE.md](./WEBHOOK_GUIDE.md)
