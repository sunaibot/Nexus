# 壁纸管理数据库文档

## 概述

壁纸管理模块支持以下核心功能：
- 壁纸库管理（上传、分类、收藏、使用记录）
- 多种壁纸模式（单张、轮播、动态、每日）
- 高级视觉效果（暗角、滤镜、渐变、粒子、动画）
- 定时切换（间隔、时间段、日出日落）
- 多屏显示支持

## 数据库表结构

### 1. wallpaper_library - 壁纸库表

存储用户上传和保存的壁纸。

```sql
CREATE TABLE wallpaper_library (
  id TEXT PRIMARY KEY,                    -- 壁纸唯一标识
  name TEXT NOT NULL,                     -- 壁纸名称
  url TEXT NOT NULL,                      -- 壁纸URL
  thumbnail TEXT NOT NULL,                -- 缩略图URL
  source TEXT NOT NULL DEFAULT 'upload',  -- 来源: upload/url/unsplash/pexels/preset
  category TEXT DEFAULT 'other',          -- 分类: nature/abstract/city/minimal/dark/anime/scenery/architecture/space/other
  tags TEXT DEFAULT '[]',                 -- 标签JSON数组
  is_favorite INTEGER DEFAULT 0,          -- 是否收藏 (0/1)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
  used_at TEXT,                           -- 最后使用时间
  use_count INTEGER DEFAULT 0,            -- 使用次数
  file_size INTEGER,                      -- 文件大小(字节)
  width INTEGER,                          -- 图片宽度
  height INTEGER                          -- 图片高度
);
```

**索引建议：**
```sql
CREATE INDEX idx_wallpaper_category ON wallpaper_library(category);
CREATE INDEX idx_wallpaper_favorite ON wallpaper_library(is_favorite);
CREATE INDEX idx_wallpaper_created ON wallpaper_library(created_at);
CREATE INDEX idx_wallpaper_used ON wallpaper_library(used_at);
```

### 2. settings - 站点设置表

壁纸设置存储在站点设置的 `wallpaper` 字段中（JSON格式）。

```sql
-- 壁纸设置作为JSON存储在settings表中
INSERT INTO settings (key, value) VALUES ('site_settings', '{
  "wallpaper": {
    "enabled": true,
    "mode": "slideshow",
    "source": "preset",
    "imageUrl": "https://example.com/wallpaper.jpg",
    "blur": 5,
    "overlay": 20,
    "brightness": 110,
    "contrast": 105,
    "saturation": 100,
    "display": {
      "fit": "cover",
      "attachment": "fixed",
      "position": "center"
    },
    "slideshow": {
      "enabled": true,
      "interval": 300,
      "transition": "fade",
      "transitionDuration": 1500,
      "shuffle": true,
      "pauseOnHover": true,
      "wallpapers": ["wp1", "wp2", "wp3"]
    },
    "dynamic": {
      "enabled": false,
      "muted": true,
      "playbackSpeed": 1
    },
    "daily": {
      "enabled": false,
      "source": "unsplash",
      "category": "nature",
      "keywords": ["landscape", "mountain"],
      "updateTime": "08:00",
      "saveToLibrary": true
    },
    "effects": {
      "vignette": {
        "enabled": true,
        "intensity": 40,
        "color": "#000000"
      },
      "colorFilter": {
        "enabled": false,
        "type": "none",
        "intensity": 50
      },
      "gradient": {
        "enabled": false,
        "type": "linear",
        "angle": 180,
        "colors": [{"color": "#000000", "position": 0}, {"color": "transparent", "position": 100}],
        "opacity": 30
      },
      "particles": {
        "enabled": true,
        "type": "snow",
        "density": 30,
        "speed": 40,
        "color": "#ffffff"
      },
      "animation": {
        "enabled": false,
        "type": "ken-burns",
        "speed": 50
      }
    },
    "schedule": {
      "enabled": false,
      "type": "interval",
      "interval": 60,
      "timeSlots": [
        {"time": "08:00", "wallpaperId": "morning"},
        {"time": "18:00", "wallpaperId": "evening"}
      ],
      "sunriseSunset": {
        "latitude": 39.9042,
        "longitude": 116.4074,
        "useCurrentLocation": true,
        "dawnWallpaper": "dawn",
        "dayWallpaper": "day",
        "duskWallpaper": "dusk",
        "nightWallpaper": "night"
      }
    },
    "multiScreen": {
      "enabled": false,
      "screens": [
        {"screenId": 0, "wallpaperId": "wp1", "span": false}
      ]
    }
  }
}');
```

