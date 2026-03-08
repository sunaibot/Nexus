'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe,
  Gauge,
  Shield,
  Database,
  ChevronRight,
  Check,
  Sparkles,
  Monitor,
  Sun,
  Type,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Info,
  Upload,
  Link,
  Network,
  Settings2,
  FileText,
  Bell
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../../components/admin/Toast'
import { themes, useTheme } from '../../../hooks/useTheme'
import { cn } from '../../../lib/utils'
import { fetchSettings, updateSettings, type SiteSettings, factoryReset, clearAuthStatus, adminChangePassword, adminChangeUsername, exportData, importData } from '../../../lib/api'

// 设置模块类型
 type SettingsModule = 'site' | 'widget' | 'network' | 'security' | 'data' | 'advanced'

// 模块配置
const modules = [
  {
    id: 'site' as SettingsModule,
    title: '站点配置',
    desc: '网站标题、图标、动画',
    icon: Globe,
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'from-cyan-500/10 to-blue-500/10'
  },
  {
    id: 'widget' as SettingsModule,
    title: '系统状态',
    desc: '仪表显示、组件控制',
    icon: Gauge,
    color: 'from-sky-500 to-violet-500',
    bgColor: 'from-sky-500/10 to-violet-500/10'
  },
  {
    id: 'network' as SettingsModule,
    title: '网络环境',
    desc: '内网检测、域名配置',
    icon: Network,
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'from-indigo-500/10 to-purple-500/10'
  },
  {
    id: 'security' as SettingsModule,
    title: '安全设置',
    desc: '密码管理、账户安全',
    icon: Shield,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'from-amber-500/10 to-orange-500/10'
  },
  {
    id: 'data' as SettingsModule,
    title: '数据管理',
    desc: '导入导出、恢复备份',
    icon: Database,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'from-emerald-500/10 to-teal-500/10'
  },
  {
    id: 'advanced' as SettingsModule,
    title: '高级配置',
    desc: '系统参数、安全配置',
    icon: Settings2,
    color: 'from-rose-500 to-pink-500',
    bgColor: 'from-rose-500/10 to-pink-500/10'
  }
]

