# 认证指南

> 最后更新: 2026-02-22

## 📋 概述

Nexus API 使用 JWT (JSON Web Token) 进行身份认证。

## 🔐 认证流程

### 1. 获取 Token

```http
POST /api/v2/auth/login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

### 2. 使用 Token

在请求头中添加 Authorization:

```http
Authorization: Bearer <your-jwt-token>
```

### 3. Token 刷新

Token 过期前使用 refresh token 获取新 token:

```http
POST /api/v2/auth/refresh
Authorization: Bearer <refresh-token>
```

## 📝 Token 结构

### Access Token

- **有效期**: 24小时
- **用途**: 访问受保护资源
- **存储**: 内存或 sessionStorage

### Refresh Token

- **有效期**: 7天
- **用途**: 刷新 access token
- **存储**: httpOnly cookie 或 secure storage

## ⚠️ 安全建议

1. **不要在客户端存储敏感信息**
2. **使用 HTTPS 传输**
3. **Token 过期后重新登录**
4. **定期更换密码**

## 💡 示例代码

### 登录并存储 Token

```javascript
async function login(username, password) {
  const response = await fetch('/api/v2/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const { data } = await response.json();
  
  // 存储 token
  localStorage.setItem('token', data.token);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data.user;
}
```

### 带认证的请求

```javascript
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  // Token 过期，尝试刷新
  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      return fetchWithAuth(url, options);
    }
  }
  
  return response;
}
```

### 刷新 Token

```javascript
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('/api/v2/auth/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${refreshToken}`
    }
  });
  
  if (response.ok) {
    const { data } = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    return true;
  }
  
  // 刷新失败，需要重新登录
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
  return false;
}
```
