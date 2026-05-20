# AI 图像生成平台 - API 使用指南

## 📁 已创建的 API 文件

### 认证 API
- `app/api/auth/signup/route.ts` - 用户注册（赠送100积分）
- `app/api/auth/signin/route.ts` - 用户登录
- `app/api/auth/user/route.ts` - 获取当前用户信息

### 用户 API
- `app/api/user/credits/route.ts` - 获取用户积分

### 图片上传 API
- `app/api/upload/route.ts` - 上传图片到 Supabase Storage

### 图片生成 API
- `app/api/generate/text/route.ts` - 文生图（10积分）
- `app/api/generate/image/route.ts` - 图生图（15积分）

---

## 🔐 认证流程

### 1. 用户注册

```bash
POST /api/auth/signup

Body:
{
  "email": "user@example.com",
  "password": "Password123!",
  "displayName": "用户名"
}

Response (成功):
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "displayName": "用户名",
      "credits": 100
    },
    "message": "注册成功！已赠送100积分"
  }
}
```

### 2. 用户登录

```bash
POST /api/auth/signin

Body:
{
  "email": "user@example.com",
  "password": "Password123!"
}

Response (成功):
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "displayName": "用户名",
      "credits": 100,
      "isAdmin": false
    },
    "session": "jwt-token-string"
  }
}
```

---

## 🎨 图片生成功能

### 1. 文生图

**请求**:
```bash
POST /api/generate/text
Authorization: Bearer <token>

Body:
{
  "prompt": "A beautiful sunset over mountains with golden clouds",
  "width": 512,
  "height": 512,
  "steps": 10,
  "guidance": 7.5
}
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "generation-uuid",
    "status": "completed",
    "prompt": "A beautiful sunset over mountains with golden clouds",
    "imageUrl": "https://replicate.delivery/...",
    "creditsUsed": 10,
    "remainingCredits": 90,
    "settings": {
      "width": 512,
      "height": 512,
      "steps": 10,
      "guidance": 7.5
    },
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**积分不足响应**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Insufficient credits. You need 10 credits but only have 5"
  }
}
```

### 2. 图生图

**步骤 1: 上传图片**
```bash
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
file: [图片文件]
```

**响应**:
```json
{
  "success": true,
  "data": {
    "fileName": "original-image.jpg",
    "fileUrl": "https://xxx.supabase.co/storage/v1/object/public/generated/user-id/xxx.jpg",
    "fileSize": 102400,
    "fileType": "image/jpeg",
    "uploadedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**步骤 2: 图生图**
```bash
POST /api/generate/image
Authorization: Bearer <token>

Body:
{
  "imageUrl": "https://xxx.supabase.co/storage/v1/object/public/generated/user-id/xxx.jpg",
  "prompt": "Transform this into a watercolor painting",
  "strength": 0.7,
  "width": 512,
  "height": 512,
  "steps": 10,
  "guidance": 7.5
}
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "generation-uuid",
    "status": "completed",
    "prompt": "Transform this into a watercolor painting",
    "imageUrl": "https://replicate.delivery/...",
    "inputImageUrl": "https://xxx.supabase.co/storage/v1/object/public/generated/...",
    "creditsUsed": 15,
    "remainingCredits": 85,
    "settings": {
      "strength": 0.7,
      "width": 512,
      "height": 512,
      "steps": 10,
      "guidance": 7.5
    },
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## 💰 积分系统

### 积分消耗规则

| 操作 | 消耗积分 | 说明 |
|------|----------|------|
| 文生图 | 10 | 根据尺寸和步骤可能不同 |
| 图生图 | 15 | 包含图像处理 |
| 风格迁移 | 20 | 双图像处理 |
| 图像优化 | 5 | 格式转换 |

### 积分不足处理

当用户积分不足时：
1. API 返回 400 状态码
2. 错误代码: `INSUFFICIENT_CREDITS`
3. 清晰说明需要的积分和当前积分
4. **不会扣除任何积分**
5. **不会创建生成记录**

### 积分回滚机制

如果生成失败：
1. 立即回滚已扣除的积分
2. 删除消费记录
3. 更新生成状态为 `failed`
4. 返回清晰的错误信息

---

## 🛡️ 错误处理

### 常见错误代码

