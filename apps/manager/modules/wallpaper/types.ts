/**
 * 壁纸设置模块类型定义
 */

// 壁纸来源类型
export type WallpaperSource = 'upload' | 'url' | 'unsplash' | 'picsum' | 'pexels' | 'preset' | 'video' | 'gif'

// 壁纸显示模式
export type WallpaperMode = 'single' | 'slideshow' | 'dynamic' | 'daily'

// 壁纸填充模式
export type WallpaperFit = 'cover' | 'contain' | 'stretch' | 'tile' | 'center'

// 壁纸固定方式
export type WallpaperAttachment = 'fixed' | 'scroll'

// 颜色滤镜类型
export type ColorFilter = 'none' | 'grayscale' | 'sepia' | 'warm' | 'cool' | 'vintage' | 'noir'

// 渐变类型
export type GradientType = 'none' | 'linear' | 'radial' | 'angular'

// 定时切换类型
export type ScheduleType = 'interval' | 'timeOfDay' | 'sunriseSunset'

// 壁纸库项目
export interface WallpaperLibraryItem {
  id: string
  name: string
  url: string
  thumbnail: string
  source: WallpaperSource
  category: WallpaperCategory
  tags: string[]
  isFavorite: boolean
  createdAt: string
  usedAt?: string
  useCount: number
  fileSize?: number
  dimensions?: { width: number; height: number }
}

// 壁纸分类
export type WallpaperCategory = 'nature' | 'abstract' | 'city' | 'minimal' | 'dark' | 'anime' | 'scenery' | 'architecture' | 'space' | 'solar-term' | 'other'

// 轮播设置
export interface SlideshowSettings {
  enabled: boolean
  interval: number // 切换间隔（秒）
  transition: 'fade' | 'slide' | 'zoom' | 'blur' // 过渡效果
  transitionDuration: number // 过渡动画时长（毫秒）
  shuffle: boolean // 随机播放
  pauseOnHover: boolean // 悬停暂停
  wallpapers: string[] // 壁纸ID列表
}

// 动态壁纸设置
export interface DynamicWallpaperSettings {
  enabled: boolean
  videoUrl?: string
  gifUrl?: string
  muted: boolean
  playbackSpeed: number
}

// 每日壁纸设置
export interface DailyWallpaperSettings {
  enabled: boolean
  source: 'unsplash' | 'pexels' | 'picsum' | 'bing' | 'custom'
  category?: string
  keywords?: string[]
  updateTime: string // 每日更新时间 (HH:mm)
  saveToLibrary: boolean
}

// 显示设置
export interface DisplaySettings {
  fit: WallpaperFit
  attachment: WallpaperAttachment
  position: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

// 高级效果设置
export interface AdvancedEffects {
  // 暗角效果
  vignette: {
    enabled: boolean
    intensity: number // 0-100
    size: number // 0-100
  }
  // 颜色滤镜
  colorFilter: {
    enabled: boolean
    type: ColorFilter
    intensity: number // 0-100
  }
  // 渐变叠加
  gradient: {
    enabled: boolean
    type: GradientType
    angle: number // 0-360 (for linear)
    colors: { color: string; position: number }[]
    opacity: number // 0-100
  }
  // 粒子效果
  particles: {
    enabled: boolean
    type: 'snow' | 'rain' | 'bubbles' | 'stars' | 'fireflies'
    density: number // 0-100
    speed: number // 0-100
    color: string
  }
  // 动画效果
  animation: {
    enabled: boolean
    type: 'ken-burns' | 'parallax' | 'zoom' | 'pulse'
    speed: number // 0-100
  }
}

// 定时切换设置
export interface ScheduleSettings {
  enabled: boolean
  type: ScheduleType
  interval?: number // 分钟（用于interval模式）
  timeSlots?: { time: string; wallpaperId: string }[] // 时间段设置
  sunriseSunset?: {
    latitude: number
    longitude: number
    useCurrentLocation: boolean
    dawnWallpaper?: string
    dayWallpaper?: string
    duskWallpaper?: string
    nightWallpaper?: string
  }
}

// 预设壁纸
export interface PresetWallpaper {
  id: string
  name: string
  url: string
  thumbnail: string
  category: WallpaperCategory
  tags: string[]
  source: 'preset' | 'unsplash' | 'pexels'
}

// 别名导出（用于 API 客户端）
export type WallpaperPreset = PresetWallpaper

// 壁纸源类型
export type WallpaperProviderType = 'builtin' | 'api' | 'rss' | 'json' | 'html'

// 壁纸源配置
export interface WallpaperProvider {
  id: string
  name: string
  description?: string
  type: WallpaperProviderType
  enabled: boolean
  icon?: string
  
  // API 配置
  apiUrl?: string
  apiKey?: string
  
  // 请求配置
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  params?: Record<string, string>
  
