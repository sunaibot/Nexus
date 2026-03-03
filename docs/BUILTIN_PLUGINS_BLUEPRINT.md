# 内置插件蓝图 - 零件工坊复刻指南

本文档详细拆解系统内置插件的结构，帮助你用零件工坊和插件构建器复刻它们。

---

## 1. 名言插件 (Quotes)

### 功能清单
- [x] 显示随机名言
- [x] 显示作者和出处
- [x] 每日自动更新
- [x] 后台管理名言库

### 数据库结构

```sql
CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,      -- 名言内容
  author TEXT,                -- 作者
  source TEXT,                -- 出处
  category TEXT,              -- 分类
  isActive INTEGER DEFAULT 1, -- 是否启用
  createdAt TEXT,
  updatedAt TEXT
);
```

### API端点

```typescript
// 获取随机名言
GET /api/quotes/random
Response: { id, content, author, source }

// 获取每日名言（按日期固定）
GET /api/quotes/daily
Response: { id, content, author, source }

// 获取名言列表（管理后台）
GET /api/quotes
Response: [{ id, content, author, source, isActive }]

// 添加名言
POST /api/quotes
Body: { content, author, source, category }

// 更新名言
PUT /api/quotes/:id
Body: { content, author, source, isActive }

// 删除名言
DELETE /api/quotes/:id
```

### 前台组件拆解

```typescript
// QuoteCard 组件
{
  name: '名言卡片',
  structure: {
    container: {
      type: 'div',
      styles: {
        padding: '16px 20px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)'
      }
    },
    icon: {
      type: 'QuoteIcon',
      styles: {
        width: '20px',
        height: '20px',
        color: 'rgba(255,255,255,0.4)',
        marginBottom: '12px'
      }
    },
    content: {
      type: 'p',
      styles: {
        fontSize: '15px',
        lineHeight: '1.7',
        color: 'rgba(255,255,255,0.9)',
        fontStyle: 'italic',
        marginBottom: '12px'
      }
    },
    author: {
      type: 'span',
      styles: {
        fontSize: '13px',
        color: 'rgba(255,255,255,0.5)'
      }
    }
  }
}
```

### 零件工坊复刻方案

**需要的零件：**

1. **QuoteCard 容器零件**
```typescript
{
  id: 'quote-card-container',
  name: '名言卡片容器',
  category: 'layout',
  visual: {
    base: {
      padding: '16px 20px',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.1)'
    },
    states: {
      hover: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.2)'
      }
    }
  },
  properties: [
    { name: 'padding', label: '内边距', type: 'select', 
      options: [{label: '小', value: '12px 16px'}, {label: '中', value: '16px 20px'}, {label: '大', value: '20px 24px'}] },
    { name: 'backgroundColor', label: '背景色', type: 'color', defaultValue: 'rgba(255,255,255,0.05)' },
    { name: 'borderColor', label: '边框色', type: 'color', defaultValue: 'rgba(255,255,255,0.1)' }
  ]
}
```

2. **QuoteIcon 图标零件**
```typescript
{
  id: 'quote-icon',
  name: '引号图标',
  category: 'basic',
  visual: {
    base: {
      width: '20px',
      height: '20px',
      color: 'rgba(255,255,255,0.4)'
    }
  },
  properties: [
    { name: 'size', label: '大小', type: 'select', 
      options: [{label: '小', value: '16px'}, {label: '中', value: '20px'}, {label: '大', value: '24px'}] },
    { name: 'color', label: '颜色', type: 'color', defaultValue: 'rgba(255,255,255,0.4)' }
  ]
}
```

