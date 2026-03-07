'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  Sunrise,
  Sunset,
  MapPin,
  Plus,
  Trash2,
  Calendar,
  Timer,
  Globe,
  Sun,
  Moon
} from 'lucide-react'
import type { ScheduleSettings as ScheduleSettingsType, WallpaperLibraryItem } from '../types'

interface ScheduleSettingsProps {
  settings: ScheduleSettingsType
  wallpapers: WallpaperLibraryItem[]
  onChange: (settings: ScheduleSettingsType) => void
}

const SCHEDULE_TYPES = [
  { 
    value: 'interval', 
    label: '定时切换',
    description: '按固定时间间隔自动切换',
    icon: Timer
  },
  { 
    value: 'timeOfDay', 
    label: '时间段',
    description: '在指定时间点切换',
    icon: Clock
  },
  { 
    value: 'sunriseSunset', 
    label: '日出日落',
    description: '根据日出日落时间切换',
    icon: Sunrise
  },
] as const

const INTERVAL_OPTIONS = [
  { value: 5, label: '5分钟' },
  { value: 15, label: '15分钟' },
  { value: 30, label: '30分钟' },
  { value: 60, label: '1小时' },
  { value: 360, label: '6小时' },
  { value: 720, label: '12小时' },
  { value: 1440, label: '24小时' },
]

