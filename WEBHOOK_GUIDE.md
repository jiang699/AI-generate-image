# Webhook 和异步处理系统

## 系统架构

### 同步模式 vs 异步模式

#### 同步模式（默认）
```
客户端 → API Route → Replicate API → 等待结果 → 返回客户端
```

**特点**：
- 简单直接，请求完成即得到结果
- 适合短时间任务（< 30秒）
- Serverless 环境可能超时

#### 异步模式（推荐）
```
1. 客户端 → API Route（-async）→ 创建任务 → 返回任务ID
2. Replicate → 后台处理
3. Replicate → Webhook回调 → 处理结果 → 下载/上传图片
4. 客户端 → 查询状态 → 获取结果
```

**特点**：
- 适合长时间任务
- 支持 Webhook 实时通知
- 更好的错误处理和重试机制

---

## API 端点

### 同步版本
- `POST /api/generate/text` - 文生图（同步）
- `POST /api/generate/image` - 图生图（同步）
- `POST /api/generate/style-transfer` - 风格迁移（同步）
- `POST /api/generate/optimize` - 图像优化（同步）

### 异步版本
- `POST /api/generate/text-async` - 文生图（异步）
- `POST /api/generate/image-async` - 图生图（异步）
- `POST /api/generate/style-transfer-async` - 风格迁移（异步）
- `GET /api/generate/{id}/status` - 查询任务状态
- `POST /api/webhooks/replicate` - Replicate Webhook 回调

---

## 异步 API 使用流程

### 1. 发起异步请求

```bash
curl -X POST https://your-domain.com/api/generate/text-async \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "width": 1024,
    "height": 1024
  }'
```

**响应**：
```json
{
  "success": true,
  "data": {
    "id": "generation-id",
    "status": "processing",
    "predictionId": "replicate-prediction-id",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "message": "Generation started. Use predictionId to check status via webhook."
  }
}
```

### 2. 配置 Replicate Webhook

在 Replicate 控制台或通过 API 配置 Webhook URL：

```bash
# 通过 Replicate API 创建预测时指定 webhook
curl -X POST https://api.replicate.com/v1/predictions \
  -H "Authorization: Token YOUR_REPLICATE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "model-version",
    "input": {
      "prompt": "A beautiful sunset"
    },
    "webhook": "https://your-domain.com/api/webhooks/replicate",
    "webhook_events_filter": ["start", "completed", "failed"]
  }'
```

### 3. Webhook 处理流程

当 Replicate 完成处理时，会向 Webhook URL 发送 POST 请求：

```json
{
  "id": "replicate-prediction-id",
  "status": "succeeded",
  "output": ["https://replicate.delivery/..."],
  "webhook_received_at": "2024-01-01T12:00:30.000Z"
}
```

### 4. Webhook 处理器执行步骤

#### 成功流程（succeeded）

```mermaid
flowchart TD
    A[接收 Webhook] --> B{查找生成记录}
    B -->|未找到| C[返回 404]
    B -->|找到| D[提取图片 URL]
    D --> E[下载图片]
    E --> F[上传至 Supabase Storage]
    F --> G[更新数据库记录]
    G --> H[设置状态为 completed]
    H --> I[记录历史日志]
    I --> J[返回成功响应]
```

#### 失败流程（failed/canceled）

```mermaid
flowchart TD
    A[接收 Webhook] --> B[查找生成记录]
    B --> C[更新状态为 failed]
    C --> D[记录失败日志]
    D --> E[回滚积分]
    E --> F[删除消费记录]
    F --> G[返回成功响应]
```

### 5. 查询任务状态

```bash
curl -X GET https://your-domain.com/api/generate/{id}/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应**：
```json
{
  "success": true,
  "data": {
    "id": "generation-id",
    "status": "completed",
    "prompt": "A beautiful sunset",
    "image_url": "https://your-domain.com/storage/generated/...",
    "predictionStatus": "succeeded"
  }
}
```

---

## 数据库表结构

### generations 表字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 生成记录 ID |
| user_id | UUID | 用户 ID |
| prompt | TEXT | 提示词 |
| image_url | TEXT | 生成的图片 URL |
| mode | TEXT | 生成模式（text/image/style/optimize） |
| settings | JSONB | 生成参数，包含 replicate_id |
| status | TEXT | 状态（pending/processing/completed/failed） |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### generation_history 表字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 记录 ID |
| generation_id | UUID | 生成记录 ID |
| status | TEXT | 状态 |
| error_message | TEXT | 错误信息 |
| created_at | TIMESTAMPTZ | 创建时间 |

---

## 配置步骤

### 1. 配置 Webhook URL

在 Replicate 控制台：
1. 进入项目设置
2. 找到 Webhooks 部分
3. 添加 Webhook URL：`https://your-domain.com/api/webhooks/replicate`
4. 选择要监听的事件：`completed`, `failed`