3. **QuoteContent 文本零件**
```typescript
{
  id: 'quote-content',
  name: '名言内容',
  category: 'basic',
  visual: {
    base: {
      fontSize: '15px',
      lineHeight: '1.7',
      color: 'rgba(255,255,255,0.9)',
      fontStyle: 'italic'
    }
  },
  properties: [
    { name: 'content', label: '内容', type: 'string', defaultValue: '学而时习之，不亦说乎' },
    { name: 'fontSize', label: '字号', type: 'select',
      options: [{label: '小', value: '13px'}, {label: '中', value: '15px'}, {label: '大', value: '17px'}] },
    { name: 'color', label: '颜色', type: 'color', defaultValue: 'rgba(255,255,255,0.9)' },
    { name: 'italic', label: '斜体', type: 'boolean', defaultValue: true }
  ]
}
```

4. **QuoteAuthor 作者零件**
```typescript
{
  id: 'quote-author',
  name: '名言作者',
  category: 'basic',
  visual: {
    base: {
      fontSize: '13px',
      color: 'rgba(255,255,255,0.5)',
      textAlign: 'right'
    }
  },
  properties: [
    { name: 'author', label: '作者', type: 'string', defaultValue: '孔子' },
    { name: 'source', label: '出处', type: 'string', defaultValue: '论语' },
    { name: 'prefix', label: '前缀', type: 'string', defaultValue: '—— ' },
    { name: 'showSource', label: '显示出处', type: 'boolean', defaultValue: true }
  ]
}
```

5. **RefreshButton 刷新按钮**
```typescript
{
  id: 'refresh-button',
  name: '刷新按钮',
  category: 'basic',
  visual: {
    base: {
      padding: '6px 12px',
      backgroundColor: 'transparent',
      color: 'rgba(255,255,255,0.5)',
      borderRadius: '6px',
      fontSize: '12px',
      cursor: 'pointer'
    },
    states: {
      hover: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.8)'
      }
    }
  },
  behavior: {
    events: [
      { name: 'click', label: '点击', description: '点击刷新' }
    ]
  },
  properties: [
    { name: 'text', label: '文字', type: 'string', defaultValue: '换一条' },
    { name: 'icon', label: '图标', type: 'select',
      options: [{label: '刷新', value: 'refresh'}, {label: '箭头', value: 'arrow'}, {label: '无', value: ''}] }
  ]
}
```

### 插件构建器配置

```typescript
{
  name: '每日名言',
  description: '显示每日一句名言警句',
  icon: '📜',
  
  canvas: {
    width: 400,
    height: 200,
    backgroundColor: 'transparent'
  },
  
  components: [
    {
      id: 'card',
      part: 'quote-card-container',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 200 }
    },
    {
      id: 'icon',
      part: 'quote-icon',
      position: { x: 20, y: 20 }
    },
    {
      id: 'content',
      part: 'quote-content',
      position: { x: 20, y: 52 },
      size: { width: 360, height: 80 },
      dataBinding: {
        content: '{{quote.content}}'
      }
    },
    {
      id: 'author',
      part: 'quote-author',
      position: { x: 20, y: 140 },
      size: { width: 360, height: 24 },
      dataBinding: {
        author: '{{quote.author}}',
        source: '{{quote.source}}'
      }
    },
    {
      id: 'refresh',
      part: 'refresh-button',
      position: { x: 320, y: 164 }
    }
  ],
  
  dataSources: [
    {
      id: 'quote',
      name: '名言数据',
      type: 'api',
      config: {
        endpoint: '/api/quotes/daily',
        method: 'GET',
        refreshInterval: 86400000  // 24小时
      }
    }
  ],
  
  actions: [
    {
      id: 'refresh-quote',
      name: '刷新名言',
      type: 'refreshData',
      config: {
        target: 'quote'
      }
    }
  ],
  
  events: [
    {
      component: 'refresh',
      event: 'click',
      action: 'refresh-quote'
    }
  ]
}
```

---

## 2. 文件快传插件 (File Transfer)

### 功能清单
- [x] 拖拽上传文件
- [x] 显示上传进度
- [x] 文件列表管理
- [x] 下载和删除文件
- [x] 过期自动清理

### 数据库结构