// 实时预览组件
function LivePreview({ settings }: { settings: Partial<SiteSettings> }) {
  const { themeId } = useTheme()
  const theme = themes[themeId]

  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.bgSecondary}, ${theme.colors.bgTertiary})`,
        border: `1px solid ${theme.colors.glassBorder}`
      }}
    >
      {/* 预览标题 */}
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4" style={{ color: theme.colors.textMuted }} />
        <span className="text-sm font-medium" style={{ color: theme.colors.textMuted }}>
          实时预览
        </span>
      </div>

      {/* 模拟前台界面 */}
      <div
        className="rounded-xl p-4 relative overflow-hidden"
        style={{
          background: theme.colors.bgPrimary,
          border: `1px solid ${theme.colors.border}`
        }}
      >
        {/* 模拟导航栏 */}
        <div className="flex items-center justify-between mb-4 pb-3 relative z-10" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center gap-2">
            {settings.siteFavicon ? (
              <img src={settings.siteFavicon} alt="" className="w-6 h-6 rounded" />
            ) : (
              <div
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ background: theme.colors.glass }}
              >
                <Sparkles className="w-3 h-3" style={{ color: theme.colors.primary }} />
              </div>
            )}
            <span className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
              {settings.siteTitle || 'Nexus'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {settings.menuVisibility?.languageToggle && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: theme.colors.glass, color: theme.colors.textSecondary }}>
                EN/中
              </span>
            )}
            {settings.menuVisibility?.themeToggle && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: theme.colors.glass, color: theme.colors.textSecondary }}>
                {theme.mode === 'dark' ? <Sun className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
              </span>
            )}
          </div>
        </div>

        {/* 模拟主内容 */}
        <div className="text-center py-6 relative z-10">
          {/* 光束动画效果 */}
          {settings.enableBeamAnimation && (
            <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
              <div 
                className="absolute top-0 left-1/4 w-px h-full opacity-30"
                style={{ background: `linear-gradient(to bottom, transparent, ${theme.colors.primary}, transparent)` }}
              />
              <div 
                className="absolute top-0 right-1/3 w-px h-full opacity-20"
                style={{ background: `linear-gradient(to bottom, transparent, ${theme.colors.accent}, transparent)` }}
              />
            </div>
          )}
          
          <h1
            className="text-xl font-bold mb-2 relative"
            style={{
              background: settings.enableBeamAnimation ? `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.accent})` : 'transparent',
              WebkitBackgroundClip: settings.enableBeamAnimation ? 'text' : 'unset',
              WebkitTextFillColor: settings.enableBeamAnimation ? 'transparent' : 'unset',
              color: settings.enableBeamAnimation ? 'transparent' : theme.colors.textPrimary
            }}
          >
            {settings.siteTitle || 'Nexus'}
          </h1>
          <p className="text-xs" style={{ color: theme.colors.textMuted }}>
            {settings.siteDescription || '探索精选网站导航'}
          </p>
          
          {/* 天气和农历显示 */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {settings.enableWeather && (
              <div className="flex items-center gap-1 text-xs" style={{ color: theme.colors.textSecondary }}>
                <Sun className="w-3 h-3" />
                <span>24°C 晴</span>
              </div>
            )}
            {settings.enableLunar && (
              <div className="text-xs" style={{ color: theme.colors.textMuted }}>
                农历正月初一
              </div>
            )}
          </div>
        </div>

        {/* 模拟底部 */}
        {settings.footerInfo && (
          <div
            className="mt-4 pt-3 text-center text-[10px] border-t relative z-10"
            style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
          >
            {settings.footerInfo}
          </div>
        )}
      </div>
    </div>
  )
}

// 预设图标列表
const presetFavicons = [
  {
    id: 'default',
    name: '默认图标',
    url: '/favicon.svg'
  },
  {
    id: 'n-letter',
    name: 'N字母',
    url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%234F46E5" width="100" height="100" rx="20"/><text x="50" y="70" font-size="60" fill="white" text-anchor="middle" font-family="Arial">N</text></svg>'
  },
  {
    id: 'globe',
    name: '地球',
    url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%2310B981" width="100" height="100" rx="20"/><circle cx="50" cy="50" r="30" fill="none" stroke="white" stroke-width="4"/><ellipse cx="50" cy="50" rx="30" ry="12" fill="none" stroke="white" stroke-width="3"/><line x1="50" y1="20" x2="50" y2="80" stroke="white" stroke-width="3"/></svg>'
  },
  {
    id: 'star',
    name: '星星',
    url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23F59E0B" width="100" height="100" rx="20"/><polygon points="50,15 61,40 88,40 66,57 74,82 50,67 26,82 34,57 12,40 39,40" fill="white"/></svg>'
  },
  {
    id: 'bookmark',
    name: '书签',
    url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23EC4899" width="100" height="100" rx="20"/><path d="M30 25 L70 25 L70 75 L50 60 L30 75 Z" fill="white"/></svg>'
  },
  {
    id: 'rocket',
    name: '火箭',
    url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%233B82F6" width="100" height="100" rx="20"/><path d="M50 15 Q65 35 65 55 Q65 65 50 70 Q35 65 35 55 Q35 35 50 15" fill="white"/><circle cx="50" cy="45" r="8" fill="%233B82F6"/><path d="M35 60 L25 80 L35 75 L40 65" fill="white"/><path d="M65 60 L75 80 L65 75 L60 65" fill="white"/></svg>'
  }
]

// 站点配置模块
function SiteConfigModule({
  settings,
  onChange
}: {
  settings: Partial<SiteSettings>
  onChange: (key: keyof SiteSettings, value: any) => void
}) {
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.ico']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      showToast('error', '不支持的文件格式，请上传 PNG、JPG、SVG 或 ICO 格式的图片')
      return
    }

    // 验证文件大小 (最大 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', '文件大小不能超过 2MB')
      return
    }

    // 模拟上传
    const reader = new FileReader()
    reader.onload = (event) => {
      onChange('siteFavicon', event.target?.result as string)
      showToast('success', '图标已上传')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      {/* 站点标题 */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          站点标题
        </label>
        <input
          type="text"
          value={settings.siteTitle || ''}
          onChange={(e) => onChange('siteTitle', e.target.value)}
          placeholder="请输入站点标题"
          className="w-full px-4 py-3 rounded-xl border bg-transparent transition-all"
          style={{
            borderColor: 'var(--color-glass-border)',
            color: 'var(--color-text-primary)'
          }}
        />
      </div>

      {/* 站点描述 */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          站点描述
        </label>
        <input
          type="text"
          value={settings.siteDescription || ''}
          onChange={(e) => onChange('siteDescription', e.target.value)}
          placeholder="请输入站点描述"
          className="w-full px-4 py-3 rounded-xl border bg-transparent transition-all"
          style={{
            borderColor: 'var(--color-glass-border)',
            color: 'var(--color-text-primary)'
          }}
        />
      </div>

      {/* 站点图标 */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          站点图标
        </label>
        
        {/* 预设图标选择 */}
        <div className="mb-4">
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>预设图标</p>
          <div className="flex gap-2 flex-wrap">
            {presetFavicons.map((favicon) => (
              <motion.button
                key={favicon.id}
                onClick={() => onChange('siteFavicon', favicon.url)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${
                  settings.siteFavicon === favicon.url ? 'border-blue-500 ring-2 ring-blue-500/30' : ''
                }`}
                style={{ 
                  borderColor: settings.siteFavicon === favicon.url ? 'var(--color-primary)' : 'var(--color-glass-border)',
                  background: 'var(--color-glass)'
                }}
                title={favicon.name}
              >
                <img src={favicon.url} alt={favicon.name} className="w-8 h-8 rounded" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* 上传区域 */}
        <div className="flex gap-4">
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 p-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-all"
            style={{ borderColor: 'var(--color-glass-border)' }}
          >
            <Upload className="w-6 h-6" style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              点击上传图标
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              支持 PNG、JPG、SVG、ICO 格式
            </span>
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg,.ico,image/png,image/jpeg,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
            onChange={handleFileUpload}
            className="hidden"
          />
          {settings.siteFavicon && (
            <div
              className="w-24 h-24 rounded-xl flex items-center justify-center relative group"
              style={{ background: 'var(--color-glass)' }}
            >
              <img src={settings.siteFavicon} alt="" className="w-16 h-16 rounded-lg" />
              <button
                onClick={() => onChange('siteFavicon', '')}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          )}
        </div>
        <input
          type="text"
          value={settings.siteFavicon || ''}
          onChange={(e) => onChange('siteFavicon', e.target.value)}
          placeholder="或输入图标 URL"
          className="w-full mt-3 px-4 py-2 rounded-xl border bg-transparent text-sm"
          style={{
            borderColor: 'var(--color-glass-border)',
            color: 'var(--color-text-primary)'
          }}
        />
      </div>

      {/* 功能开关 */}
      <div className="space-y-4">
        <ToggleItem
          icon={Sparkles}
          title="光束动画"
          desc="背景光束效果"
          checked={settings.enableBeamAnimation || false}
          onChange={(v) => onChange('enableBeamAnimation', v)}
        />
        <ToggleItem
          icon={Monitor}
          title="精简模式"
          desc="性能优先 (Lite)，关闭所有耗能特效"
          checked={settings.enableLiteMode || false}
          onChange={(v) => onChange('enableLiteMode', v)}
        />
        <ToggleItem
          icon={Sun}
          title="天气显示"
          desc="在首页显示当前位置的天气信息"
          checked={settings.enableWeather || false}
          onChange={(v) => onChange('enableWeather', v)}
        />
        <ToggleItem
          icon={Type}
          title="农历显示"
          desc="在日期旁显示农历、节气和传统节日"
          checked={settings.enableLunar || false}
          onChange={(v) => onChange('enableLunar', v)}
        />
        <ToggleItem
          icon={Globe}
          title="多语言切换"
          desc="在前台菜单栏显示中英文切换按钮"
          checked={settings.menuVisibility?.languageToggle || false}
          onChange={(v) => onChange('menuVisibility', { 
            ...settings.menuVisibility, 
            languageToggle: v 
          })}
        />
        <ToggleItem
          icon={Eye}
          title="主题切换"
          desc="在前台菜单栏显示日间/夜间模式切换按钮"
          checked={settings.menuVisibility?.themeToggle || false}
          onChange={(v) => onChange('menuVisibility', { 
            ...settings.menuVisibility, 
            themeToggle: v 
          })}
        />
      </div>

      {/* 底部备案信息 */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          底部备案信息
        </label>
        <textarea
          value={settings.footerInfo || ''}
          onChange={(e) => onChange('footerInfo', e.target.value)}
          placeholder="例如：京ICP备XXXXXXXX号-1 | 京公网安备XXXXXXXXXXXXXXX号&#10;支持 HTML 格式，留空则不显示"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border bg-transparent transition-all resize-none"
          style={{
            borderColor: 'var(--color-glass-border)',
            color: 'var(--color-text-primary)'
          }}
        />
      </div>
    </div>
  )
}