## 壁纸设置字段详解

### 基础设置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| enabled | boolean | false | 是否启用壁纸 |
| mode | string | 'single' | 显示模式: single/slideshow/dynamic/daily |
| source | string | 'upload' | 来源: upload/url/unsplash/pexels/preset/video/gif |
| currentWallpaperId | string | - | 当前壁纸ID（引用壁纸库） |
| imageUrl | string | - | 当前图片URL |
| videoUrl | string | - | 视频壁纸URL |
| gifUrl | string | - | GIF壁纸URL |

### 基础效果

| 字段 | 类型 | 范围 | 默认值 | 说明 |
|------|------|------|--------|------|
| blur | number | 0-20 | 0 | 模糊度(px) |
| overlay | number | 0-100 | 0 | 遮罩不透明度(%) |
| brightness | number | 50-150 | 100 | 亮度(%) |
| contrast | number | 50-150 | 100 | 对比度(%) |
| saturation | number | 0-200 | 100 | 饱和度(%) |

### 显示设置 (display)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fit | string | 'cover' | 填充模式: cover/contain/stretch/tile/center |
| attachment | string | 'fixed' | 背景固定: fixed/scroll |
| position | string | 'center' | 背景位置: center/top/bottom/left/right |

### 轮播设置 (slideshow)

| 字段 | 类型 | 范围 | 默认值 | 说明 |
|------|------|------|--------|------|
| enabled | boolean | - | false | 是否启用轮播 |
| interval | number | 10-3600 | 60 | 切换间隔(秒) |
| transition | string | - | 'fade' | 过渡效果: fade/slide/zoom/blur |
| transitionDuration | number | 100-5000 | 1000 | 过渡时长(ms) |
| shuffle | boolean | - | false | 是否随机播放 |
| pauseOnHover | boolean | - | true | 悬停时暂停 |
| wallpapers | string[] | - | [] | 轮播壁纸ID列表 |

### 动态壁纸设置 (dynamic)

| 字段 | 类型 | 范围 | 默认值 | 说明 |
|------|------|------|--------|------|
| enabled | boolean | - | false | 是否启用动态壁纸 |
| muted | boolean | - | true | 是否静音 |
| playbackSpeed | number | 0.25-2 | 1 | 播放速度 |

### 每日壁纸设置 (daily)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| enabled | boolean | false | 是否启用每日壁纸 |
| source | string | 'unsplash' | 图片来源: unsplash/pexels/picsum/bing |
| category | string | - | 图片分类/主题 |
| keywords | string[] | - | 搜索关键词数组 |
| updateTime | string | '08:00' | 每日更新时间 (HH:mm) |
| saveToLibrary | boolean | true | 是否保存到壁纸库 |

### 高级效果 (effects)

#### 暗角效果 (vignette)
| 字段 | 类型 | 范围 | 默认值 | 说明 |
|------|------|------|--------|------|
| enabled | boolean | - | false | 是否启用 |
| intensity | number | 0-100 | 30 | 强度(%) |
| color | string | - | '#000000' | 暗角颜色 |

#### 颜色滤镜 (colorFilter)
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| enabled | boolean | false | 是否启用 |
| type | string | 'none' | 滤镜类型: none/grayscale/sepia/warm/cool/vintage/noir |
| intensity | number | 0-100 | 50 | 强度(%) |

#### 渐变叠加 (gradient)
| 字段 | 类型 | 范围 | 默认值 | 说明 |
|------|------|------|--------|------|
| enabled | boolean | - | false | 是否启用 |
| type | string | 'linear' | 渐变类型: none/linear/radial/angular |
| angle | number | 0-360 | 180 | 角度(线性渐变) |
| colors | array | - | - | 渐变颜色数组 [{color, position}] |
| opacity | number | 0-100 | 30 | 不透明度(%) |