```sql
CREATE TABLE file_transfers (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  originalName TEXT,
  mimeType TEXT,
  size INTEGER,
  path TEXT,
  expireAt TEXT,           -- 过期时间
  downloadCount INTEGER DEFAULT 0,
  maxDownloads INTEGER,    -- 最大下载次数
  password TEXT,           -- 访问密码
  createdBy TEXT,
  createdAt TEXT
);
```

### API端点

```typescript
// 上传文件
POST /api/file-transfers/upload
Content-Type: multipart/form-data
Body: { file: File, expireHours?: number, maxDownloads?: number, password?: string }
Response: { id, filename, size, expireAt, downloadUrl }

// 获取文件列表
GET /api/file-transfers
Response: [{ id, filename, size, createdAt, expireAt, downloadCount }]

// 下载文件
GET /api/file-transfers/:id/download
Query: { password?: string }
Response: File stream

// 删除文件
DELETE /api/file-transfers/:id

// 获取上传进度（WebSocket/SSE）
WS /api/file-transfers/progress/:uploadId
```

### 零件清单

1. **FileUploadZone** - 文件上传区域
2. **ProgressBar** - 进度条
3. **FileList** - 文件列表
4. **FileItem** - 单个文件项
5. **DownloadButton** - 下载按钮
6. **DeleteButton** - 删除按钮

### 零件定义

```typescript
// 1. 文件上传区域
{
  id: 'file-upload-zone',
  name: '文件上传区',
  category: 'interactive',
  visual: {
    base: {
      padding: '40px',
      border: '2px dashed #d1d5db',
      borderRadius: '12px',
      textAlign: 'center',
      backgroundColor: '#f9fafb'
    },
    states: {
      hover: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff'
      },
      dragover: {
        borderColor: '#3b82f6',
        backgroundColor: '#dbeafe',
        transform: 'scale(1.02)'
      }
    }
  },
  behavior: {
    events: [
      { name: 'fileSelect', label: '选择文件' },
      { name: 'fileDrop', label: '拖放文件' },
      { name: 'dragEnter', label: '拖拽进入' },
      { name: 'dragLeave', label: '拖拽离开' }
    ]
  },
  properties: [
    { name: 'title', label: '标题', type: 'string', defaultValue: '拖拽文件到此处' },
    { name: 'subtitle', label: '副标题', type: 'string', defaultValue: '或点击选择文件' },
    { name: 'accept', label: '允许类型', type: 'string', defaultValue: '*' },
    { name: 'maxSize', label: '最大大小(MB)', type: 'number', defaultValue: 100 },
    { name: 'multiple', label: '多文件', type: 'boolean', defaultValue: true },
    { name: 'borderStyle', label: '边框样式', type: 'select',
      options: [{label: '虚线', value: 'dashed'}, {label: '实线', value: 'solid'}] }
  ]
}

// 2. 进度条
{
  id: 'upload-progress',
  name: '上传进度条',
  category: 'data',
  visual: {
    base: {
      height: '8px',
      backgroundColor: '#e5e7eb',
      borderRadius: '4px',
      overflow: 'hidden'
    }
  },
  properties: [
    { name: 'progress', label: '进度(%)', type: 'number', defaultValue: 0, min: 0, max: 100 },
    { name: 'color', label: '进度颜色', type: 'color', defaultValue: '#3b82f6' },
    { name: 'backgroundColor', label: '背景色', type: 'color', defaultValue: '#e5e7eb' },
    { name: 'showText', label: '显示文字', type: 'boolean', defaultValue: true },
    { name: 'text', label: '文字模板', type: 'string', defaultValue: '{{progress}}%' }
  ]
}

// 3. 文件列表项
{
  id: 'file-list-item',
  name: '文件列表项',
  category: 'data',
  visual: {
    base: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      gap: '12px'
    },
    states: {
      hover: {
        backgroundColor: '#f9fafb',
        borderColor: '#d1d5db'
      }
    }
  },
  properties: [
    { name: 'filename', label: '文件名', type: 'string' },
    { name: 'size', label: '文件大小', type: 'string' },
    { name: 'date', label: '上传日期', type: 'string' },
    { name: 'showIcon', label: '显示图标', type: 'boolean', defaultValue: true },
    { name: 'showSize', label: '显示大小', type: 'boolean', defaultValue: true },
    { name: 'showDate', label: '显示日期', type: 'boolean', defaultValue: true }
  ]
}

// 4. 操作按钮组
{
  id: 'file-actions',
  name: '文件操作按钮',
  category: 'interactive',
  visual: {
    base: {
      display: 'flex',
      gap: '8px'
    }
  },
  behavior: {
    events: [
      { name: 'download', label: '下载' },
      { name: 'delete', label: '删除' },
      { name: 'share', label: '分享' }
    ]
  },
  properties: [
    { name: 'showDownload', label: '显示下载', type: 'boolean', defaultValue: true },
    { name: 'showDelete', label: '显示删除', type: 'boolean', defaultValue: true },
    { name: 'showShare', label: '显示分享', type: 'boolean', defaultValue: false },
    { name: 'buttonSize', label: '按钮大小', type: 'select',
      options: [{label: '小', value: 'small'}, {label: '中', value: 'medium'}] }
  ]
}
```

