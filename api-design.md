# API 接口设计文档

## 版本信息
| 项目 | 内容 |
|------|------|
| 版本 | v1.0 |
| 日期 | 2026-05-19 |
| 基于文档 | PRD + 技术设计文档 |

---

## 目录
1. [认证模块 (Auth Module)](#1-认证模块-auth-module)
2. [图像生成模块 (Generation Module)](#2-图像生成模块-generation-module)
3. [支付模块 (Payment Module)](#3-支付模块-payment-module)
4. [用户模块 (User Module)](#4-用户模块-user-module)
5. [图库模块 (Gallery Module)](#5-图库模块-gallery-module)
6. [错误码汇总](#6-错误码汇总)
7. [分页/鉴权/幂等性设计要点](#7-分页鉴权幂等性设计要点)

---

## 1. 认证模块 (Auth Module)

### 1.1 用户注册

| 属性 | 值 |
|------|------|
| **名称** | 用户注册 |
| **HTTP方法** | POST |
| **路径** | `/api/auth/signup` |

**请求参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| email | string | 是 | 邮箱格式，最大255字符 | `user@example.com` |
| password | string | 是 | 最小8字符，包含大小写字母和数字 | `Password123!` |
| displayName | string | 是 | 2-50字符，支持中英文 | `张三` |

**成功响应 (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "displayName": "张三",
    "credits": 0,
    "avatarUrl": null,
    "createdAt": "2026-05-19T10:30:00Z"
  },
  "message": "注册成功"
}
```

**失败响应 (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "邮箱格式不正确"
  }
}
```

---

### 1.2 用户登录

| 属性 | 值 |
|------|------|
| **名称** | 用户登录 |
| **HTTP方法** | POST |
| **路径** | `/api/auth/signin` |

**请求参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| email | string | 是 | 邮箱格式 | `user@example.com` |
| password | string | 是 | 非空字符串 | `Password123!` |

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "displayName": "张三",
    "credits": 50,
    "avatarUrl": "https://example.com/avatar.png",
    "sessionToken": "jwt-token-string"
  },
  "message": "登录成功"
}
```

**失败响应 (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_003",
    "message": "邮箱或密码错误"
  }
}
```

---

### 1.3 用户登出

| 属性 | 值 |
|------|------|
| **名称** | 用户登出 |
| **HTTP方法** | POST |
| **路径** | `/api/auth/signout` |
| **鉴权要求** | Bearer Token |

**请求参数:** 无

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "登出成功"
}
```

---

### 1.4 获取当前用户信息

| 属性 | 值 |
|------|------|
| **名称** | 获取当前用户信息 |
| **HTTP方法** | GET |
| **路径** | `/api/auth/user` |
| **鉴权要求** | Bearer Token |

**请求参数:** 无

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "displayName": "张三",
    "credits": 50,
    "avatarUrl": "https://example.com/avatar.png",
    "isAdmin": false,
    "createdAt": "2026-05-19T10:30:00Z"
  },
  "message": "获取成功"
}
```

---

## 2. 图像生成模块 (Generation Module)

### 2.1 文生图

| 属性 | 值 |
|------|------|
| **名称** | 文生图 |
| **HTTP方法** | POST |
| **路径** | `/api/generate/text` |
| **鉴权要求** | Bearer Token |
| **积分消耗** | 10 |

**请求参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| prompt | string | 是 | 10-1000字符 | `beautiful landscape with mountains` |
| width | number | 否 | 512-2048，步长64 | `1024` |
| height | number | 否 | 512-2048，步长64 | `1024` |
| steps | number | 否 | 10-50，默认30 | `30` |
| guidance | number | 否 | 1-20，默认7.5 | `7.5` |
| seed | number | 否 | 0-999999999 | `12345` |

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "status": "pending",
    "prompt": "beautiful landscape with mountains",
    "imageUrl": null,
    "settings": {
      "width": 1024,
      "height": 1024,
      "steps": 30,
      "guidance": 7.5,
      "seed": 12345
    },
    "createdAt": "2026-05-19T10:35:00Z"
  },
  "message": "任务已提交"
}
```

---

### 2.2 图生图

| 属性 | 值 |
|------|------|
| **名称** | 图生图 |
| **HTTP方法** | POST |
| **路径** | `/api/generate/image` |
| **鉴权要求** | Bearer Token |
| **积分消耗** | 15 |

**请求参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| imageUrl | string | 是 | 有效的图像URL | `https://example.com/base.png` |
| prompt | string | 是 | 10-1000字符 | `turn this into a painting` |
| strength | number | 否 | 0.1-1.0，默认0.7 | `0.7` |
| width | number | 否 | 512-2048，步长64 | `1024` |
| height | number | 否 | 512-2048，步长64 | `1024` |

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "status": "pending",
    "prompt": "turn this into a painting",
    "imageUrl": null,
    "settings": {
      "imageUrl": "https://example.com/base.png",
      "strength": 0.7,
      "width": 1024,
      "height": 1024
    },
    "createdAt": "2026-05-19T10:40:00Z"
  },
  "message": "任务已提交"
}
```

---

### 2.3 风格迁移

| 属性 | 值 |
|------|------|
| **名称** | 风格迁移 |
| **HTTP方法** | POST |
| **路径** | `/api/generate/style-transfer` |
| **鉴权要求** | Bearer Token |
| **积分消耗** | 20 |

**请求参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| contentImageUrl | string | 是 | 有效的图像URL | `https://example.com/content.jpg` |
| styleImageUrl | string | 是 | 有效的图像URL | `https://example.com/style.jpg` |
| styleStrength | number | 否 | 0.1-1.0，默认0.8 | `0.8` |

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "status": "pending",
    "prompt": "style transfer",
    "imageUrl": null,
    "settings": {
      "contentImageUrl": "https://example.com/content.jpg",
      "styleImageUrl": "https://example.com/style.jpg",
      "styleStrength": 0.8
    },
    "createdAt": "2026-05-19T10:45:00Z"
  },
  "message": "任务已提交"
}
```

---

### 2.4 图像优化

| 属性 | 值 |
|------|------|
| **名称** | 图像优化 |
| **HTTP方法** | POST |
| **路径** | `/api/generate/optimize` |
| **鉴权要求** | Bearer Token |
| **积分消耗** | 5 |

**请求参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| imageUrl | string | 是 | 有效的图像URL | `https://example.com/original.png` |
| format | string | 否 | `jpeg`/`png`/`webp`，默认`webp` | `webp` |
| quality | number | 否 | 10-100，默认80 | `80` |

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "status": "completed",
    "prompt": "image optimization",
    "imageUrl": "https://storage.example.com/optimized.webp",
    "settings": {
      "format": "webp",
      "quality": 80
    },
    "createdAt": "2026-05-19T10:50:00Z"
  },
  "message": "优化完成"
}
```

---

### 2.5 获取生成任务状态

| 属性 | 值 |
|------|------|
| **名称** | 获取生成任务状态 |
| **HTTP方法** | GET |
| **路径** | `/api/generate/{id}` |
| **鉴权要求** | Bearer Token |

**路径参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| id | string | 是 | UUID格式 | `uuid-string` |

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "status": "completed",
    "prompt": "beautiful landscape",
    "imageUrl": "https://storage.example.com/generated.png",
    "settings": {},
    "createdAt": "2026-05-19T10:35:00Z",
    "updatedAt": "2026-05-19T10:38:00Z"
  },
  "message": "获取成功"
}
```

