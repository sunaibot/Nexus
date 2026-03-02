# 错误处理指南

> 最后更新: 2026-02-22

## 📋 概述

Nexus API 使用统一的错误响应格式，便于客户端处理。

## 📝 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人类可读的错误描述",
    "details": {}
  }
}
```

## 🔢 HTTP 状态码

| 状态码 | 含义 | 说明 |
|--------|------|------|
| 200 | OK | 请求成功 |
| 201 | Created | 创建成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 429 | Too Many Requests | 请求过于频繁 |
| 500 | Internal Server Error | 服务器错误 |

## 🚨 错误码列表

### 认证相关

| 错误码 | 描述 | HTTP 状态码 |
|--------|------|-------------|
| UNAUTHORIZED | 未认证 | 401 |
| TOKEN_EXPIRED | Token 已过期 | 401 |
| TOKEN_INVALID | Token 无效 | 401 |
| INVALID_CREDENTIALS | 用户名或密码错误 | 401 |
| PERMISSION_DENIED | 权限不足 | 403 |

### 请求相关

| 错误码 | 描述 | HTTP 状态码 |
|--------|------|-------------|
| BAD_REQUEST | 请求参数错误 | 400 |
| VALIDATION_ERROR | 数据验证失败 | 400 |
| MISSING_FIELD | 缺少必填字段 | 400 |
| INVALID_FORMAT | 格式不正确 | 400 |

### 资源相关

| 错误码 | 描述 | HTTP 状态码 |
|--------|------|-------------|
| NOT_FOUND | 资源不存在 | 404 |
| ALREADY_EXISTS | 资源已存在 | 409 |
| USERNAME_EXISTS | 用户名已存在 | 409 |
| EMAIL_EXISTS | 邮箱已被使用 | 409 |

### 系统相关

| 错误码 | 描述 | HTTP 状态码 |
|--------|------|-------------|
| INTERNAL_ERROR | 服务器内部错误 | 500 |
| DATABASE_ERROR | 数据库错误 | 500 |
| SERVICE_UNAVAILABLE | 服务不可用 | 503 |
| RATE_LIMITED | 请求过于频繁 | 429 |

## 💡 错误处理示例

### JavaScript

```javascript
async function apiRequest(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!data.success) {
      handleApiError(data.error);
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error('网络错误:', error);
    showError('网络连接失败');
  }
}

function handleApiError(error) {
  switch (error.code) {
    case 'UNAUTHORIZED':
    case 'TOKEN_EXPIRED':
      // 重新登录
      window.location.href = '/login';
      break;
    case 'PERMISSION_DENIED':
      showError('您没有权限执行此操作');
      break;
    case 'NOT_FOUND':
      showError('请求的资源不存在');
      break;
    case 'VALIDATION_ERROR':
      showError(`验证失败: ${error.message}`);
      break;
    case 'RATE_LIMITED':
      showError('请求过于频繁，请稍后再试');
      break;
    default:
      showError(error.message || '操作失败');
  }
}

function showError(message) {
  // 显示错误提示
  alert(message);
}
```

### TypeScript

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

class ApiErrorHandler {
  static handle(error: ApiError): void {
    const handlers: Record<string, () => void> = {
      'UNAUTHORIZED': () => this.redirectToLogin(),
      'TOKEN_EXPIRED': () => this.refreshToken(),
      'PERMISSION_DENIED': () => this.showPermissionError(),
      'NOT_FOUND': () => this.showNotFoundError(),
      'RATE_LIMITED': () => this.showRateLimitError(),
      'DEFAULT': () => this.showGenericError(error.message)
    };
    
    (handlers[error.code] || handlers['DEFAULT'])();
  }
  
  private static redirectToLogin(): void {
    window.location.href = '/login';
  }
  
  private static showPermissionError(): void {
    // 显示权限错误
  }
  
  // ... 其他处理方法
}
```