### 插件配置

```typescript
{
  name: '文件快传',
  description: '快速上传和分享文件',
  icon: '📤',
  
  canvas: { width: 600, height: 500 },
  
  components: [
    {
      id: 'upload-zone',
      part: 'file-upload-zone',
      position: { x: 20, y: 20 },
      size: { width: 560, height: 140 }
    },
    {
      id: 'progress-container',
      part: 'layout-container',
      position: { x: 20, y: 170 },
      size: { width: 560, height: 40 },
      conditional: '{{uploading}}'  // 上传时显示
    },
    {
      id: 'progress-bar',
      part: 'upload-progress',
      position: { x: 0, y: 0 },
      size: { width: 560, height: 8 },
      dataBinding: { progress: '{{uploadProgress}}' }
    },
    {
      id: 'file-list',
      part: 'scroll-container',
      position: { x: 20, y: 220 },
      size: { width: 560, height: 260 },
      dataBinding: {
        items: '{{files}}',
        itemComponent: 'file-list-item'
      }
    }
  ],
  
  dataSources: [
    {
      id: 'files',
      name: '文件列表',
      type: 'api',
      config: {
        endpoint: '/api/file-transfers',
        method: 'GET'
      }
    }
  ],
  
  variables: [
    { name: 'uploading', defaultValue: false },
    { name: 'uploadProgress', defaultValue: 0 },
    { name: 'selectedFiles', defaultValue: [] }
  ],
  
  actions: [
    {
      id: 'upload-files',
      name: '上传文件',
      type: 'upload',
      config: {
        endpoint: '/api/file-transfers/upload',
        method: 'POST',
        onProgress: 'update-upload-progress',
        onComplete: 'refresh-file-list'
      }
    },
    {
      id: 'download-file',
      name: '下载文件',
      type: 'download',
      config: {
        endpoint: '/api/file-transfers/{{id}}/download'
      }
    },
    {
      id: 'delete-file',
      name: '删除文件',
      type: 'api',
      config: {
        endpoint: '/api/file-transfers/{{id}}',
        method: 'DELETE',
        confirm: '确定要删除这个文件吗？'
      }
    }
  ]
}
```

---

## 3. RSS订阅插件 (RSS)

### 功能清单
- [x] RSS源管理（添加、编辑、删除）
- [x] 自动抓取文章
- [x] 文章列表展示
- [x] 已读/未读标记
- [x] 收藏文章

### 数据库结构

```sql
-- RSS源表
CREATE TABLE rss_feeds (
  id TEXT PRIMARY KEY,
  userId TEXT,
  title TEXT,
  url TEXT NOT NULL,
  description TEXT,
  lastFetchAt TEXT,
  fetchInterval INTEGER DEFAULT 3600,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT
);

-- RSS文章表
CREATE TABLE rss_articles (
  id TEXT PRIMARY KEY,
  feedId TEXT,
  title TEXT,
  content TEXT,
  summary TEXT,
  link TEXT,
  author TEXT,
  publishedAt TEXT,
  isRead INTEGER DEFAULT 0,
  isStarred INTEGER DEFAULT 0,
  createdAt TEXT
);
```

