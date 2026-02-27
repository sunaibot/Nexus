# 分页指南

> 最后更新: 2026-02-22

## 📋 概述

NOWEN API 使用统一的分页机制，支持游标分页和偏移分页。

## 📝 请求参数

### 标准分页参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | ❌ | 1 | 页码（从1开始） |
| pageSize | number | ❌ | 20 | 每页数量 |
| search | string | ❌ | - | 搜索关键词 |
| sortBy | string | ❌ | createdAt | 排序字段 |
| sortOrder | string | ❌ | desc | 排序方向: asc/desc |

### 示例请求

```http
GET /api/v2/bookmarks/paginated?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc
```

## 📊 响应格式

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5,
      "hasMore": true,
      "hasPrevious": false
    }
  }
}
```

### 分页对象说明

| 字段 | 类型 | 说明 |
|------|------|------|
| page | number | 当前页码 |
| pageSize | number | 每页数量 |
| total | number | 总记录数 |
| totalPages | number | 总页数 |
| hasMore | boolean | 是否有下一页 |
| hasPrevious | boolean | 是否有上一页 |

## 💡 使用示例

### 基础分页

```javascript
async function fetchBookmarks(page = 1, pageSize = 20) {
  const response = await fetch(
    `/api/v2/bookmarks/paginated?page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const { data } = await response.json();
  return data;
}
```

### 带搜索的分页

```javascript
async function searchBookmarks(keyword, page = 1) {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: '20',
    search: keyword,
    sortBy: 'clickCount',
    sortOrder: 'desc'
  });
  
  const response = await fetch(
    `/api/v2/bookmarks/paginated?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return response.json();
}
```

### React Hook 示例

```typescript
import { useState, useEffect } from 'react';

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

function usePaginatedData<T>(
  fetcher: (page: number, pageSize: number) => Promise<{ items: T[]; pagination: PaginationState }>
) {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false
  });
  const [loading, setLoading] = useState(false);
  
  const fetchPage = async (page: number) => {
    setLoading(true);
    try {
      const result = await fetcher(page, pagination.pageSize);
      setData(result.items);
      setPagination(result.pagination);
    } finally {
      setLoading(false);
    }
  };
  
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
  
  useEffect(() => {
    fetchPage(1);
  }, []);
  
  return {
    data,
    pagination,
    loading,
    nextPage,
    previousPage,
    refresh: () => fetchPage(pagination.page)
  };
}

// 使用
function BookmarkList() {
  const { data, pagination, loading, nextPage, previousPage } = usePaginatedData(
    (page, pageSize) => fetchBookmarks(page, pageSize)
  );
  
  return (
    <div>
      {data.map(bookmark => (
        <BookmarkCard key={bookmark.id} bookmark={bookmark} />
      ))}
      
      <div className="pagination">
        <button onClick={previousPage} disabled={pagination.page === 1}>
          上一页
        </button>
        <span>第 {pagination.page} / {pagination.totalPages} 页</span>
        <button onClick={nextPage} disabled={!pagination.hasMore}>
          下一页
        </button>
      </div>
    </div>
  );
}
```

### 无限滚动示例

```typescript
function useInfiniteScroll<T>(
  fetcher: (page: number) => Promise<{ items: T[]; pagination: { hasMore: boolean } }>
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const result = await fetcher(page);
      setItems(prev => [...prev, ...result.items]);
      setHasMore(result.pagination.hasMore);
      setPage(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };
  
  return { items, loadMore, hasMore, loading };
}
```

## ⚠️ 注意事项

1. **page 从 1 开始计数**
2. **pageSize 最大值为 100**
3. **total 可能为 -1 表示总数未知**
4. **使用 hasMore 判断是否有更多数据**