---

### 2.6 获取生成历史

| 属性 | 值 |
|------|------|
| **名称** | 获取生成历史 |
| **HTTP方法** | GET |
| **路径** | `/api/generate/history` |
| **鉴权要求** | Bearer Token |

**请求参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| page | number | 否 | >=1，默认1 | `1` |
| limit | number | 否 | 1-100，默认20 | `20` |
| mode | string | 否 | `text`/`image`/`style`/`optimize` | `text` |

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-string",
        "status": "completed",
        "prompt": "beautiful landscape",
        "imageUrl": "https://storage.example.com/generated.png",
        "mode": "text",
        "createdAt": "2026-05-19T10:35:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  },
  "message": "获取成功"
}
```

---

### 2.7 删除生成记录

| 属性 | 值 |
|------|------|
| **名称** | 删除生成记录 |
| **HTTP方法** | DELETE |
| **路径** | `/api/generate/{id}` |
| **鉴权要求** | Bearer Token |

**路径参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| id | string | 是 | UUID格式 | `uuid-string` |

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "删除成功"
}
```

---

## 3. 支付模块 (Payment Module)

### 3.1 创建支付会话

| 属性 | 值 |
|------|------|
| **名称** | 创建支付会话 |
| **HTTP方法** | POST |
| **路径** | `/api/payment/create-checkout` |
| **鉴权要求** | Bearer Token |