### API端点

```typescript
// RSS源管理
GET    /api/rss/feeds
POST   /api/rss/feeds
PUT    /api/rss/feeds/:id
DELETE /api/rss/feeds/:id
POST   /api/rss/feeds/:id/refresh

// 文章管理
GET    /api/rss/articles
GET    /api/rss/articles?feedId=:id&unreadOnly=true
POST   /api/rss/articles/:id/read
POST   /api/rss/articles/:id/star
GET    /api/rss/unread-count
```

### 零件清单

1. **FeedList** - RSS源列表（侧边栏）
2. **FeedItem** - 单个源项
3. **ArticleList** - 文章列表
4. **ArticleCard** - 文章卡片
5. **ArticleDetail** - 文章详情
6. **UnreadBadge** - 未读标记

### 零件定义示例

```typescript
// RSS源列表项
{
  id: 'rss-feed-item',
  name: 'RSS源项',
  category: 'data',
  visual: {
    base: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 12px',
      borderRadius: '8px',
      cursor: 'pointer',
      gap: '10px'
    },
    states: {
      default: { backgroundColor: 'transparent' },
      hover: { backgroundColor: 'rgba(59,130,246,0.1)' },
      active: { backgroundColor: 'rgba(59,130,246,0.2)' }
    }
  },
  properties: [
    { name: 'title', label: '标题', type: 'string' },
    { name: 'unreadCount', label: '未读数', type: 'number', defaultValue: 0 },
    { name: 'icon', label: '图标', type: 'string', defaultValue: '📰' },
    { name: 'isActive', label: '是否选中', type: 'boolean', defaultValue: false }
  ]
}

// 文章卡片
{
  id: 'rss-article-card',
  name: 'RSS文章卡片',
  category: 'data',
  visual: {
    base: {
      padding: '16px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      marginBottom: '12px'
    },
    states: {
      hover: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      },
      unread: {
        borderLeft: '3px solid #3b82f6'
      }
    }
  },
  properties: [
    { name: 'title', label: '标题', type: 'string' },
    { name: 'summary', label: '摘要', type: 'string' },
    { name: 'author', label: '作者', type: 'string' },
    { name: 'publishedAt', label: '发布时间', type: 'string' },
    { name: 'isRead', label: '已读', type: 'boolean', defaultValue: false },
    { name: 'isStarred', label: '已收藏', type: 'boolean', defaultValue: false }
  ]
}
```

### 插件配置（双栏布局）

```typescript
{
  name: 'RSS订阅',
  description: 'RSS阅读器',
  icon: '📰',
  
  canvas: { width: 900, height: 600 },
  
  layout: {
    type: 'split',
    direction: 'horizontal',
    ratio: [0.25, 0.75]  // 25% 源列表, 75% 文章区
  },
  
  components: [
    // 左侧源列表
    {
      id: 'feed-list-container',
      part: 'layout-container',
      position: { x: 0, y: 0 },
      size: { width: 225, height: 600 },
      children: [
        {
          id: 'feed-header',
          part: 'text-heading',
          props: { content: '订阅源', level: '3' }
        },
        {
          id: 'feed-list',
          part: 'rss-feed-list',
          dataBinding: {
            items: '{{feeds}}',
            selectedId: '{{selectedFeed}}'
          }
        },
        {
          id: 'add-feed-btn',
          part: 'button-secondary',
          props: { text: '+ 添加源' }
        }
      ]
    },
    
    // 右侧文章区
    {
      id: 'article-area',
      part: 'layout-container',
      position: { x: 225, y: 0 },
      size: { width: 675, height: 600 },
      children: [
        {
          id: 'article-header',
          part: 'toolbar',
          props: {
            title: '{{selectedFeedTitle}}',
            actions: ['全部标为已读', '刷新']
          }
        },
        {
          id: 'article-list',
          part: 'rss-article-list',
          dataBinding: {
            items: '{{articles}}'
          }
        }
      ]
    }
  ],
  
  dataSources: [
    {
      id: 'feeds',
      name: 'RSS源',
      type: 'api',
      config: { endpoint: '/api/rss/feeds', method: 'GET' }
    },
    {
      id: 'articles',
      name: '文章列表',
      type: 'api',
      config: {
        endpoint: '/api/rss/articles?feedId={{selectedFeed}}',
        method: 'GET',
        dependencies: ['selectedFeed']
      }
    }
  ],
  
  variables: [
    { name: 'selectedFeed', defaultValue: null },
    { name: 'selectedArticle', defaultValue: null },
    { name: 'filter', defaultValue: 'all' }  // all/unread/starred
  ]
}
```

