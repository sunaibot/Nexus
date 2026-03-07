'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Palette,
  Wind,
  Zap,
  Maximize,
  Minimize,
  Sun,
  Moon,
  Droplets,
  Cloud,
  Stars,
  Flame,
  Circle,
  Square,
  Triangle,
  Layers
} from 'lucide-react'
import type { AdvancedEffects, ColorFilter, GradientType } from '../types'

interface AdvancedEffectsSettingsProps {
  effects: AdvancedEffects
  onChange: (effects: AdvancedEffects) => void
}

const COLOR_FILTERS: { value: ColorFilter; label: string; icon: typeof Sun }[] = [
  { value: 'none', label: '无', icon: Sun },
  { value: 'grayscale', label: '黑白', icon: Circle },
  { value: 'sepia', label: '复古', icon: Palette },
  { value: 'warm', label: '暖色', icon: Sun },
  { value: 'cool', label: '冷色', icon: Moon },
  { value: 'vintage', label: '怀旧', icon: Palette },
  { value: 'noir', label: ' noir', icon: Moon },
]

const PARTICLE_TYPES = [
  { value: 'snow', label: '雪花', icon: Cloud },
  { value: 'rain', label: '雨滴', icon: Droplets },
  { value: 'bubbles', label: '气泡', icon: Circle },
  { value: 'stars', label: '星星', icon: Stars },
  { value: 'fireflies', label: '萤火虫', icon: Flame },
] as const

const ANIMATION_TYPES = [
  { value: 'ken-burns', label: 'Ken Burns', description: '缓慢缩放平移' },
  { value: 'parallax', label: '视差', description: '鼠标跟随效果' },
  { value: 'zoom', label: '缩放', description: '呼吸缩放效果' },
  { value: 'pulse', label: '脉冲', description: '明暗脉动效果' },
] as const

