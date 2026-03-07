/**
 * 添加圆形书签预设脚本
 * 用于在数据库初始化后添加新的圆形书签样式预设
 */

import { initDatabase } from '../src/db/init'
import { queryAll, run } from '../src/utils/database'
import { generateId } from '../src/utils/index'

const circularPresets = [
  {
    id: 'preset-circular-gradient',
    name: '圆形渐变',
    description: '渐变背景的圆形图标样式',
    scope: 'global',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: '0px',
    borderRadius: '0px',
    shadowColor: 'transparent',
    shadowBlur: '0px',
    padding: '20px',
    isCircular: 1,
    circleSize: '90px',
    circleBackgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    circleBorderWidth: '3px',
    circleBorderColor: 'rgba(255, 255, 255, 0.3)',
    layoutType: 'icon-top',
    iconPosition: 'center',
    showTitle: 1,
    showDescription: 0,
    textAlign: 'center',
    titleFontSize: '14px',
    titleFontWeight: '500',
    hoverScale: 1.05,
    isEnabled: 1,
    isDefault: 0,
    priority: 10,
  },
  {
    id: 'preset-circular-glass',
    name: '圆形玻璃',
    description: '毛玻璃效果的圆形图标',
    scope: 'global',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: '0px',
    borderRadius: '0px',
    shadowColor: 'transparent',
    shadowBlur: '0px',
    padding: '16px',
    isCircular: 1,
    circleSize: '85px',
    circleBackgroundColor: 'rgba(255, 255, 255, 0.15)',
    circleBorderWidth: '1px',
    circleBorderColor: 'rgba(255, 255, 255, 0.25)',
    layoutType: 'icon-top',
    iconPosition: 'center',
    showTitle: 1,
    showDescription: 0,
    textAlign: 'center',
    titleFontSize: '13px',
    titleFontWeight: '500',
    backdropBlur: '10px',
    hoverScale: 1.05,
    isEnabled: 1,
    isDefault: 0,
    priority: 10,
  },
  {
    id: 'preset-circular-minimal',
    name: '圆形极简',
    description: '简约线条圆形图标',
    scope: 'global',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: '0px',
    borderRadius: '0px',
    shadowColor: 'transparent',
    shadowBlur: '0px',
    padding: '12px',
    isCircular: 1,
    circleSize: '70px',
    circleBackgroundColor: 'transparent',
    circleBorderWidth: '2px',
    circleBorderColor: 'rgba(156, 163, 175, 0.5)',
    layoutType: 'icon-top',
    iconPosition: 'center',
    showTitle: 1,
    showDescription: 0,
    textAlign: 'center',
    titleFontSize: '13px',
    titleFontWeight: '400',
    titleColor: 'rgba(255, 255, 255, 0.8)',
    hoverScale: 1.05,
    isEnabled: 1,
    isDefault: 0,
    priority: 10,
  },
  {
    id: 'preset-circular-neon',
    name: '圆形霓虹',
    description: '发光效果的圆形图标',
    scope: 'global',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: '0px',
    borderRadius: '0px',
    shadowColor: 'rgba(59, 130, 246, 0.5)',
    shadowBlur: '20px',
    padding: '20px',
    isCircular: 1,
    circleSize: '85px',
    circleBackgroundColor: 'rgba(59, 130, 246, 0.2)',
    circleBorderWidth: '2px',
    circleBorderColor: '#3b82f6',
    layoutType: 'icon-top',
    iconPosition: 'center',
    showTitle: 1,
    showDescription: 0,
    textAlign: 'center',
    titleFontSize: '14px',
    titleFontWeight: '600',
    titleColor: '#60a5fa',
    hoverScale: 1.05,
    isEnabled: 1,
    isDefault: 0,
    priority: 10,
  },
  {
    id: 'preset-circular-dark',
    name: '圆形暗色',
    description: '深色背景的圆形图标',
    scope: 'global',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: '0px',
    borderRadius: '0px',
    shadowColor: 'transparent',
    shadowBlur: '0px',
    padding: '16px',
    isCircular: 1,
    circleSize: '80px',
    circleBackgroundColor: 'rgba(30, 30, 40, 0.8)',
    circleBorderWidth: '2px',
    circleBorderColor: 'rgba(255, 255, 255, 0.1)',
    layoutType: 'icon-top',
    iconPosition: 'center',
    showTitle: 1,
    showDescription: 0,
    textAlign: 'center',
    titleFontSize: '13px',
    titleFontWeight: '500',
    titleColor: '#e5e7eb',
    hoverScale: 1.05,
    isEnabled: 1,
    isDefault: 0,
    priority: 10,
  },
]

async function addCircularPresets() {
  console.log('检查并添加圆形书签预设...')

  for (const preset of circularPresets) {
    try {
      // 检查是否已存在
      const existing = queryAll('SELECT id FROM bookmark_card_styles WHERE id = ?', [preset.id])

      if (existing.length === 0) {
        // 插入新预设
        const columns = Object.keys(preset).join(', ')
        const placeholders = Object.keys(preset).map(() => '?').join(', ')
        const values = Object.values(preset)

        run(`INSERT INTO bookmark_card_styles (${columns}) VALUES (${placeholders})`, values)
        console.log(`✅ 已添加预设: ${preset.name} (${preset.id})`)
      } else {
        console.log(`⏭️  预设已存在: ${preset.name} (${preset.id})`)
      }
    } catch (error) {
      console.error(`❌ 添加预设失败 ${preset.name}:`, error)
    }
  }

  console.log('圆形书签预设添加完成！')
}

// 初始化数据库并添加预设
initDatabase().then(() => {
  addCircularPresets()
}).catch(console.error)