export function ScheduleSettings({ settings, wallpapers, onChange }: ScheduleSettingsProps) {
  const [newTimeSlot, setNewTimeSlot] = useState({ time: '08:00', wallpaperId: '' })

  const updateSettings = (updates: Partial<ScheduleSettingsType>) => {
    onChange({ ...settings, ...updates })
  }

  // 添加时间段
  const addTimeSlot = () => {
    if (!newTimeSlot.wallpaperId) return
    const timeSlots = [...(settings.timeSlots || []), { ...newTimeSlot }]
    // 按时间排序
    timeSlots.sort((a, b) => a.time.localeCompare(b.time))
    updateSettings({ timeSlots })
    setNewTimeSlot({ time: '08:00', wallpaperId: '' })
  }

  // 移除时间段
  const removeTimeSlot = (index: number) => {
    const timeSlots = (settings.timeSlots || []).filter((_, i) => i !== index)
    updateSettings({ timeSlots })
  }

  // 更新日出日落壁纸
  const updateSunriseSunset = (key: string, wallpaperId: string) => {
    updateSettings({
      sunriseSunset: {
        ...settings.sunriseSunset,
        [key]: wallpaperId
      } as any
    })
  }

  return (
    <div className="space-y-6">
      {/* 启用开关 */}
      <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
            <Calendar className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div>
            <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>启用定时切换</h4>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>按计划自动更换壁纸</p>
          </div>
        </div>
        <button
          onClick={() => updateSettings({ enabled: !settings.enabled })}
          className="relative w-14 h-7 rounded-full transition-all duration-300"
          style={{
            background: settings.enabled
              ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
              : 'var(--color-glass)',
            boxShadow: settings.enabled ? '0 0 20px var(--color-glow)' : 'inset 0 2px 4px rgba(0,0,0,0.2)',
            border: `2px solid ${settings.enabled ? 'transparent' : 'var(--color-glass-border)'}`
          }}
        >
          <motion.div
            animate={{ x: settings.enabled ? 28 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
          />
        </button>
      </div>

      {settings.enabled && (
        <>
          {/* 切换类型 */}
          <div className="space-y-3">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              切换方式
            </label>
            <div className="space-y-2">
              {SCHEDULE_TYPES.map(type => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    onClick={() => updateSettings({ type: type.value })}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                    style={{
                      borderColor: settings.type === type.value ? 'var(--color-primary)' : 'var(--color-glass-border)',
                      background: settings.type === type.value ? 'var(--color-primary)/10' : 'var(--color-bg-primary)'
                    }}
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: settings.type === type.value ? 'var(--color-primary)' : 'var(--color-bg-secondary)' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: settings.type === type.value ? 'white' : 'var(--color-text-muted)' }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm" style={{ color: settings.type === type.value ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                        {type.label}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {type.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 定时切换设置 */}
          {settings.type === 'interval' && (
            <div className="space-y-3">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                切换间隔
              </label>
              <div className="flex flex-wrap gap-2">
                {INTERVAL_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => updateSettings({ interval: option.value })}
                    className="px-3 py-1.5 rounded-lg text-sm transition-all"
                    style={{
                      background: settings.interval === option.value ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                      color: settings.interval === option.value ? 'white' : 'var(--color-text-muted)',
                      border: `1px solid ${settings.interval === option.value ? 'transparent' : 'var(--color-glass-border)'}`
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 时间段设置 */}
          {settings.type === 'timeOfDay' && (
            <div className="space-y-4">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                时间段设置
              </label>
              
              {/* 添加新时间段 */}
              <div className="flex gap-2">
                <input
                  type="time"
                  value={newTimeSlot.time}
                  onChange={(e) => setNewTimeSlot({ ...newTimeSlot, time: e.target.value })}
                  className="px-3 py-2 rounded-lg border text-sm"
                  style={{
                    borderColor: 'var(--color-glass-border)',
                    color: 'var(--color-text-primary)',
                    background: 'var(--color-bg-primary)'
                  }}
                />
                <select
                  value={newTimeSlot.wallpaperId}
                  onChange={(e) => setNewTimeSlot({ ...newTimeSlot, wallpaperId: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm"
                  style={{
                    borderColor: 'var(--color-glass-border)',
                    color: 'var(--color-text-primary)',
                    background: 'var(--color-bg-primary)'
                  }}
                >
                  <option value="">选择壁纸</option>
                  {wallpapers.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                <button
                  onClick={addTimeSlot}
                  disabled={!newTimeSlot.wallpaperId}
                  className="px-3 py-2 rounded-lg disabled:opacity-50"
                  style={{ background: 'var(--color-primary)', color: 'white' }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* 时间段列表 */}
              <div className="space-y-2">
                {(settings.timeSlots || []).map((slot, index) => {
                  const wallpaper = wallpapers.find(w => w.id === slot.wallpaperId)
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border"
                      style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-primary)' }}
                    >
                      <Clock className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                      <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {slot.time}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>→</span>
                      {wallpaper && (
                        <>
                          <img src={wallpaper.thumbnail} alt="" className="w-8 h-6 rounded object-cover" />
                          <span className="flex-1 text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                            {wallpaper.name}
                          </span>
                        </>
                      )}
                      <button
                        onClick={() => removeTimeSlot(index)}
                        className="p-1.5 rounded hover:bg-red-500/20"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>

              {(settings.timeSlots || []).length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                  添加时间段来自动切换壁纸
                </p>
              )}
            </div>
          )}

          {/* 日出日落设置 */}
          {settings.type === 'sunriseSunset' && (
            <div className="space-y-4">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                日出日落壁纸
              </label>

              {/* 位置设置 */}
              <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>位置设置</span>
                </div>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={settings.sunriseSunset?.useCurrentLocation}
                    onChange={(e) => updateSettings({
                      sunriseSunset: { ...settings.sunriseSunset, useCurrentLocation: e.target.checked } as any
                    })}
                    className="rounded"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>使用当前位置</span>
                </label>
                
                {!settings.sunriseSunset?.useCurrentLocation && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>纬度</label>
                      <input
                        type="number"
                        step="0.01"
                        value={settings.sunriseSunset?.latitude || ''}
                        onChange={(e) => updateSettings({
                          sunriseSunset: { ...settings.sunriseSunset, latitude: parseFloat(e.target.value) } as any
                        })}
                        placeholder="39.90"
                        className="w-full px-3 py-2 rounded-lg border text-sm mt-1"
                        style={{
                          borderColor: 'var(--color-glass-border)',
                          color: 'var(--color-text-primary)',
                          background: 'var(--color-bg-primary)'
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>经度</label>
                      <input
                        type="number"
                        step="0.01"
                        value={settings.sunriseSunset?.longitude || ''}
                        onChange={(e) => updateSettings({
                          sunriseSunset: { ...settings.sunriseSunset, longitude: parseFloat(e.target.value) } as any
                        })}
                        placeholder="116.40"
                        className="w-full px-3 py-2 rounded-lg border text-sm mt-1"
                        style={{
                          borderColor: 'var(--color-glass-border)',
                          color: 'var(--color-text-primary)',
                          background: 'var(--color-bg-primary)'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 时段壁纸选择 */}
              <div className="space-y-3">
                {[
                  { key: 'dawnWallpaper', label: '黎明', icon: Sunrise, desc: '日出前' },
                  { key: 'dayWallpaper', label: '白天', icon: Sun, desc: '日出后 - 日落前' },
                  { key: 'duskWallpaper', label: '黄昏', icon: Sunset, desc: '日落后' },
                  { key: 'nightWallpaper', label: '夜晚', icon: Moon, desc: '夜间' },
                ].map(({ key, label, icon: Icon, desc }) => (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-primary)' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-bg-secondary)' }}>
                      <Icon className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{label}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{desc}</div>
                    </div>
                    <select
                      value={(settings.sunriseSunset?.[key as keyof typeof settings.sunriseSunset] as string) || ''}
                      onChange={(e) => updateSunriseSunset(key, e.target.value)}
                      className="px-3 py-2 rounded-lg border text-sm"
                      style={{
                        borderColor: 'var(--color-glass-border)',
                        color: 'var(--color-text-primary)',
                        background: 'var(--color-bg-secondary)'
                      }}
                    >
                      <option value="">选择壁纸</option>
                      {wallpapers.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