**请求参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| packageId | string | 是 | `starter`/`pro`/`enterprise` | `pro` |

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionId": "stripe-session-id",
    "url": "https://checkout.stripe.com/pay/cs_test_xxx",
    "package": {
      "id": "pro",
      "name": "Pro Package",
      "price": 2999,
      "credits": 350,
      "currency": "USD"
    }
  },
  "message": "支付会话已创建"
}
```

---

### 3.2 Stripe Webhook

| 属性 | 值 |
|------|------|
| **名称** | Stripe Webhook |
| **HTTP方法** | POST |
| **路径** | `/api/payment/webhook` |
| **鉴权要求** | Stripe签名验证 |

**请求体:** Stripe Event JSON（由Stripe自动发送）

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "eventType": "checkout.session.completed",
    "userId": "uuid-string",
    "creditsAdded": 350
  },
  "message": "处理成功"
}
```

---

### 3.3 获取交易历史

| 属性 | 值 |
|------|------|
| **名称** | 获取交易历史 |
| **HTTP方法** | GET |
| **路径** | `/api/payment/history` |
| **鉴权要求** | Bearer Token |

**请求参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| page | number | 否 | >=1，默认1 | `1` |
| limit | number | 否 | 1-100，默认20 | `20` |
| type | string | 否 | `purchase`/`consume`/`refund` | `purchase` |

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-string",
        "type": "purchase",
        "amount": 350,
        "description": "Pro Package",
        "stripeId": "ch_xxx",
        "createdAt": "2026-05-19T11:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1
    }
  },
  "message": "获取成功"
}
```

---

## 4. 用户模块 (User Module)

### 4.1 更新用户信息

| 属性 | 值 |
|------|------|
| **名称** | 更新用户信息 |
| **HTTP方法** | PUT |
| **路径** | `/api/user` |
| **鉴权要求** | Bearer Token |

**请求参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| displayName | string | 否 | 2-50字符 | `李四` |
| avatarUrl | string | 否 | 有效的URL | `https://example.com/new-avatar.png` |

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "displayName": "李四",
    "avatarUrl": "https://example.com/new-avatar.png",
    "credits": 50
  },
  "message": "更新成功"
}
```

---

### 4.2 获取积分余额

| 属性 | 值 |
|------|------|
| **名称** | 获取积分余额 |
| **HTTP方法** | GET |
| **路径** | `/api/user/credits` |
| **鉴权要求** | Bearer Token |

**请求参数:** 无

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "credits": 50,
    "pendingTransactions": 0
  },
  "message": "获取成功"
}
```

---

### 4.3 创建API密钥

| 属性 | 值 |
|------|------|
| **名称** | 创建API密钥 |
| **HTTP方法** | POST |
| **路径** | `/api/user/api-key` |
| **鉴权要求** | Bearer Token |

**请求参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| name | string | 是 | 2-50字符 | `My API Key` |
| expiresAt | string | 否 | ISO日期格式 | `2027-05-19T00:00:00Z` |

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "My API Key",
    "key": "sk_live_xxx",
    "expiresAt": "2027-05-19T00:00:00Z",
    "createdAt": "2026-05-19T11:15:00Z"
  },
  "message": "API密钥已创建"
}
```

---

### 4.4 删除API密钥

| 属性 | 值 |
|------|------|
| **名称** | 删除API密钥 |
| **HTTP方法** | DELETE |
| **路径** | `/api/user/api-key/{id}` |
| **鉴权要求** | Bearer Token |

**路径参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| id | string | 是 | UUID格式 | `uuid-string` |

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "API密钥已删除"
}
```

---

## 5. 图库模块 (Gallery Module)

### 5.1 获取图库列表

| 属性 | 值 |
|------|------|
| **名称** | 获取图库列表 |
| **HTTP方法** | GET |
| **路径** | `/api/gallery` |
| **鉴权要求** | Bearer Token |