// 开关项组件
function ToggleItem({
  icon: Icon,
  title,
  desc,
  checked,
  onChange
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  title: string
  desc: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all"
      style={{ background: 'var(--color-glass)' }}
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--color-bg-tertiary)' }}
        >
          <Icon className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {desc}
          </div>
        </div>
      </div>
      <div
        className={cn(
          'w-12 h-6 rounded-full transition-all relative',
          checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-glass-border)]'
        )}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white"
          animate={{ left: checked ? '28px' : '4px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </div>
  )
}

// 系统状态模块
function WidgetModule({
  settings,
  onChange
}: {
  settings: Partial<SiteSettings>
  onChange: (key: keyof SiteSettings, value: any) => void
}) {
  const visibility = settings.widgetVisibility || {}

  return (
    <div className="space-y-4">
      <ToggleItem
        icon={Monitor}
        title="系统监控"
        desc="显示 CPU、内存、网络等实时数据"
        checked={visibility.systemMonitor ?? false}
        onChange={(v) => onChange('widgetVisibility', { ...visibility, systemMonitor: v })}
      />
      <ToggleItem
        icon={Gauge}
        title="硬件信息"
        desc="显示设备型号和硬件规格"
        checked={visibility.hardwareIdentity ?? false}
        onChange={(v) => onChange('widgetVisibility', { ...visibility, hardwareIdentity: v })}
      />
      <ToggleItem
        icon={Info}
        title="生命体征"
        desc="显示系统运行时间和健康度"
        checked={visibility.vitalSigns ?? false}
        onChange={(v) => onChange('widgetVisibility', { ...visibility, vitalSigns: v })}
      />
      <ToggleItem
        icon={Link}
        title="网络遥测"
        desc="显示网络延迟和连接状态"
        checked={visibility.networkTelemetry ?? false}
        onChange={(v) => onChange('widgetVisibility', { ...visibility, networkTelemetry: v })}
      />
    </div>
  )
}