---

## 4. 访问统计插件 (Visits)

### 功能清单
- [x] 记录页面访问
- [x] 统计PV/UV
- [x] 访问趋势图表
- [x] 热门页面排行
- [x] 访客地域分布

### 数据库结构

```sql
CREATE TABLE visits (
  id TEXT PRIMARY KEY,
  ip TEXT,
  userAgent TEXT,
  path TEXT,
  referrer TEXT,
  country TEXT,
  city TEXT,
  createdAt TEXT
);

CREATE TABLE visit_stats (
  date TEXT PRIMARY KEY,
  pv INTEGER DEFAULT 0,
  uv INTEGER DEFAULT 0,
  uniqueVisitors INTEGER DEFAULT 0
);
```

### API端点

```typescript
// 记录访问
POST /api/visits
Body: { path, referrer }

// 获取统计数据
GET /api/visits/stats?startDate=:start&endDate=:end
Response: {
  totalPV: number,
  totalUV: number,
  todayPV: number,
  todayUV: number,
  trend: [{ date, pv, uv }],
  topPages: [{ path, count }],
  geo: [{ country, count }]
}
```

### 需要的零件

1. **StatCard** - 统计卡片（显示PV/UV数字）
2. **LineChart** - 折线图（访问趋势）
3. **BarChart** - 柱状图（热门页面）
4. **PieChart** - 饼图（地域分布）
5. **DataTable** - 数据表格

### 统计卡片零件

```typescript
{
  id: 'stat-number-card',
  name: '统计数字卡片',
  category: 'data',
  visual: {
    base: {
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }
  },
  properties: [
    { name: 'title', label: '标题', type: 'string', defaultValue: '总访问量' },
    { name: 'value', label: '数值', type: 'string', defaultValue: '0' },
    { name: 'trend', label: '趋势', type: 'select',
      options: [{label: '上升', value: 'up'}, {label: '下降', value: 'down'}, {label: '持平', value: 'flat'}] },
    { name: 'trendValue', label: '变化值', type: 'string', defaultValue: '0%' },
    { name: 'icon', label: '图标', type: 'string', defaultValue: '👁️' },
    { name: 'color', label: '主题色', type: 'color', defaultValue: '#3b82f6' }
  ]
}
```

### 图表零件（使用图表库）

```typescript
{
  id: 'line-chart',
  name: '折线图',
  category: 'data',
  properties: [
    { name: 'data', label: '数据', type: 'array' },
    { name: 'xField', label: 'X轴字段', type: 'string', defaultValue: 'date' },
    { name: 'yField', label: 'Y轴字段', type: 'string', defaultValue: 'value' },
    { name: 'series', label: '系列', type: 'array' },
    { name: 'smooth', label: '平滑曲线', type: 'boolean', defaultValue: true },
    { name: 'showArea', label: '显示面积', type: 'boolean', defaultValue: false }
  ]
}
```

---

## 5. 便签笔记插件 (Notepads)

### 功能清单
- [x] 创建便签
- [x] 编辑内容（富文本）
- [x] 设置颜色标签
- [x] 拖拽排序
- [x] 搜索和筛选

