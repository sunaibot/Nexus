'use client'

import { motion } from 'framer-motion'
import {
  Clock,
  Calendar,
  Cloud,
  Layout,
  Type,
  Eye,
  EyeOff,
  Palette,
  SlidersHorizontal,
  Check
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import type { HomeComponentSettings } from '../types'

interface HomeComponentSettingsProps {
  settings: HomeComponentSettings
  onChange: (settings: HomeComponentSettings) => void
}

const LAYOUT_OPTIONS = [
  { id: 'vertical', label: '垂直布局', description: '时间在上，天气在下' },
  { id: 'horizontal', label: '水平布局', description: '左右排列' },
  { id: 'card', label: '卡片布局', description: '左侧天气，右侧日期' },
]

const TIME_STYLES = [
  { id: 'large', label: '大', description: '5xl 字号' },
  { id: 'medium', label: '中', description: '4xl 字号' },
  { id: 'small', label: '小', description: '3xl 字号' },
]

const WEATHER_STYLES = [
  { id: 'simple', label: '简洁', description: '仅温度和图标' },
  { id: 'detailed', label: '详细', description: '包含湿度、风速等' },
  { id: 'icon-only', label: '仅图标', description: '只显示天气图标' },
]



export function HomeComponentSettingsPanel({ settings, onChange }: HomeComponentSettingsProps) {
  const updateSetting = <K extends keyof HomeComponentSettings>(
    key: K,
    value: HomeComponentSettings[K]
  ) => {
    onChange({ ...settings, [key]: value })
  }

  const ToggleItem = ({
    icon: Icon,
    label,
    checked,
    onChange: onToggle
  }: {
    icon: typeof Clock
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
  }) => (
    <button
      onClick={() => onToggle(!checked)}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-all',
        checked
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-white/10 hover:border-white/20'
      )}
    >
      <div className={cn(
        'p-2 rounded-lg transition-colors',
        checked ? 'bg-blue-500 text-white' : 'bg-white/5'
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="flex-1 text-left">{label}</span>
      {checked ? (
        <Eye className="w-4 h-4 text-blue-400" />
      ) : (
        <EyeOff className="w-4 h-4 text-gray-500" />
      )}
    </button>
  )

  return (
    <div className="space-y-6">
      {/* 显示控制 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Eye className="w-4 h-4" />
          显示控制
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <ToggleItem
            icon={Clock}
            label="显示时间"
            checked={settings.showTime}
            onChange={(v) => updateSetting('showTime', v)}
          />
          <ToggleItem
            icon={Calendar}
            label="显示日期"
            checked={settings.showDate}
            onChange={(v) => updateSetting('showDate', v)}
          />
          <ToggleItem
            icon={Cloud}
            label="显示天气"
            checked={settings.showWeather}
            onChange={(v) => updateSetting('showWeather', v)}
          />
        </div>
      </div>

      {/* 时间设置 */}
      {settings.showTime && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            时间设置
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs text-white/50">时间格式</label>
              <div className="flex gap-2">
                {(['12h', '24h'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => updateSetting('timeFormat', format)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg text-sm transition-all',
                      settings.timeFormat === format
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 hover:bg-white/10'
                    )}
                  >
                    {format === '12h' ? '12小时' : '24小时'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/50">时间大小</label>
              <div className="flex gap-1">
                {TIME_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => updateSetting('timeStyle', style.id as any)}
                    className={cn(
                      'flex-1 px-2 py-2 rounded-lg text-sm transition-all',
                      settings.timeStyle === style.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 hover:bg-white/10'
                    )}
                    title={style.description}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 日期设置 */}
      {settings.showDate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            日期设置
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <ToggleItem
              icon={Calendar}
              label="显示农历"
              checked={settings.showLunar}
              onChange={(v) => updateSetting('showLunar', v)}
            />
            <ToggleItem
              icon={Calendar}
              label="显示节日"
              checked={settings.showFestival}
              onChange={(v) => updateSetting('showFestival', v)}
            />
            <ToggleItem
              icon={Calendar}
              label="显示节气"
              checked={settings.showJieQi}
              onChange={(v) => updateSetting('showJieQi', v)}
            />
          </div>
        </motion.div>
      )}

      {/* 天气设置 */}
      {settings.showWeather && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            天气样式
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {WEATHER_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => updateSetting('weatherStyle', style.id as any)}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all',
                  settings.weatherStyle === style.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 hover:border-white/20'
                )}
              >
                <div className="font-medium text-sm">{style.label}</div>
                <div className="text-xs text-white/50 mt-1">{style.description}</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* 整体布局 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Layout className="w-4 h-4" />
          整体布局
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {LAYOUT_OPTIONS.map((layout) => (
            <button
              key={layout.id}
              onClick={() => updateSetting('layout', layout.id as any)}
              className={cn(
                'p-3 rounded-xl border text-left transition-all',
                settings.layout === layout.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 hover:border-white/20'
              )}
            >
              <div className="font-medium text-sm">{layout.label}</div>
              <div className="text-xs text-white/50 mt-1">{layout.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 卡片样式（仅卡片布局） */}
      {settings.layout === 'card' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Palette className="w-4 h-4" />
            卡片样式
          </h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs text-white/50">卡片背景色</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.cardBackground}
                  onChange={(e) => updateSetting('cardBackground', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.cardBackground}
                  onChange={(e) => updateSetting('cardBackground', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
                  placeholder="rgba(0,0,0,0.5)"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/50">卡片透明度: {settings.cardOpacity}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.cardOpacity}
                onChange={(e) => updateSetting('cardOpacity', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/50">模糊程度: {settings.cardBlur}px</label>
              <input
                type="range"
                min="0"
                max="20"
                value={settings.cardBlur}
                onChange={(e) => updateSetting('cardBlur', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/50">圆角大小</label>
              <input
                type="text"
                value={settings.cardBorderRadius}
                onChange={(e) => updateSetting('cardBorderRadius', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
                placeholder="16px"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