**请求参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| page | number | 否 | >=1，默认1 | `1` |
| limit | number | 否 | 1-100，默认20 | `20` |
| mode | string | 否 | `text`/`image`/`style`/`optimize` | `text` |
| search | string | 否 | 搜索关键词 | `landscape` |

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-string",
        "imageUrl": "https://storage.example.com/image.png",
        "thumbnailUrl": "https://storage.example.com/image_thumb.png",
        "prompt": "beautiful landscape",
        "mode": "text",
        "createdAt": "2026-05-19T10:35:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  },
  "message": "获取成功"
}
```

---

### 5.2 批量删除图库图片

| 属性 | 值 |
|------|------|
| **名称** | 批量删除图库图片 |
| **HTTP方法** | DELETE |
| **路径** | `/api/gallery/batch` |
| **鉴权要求** | Bearer Token |

**请求参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| ids | string[] | 是 | UUID数组，最多50个 | `["uuid1", "uuid2"]` |

**成功响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "deletedCount": 2
  },
  "message": "批量删除成功"
}
```

---

### 5.3 下载图片

| 属性 | 值 |
|------|------|
| **名称** | 下载图片 |
| **HTTP方法** | GET |
| **路径** | `/api/gallery/{id}/download` |
| **鉴权要求** | Bearer Token |

**路径参数:**

| 字段名 | 类型 | 必填 | 校验规则 | 示例 |
|--------|------|------|----------|------|
| id | string | 是 | UUID格式 | `uuid-string` |

**成功响应 (200 OK):**
- Content-Type: `image/png` 或对应格式
- Body: 二进制图片数据

---

## 6. 错误码汇总

| 错误码 | 含义 | HTTP状态码 | 所属模块 |
|--------|------|------------|----------|
| AUTH_001 | 邮箱格式不正确 | 400 | 认证 |
| AUTH_002 | 用户已存在 | 400 | 认证 |
| AUTH_003 | 邮箱或密码错误 | 401 | 认证 |
| AUTH_004 | 未授权访问 | 401 | 认证 |
| AUTH_005 | Token过期或无效 | 401 | 认证 |
| GEN_001 | 积分不足 | 400 | 生成 |
| GEN_002 | 生成任务不存在 | 404 | 生成 |
| GEN_003 | 生成任务处理失败 | 500 | 生成 |
| GEN_004 | 请求过于频繁 | 429 | 生成 |
| GEN_005 | 无效的图像URL | 400 | 生成 |
| PAY_001 | 支付套餐不存在 | 400 | 支付 |
| PAY_002 | Stripe创建会话失败 | 500 | 支付 |
| PAY_003 | Webhook签名验证失败 | 401 | 支付 |
| USER_001 | 用户不存在 | 404 | 用户 |
| USER_002 | API密钥不存在 | 404 | 用户 |
| GALLERY_001 | 图片不存在 | 404 | 图库 |

---

## 7. 分页/鉴权/幂等性设计要点

### 7.1 分页设计

| 设计要点 | 说明 |
|----------|------|
| **分页方式** | 基于偏移量的分页（Offset-based Pagination） |
| **默认值** | `page=1`, `limit=20` |
| **限制范围** | `limit` 最小1，最大100 |
| **响应结构** | 包含 `items` 数组和 `pagination` 对象 |
| **pagination字段** | `page`, `limit`, `total`, `totalPages` |

### 7.2 鉴权设计

| 设计要点 | 说明 |
|----------|------|
| **认证方式** | JWT Bearer Token |
| **Token位置** | HTTP Header: `Authorization: Bearer {token}` |
| **Token有效期** | 7天，支持自动刷新 |
| **保护路径** | `/api/workspace`, `/api/gallery`, `/api/profile`, `/api/generate`, `/api/user`, `/api/payment`（除webhook） |
| **公开路径** | `/`, `/api/auth/signup`, `/api/auth/signin`, `/api/pricing` |
| **权限级别** | 匿名用户 → 认证用户 → 管理员 |

### 7.3 幂等性设计

| 场景 | 设计方案 |
|------|----------|
| **重复创建支付会话** | 使用 `packageId` + `userId` 作为唯一键，相同请求返回已有会话 |
| **重复生成请求** | 生成请求不保证幂等，每次请求都会创建新任务 |
| **删除操作** | 多次删除同一资源返回成功（幂等） |
| **更新操作** | 多次更新使用最新参数，最终状态一致（幂等） |

### 7.4 请求限制

| 限制项 | 规则 |
|--------|------|
| **图像生成** | 每分钟最多5次 |
| **登录尝试** | 每小时最多10次 |
| **API密钥请求** | 每小时最多100次 |
| **批量删除** | 每次最多50个 |

### 7.5 响应格式规范

**成功响应:**
```json
{
  "success": true,
  "data": {},
  "message": "string"
}
```

**失败响应:**
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string"
  }
}
```