| 错误代码 | HTTP状态 | 说明 |
|----------|----------|------|
| AUTH_REQUIRED | 401 | 需要认证 |
| INVALID_PARAMS | 400 | 参数无效 |
| USER_NOT_FOUND | 404 | 用户不存在 |
| INSUFFICIENT_CREDITS | 400 | 积分不足 |
| CREDIT_ERROR | 500 | 积分操作失败 |
| GENERATION_FAILED | 500 | 图片生成失败 |
| DB_ERROR | 500 | 数据库错误 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误详情描述"
  }
}
```

---

## 🔧 完整使用流程

### 示例：完整图片生成流程

```javascript
// 1. 注册/登录获取 Token
const signupResponse = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'Password123!',
    displayName: 'User'
  })
});

const { data: signupData } = await signupResponse.json();
const token = signupData.session;

// 2. 检查积分
const creditsResponse = await fetch('/api/user/credits', {
  headers: { Authorization: `Bearer ${token}` }
});
const { data: { credits } } = await creditsResponse.json();
console.log('当前积分:', credits);

// 3. 文生图
const genResponse = await fetch('/api/generate/text', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    prompt: 'A beautiful sunset',
    width: 512,
    height: 512,
    steps: 10
  })
});

const genData = await genResponse.json();
if (genData.success) {
  console.log('生成成功！');
  console.log('图片 URL:', genData.data.imageUrl);
  console.log('剩余积分:', genData.data.remainingCredits);
} else {
  console.log('生成失败:', genData.error.message);
}

// 4. 图生图 - 先上传图片
const formData = new FormData();
formData.append('file', imageFile);

const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData
});

const { data: { fileUrl } } = await uploadResponse.json();

// 5. 图生图
const img2imgResponse = await fetch('/api/generate/image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    imageUrl: fileUrl,
    prompt: 'Transform to watercolor',
    strength: 0.7
  })
});

const img2imgData = await img2imgResponse.json();
console.log('图生图结果:', img2imgData);
```

---

## 📝 React Hooks 示例

```typescript
import { useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const signin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.data.user);
        localStorage.setItem('token', data.data.session);
        return { success: true };
      } else {
        return { success: false, error: data.error.message };
      }
    } finally {
      setLoading(false);
    }
  };

  return { user, signin, loading };
}

export function useImageGeneration() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async (token: string, params: any) => {
    setGenerating(true);
    try {
      const response = await fetch('/api/generate/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(params)
      });
      
      const data = await response.json();
      setResult(data);
      return data;
    } finally {
      setGenerating(false);
    }
  };

  return { generating, result, generate };
}
```

---

## 🚀 测试命令

```bash
# 测试用户注册
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "displayName": "Test User"
  }'

# 测试用户登录
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'

# 测试获取积分（需要 Token）
curl -X GET http://localhost:3000/api/user/credits \
  -H "Authorization: Bearer YOUR_TOKEN"

# 测试文生图（需要 Token）
curl -X POST http://localhost:3000/api/generate/text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "prompt": "A beautiful sunset",
    "width": 512,
    "height": 512
  }'

# 测试图生图（需要 Token）
curl -X POST http://localhost:3000/api/generate/image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "prompt": "Transform this",
    "strength": 0.7
  }'
```

---

## 📊 数据库记录

每次生成都会在数据库中创建记录：

**generations 表**:
- `id`: 唯一标识
- `user_id`: 用户ID
- `prompt`: 提示词
- `mode`: 生成模式（text/image/style/optimize）
- `settings`: 生成参数
- `status`: 状态（pending/processing/completed/failed）
- `image_url`: 生成的图片URL
- `created_at`: 创建时间

**transactions 表**:
- `id`: 唯一标识
- `user_id`: 用户ID
- `type`: 类型（purchase/consume/refund）
- `amount`: 积分数量
- `description`: 描述
- `created_at`: 创建时间

**users 表**:
- `id`: 唯一标识
- `email`: 邮箱
- `display_name`: 显示名称
- `credits`: 积分余额
- `is_admin`: 是否管理员
- `created_at`: 创建时间

---

## 🔒 安全特性

1. **JWT 认证**: 所有需要认证的 API 都验证 Bearer Token
2. **用户隔离**: 每个用户只能访问自己的数据和积分
3. **积分保护**: 
   - 积分不足时阻止生成
   - 生成失败时自动回滚
   - 所有积分变动都有记录
4. **输入验证**: 使用 Zod 进行严格的参数验证
5. **错误处理**: 统一的错误响应格式
