# Settings 模块 - 系统设置

> 模块路径: `/api/v2/settings`  
> 最后更新: 2026-02-22

## 📋 模块概述

系统设置模块用于管理全局配置、站点信息、功能开关等。

## 🔗 接口列表

### 1. 获取站点设置（公开）

**GET** `/api/v2/settings/site`

> 无需认证

#### 响应示例

```json
{
  "success": true,
  "data": {
    "siteTitle": "NOWEN",
    "siteFavicon": "/favicon.ico",
    "enableBeamAnimation": true,
    "enableLiteMode": false,
    "enableWeather": true,
    "enableLunar": true,
    "wallpaper": {
      "enabled": true,
      "source": "upload",
      "imageData": "data:image/jpeg;base64,/9j/4AAQ...",
      "imageUrl": "",
      "blur": 5,
      "overlay": 40
    }
  }
}
```

---

### 2. 更新站点设置

**PUT** `/api/v2/settings/site`

> 需要管理员权限

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| siteTitle | string | ❌ | 站点标题 |
| siteFavicon | string | ❌ | 站点图标 |
| enableBeamAnimation | boolean | ❌ | 光束动画 |
| enableLiteMode | boolean | ❌ | 精简模式 |
| enableWeather | boolean | ❌ | 天气组件 |
| enableLunar | boolean | ❌ | 农历显示 |
| wallpaper | object | ❌ | 壁纸设置 |

---

### 3. 获取默认设置

**GET** `/api/v2/settings/default`

> 无需认证

---

### 4. 获取所有设置

**GET** `/api/v2/settings`

> 需要管理员权限

---

### 5. 更新设置

**PUT** `/api/v2/settings`

> 需要管理员权限

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | string | ✅ | 设置键 |
| value | any | ✅ | 设置值 |

---

### 6. 批量更新设置

**PUT** `/api/v2/settings/batch`

> 需要管理员权限

#### 请求示例

```json
{
  "settings": {
    "siteTitle": "NOWEN",
    "enableWeather": true
  }
}
```

---

### 7. 重置设置

**POST** `/api/v2/settings/reset`

> 需要管理员权限

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | string | ❌ | 指定键重置（不传则重置所有） |

---

## 📝 设置项说明

### 站点设置

| 键 | 类型 | 默认值 | 说明 |
|----|------|--------|------|
| siteTitle | string | "NOWEN" | 站点标题 |
| siteDescription | string | "" | 站点描述 |
| siteFavicon | string | "/favicon.ico" | 站点图标 |

### 功能开关

| 键 | 类型 | 默认值 | 说明 |
|----|------|--------|------|
| enableBeamAnimation | boolean | true | 光束动画效果 |
| enableLiteMode | boolean | false | 精简模式 |
| enableWeather | boolean | true | 天气组件 |
| enableLunar | boolean | true | 农历显示 |
| enableSearch | boolean | true | 搜索功能 |

### 外观设置

| 键 | 类型 | 默认值 | 说明 |
|----|------|--------|------|
| theme | string | "default" | 主题 |
| wallpaper.enabled | boolean | false | 启用壁纸 |
| wallpaper.source | string | "upload" | 壁纸来源(upload/url/preset) |
| wallpaper.imageData | string | "" | 上传图片的Base64数据 |
| wallpaper.imageUrl | string | "" | 图片URL地址 |
| wallpaper.blur | number | 0 | 模糊度(0-20) |
| wallpaper.overlay | number | 30 | 遮罩透明度(0-100) |

#### 壁纸设置详细说明

壁纸设置通过 `/api/v2/settings/site` 接口的 `wallpaper` 字段进行配置：

**请求示例 - 启用本地上传壁纸：**
```json
{
  "wallpaper": {
    "enabled": true,
    "source": "upload",
    "imageData": "data:image/jpeg;base64,/9j/4AAQ...",
    "blur": 5,
    "overlay": 40
  }
}
```

**请求示例 - 使用图片URL：**
```json
{
  "wallpaper": {
    "enabled": true,
    "source": "url",
    "imageUrl": "https://example.com/wallpaper.jpg",
    "blur": 0,
    "overlay": 30
  }
}
```

**请求示例 - 使用预设壁纸：**
```json
{
  "wallpaper": {
    "enabled": true,
    "source": "preset",
    "imageUrl": "/wallpapers/preset1.jpg",
    "blur": 2,
    "overlay": 25
  }
}
```

**注意事项：**
- `wallpaper` 字段在请求中需要作为 JSON 字符串发送，后端会自动解析
- 前端 SDK 中的 `updateSettings` 函数会自动处理对象到字符串的转换
- 获取设置时，`wallpaper` 字段会作为对象返回

### 系统设置

| 键 | 类型 | 默认值 | 说明 |
|----|------|--------|------|
| allowRegistration | boolean | true | 允许注册 |
| defaultVisibility | string | "personal" | 默认可见性 |
| sessionTimeout | number | 86400 | 会话超时（秒） |

## 💡 使用示例

### 获取站点设置

```bash
curl -X GET "http://localhost:3000/api/v2/settings/site"
```

### 更新站点标题

```bash
curl -X PUT "http://localhost:3000/api/v2/settings/site" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "siteTitle": "我的书签"
  }'
```

### 前端 SDK 使用示例

**获取站点设置（包含壁纸）：**
```typescript
import { fetchSettings } from '@/lib/api'

const settings = await fetchSettings()
console.log(settings.wallpaper)  // { enabled: true, source: 'upload', ... }
```

**更新壁纸设置：**
```typescript
import { updateSettings } from '@/lib/api'

// 启用壁纸并设置图片
await updateSettings({
  wallpaper: {
    enabled: true,
    source: 'upload',
    imageData: 'data:image/jpeg;base64,/9j/4AAQ...',
    blur: 5,
    overlay: 40
  }
})

// 禁用壁纸
await updateSettings({
  wallpaper: {
    enabled: false,
    source: 'upload',
    blur: 0,
    overlay: 30
  }
})
```

**使用壁纸模块 Hook：**
```typescript
import { useWallpaper } from '@/modules/wallpaper/hooks/useWallpaper'

function WallpaperSettings() {
  const { settings, setEnabled, uploadImage, setBlur, setOverlay } = useWallpaper()
  
  // 启用/禁用壁纸
  const toggleWallpaper = () => setEnabled(!settings.enabled)
  
  // 上传图片
  const handleUpload = async (file: File) => {
    await uploadImage(file)
  }
  
  return (
    // ...
  )
}
```
