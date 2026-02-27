# JavaScript 示例

> 最后更新: 2026-02-22

## 📋 基础配置

```javascript
const API_BASE_URL = 'http://localhost:3000/api/v2';

// 存储 token
let accessToken = localStorage.getItem('token');
let refreshToken = localStorage.getItem('refreshToken');
```

## 🔐 认证

### 登录

```javascript
async function login(username, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const result = await response.json();
  
  if (result.success) {
    accessToken = result.data.token;
    refreshToken = result.data.refreshToken;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    return result.data.user;
  }
  
  throw new Error(result.error.message);
}
```

### 登出

```javascript
async function logout() {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
}
```

### 刷新 Token

```javascript
async function refreshAccessToken() {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${refreshToken}` }
  });
  
  const result = await response.json();
  
  if (result.success) {
    accessToken = result.data.token;
    refreshToken = result.data.refreshToken;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    return true;
  }
  
  return false;
}
```

## 🌐 API 客户端

### 基础请求封装

```javascript
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    // 添加认证头
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    let response = await fetch(url, config);
    
    // Token 过期，尝试刷新
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
        response = await fetch(url, config);
      } else {
        window.location.href = '/login';
        return;
      }
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error.message);
    }
    
    return result.data;
  }
  
  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }
  
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
  
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const api = new ApiClient(API_BASE_URL);
```

## 📚 书签操作

### 获取书签列表

```javascript
async function getBookmarks() {
  return api.get('/bookmarks');
}

// 使用
const bookmarks = await getBookmarks();
console.log(bookmarks);
```

### 分页获取书签

```javascript
async function getBookmarksPaginated(page = 1, pageSize = 20, search = '') {
  return api.get('/bookmarks/paginated', {
    page,
    pageSize,
    search,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
}

// 使用
const result = await getBookmarksPaginated(1, 20, 'javascript');
console.log(result.items);
console.log(result.pagination);
```

### 创建书签

```javascript
async function createBookmark(bookmark) {
  return api.post('/bookmarks', bookmark);
}

// 使用
const newBookmark = await createBookmark({
  url: 'https://github.com',
  title: 'GitHub',
  description: '代码托管平台',
  category: '开发工具',
  visibility: 'personal'
});
```

### 更新书签

```javascript
async function updateBookmark(id, updates) {
  return api.put(`/bookmarks/${id}`, updates);
}

// 使用
await updateBookmark('bm-123', {
  title: 'GitHub - 更新',
  category: '技术'
});
```

### 删除书签

```javascript
async function deleteBookmark(id) {
  return api.delete(`/bookmarks/${id}`);
}

// 使用
await deleteBookmark('bm-123');
```

### 置顶/取消置顶

```javascript
async function togglePin(id) {
  return api.patch(`/bookmarks/${id}/pin`);
}
```

## 👤 用户管理

### 获取用户列表

```javascript
async function getUsers() {
  return api.get('/users');
}
```

### 创建用户

```javascript
async function createUser(user) {
  return api.post('/users', user);
}

// 使用
await createUser({
  username: 'newuser',
  password: 'password123',
  role: 'user',
  email: 'user@example.com'
});
```

## ⚙️ 设置

### 获取站点设置

```javascript
async function getSiteSettings() {
  return api.get('/settings/site');
}
```

### 更新站点设置

```javascript
async function updateSiteSettings(settings) {
  return api.put('/settings/site', settings);
}

// 使用
await updateSiteSettings({
  siteTitle: '我的书签',
  enableWeather: true,
  enableLunar: true
});
```

## 📊 React Hook 示例

### 使用书签

```typescript
import { useState, useEffect, useCallback } from 'react';

function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/bookmarks');
      setBookmarks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const createBookmark = async (bookmark) => {
    const newBookmark = await api.post('/bookmarks', bookmark);
    setBookmarks(prev => [newBookmark, ...prev]);
    return newBookmark;
  };
  
  const updateBookmark = async (id, updates) => {
    const updated = await api.put(`/bookmarks/${id}`, updates);
    setBookmarks(prev =>
      prev.map(b => b.id === id ? updated : b)
    );
    return updated;
  };
  
  const deleteBookmark = async (id) => {
    await api.delete(`/bookmarks/${id}`);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };
  
  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);
  
  return {
    bookmarks,
    loading,
    error,
    refresh: fetchBookmarks,
    createBookmark,
    updateBookmark,
    deleteBookmark
  };
}

// 使用
function BookmarkList() {
  const { bookmarks, loading, error, createBookmark } = useBookmarks();
  
  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  
  return (
    <div>
      {bookmarks.map(bookmark => (
        <BookmarkCard key={bookmark.id} bookmark={bookmark} />
      ))}
    </div>
  );
}
```

### 分页书签

```typescript
function usePaginatedBookmarks(pageSize = 20) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize,
    total: 0,
    hasMore: false
  });
  const [loading, setLoading] = useState(false);
  
  const fetchPage = useCallback(async (page, search = '') => {
    setLoading(true);
    try {
      const result = await api.get('/bookmarks/paginated', {
        page,
        pageSize,
        search
      });
      setItems(result.items);
      setPagination(result.pagination);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);
  
  const nextPage = () => {
    if (pagination.hasMore) {
      fetchPage(pagination.page + 1);
    }
  };
  
  const previousPage = () => {
    if (pagination.page > 1) {
      fetchPage(pagination.page - 1);
    }
  };
  
  return {
    items,
    pagination,
    loading,
    fetchPage,
    nextPage,
    previousPage
  };
}
```

## 🎯 完整示例：书签管理组件

```typescript
import React, { useState } from 'react';

function BookmarkManager() {
  const { bookmarks, loading, createBookmark, deleteBookmark } = useBookmarks();
  const [newBookmark, setNewBookmark] = useState({
    url: '',
    title: '',
    category: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await createBookmark(newBookmark);
    setNewBookmark({ url: '', title: '', category: '' });
  };
  
  if (loading) return <div>加载中...</div>;
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="URL"
          value={newBookmark.url}
          onChange={e => setNewBookmark({...newBookmark, url: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="标题"
          value={newBookmark.title}
          onChange={e => setNewBookmark({...newBookmark, title: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="分类"
          value={newBookmark.category}
          onChange={e => setNewBookmark({...newBookmark, category: e.target.value})}
        />
        <button type="submit">添加书签</button>
      </form>
      
      <ul>
        {bookmarks.map(bookmark => (
          <li key={bookmark.id}>
            <a href={bookmark.url} target="_blank" rel="noopener">
              {bookmark.title}
            </a>
            <button onClick={() => deleteBookmark(bookmark.id)}>
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```
