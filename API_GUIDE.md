# API 使用指南

## 认证

所有 API 端点（除公开端点外）都需要在请求头中提供有效的 JWT Token：

```http
Authorization: Bearer <your_access_token>
```

## 公共响应格式

### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## 错误代码

| 错误代码 | 描述 |
|----------|------|
| `AUTH_REQUIRED` | 需要认证 |
| `INVALID_PARAMS` | 参数无效 |
| `USER_NOT_FOUND` | 用户不存在 |
| `INSUFFICIENT_CREDITS` | 积分不足 |
| `CREDIT_ERROR` | 积分处理错误 |
| `DB_ERROR` | 数据库错误 |
| `GENERATION_FAILED` | 图像生成失败 |
| `OPTIMIZATION_FAILED` | 图像优化失败 |
| `NOT_FOUND` | 资源不存在 |
| `DELETE_FAILED` | 删除失败 |
| `INTERNAL_ERROR` | 服务器内部错误 |

---

## API 端点

### 1. 文生图

**URL**: `POST /api/generate/text`

**请求参数**:

```json
{
  "prompt": "A beautiful sunset over mountains",
  "width": 1024,
  "height": 1024,
  "steps": 30,
  "guidance": 7.5,
  "seed": 42
}
```

**参数说明**:
- `prompt`: (必填) 描述图像的文本提示词（10-1000字符）
- `width`: (可选) 图像宽度（512-2048，默认1024）
- `height`: (可选) 图像高度（512-2048，默认1024）
- `steps`: (可选) 生成步数（10-50，默认30）
- `guidance`: (可选) 引导系数（1-20，默认7.5）
- `seed`: (可选) 随机种子

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "886725b6-a357-4a31-bf67-44e3337005c9",
    "status": "completed",
    "prompt": "A beautiful sunset over mountains",
    "imageUrl": "https://replicate.com/...",
    "settings": {
      "width": 1024,
      "height": 1024,
      "steps": 30,
      "guidance": 7.5
    },
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**消耗积分**: 10

---

### 2. 图生图

**URL**: `POST /api/generate/image`

**请求参数**:

```json
{
  "imageUrl": "https://example.com/image.jpg",
  "prompt": "Make this look like a painting",
  "strength": 0.7,
  "width": 1024,
  "height": 1024,
  "steps": 30,
  "guidance": 7.5
}
```

**参数说明**:
- `imageUrl`: (必填) 源图像 URL
- `prompt`: (必填) 描述图像的文本提示词（10-1000字符）
- `strength`: (可选) 变换强度（0.1-1，默认0.7）
- `width`: (可选) 图像宽度（512-2048，默认1024）
- `height`: (可选) 图像高度（512-2048，默认1024）
- `steps`: (可选) 生成步数（10-50，默认30）
- `guidance`: (可选) 引导系数（1-20，默认7.5）
- `seed`: (可选) 随机种子

**响应示例**: 同文生图

**消耗积分**: 15

---

### 3. 风格迁移

**URL**: `POST /api/generate/style-transfer`

**请求参数**:

```json
{
  "contentImageUrl": "https://example.com/photo.jpg",
  "styleImageUrl": "https://example.com/painting.jpg",
  "styleStrength": 0.8
}
```

**参数说明**:
- `contentImageUrl`: (必填) 内容图像 URL
- `styleImageUrl`: (必填) 风格图像 URL
- `styleStrength`: (可选) 风格强度（0.1-1，默认0.8）

**响应示例**: 同文生图

**消耗积分**: 20

---

### 4. 图像优化

**URL**: `POST /api/generate/optimize`

**请求参数**:

```json
{
  "imageUrl": "https://example.com/image.jpg",
  "format": "webp",
  "quality": 80
}
```

**参数说明**:
- `imageUrl`: (必填) 源图像 URL
- `format`: (可选) 输出格式（"jpeg"、"png"、"webp"，默认"webp"）
- `quality`: (可选) 质量（10-100，默认80）

**响应示例**: 同文生图

**消耗积分**: 5

---

### 5. 获取生成历史

**URL**: `GET /api/generate/history`

**查询参数**:

```
page=1&limit=20&mode=text
```

**参数说明**:
- `page`: (可选) 页码（默认1）
- `limit`: (可选) 每页数量（默认20，最大100）
- `mode`: (可选) 过滤模式（"text"、"image"、"style"、"optimize"）

**响应示例**:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "886725b6-a357-4a31-bf67-44e3337005c9",
        "user_id": "user-id",
        "prompt": "A beautiful sunset",
        "image_url": "https://...",
        "mode": "text",
        "status": "completed",
        "created_at": "2024-01-01T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

### 6. 获取单个生成记录

**URL**: `GET /api/generate/{id}`

**路径参数**:
- `id`: 生成记录 UUID

**响应示例**: 同历史记录的单个 item

---

### 7. 删除生成记录

**URL**: `DELETE /api/generate/{id}`

**路径参数**:
- `id`: 生成记录 UUID

**响应示例**:

```json
{
  "success": true,
  "data": {
    "message": "Generation deleted"
  }
}
```

---

## 使用示例

### JavaScript/Node.js

```javascript
async function generateImage(prompt) {
  const response = await fetch('https://your-domain.com/api/generate/text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      prompt,
      width: 1024,
      height: 1024
    })
  });

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
}
```

### React

```javascript
import { useMutation } from '@tanstack/react-query';

function useGenerateImage() {
  return useMutation({
    mutationFn: async (prompt) => {
      const response = await fetch('/api/generate/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ prompt })
      });
      return response.json();
    }
  });
}
```

## 注意事项

1. **积分扣除**: 每个 API 调用都会在请求开始时扣除积分，如果生成失败会自动回滚
2. **速率限制**: 建议在客户端实现适当的请求延迟，避免触发速率限制
3. **图像 URL**: 提供的图像 URL 必须是公开可访问的
4. **超时**: API 请求可能需要 5-60 秒，请设置适当的超时时间