// 网络环境配置模块
function NetworkConfigModule({
  settings,
  onChange
}: {
  settings: Partial<SiteSettings>
  onChange: (key: keyof SiteSettings, value: any) => void
}) {
  const networkEnv = settings.networkEnv || {
    internalSuffixes: ['.local', '.lan', '.internal', '.corp', '.home'],
    internalIPs: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
    localhostNames: ['localhost', '127.0.0.1', '[::1]'],
  }

  const updateNetworkEnv = (key: keyof typeof networkEnv, value: string[]) => {
    onChange('networkEnv', { ...networkEnv, [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* 内网域名后缀 */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          内网域名后缀
        </label>
        <textarea
          value={networkEnv.internalSuffixes.join('\n')}
          onChange={(e) => updateNetworkEnv('internalSuffixes', e.target.value.split('\n').filter(s => s.trim()))}
          placeholder=".local&#10;.lan&#10;.internal"
          rows={5}
          className="w-full px-4 py-3 rounded-xl border bg-transparent transition-all resize-none font-mono text-sm"
          style={{
            borderColor: 'var(--color-glass-border)',
            color: 'var(--color-text-primary)'
          }}
        />
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          每行一个后缀，用于识别内网域名（如 .local, .lan）
        </p>
      </div>

      {/* 内网IP段 */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          内网IP段
        </label>
        <textarea
          value={networkEnv.internalIPs.join('\n')}
          onChange={(e) => updateNetworkEnv('internalIPs', e.target.value.split('\n').filter(s => s.trim()))}
          placeholder="10.0.0.0/8&#10;172.16.0.0/12&#10;192.168.0.0/16"
          rows={5}
          className="w-full px-4 py-3 rounded-xl border bg-transparent transition-all resize-none font-mono text-sm"
          style={{
            borderColor: 'var(--color-glass-border)',
            color: 'var(--color-text-primary)'
          }}
        />
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          每行一个CIDR格式的IP段，用于识别内网IP地址
        </p>
      </div>

      {/* localhost别名 */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          localhost别名
        </label>
        <textarea
          value={networkEnv.localhostNames.join('\n')}
          onChange={(e) => updateNetworkEnv('localhostNames', e.target.value.split('\n').filter(s => s.trim()))}
          placeholder="localhost&#10;127.0.0.1&#10;[::1]"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border bg-transparent transition-all resize-none font-mono text-sm"
          style={{
            borderColor: 'var(--color-glass-border)',
            color: 'var(--color-text-primary)'
          }}
        />
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          每行一个localhost别名，用于识别本地开发环境
        </p>
      </div>

      {/* 说明 */}
      <div className="p-4 rounded-xl" style={{ background: 'var(--color-glass)' }}>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <p className="mb-2">这些配置用于自动检测当前网络环境是否为内网：</p>
            <ul className="list-disc list-inside space-y-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <li>当访问的域名匹配上述后缀时，自动切换到内网模式</li>
              <li>内网模式下，书签会优先显示内网链接（如果配置了）</li>
              <li>修改后需要刷新前台页面才能生效</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// 安全设置模块
function SecurityModule() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // 修改用户名相关状态
  const [usernameCurrentPassword, setUsernameCurrentPassword] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [showUsernamePassword, setShowUsernamePassword] = useState(false)
  const [currentUsername, setCurrentUsername] = useState('')
  
  const { showToast } = useToast()
  
  // 获取当前用户名
  useEffect(() => {
    const username = localStorage.getItem('admin_username') || ''
    setCurrentUsername(username)
    setNewUsername(username)
  }, [])

  // 私密密码相关状态
  const [privatePasswordStatus, setPrivatePasswordStatus] = useState<{ hasPassword: boolean; isEnabled: boolean } | null>(null)
  const [isLoadingPrivatePassword, setIsLoadingPrivatePassword] = useState(false)
  const [privatePasswordError, setPrivatePasswordError] = useState<string | null>(null)
  const [privatePasswordSuccess, setPrivatePasswordSuccess] = useState(false)
  const [privatePasswordMode, setPrivatePasswordMode] = useState<'set' | 'update' | 'delete' | null>(null)
  const [privateNewPassword, setPrivateNewPassword] = useState('')
  const [privateConfirmPassword, setPrivateConfirmPassword] = useState('')
  const [privateOldPassword, setPrivateOldPassword] = useState('')
  const [showPrivatePassword, setShowPrivatePassword] = useState(false)

  const API_BASE_URL = '/api'
  const getAuthToken = () => localStorage.getItem('token')

  // 获取私密密码状态
  const fetchPrivatePasswordStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/v2/users/me/private-password/status`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken() || ''}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setPrivatePasswordStatus(data.data)
      }
    } catch (error) {
      console.error('获取私密密码状态失败:', error)
    }
  }

  useEffect(() => {
    fetchPrivatePasswordStatus()
  }, [])

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast('error', '两次输入的密码不一致')
      return
    }
    if (newPassword.length < 6) {
      showToast('error', '密码长度至少6位')
      return
    }
    if (!currentPassword) {
      showToast('error', '请输入当前密码')
      return
    }
    try {
      await adminChangePassword(currentPassword, newPassword)
      showToast('success', '密码修改成功')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      showToast('error', err.message || '密码修改失败')
    }
  }

  // 修改用户名
  const handleChangeUsername = async () => {
    if (!newUsername.trim()) {
      showToast('error', '用户名不能为空')
      return
    }
    if (newUsername.length < 2) {
      showToast('error', '用户名至少2个字符')
      return
    }
    if (newUsername === currentUsername) {
      showToast('error', '新用户名不能与当前用户名相同')
      return
    }
    if (!usernameCurrentPassword) {
      showToast('error', '请输入当前密码')
      return
    }
    try {
      const result = await adminChangeUsername(usernameCurrentPassword, newUsername.trim())
      showToast('success', '用户名修改成功')
      // 更新本地存储的用户名
      localStorage.setItem('admin_username', result.newUsername || newUsername)
      setCurrentUsername(result.newUsername || newUsername)
      setUsernameCurrentPassword('')
    } catch (err: any) {
      showToast('error', err.message || '用户名修改失败')
    }
  }

  // 设置私密密码
  const handleSetPrivatePassword = async () => {
    if (privateNewPassword.length < 4) {
      setPrivatePasswordError('密码长度至少为4位')
      return
    }
    if (privateNewPassword !== privateConfirmPassword) {
      setPrivatePasswordError('两次输入的密码不一致')
      return
    }

    setIsLoadingPrivatePassword(true)
    setPrivatePasswordError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/v2/users/me/private-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken() || ''}`,
        },
        body: JSON.stringify({ password: privateNewPassword }),
      })
      const data = await response.json()
      if (data.success) {
        setPrivatePasswordSuccess(true)
        setPrivatePasswordMode(null)
        setPrivateNewPassword('')
        setPrivateConfirmPassword('')
        await fetchPrivatePasswordStatus()
        showToast('success', '私密密码设置成功')
      } else {
        throw new Error(data.error || '设置失败')
      }
    } catch (err: any) {
      setPrivatePasswordError(err.message || '设置失败')
    } finally {
      setIsLoadingPrivatePassword(false)
    }
  }

  // 更新私密密码
  const handleUpdatePrivatePassword = async () => {
    if (privateNewPassword.length < 4) {
      setPrivatePasswordError('新密码长度至少为4位')
      return
    }
    if (privateNewPassword !== privateConfirmPassword) {
      setPrivatePasswordError('两次输入的新密码不一致')
      return
    }

    setIsLoadingPrivatePassword(true)
    setPrivatePasswordError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/v2/users/me/private-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken() || ''}`,
        },
        body: JSON.stringify({ oldPassword: privateOldPassword, newPassword: privateNewPassword }),
      })
      const data = await response.json()
      if (data.success) {
        setPrivatePasswordSuccess(true)
        setPrivatePasswordMode(null)
        setPrivateOldPassword('')
        setPrivateNewPassword('')
        setPrivateConfirmPassword('')
        await fetchPrivatePasswordStatus()
        showToast('success', '私密密码更新成功')
      } else {
        throw new Error(data.error || '更新失败')
      }
    } catch (err: any) {
      setPrivatePasswordError(err.message || '更新失败')
    } finally {
      setIsLoadingPrivatePassword(false)
    }
  }

  // 删除私密密码
  const handleDeletePrivatePassword = async () => {
    if (!privateOldPassword) {
      setPrivatePasswordError('请输入当前密码')
      return
    }

    setIsLoadingPrivatePassword(true)
    setPrivatePasswordError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/v2/users/me/private-password`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken() || ''}`,
        },
        body: JSON.stringify({ password: privateOldPassword }),
      })
      const data = await response.json()
      if (data.success) {
        setPrivatePasswordSuccess(true)
        setPrivatePasswordMode(null)
        setPrivateOldPassword('')
        await fetchPrivatePasswordStatus()
        showToast('success', '私密密码已删除')
      } else {
        throw new Error(data.error || '删除失败')
      }
    } catch (err: any) {
      setPrivatePasswordError(err.message || '删除失败')
    } finally {
      setIsLoadingPrivatePassword(false)
    }
  }

  // 切换启用/禁用状态
  const handleTogglePrivatePassword = async () => {
    setIsLoadingPrivatePassword(true)
    try {
      const endpoint = privatePasswordStatus?.isEnabled ? 'disable' : 'enable'
      const response = await fetch(`${API_BASE_URL}/v2/users/me/private-password/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getAuthToken() || ''}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        await fetchPrivatePasswordStatus()
        showToast('success', privatePasswordStatus?.isEnabled ? '私密密码已禁用' : '私密密码已启用')
      } else {
        throw new Error(data.error || '操作失败')
      }
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    } finally {
      setIsLoadingPrivatePassword(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 修改用户名 */}
      <div className="p-4 rounded-xl" style={{ background: 'var(--color-glass)' }}>
        <h3 className="font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>
          修改用户名
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              当前用户名
            </label>
            <input
              type="text"
              value={currentUsername}
              disabled
              className="w-full px-4 py-3 rounded-xl border bg-transparent opacity-60"
              style={{
                borderColor: 'var(--color-glass-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              新用户名
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border bg-transparent"
              style={{
                borderColor: 'var(--color-glass-border)',
                color: 'var(--color-text-primary)'
              }}
              placeholder="输入新用户名"
            />
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              当前密码（验证身份）
            </label>
            <div className="relative">
              <input
                type={showUsernamePassword ? 'text' : 'password'}
                value={usernameCurrentPassword}
                onChange={(e) => setUsernameCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border bg-transparent pr-12"
                style={{
                  borderColor: 'var(--color-glass-border)',
                  color: 'var(--color-text-primary)'
                }}
                placeholder="输入当前密码"
              />
              <button
                onClick={() => setShowUsernamePassword(!showUsernamePassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showUsernamePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <motion.button
            onClick={handleChangeUsername}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl text-white font-medium"
            style={{ background: 'var(--color-primary)' }}
          >
            修改用户名
          </motion.button>
        </div>
      </div>

      {/* 修改登录密码 */}
      <div className="p-4 rounded-xl" style={{ background: 'var(--color-glass)' }}>
        <h3 className="font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>
          修改登录密码
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              当前密码
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border bg-transparent pr-12"
                style={{
                  borderColor: 'var(--color-glass-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              新密码
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border bg-transparent"
              style={{
                borderColor: 'var(--color-glass-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              确认新密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border bg-transparent"
              style={{
                borderColor: 'var(--color-glass-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>
          <motion.button
            onClick={handleChangePassword}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl text-white font-medium"
            style={{ background: 'var(--color-primary)' }}
          >
            修改密码
          </motion.button>
        </div>
      </div>

      {/* 私密书签密码 */}
      <div className="p-4 rounded-xl" style={{ background: 'var(--color-glass)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              私密书签密码
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {privatePasswordStatus?.hasPassword
                ? privatePasswordStatus?.isEnabled
                  ? '已设置并启用'
                  : '已设置但已禁用'
                : '未设置私密密码'}
            </p>
          </div>
          {privatePasswordStatus?.hasPassword && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                privatePasswordStatus?.isEnabled
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {privatePasswordStatus?.isEnabled ? '已启用' : '已禁用'}
            </span>
          )}
        </div>

        {/* 状态切换 */}
        {privatePasswordStatus?.hasPassword && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 mb-4">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              私密书签密码{privatePasswordStatus?.isEnabled ? '已启用' : '已禁用'}
            </span>
            <motion.button
              onClick={handleTogglePrivatePassword}
              disabled={isLoadingPrivatePassword}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                privatePasswordStatus?.isEnabled
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              } disabled:opacity-50`}
            >
              {isLoadingPrivatePassword
                ? '处理中...'
                : privatePasswordStatus?.isEnabled
                ? '禁用'
                : '启用'}
            </motion.button>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {privatePasswordStatus?.hasPassword ? (
            <>
              <motion.button
                onClick={() => {
                  setPrivatePasswordMode(privatePasswordMode === 'update' ? null : 'update')
                  setPrivatePasswordError(null)
                  setPrivateOldPassword('')
                  setPrivateNewPassword('')
                  setPrivateConfirmPassword('')
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  privatePasswordMode === 'update'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                修改密码
              </motion.button>
              <motion.button
                onClick={() => {
                  setPrivatePasswordMode(privatePasswordMode === 'delete' ? null : 'delete')
                  setPrivatePasswordError(null)
                  setPrivateOldPassword('')
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  privatePasswordMode === 'delete'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                }`}
              >
                删除密码
              </motion.button>
            </>
          ) : (
            <motion.button
              onClick={() => {
                setPrivatePasswordMode(privatePasswordMode === 'set' ? null : 'set')
                setPrivatePasswordError(null)
                setPrivateNewPassword('')
                setPrivateConfirmPassword('')
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                privatePasswordMode === 'set'
                  ? 'bg-purple-500 text-white'
                  : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
              }`}
            >
              设置密码
            </motion.button>
          )}
        </div>

        {/* 设置密码表单 */}
        <AnimatePresence>
          {privatePasswordMode === 'set' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="relative">
                <input
                  type={showPrivatePassword ? 'text' : 'password'}
                  value={privateNewPassword}
                  onChange={(e) => {
                    setPrivateNewPassword(e.target.value)
                    setPrivatePasswordError(null)
                  }}
                  placeholder="输入密码（至少4位）"
                  className="w-full px-4 py-3 rounded-xl border bg-transparent pr-12"
                  style={{
                    borderColor: 'var(--color-glass-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
                <button
                  onClick={() => setShowPrivatePassword(!showPrivatePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPrivatePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <input
                type={showPrivatePassword ? 'text' : 'password'}
                value={privateConfirmPassword}
                onChange={(e) => {
                  setPrivateConfirmPassword(e.target.value)
                  setPrivatePasswordError(null)
                }}
                placeholder="确认密码"
                className="w-full px-4 py-3 rounded-xl border bg-transparent"
                style={{
                  borderColor: 'var(--color-glass-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
              {privatePasswordError && (
                <p className="text-sm text-red-400">{privatePasswordError}</p>
              )}
              <motion.button
                onClick={handleSetPrivatePassword}
                disabled={isLoadingPrivatePassword || !privateNewPassword || !privateConfirmPassword}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl text-white font-medium bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingPrivatePassword ? '设置中...' : '确认设置'}
              </motion.button>
            </motion.div>
          )}

          {/* 更新密码表单 */}
          {privatePasswordMode === 'update' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <input
                type={showPrivatePassword ? 'text' : 'password'}
                value={privateOldPassword}
                onChange={(e) => {
                  setPrivateOldPassword(e.target.value)
                  setPrivatePasswordError(null)
                }}
                placeholder="输入旧密码"
                className="w-full px-4 py-3 rounded-xl border bg-transparent"
                style={{
                  borderColor: 'var(--color-glass-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
              <div className="relative">
                <input
                  type={showPrivatePassword ? 'text' : 'password'}
                  value={privateNewPassword}
                  onChange={(e) => {
                    setPrivateNewPassword(e.target.value)
                    setPrivatePasswordError(null)
                  }}
                  placeholder="输入新密码（至少4位）"
                  className="w-full px-4 py-3 rounded-xl border bg-transparent pr-12"
                  style={{
                    borderColor: 'var(--color-glass-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
                <button
                  onClick={() => setShowPrivatePassword(!showPrivatePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPrivatePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <input
                type={showPrivatePassword ? 'text' : 'password'}
                value={privateConfirmPassword}
                onChange={(e) => {
                  setPrivateConfirmPassword(e.target.value)
                  setPrivatePasswordError(null)
                }}
                placeholder="确认新密码"
                className="w-full px-4 py-3 rounded-xl border bg-transparent"
                style={{
                  borderColor: 'var(--color-glass-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
              {privatePasswordError && (
                <p className="text-sm text-red-400">{privatePasswordError}</p>
              )}
              <motion.button
                onClick={handleUpdatePrivatePassword}
                disabled={isLoadingPrivatePassword || !privateOldPassword || !privateNewPassword || !privateConfirmPassword}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl text-white font-medium bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingPrivatePassword ? '更新中...' : '确认更新'}
              </motion.button>
            </motion.div>
          )}

          {/* 删除密码表单 */}
          {privatePasswordMode === 'delete' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 overflow-hidden p-4 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                删除后，所有私密书签将不再受密码保护。此操作不可恢复。
              </p>
              <input
                type={showPrivatePassword ? 'text' : 'password'}
                value={privateOldPassword}
                onChange={(e) => {
                  setPrivateOldPassword(e.target.value)
                  setPrivatePasswordError(null)
                }}
                placeholder="输入当前密码确认删除"
                className="w-full px-4 py-3 rounded-xl border bg-transparent"
                style={{
                  borderColor: 'var(--color-glass-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
              {privatePasswordError && (
                <p className="text-sm text-red-400">{privatePasswordError}</p>
              )}
              <motion.button
                onClick={handleDeletePrivatePassword}
                disabled={isLoadingPrivatePassword || !privateOldPassword}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl text-white font-medium bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingPrivatePassword ? '删除中...' : '确认删除'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 说明 */}
        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            设置私密密码后，您可以将书签标记为私密状态。私密书签在前台默认隐藏，需要输入密码才能查看。
          </p>
        </div>
      </div>
    </div>
  )
}

// 数据管理模块
function DataModule() {
  const { showToast } = useToast()
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetMode, setResetMode] = useState<'full' | 'keepUsers' | 'initial'>('initial')
  const [isResetting, setIsResetting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const data = await exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `nowen-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showToast('success', '数据导出成功')
    } catch (err: any) {
      showToast('error', err.message || '数据导出失败')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const content = await file.text()
      const data = JSON.parse(content)
      await importData(data, 'merge')
      showToast('success', '数据导入成功，页面即将刷新')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      showToast('error', err.message || '数据导入失败')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleReset = async () => {
    setIsResetting(true)
    try {
      const result = await factoryReset(resetMode)
      showToast('success', '已恢复出厂设置，页面即将刷新')
      clearAuthStatus()
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      showToast('error', err.message || '恢复出厂设置失败')
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-4">
      <motion.button
        onClick={handleExport}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full p-4 rounded-xl flex items-center gap-3 transition-all"
        style={{ background: 'var(--color-glass)' }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--color-bg-tertiary)' }}
        >
          <Save className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
        </div>
        <div className="text-left">
          <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            导出数据
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            下载所有书签、分类和设置的备份
          </div>
        </div>
      </motion.button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".json"
        className="hidden"
      />
      <motion.button
        onClick={handleImportClick}
        disabled={isImporting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full p-4 rounded-xl flex items-center gap-3 transition-all disabled:opacity-50"
        style={{ background: 'var(--color-glass)' }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--color-bg-tertiary)' }}
        >
          <Upload className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
        </div>
        <div className="text-left">
          <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {isImporting ? '导入中...' : '导入数据'}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            从备份文件恢复数据
          </div>
        </div>
      </motion.button>

      <motion.button
        onClick={() => setShowResetDialog(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full p-4 rounded-xl flex items-center gap-3 transition-all"
        style={{ background: 'var(--color-glass)' }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--color-bg-tertiary)' }}
        >
          <RotateCcw className="w-5 h-5" style={{ color: 'var(--color-error)' }} />
        </div>
        <div className="text-left">
          <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            恢复出厂设置
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            清除所有数据并恢复默认设置
          </div>
        </div>
      </motion.button>

      {/* 重置模式选择对话框 */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-glass-border)' }}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              恢复出厂设置
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              请选择重置模式：
            </p>

            <div className="space-y-3 mb-6">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${resetMode === 'initial' ? 'ring-2' : ''}`}
                style={{
                  background: 'var(--color-glass)',
                  border: `1px solid ${resetMode === 'initial' ? 'var(--color-primary)' : 'var(--color-glass-border)'}`,
                }}
              >
                <input
                  type="radio"
                  name="resetMode"
                  value="initial"
                  checked={resetMode === 'initial'}
                  onChange={(e) => setResetMode(e.target.value as any)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    恢复初始状态（推荐）
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    保留示例数据：5个分类、8个书签、示例名言
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${resetMode === 'keepUsers' ? 'ring-2' : ''}`}
                style={{
                  background: 'var(--color-glass)',
                  border: `1px solid ${resetMode === 'keepUsers' ? 'var(--color-primary)' : 'var(--color-glass-border)'}`,
                }}
              >
                <input
                  type="radio"
                  name="resetMode"
                  value="keepUsers"
                  checked={resetMode === 'keepUsers'}
                  onChange={(e) => setResetMode(e.target.value as any)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    清空所有数据
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    删除所有书签、分类，保留用户账户
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${resetMode === 'full' ? 'ring-2' : ''}`}
                style={{
                  background: 'var(--color-glass)',
                  border: `1px solid ${resetMode === 'full' ? 'var(--color-error)' : 'var(--color-glass-border)'}`,
                }}
              >
                <input
                  type="radio"
                  name="resetMode"
                  value="full"
                  checked={resetMode === 'full'}
                  onChange={(e) => setResetMode(e.target.value as any)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium" style={{ color: 'var(--color-error)' }}>
                    完全重置
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    删除所有数据，包括用户账户（仅保留管理员）
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetDialog(false)}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ background: 'var(--color-glass)', color: 'var(--color-text-secondary)' }}
                disabled={isResetting}
              >
                取消
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
                style={{ background: resetMode === 'full' ? 'var(--color-error)' : 'var(--color-primary)' }}
                disabled={isResetting}
              >
                {isResetting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    重置中...
                  </span>
                ) : (
                  '确认重置'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// 高级配置模块 - 简化的系统配置界面
function AdvancedConfigModule() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'security' | 'fileTransfer' | 'upload' | 'notification'>('security')
  const [loading, setLoading] = useState(true)

  // 模拟配置数据
  const [configs, setConfigs] = useState({
    security: {
      maxLoginAttempts: 3,
      lockDurationMinutes: 30,
      sessionTimeoutHours: 24,
      passwordMinLength: 8,
      requireStrongPassword: true,
      enableIpFilter: false,
      enableAuditLog: true
    },
    fileTransfer: {
      maxFileSizeMB: 100,
      maxExpiryHours: 72,
      maxDownloads: 10,
      allowedFileTypes: ['jpg', 'png', 'pdf', 'docx'],
      blockedFileTypes: ['exe', 'bat', 'sh'],
      uploadPath: './uploads',
      enableVirusScan: false,
      chunkSizeMB: 5,
      maxConcurrentUploads: 3
    },
    upload: {
      chunkSizeMB: 5,
      maxConcurrent: 3,
      maxFileSizeMB: 100,
      tempDir: 'uploads/temp',
      expireTimeHours: 24,
      cleanupIntervalMinutes: 30
    },
    notification: {
      cooldownMinutes: 5,
      maxRetries: 3,
      retryIntervalMinutes: 10
    }
  })

  useEffect(() => {
    // 模拟加载
    setTimeout(() => setLoading(false), 500)
  }, [])

  const handleConfigChange = (section: string, key: string, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }))
  }

  const handleSave = async () => {
    showToast('success', '配置已保存')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }} />
      </div>
    )
  }

  const tabs = [
    { id: 'security', label: '安全配置', icon: Shield },
    { id: 'fileTransfer', label: '文件传输', icon: FileText },
    { id: 'upload', label: '上传配置', icon: Upload },
    { id: 'notification', label: '通知配置', icon: Bell }
  ]

  return (
    <div className="space-y-4">
      {/* Tab 导航 */}
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--color-glass)' }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'text-white' : 'hover:opacity-80'
              }`}
              style={{
                background: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--color-text-secondary)'
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 配置内容 */}
      <div className="p-6 rounded-xl space-y-6" style={{ background: 'var(--color-glass)' }}>
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <ConfigNumberInput
                label="最大登录尝试次数"
                value={configs.security.maxLoginAttempts}
                onChange={(v) => handleConfigChange('security', 'maxLoginAttempts', v)}
                min={1}
                max={10}
                unit="次"
              />
              <ConfigNumberInput
                label="锁定时间"
                value={configs.security.lockDurationMinutes}
                onChange={(v) => handleConfigChange('security', 'lockDurationMinutes', v)}
                min={1}
                max={60}
                unit="分钟"
              />
            </div>
            <ConfigNumberInput
              label="会话超时时间"
              value={configs.security.sessionTimeoutHours}
              onChange={(v) => handleConfigChange('security', 'sessionTimeoutHours', v)}
              min={1}
              max={168}
              unit="小时"
            />
            <div className="grid grid-cols-2 gap-4">
              <ConfigNumberInput
                label="密码最小长度"
                value={configs.security.passwordMinLength}
                onChange={(v) => handleConfigChange('security', 'passwordMinLength', v)}
                min={4}
                max={32}
                unit="位"
              />
            </div>
            <ConfigToggle
              label="要求强密码"
              checked={configs.security.requireStrongPassword}
              onChange={(v) => handleConfigChange('security', 'requireStrongPassword', v)}
            />
            <ConfigToggle
              label="启用IP过滤"
              checked={configs.security.enableIpFilter}
              onChange={(v) => handleConfigChange('security', 'enableIpFilter', v)}
            />
            <ConfigToggle
              label="启用审计日志"
              checked={configs.security.enableAuditLog}
              onChange={(v) => handleConfigChange('security', 'enableAuditLog', v)}
            />
          </div>
        )}

        {activeTab === 'fileTransfer' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <ConfigNumberInput
                label="最大文件大小"
                value={configs.fileTransfer.maxFileSizeMB}
                onChange={(v) => handleConfigChange('fileTransfer', 'maxFileSizeMB', v)}
                min={1}
                max={1024}
                unit="MB"
              />
              <ConfigNumberInput
                label="最大过期时间"
                value={configs.fileTransfer.maxExpiryHours}
                onChange={(v) => handleConfigChange('fileTransfer', 'maxExpiryHours', v)}
                min={1}
                max={720}
                unit="小时"
              />
            </div>
            <ConfigNumberInput
              label="最大下载次数"
              value={configs.fileTransfer.maxDownloads}
              onChange={(v) => handleConfigChange('fileTransfer', 'maxDownloads', v)}
              min={1}
              max={100}
              unit="次"
            />
            <ConfigTextInput
              label="上传目录"
              value={configs.fileTransfer.uploadPath}
              onChange={(v) => handleConfigChange('fileTransfer', 'uploadPath', v)}
            />
            <ConfigToggle
              label="启用病毒扫描"
              checked={configs.fileTransfer.enableVirusScan}
              onChange={(v) => handleConfigChange('fileTransfer', 'enableVirusScan', v)}
            />
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <ConfigNumberInput
                label="分片大小"
                value={configs.upload.chunkSizeMB}
                onChange={(v) => handleConfigChange('upload', 'chunkSizeMB', v)}
                min={1}
                max={50}
                unit="MB"
              />
              <ConfigNumberInput
                label="最大并发数"
                value={configs.upload.maxConcurrent}
                onChange={(v) => handleConfigChange('upload', 'maxConcurrent', v)}
                min={1}
                max={10}
                unit="个"
              />
            </div>
            <ConfigTextInput
              label="临时目录"
              value={configs.upload.tempDir}
              onChange={(v) => handleConfigChange('upload', 'tempDir', v)}
            />
          </div>
        )}

        {activeTab === 'notification' && (
          <div className="space-y-6">
            <ConfigNumberInput
              label="冷却时间"
              value={configs.notification.cooldownMinutes}
              onChange={(v) => handleConfigChange('notification', 'cooldownMinutes', v)}
              min={1}
              max={60}
              unit="分钟"
            />
            <div className="grid grid-cols-2 gap-4">
              <ConfigNumberInput
                label="最大重试次数"
                value={configs.notification.maxRetries}
                onChange={(v) => handleConfigChange('notification', 'maxRetries', v)}
                min={0}
                max={10}
                unit="次"
              />
              <ConfigNumberInput
                label="重试间隔"
                value={configs.notification.retryIntervalMinutes}
                onChange={(v) => handleConfigChange('notification', 'retryIntervalMinutes', v)}
                min={1}
                max={60}
                unit="分钟"
              />
            </div>
          </div>
        )}
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <motion.button
          onClick={handleSave}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-2.5 rounded-xl text-white font-medium flex items-center gap-2"
          style={{ background: 'var(--color-primary)' }}
        >
          <Save className="w-4 h-4" />
          保存配置
        </motion.button>
      </div>
    </div>
  )
}

// 配置表单组件
function ConfigNumberInput({ label, value, onChange, min, max, unit }: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  unit: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </label>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{unit}</span>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))}
        min={min}
        max={max}
        className="w-full px-3 py-2 rounded-lg text-sm transition-all"
        style={{
          background: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)'
        }}
      />
    </div>
  )
}

function ConfigTextInput({ label, value, onChange }: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm transition-all"
        style={{
          background: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)'
        }}
      />
    </div>
  )
}

function ConfigToggle({ label, checked, onChange }: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
        {label}
      </span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-bg-tertiary)]'
        }`}
        style={{ border: '1px solid var(--color-border)' }}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

// 主组件
export default function SettingsPage() {
  const { t } = useTranslation()
  const [activeModule, setActiveModule] = useState<SettingsModule>('site')
  const [settings, setSettings] = useState<Partial<SiteSettings>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useToast()

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchSettings()
        setSettings(data)
      } catch (error) {
        showToast('error', t('common.error'))
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [showToast, t])

  // 更新设置项
  const handleChange = (key: keyof SiteSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // 保存设置
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSettings(settings)
      showToast('success', t('admin.settings.site.saved'))
    } catch (error) {
      showToast('error', t('common.error'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    )
  }

  const activeModuleData = modules.find(m => m.id === activeModule)

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* 左侧模块列表 */}
      <div className="w-64 flex-shrink-0 space-y-2">
        {modules.map((module) => {
          const Icon = module.icon
          const isActive = activeModule === module.id
          const handleClick = () => {
            setActiveModule(module.id)
          }
          return (
            <motion.button
              key={module.id}
              onClick={handleClick}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full p-4 rounded-xl text-left transition-all border',
                isActive
                  ? 'border-[var(--color-primary)] bg-[var(--color-glass)]'
                  : 'border-transparent hover:bg-[var(--color-glass)]'
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    'bg-gradient-to-br',
                    module.bgColor
                  )}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {module.title}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {module.desc}
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    'w-4 h-4 flex-shrink-0 transition-transform',
                    isActive ? 'rotate-90' : ''
                  )}
                  style={{ color: 'var(--color-text-muted)' }}
                />
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1 flex gap-6 min-w-0">
        {/* 设置表单 */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {/* 模块标题 */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {activeModuleData?.title}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    {activeModuleData?.desc}
                  </p>
                </div>
                <motion.button
                  onClick={handleSave}
                  disabled={isSaving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2 disabled:opacity-50"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {t('admin.settings.site.save')}
                </motion.button>
              </div>

              {/* 模块内容 */}
              <div
                className="p-6 rounded-2xl"
                style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
              >
                {activeModule === 'site' && (
                  <SiteConfigModule settings={settings} onChange={handleChange} />
                )}
                {activeModule === 'widget' && (
                  <WidgetModule settings={settings} onChange={handleChange} />
                )}
                {activeModule === 'network' && (
                  <NetworkConfigModule settings={settings} onChange={handleChange} />
                )}
                {activeModule === 'security' && <SecurityModule />}
                {activeModule === 'data' && <DataModule />}
                {activeModule === 'advanced' && <AdvancedConfigModule />}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 实时预览 */}
        <div className="w-80 flex-shrink-0 hidden xl:block">
          <div className="sticky top-4">
            <LivePreview settings={settings} />
          </div>
        </div>
      </div>
    </div>
  )
}
