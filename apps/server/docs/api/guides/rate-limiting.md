# 限流指南

> 最后更新: 2026-02-22

## 📋 概述

Nexus API 实施限流策略以防止滥用和确保服务稳定性。

## 🚦 限流策略

### 公开接口

| 类型 | 限制 | 说明 |
|------|------|------|
| 公开API | 300次/分钟 | 如获取公开书签、站点设置 |

### 认证接口

| 类型 | 限制 | 说明 |
|------|------|------|
| 普通接口 | 100次/分钟 | 需要登录的接口 |
| 敏感操作 | 5次/15分钟 | 登录、修改密码等 |
| 上传接口 | 10次/小时 | 文件上传相关 |

### 管理接口

| 类型 | 限制 | 说明 |
|------|------|------|
| 管理操作 | 50次/分钟 | 管理员专用接口 |

## 📊 响应头

限流相关的响应头：

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1645536000
Retry-After: 60
```

### 头字段说明

| 头字段 | 说明 |
|--------|------|
| X-RateLimit-Limit | 当前窗口的最大请求数 |
| X-RateLimit-Remaining | 当前窗口剩余请求数 |
| X-RateLimit-Reset | 限流重置时间戳（秒） |
| Retry-After | 被限流后需要等待的秒数 |

## 🚨 限流响应

当触发限流时，返回 429 状态码：

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "请求过于频繁，请稍后再试",
    "details": {
      "retryAfter": 60,
      "limit": 100,
      "window": "1m"
    }
  }
}
```

## 💡 最佳实践

### 1. 客户端限流

```javascript
class RateLimiter {
  constructor() {
    this.requests = [];
    this.limit = 100;
    this.window = 60000; // 1分钟
  }
  
  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(
      time => now - time < this.window
    );
    return this.requests.length < this.limit;
  }
  
  recordRequest() {
    this.requests.push(Date.now());
  }
}
```

### 2. 指数退避

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
      await sleep(retryAfter * 1000);
      continue;
    }
    
    return response;
  }
  
  throw new Error('Max retries exceeded');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 3. 请求队列

```javascript
class RequestQueue {
  constructor(rateLimit = 100, windowMs = 60000) {
    this.queue = [];
    this.rateLimit = rateLimit;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }
  
  async processQueue() {
    if (this.queue.length === 0) return;
    
    const now = Date.now();
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );
    
    if (this.requests.length >= this.rateLimit) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      setTimeout(() => this.processQueue(), waitTime);
      return;
    }
    
    const { requestFn, resolve, reject } = this.queue.shift();
    this.requests.push(now);
    
    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    }
    
    this.processQueue();
  }
}

// 使用
const queue = new RequestQueue(100, 60000);

async function makeRequest(url, options) {
  return queue.add(() => fetch(url, options));
}
```

## ⚠️ 注意事项

1. **429 错误时不要立即重试**
2. **尊重 Retry-After 头**
3. **实现客户端限流作为后备**
4. **批量操作使用专用接口**
5. **缓存不常变化的数据**