### 数据库结构

```sql
CREATE TABLE notepads (
  id TEXT PRIMARY KEY,
  userId TEXT,
  title TEXT,
  content TEXT,
  color TEXT DEFAULT 'yellow',
  orderIndex INTEGER DEFAULT 0,
  isPinned INTEGER DEFAULT 0,
  createdAt TEXT,
  updatedAt TEXT
);
```

### 零件清单

1. **NoteCard** - 便签卡片
2. **NoteEditor** - 便签编辑器
3. **ColorPicker** - 颜色选择器
4. **SearchBox** - 搜索框
5. **SortableGrid** - 可排序网格

### 便签卡片零件

```typescript
{
  id: 'notepad-card',
  name: '便签卡片',
  category: 'data',
  visual: {
    base: {
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      minHeight: '150px'
    },
    states: {
      yellow: { backgroundColor: '#fef3c7' },
      green: { backgroundColor: '#d1fae5' },
      blue: { backgroundColor: '#dbeafe' },
      pink: { backgroundColor: '#fce7f3' },
      purple: { backgroundColor: '#f3e8ff' }
    }
  },
  properties: [
    { name: 'title', label: '标题', type: 'string' },
    { name: 'content', label: '内容', type: 'string' },
    { name: 'color', label: '颜色', type: 'select',
      options: [
        {label: '黄色', value: 'yellow'},
        {label: '绿色', value: 'green'},
        {label: '蓝色', value: 'blue'},
        {label: '粉色', value: 'pink'},
        {label: '紫色', value: 'purple'}
      ] },
    { name: 'isPinned', label: '置顶', type: 'boolean', defaultValue: false },
    { name: 'updatedAt', label: '更新时间', type: 'string' }
  ]
}
```

---

## 复刻检查清单

### 名言插件复刻检查项

- [ ] 创建 QuoteCard 容器零件
- [ ] 创建 QuoteIcon 图标零件
- [ ] 创建 QuoteContent 文本零件
- [ ] 创建 QuoteAuthor 作者零件
- [ ] 创建 RefreshButton 按钮零件
- [ ] 在构建器中搭建布局
- [ ] 配置 /api/quotes/daily 数据源
- [ ] 绑定数据到组件
- [ ] 添加刷新按钮点击事件
- [ ] 测试预览
- [ ] 保存并发布

### 文件快传插件复刻检查项

- [ ] 创建 FileUploadZone 上传区域零件
- [ ] 创建 ProgressBar 进度条零件
- [ ] 创建 FileListItem 文件项零件
- [ ] 创建 FileActions 操作按钮零件
- [ ] 搭建上传区域布局
- [ ] 配置文件列表数据源
- [ ] 实现上传功能
- [ ] 实现下载和删除功能
- [ ] 测试文件上传流程
- [ ] 保存并发布

### RSS插件复刻检查项

- [ ] 创建 FeedItem 源项零件
- [ ] 创建 ArticleCard 文章卡片零件
- [ ] 创建 UnreadBadge 未读标记零件
- [ ] 搭建双栏布局（左源右文）
- [ ] 配置 feeds 和 articles 数据源
- [ ] 实现源切换功能
- [ ] 实现文章阅读功能
- [ ] 实现已读/收藏功能
- [ ] 测试RSS阅读流程
- [ ] 保存并发布

---

## 总结

通过以上蓝图，你可以：

1. **理解每个插件的完整结构** - 数据库、API、前端组件
2. **知道需要创建哪些零件** - 每个零件的功能和属性
3. **按照步骤复刻插件** - 从零件到完整插件
4. **自定义和扩展** - 基于蓝图创建变体

记住核心原则：
- **原子化设计** - 零件要小而专
- **数据驱动** - 通过数据源连接前后端
- **可配置** - 提供丰富的属性选项
- **可复用** - 零件可以在多个插件中使用

开始你的插件构建之旅吧！🚀