  // 解析配置（用于非标准 API）
  parser?: {
    imageUrlPath: string // JSONPath 或字段路径，如 "images[0].url"
    titlePath?: string
    authorPath?: string
    thumbnailPath?: string
  }
  
  // 缓存配置
  cacheDuration?: number // 缓存时间（分钟）
  
  // 限制配置
  maxResults?: number
  
  // 元数据
  createdAt: string
  updatedAt: string
}

// 内置壁纸源预设
export interface BuiltinProviderPreset {
  id: string
  name: string
  description: string
  type: WallpaperProviderType
  icon: string
  defaultApiUrl: string
  defaultHeaders?: Record<string, string>
  defaultParams?: Record<string, string>
  defaultParser?: {
    imageUrlPath: string
    titlePath?: string
    authorPath?: string
  }
  documentationUrl?: string
}

// 从壁纸源获取的壁纸
export interface ProviderWallpaper {
  id: string
  url: string
  thumbnail?: string
  title?: string
  author?: string
  source: string // 来源 provider ID
  sourceUrl?: string // 原图链接
  createdAt: string
}

// 首页组件样式
export type HomeComponentStyle = 'default' | 'card' | 'minimal' | 'glass'

// 首页组件设置
export interface HomeComponentSettings {
  // 时间显示
  showTime: boolean
  timeFormat: '12h' | '24h'
  timeStyle: 'large' | 'medium' | 'small'
  
  // 日期显示
  showDate: boolean
  showLunar: boolean
  showFestival: boolean
  showJieQi: boolean
  
  // 天气显示
  showWeather: boolean
  weatherStyle: 'simple' | 'detailed' | 'icon-only'
  
  // 整体布局
  layout: 'vertical' | 'horizontal' | 'card'
  cardBackground: string
  cardOpacity: number // 0-100
  cardBlur: number // 0-20
  cardBorderRadius: string
}

// 24节气
export type SolarTerm = 
  | 'lichun' | 'yushui' | 'jingzhe' | 'chunfen' | 'qingming' | 'guyu'
  | 'lixia' | 'xiaoman' | 'mangzhong' | 'xiazhi' | 'xiaoshu' | 'dashu'
  | 'liqiu' | 'chushu' | 'bailu' | 'qiufen' | 'hanlu' | 'shuangjiang'
  | 'lidong' | 'xiaoxue' | 'daxue' | 'dongzhi' | 'xiaohan' | 'dahan'

// 节气背景设置
export interface SolarTermSettings {
  enabled: boolean
  autoSwitch: boolean
  wallpapers: Partial<Record<SolarTerm, string>> // 每个节气的背景图片
  customDates?: Partial<Record<SolarTerm, string>> // 自定义节气日期 (MM-DD)
  transition: 'fade' | 'slide' | 'zoom'
  transitionDuration: number
}

// 壁纸设置（完整版）
export interface WallpaperSettings {
  // 基础设置
  enabled: boolean
  mode: WallpaperMode
  source: WallpaperSource
  
  // 当前壁纸
  currentWallpaperId?: string
  imageData?: string | null
  imageUrl?: string | null
  presetId?: string | null
  videoUrl?: string
  gifUrl?: string
  
  // 基础效果
  blur: number
  overlay: number
  brightness: number // 亮度 50-150
  contrast: number // 对比度 50-150
  saturation: number // 饱和度 0-200
  
  // 显示设置
  display: DisplaySettings
  
  // 高级功能
  slideshow: SlideshowSettings
  dynamic: DynamicWallpaperSettings
  daily: DailyWallpaperSettings
  effects: AdvancedEffects
  schedule: ScheduleSettings
  
  // 首页组件
  homeComponent: HomeComponentSettings
  
  // 24节气背景
  solarTerm: SolarTermSettings
  
  // 多屏支持
  multiScreen: {
    enabled: boolean
    screens: { screenId: number; wallpaperId: string; span: boolean }[]
  }
}

// 上传结果
export interface UploadResult {
  url: string
  success: boolean
  message?: string
  id?: string
}

// 壁纸操作结果
export interface WallpaperOperationResult {
  success: boolean
  message?: string
  data?: Partial<WallpaperSettings>
}

// 壁纸库筛选条件
export interface WallpaperFilter {
  category?: WallpaperCategory
  tags?: string[]
  source?: WallpaperSource
  isFavorite?: boolean
  searchQuery?: string
  sortBy: 'newest' | 'oldest' | 'mostUsed' | 'lastUsed' | 'name'
}

// API 响应类型
export interface UnsplashPhoto {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  alt_description: string
  description: string
  user: {
    name: string
    username: string
  }
  width: number
  height: number
}

export interface PexelsPhoto {
  id: number
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    portrait: string
    landscape: string
    tiny: string
  }
  photographer: string
  width: number
  height: number
  url: string
}

// 日出日落时间
export interface SunTimes {
  sunrise: Date
  sunset: Date
  dawn: Date
  dusk: Date
  solarNoon: Date
}