#### 粒子效果 (particles)
| 字段 | 类型 | 范围 | 默认值 | 说明 |
|------|------|------|--------|------|
| enabled | boolean | - | false | 是否启用 |
| type | string | 'snow' | 粒子类型: snow/rain/bubbles/stars/fireflies |
| density | number | 0-100 | 50 | 密度 |
| speed | number | 0-100 | 50 | 速度 |
| color | string | - | '#ffffff' | 粒子颜色 |

#### 动画效果 (animation)
| 字段 | 类型 | 范围 | 默认值 | 说明 |
|------|------|------|--------|------|
| enabled | boolean | - | false | 是否启用 |
| type | string | 'ken-burns' | 动画类型: ken-burns/parallax/zoom/pulse |
| speed | number | 0-100 | 50 | 速度 |

### 定时切换 (schedule)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| enabled | boolean | false | 是否启用定时切换 |
| type | string | 'interval' | 定时类型: interval/timeOfDay/sunriseSunset |
| interval | number | 60 | 间隔分钟数（interval模式） |
| timeSlots | array | - | 时间段设置 [{time, wallpaperId}] |

#### 日出日落设置 (sunriseSunset)
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| latitude | number | - | 纬度 |
| longitude | number | - | 经度 |
| useCurrentLocation | boolean | true | 使用当前位置 |
| dawnWallpaper | string | - | 黎明壁纸ID |
| dayWallpaper | string | - | 白天壁纸ID |
| duskWallpaper | string | - | 黄昏壁纸ID |
| nightWallpaper | string | - | 夜晚壁纸ID |

### 多屏显示 (multiScreen)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| enabled | boolean | false | 是否启用多屏 |
| screens | array | - | 屏幕配置 [{screenId, wallpaperId, span}] |

## API 端点

详见 API 文档 `/api/v2/docs` 中的"壁纸管理"模块。

主要端点：
- `GET /api/v2/wallpaper/library` - 获取壁纸库列表
- `POST /api/v2/wallpaper/library` - 添加壁纸到库
- `PUT /api/v2/wallpaper/library/:id` - 更新壁纸信息
- `DELETE /api/v2/wallpaper/library/:id` - 删除壁纸
- `POST /api/v2/wallpaper/library/:id/use` - 记录壁纸使用
- `POST /api/v2/wallpaper/library/:id/favorite` - 切换收藏状态
- `GET /api/v2/wallpaper/presets` - 获取预设壁纸列表
- `GET /api/v2/wallpaper/daily` - 获取每日壁纸
- `GET /api/v2/settings/site` - 获取站点设置（包含壁纸设置）
- `PUT /api/v2/settings/site` - 更新站点设置（包含壁纸设置）

## 数据迁移

从旧版本迁移壁纸数据：

```sql
-- 将旧版壁纸数据迁移到新版壁纸库表
INSERT INTO wallpaper_library (id, name, url, thumbnail, source, category, created_at)
SELECT 
  id,
  COALESCE(name, '未命名壁纸'),
  url,
  COALESCE(thumbnail, url),
  COALESCE(source, 'upload'),
  COALESCE(category, 'other'),
  COALESCE(created_at, datetime('now'))
FROM old_wallpapers;
```

## 备份与恢复

备份壁纸库：
```bash
# 导出壁纸库数据
sqlite3 database.db ".dump wallpaper_library" > wallpaper_backup.sql

# 导出站点设置（包含壁纸设置）
sqlite3 database.db "SELECT value FROM settings WHERE key = 'site_settings'" > site_settings_backup.json
```

恢复壁纸库：
```bash
# 导入壁纸库数据
sqlite3 database.db < wallpaper_backup.sql

# 恢复站点设置
sqlite3 database.db "UPDATE settings SET value = '$(cat site_settings_backup.json)' WHERE key = 'site_settings'"
```