export function AdvancedEffectsSettings({ effects, onChange }: AdvancedEffectsSettingsProps) {
  const [activeSection, setActiveSection] = useState<'vignette' | 'filter' | 'gradient' | 'particles' | 'animation'>('vignette')

  const updateEffects = (section: keyof AdvancedEffects, updates: any) => {
    onChange({
      ...effects,
      [section]: { ...effects[section], ...updates }
    })
  }

  const sections = [
    { id: 'vignette', label: '暗角', icon: Minimize },
    { id: 'filter', label: '滤镜', icon: Palette },
    { id: 'gradient', label: '渐变', icon: Layers },
    { id: 'particles', label: '粒子', icon: Sparkles },
    { id: 'animation', label: '动画', icon: Zap },
  ] as const

  return (
    <div className="space-y-4">
      {/* 效果选择标签 */}
      <div className="flex flex-wrap gap-2">
        {sections.map(section => {
          const Icon = section.icon
          const isEnabled = effects[section.id as keyof AdvancedEffects]?.enabled
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
              style={{
                background: activeSection === section.id ? 'var(--color-primary)' : isEnabled ? 'var(--color-accent)/20' : 'var(--color-bg-primary)',
                color: activeSection === section.id ? 'white' : isEnabled ? 'var(--color-accent)' : 'var(--color-text-muted)',
                border: `1px solid ${activeSection === section.id ? 'transparent' : isEnabled ? 'var(--color-accent)' : 'var(--color-glass-border)'}`
              }}
            >
              <Icon className="w-4 h-4" />
              {section.label}
              {isEnabled && <span className="w-2 h-2 rounded-full bg-current" />}
            </button>
          )
        })}
      </div>

      {/* 暗角设置 */}
      {activeSection === 'vignette' && (
        <div className="space-y-4 p-4 rounded-xl border" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}>
          <div className="flex items-center justify-between">
            <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>暗角效果</h4>
            <input
              type="checkbox"
              checked={effects.vignette.enabled}
              onChange={(e) => updateEffects('vignette', { enabled: e.target.checked })}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--color-primary)' }}
            />
          </div>

          {effects.vignette.enabled && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>强度</label>
                  <span className="text-sm font-medium">{effects.vignette.intensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={effects.vignette.intensity}
                  onChange={(e) => updateEffects('vignette', { intensity: parseInt(e.target.value) })}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ background: 'var(--color-bg-primary)', accentColor: 'var(--color-primary)' }}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>大小</label>
                  <span className="text-sm font-medium">{effects.vignette.size}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={effects.vignette.size}
                  onChange={(e) => updateEffects('vignette', { size: parseInt(e.target.value) })}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ background: 'var(--color-bg-primary)', accentColor: 'var(--color-primary)' }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 滤镜设置 */}
      {activeSection === 'filter' && (
        <div className="space-y-4 p-4 rounded-xl border" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}>
          <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>颜色滤镜</h4>
          
          <div className="grid grid-cols-4 gap-2">
            {COLOR_FILTERS.map(filter => {
              const Icon = filter.icon
              return (
                <button
                  key={filter.value}
                  onClick={() => updateEffects('colorFilter', { type: filter.value, enabled: filter.value !== 'none' })}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all"
                  style={{
                    background: effects.colorFilter.type === filter.value ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                    color: effects.colorFilter.type === filter.value ? 'white' : 'var(--color-text-muted)'
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{filter.label}</span>
                </button>
              )
            })}
          </div>

          {effects.colorFilter.type !== 'none' && (
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>强度</label>
                <span className="text-sm font-medium">{effects.colorFilter.intensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={effects.colorFilter.intensity}
                onChange={(e) => updateEffects('colorFilter', { intensity: parseInt(e.target.value) })}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ background: 'var(--color-bg-primary)', accentColor: 'var(--color-primary)' }}
              />
            </div>
          )}
        </div>
      )}

      {/* 渐变设置 */}
      {activeSection === 'gradient' && (
        <div className="space-y-4 p-4 rounded-xl border" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}>
          <div className="flex items-center justify-between">
            <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>渐变叠加</h4>
            <input
              type="checkbox"
              checked={effects.gradient.enabled}
              onChange={(e) => updateEffects('gradient', { enabled: e.target.checked })}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--color-primary)' }}
            />
          </div>

          {effects.gradient.enabled && (
            <div className="space-y-4">
              {/* 渐变类型 */}
              <div className="flex gap-2">
                {(['linear', 'radial', 'angular'] as GradientType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => updateEffects('gradient', { type })}
                    className="flex-1 px-3 py-2 rounded-lg text-sm transition-all"
                    style={{
                      background: effects.gradient.type === type ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                      color: effects.gradient.type === type ? 'white' : 'var(--color-text-muted)'
                    }}
                  >
                    {type === 'linear' ? '线性' : type === 'radial' ? '径向' : '角度'}
                  </button>
                ))}
              </div>

              {/* 角度 (仅线性) */}
              {effects.gradient.type === 'linear' && (
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>角度</label>
                    <span className="text-sm font-medium">{effects.gradient.angle}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={effects.gradient.angle}
                    onChange={(e) => updateEffects('gradient', { angle: parseInt(e.target.value) })}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{ background: 'var(--color-bg-primary)', accentColor: 'var(--color-primary)' }}
                  />
                </div>
              )}

              {/* 透明度 */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>不透明度</label>
                  <span className="text-sm font-medium">{effects.gradient.opacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={effects.gradient.opacity}
                  onChange={(e) => updateEffects('gradient', { opacity: parseInt(e.target.value) })}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ background: 'var(--color-bg-primary)', accentColor: 'var(--color-primary)' }}
                />
              </div>

              {/* 颜色 */}
              <div className="space-y-2">
                <label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>渐变颜色</label>
                <div className="flex gap-2">
                  {effects.gradient.colors.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color.color}
                        onChange={(e) => {
                          const newColors = [...effects.gradient.colors]
                          newColors[index] = { ...color, color: e.target.value }
                          updateEffects('gradient', { colors: newColors })
                        }}
                        className="w-10 h-10 rounded-lg border cursor-pointer"
                        style={{ borderColor: 'var(--color-glass-border)' }}
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={color.position}
                        onChange={(e) => {
                          const newColors = [...effects.gradient.colors]
                          newColors[index] = { ...color, position: parseInt(e.target.value) }
                          updateEffects('gradient', { colors: newColors })
                        }}
                        className="w-16 h-2"
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 粒子效果 */}
      {activeSection === 'particles' && (
        <div className="space-y-4 p-4 rounded-xl border" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}>
          <div className="flex items-center justify-between">
            <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>粒子效果</h4>
            <input
              type="checkbox"
              checked={effects.particles.enabled}
              onChange={(e) => updateEffects('particles', { enabled: e.target.checked })}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--color-primary)' }}
            />
          </div>

          {effects.particles.enabled && (
            <div className="space-y-4">
              {/* 粒子类型 */}
              <div className="grid grid-cols-5 gap-2">
                {PARTICLE_TYPES.map(type => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      onClick={() => updateEffects('particles', { type: type.value })}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all"
                      style={{
                        background: effects.particles.type === type.value ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                        color: effects.particles.type === type.value ? 'white' : 'var(--color-text-muted)'
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{type.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* 密度 */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>密度</label>
                  <span className="text-sm font-medium">{effects.particles.density}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={effects.particles.density}
                  onChange={(e) => updateEffects('particles', { density: parseInt(e.target.value) })}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ background: 'var(--color-bg-primary)', accentColor: 'var(--color-primary)' }}
                />
              </div>

              {/* 速度 */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>速度</label>
                  <span className="text-sm font-medium">{effects.particles.speed}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={effects.particles.speed}
                  onChange={(e) => updateEffects('particles', { speed: parseInt(e.target.value) })}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ background: 'var(--color-bg-primary)', accentColor: 'var(--color-primary)' }}
                />
              </div>

              {/* 颜色 */}
              <div className="flex items-center gap-3">
                <label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>粒子颜色</label>
                <input
                  type="color"
                  value={effects.particles.color}
                  onChange={(e) => updateEffects('particles', { color: e.target.value })}
                  className="w-10 h-10 rounded-lg border cursor-pointer"
                  style={{ borderColor: 'var(--color-glass-border)' }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 动画效果 */}
      {activeSection === 'animation' && (
        <div className="space-y-4 p-4 rounded-xl border" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}>
          <div className="flex items-center justify-between">
            <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>动画效果</h4>
            <input
              type="checkbox"
              checked={effects.animation.enabled}
              onChange={(e) => updateEffects('animation', { enabled: e.target.checked })}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--color-primary)' }}
            />
          </div>

          {effects.animation.enabled && (
            <div className="space-y-4">
              {/* 动画类型 */}
              <div className="grid grid-cols-2 gap-3">
                {ANIMATION_TYPES.map(anim => (
                  <button
                    key={anim.value}
                    onClick={() => updateEffects('animation', { type: anim.value as any })}
                    className="p-3 rounded-xl border text-left transition-all"
                    style={{
                      borderColor: effects.animation.type === anim.value ? 'var(--color-primary)' : 'var(--color-glass-border)',
                      background: effects.animation.type === anim.value ? 'var(--color-primary)/10' : 'var(--color-bg-primary)'
                    }}
                  >
                    <div className="font-medium text-sm" style={{ color: effects.animation.type === anim.value ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                      {anim.label}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {anim.description}
                    </div>
                  </button>
                ))}
              </div>

              {/* 速度 */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>动画速度</label>
                  <span className="text-sm font-medium">{effects.animation.speed}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={effects.animation.speed}
                  onChange={(e) => updateEffects('animation', { speed: parseInt(e.target.value) })}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ background: 'var(--color-bg-primary)', accentColor: 'var(--color-primary)' }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