### 2. 配置环境变量

在 `.env.local` 中添加：

```bash
# 应用 URL（用于 Webhook 回调）
NEXT_PUBLIC_APP_URL=https://your-domain.com

# 可选：Webhook 签名验证
REPLICATE_WEBHOOK_SECRET=your-webhook-secret
```

### 3. 验证 Webhook 签名（可选）

在生产环境中，建议验证 Webhook 签名以确保请求来源可靠：

```typescript
// 在 Webhook 处理器中添加签名验证
async function verifyWebhookSignature(
  signature: string,
  secret: string,
  payload: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureBuffer = Buffer.from(signature.replace('sha256=', ''), 'hex');
  const payloadBuffer = encoder.encode(payload);

  return await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBuffer,
    payloadBuffer
  );
}
```

---

## 错误处理

### 常见错误

| 错误类型 | 原因 | 处理方式 |
|----------|------|----------|
| `NOT_FOUND` | 生成记录不存在 | 检查 replicate_id 是否正确 |
| `DOWNLOAD_FAILED` | 图片下载失败 | 使用原始 URL 作为备选 |
| `UPLOAD_FAILED` | 上传至 Storage 失败 | 仍使用原始 URL，标记为成功 |
| `ROLLBACK_FAILED` | 积分回滚失败 | 手动处理，发送告警 |

### 重试机制

Webhook 失败时，Replicate 会自动重试：
- 重试间隔：指数退避
- 最大重试次数：10 次
- 重试超时：24 小时

建议在 Webhook 处理器中添加幂等性检查：
```typescript
// 检查是否已处理过
const existingRecord = await supabase
  .from('generation_history')
  .select('*')
  .eq('generation_id', generation.id)
  .eq('status', payload.status)
  .single();

if (existingRecord) {
  return NextResponse.json({ message: 'Already processed' });
}
```

---

## 前端集成示例

### React Hook

```typescript
import { useState, useEffect } from 'react';

export function useGenerationStatus(generationId: string) {
  const [status, setStatus] = useState<string>('processing');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/generate/${generationId}/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const result = await response.json();

        if (result.success) {
          setStatus(result.data.status);
          setImageUrl(result.data.image_url);

          if (result.data.status === 'completed' || result.data.status === 'failed') {
            return; // 停止轮询
          }
        } else {
          setError(result.error.message);
          return;
        }

        // 继续轮询
        setTimeout(checkStatus, 2000);
      } catch (err) {
        setError('Failed to fetch status');
      }
    };

    checkStatus();
  }, [generationId]);

  return { status, imageUrl, error };
}
```

### 使用示例

```tsx
function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationId, setGenerationId] = useState(null);
  
  const { status, imageUrl, error } = useGenerationStatus(generationId);

  const handleGenerate = async () => {
    setGenerating(true);
    
    const response = await fetch('/api/generate/text-async', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt }),
    });
    
    const result = await response.json();
    setGenerationId(result.data.id);
    setGenerating(false);
  };

  return (
    <div>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button onClick={handleGenerate} disabled={generating}>
        {generating ? 'Starting...' : 'Generate'}
      </button>
      
      {status === 'processing' && <p>Generating...</p>}
      {imageUrl && <img src={imageUrl} alt="Generated" />}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

---

## 监控和日志

### 日志记录

Webhook 处理器会记录以下日志：
- 接收到的 Webhook 数据
- 生成记录查找结果
- 图片下载和上传状态
- 积分回滚结果
- 错误和异常

### 建议的监控指标

1. **Webhook 接收量**：每小时接收的 Webhook 数量
2. **成功率**：成功完成 vs 失败的比例
3. **平均处理时间**：从 Webhook 收到到处理完成的时间
4. **回滚率**：需要回滚积分的失败比例
5. **重复 Webhook**：幂等性检查拦截的重复请求

---

## 生产环境检查清单

- [ ] 配置了正确的 Webhook URL
- [ ] 启用了 Webhook 签名验证
- [ ] 实现了幂等性检查
- [ ] 配置了日志记录
- [ ] 设置了监控告警
- [ ] 测试了成功和失败流程
- [ ] 验证了积分回滚机制
- [ ] 检查了图片上传和访问权限
