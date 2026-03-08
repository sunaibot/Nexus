'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Puzzle,
  Code,
  Rocket,
  Check,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Wand2,
  Box,
  Play,
  Save,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/admin/Toast'
import PluginBuilder from '../PluginBuilder'
import type { BuildingPlugin } from '../../types/builder'

interface PluginWizardProps {
  onComplete?: () => void
  onCancel?: () => void
}

type WizardStep = 'intro' | 'design' | 'preview' | 'generate' | 'deploy' | 'success'

const STEPS: { id: WizardStep; title: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'intro',
    title: '开始',
    icon: <Sparkles className="w-5 h-5" />,
    description: '了解如何创建插件'
  },
  {
    id: 'design',
    title: '设计',
    icon: <Puzzle className="w-5 h-5" />,
    description: '拖拽零件搭建插件'
  },
  {
    id: 'preview',
    title: '预览',
    icon: <Eye className="w-5 h-5" />,
    description: '看看效果怎么样'
  },
  {
    id: 'generate',
    title: '生成',
    icon: <Code className="w-5 h-5" />,
    description: '自动生成代码'
  },
  {
    id: 'deploy',
    title: '部署',
    icon: <Rocket className="w-5 h-5" />,
    description: '发布到网站'
  }
]

// 示例插件模板 - 小学生可以直接使用
const PLUGIN_TEMPLATES = [
  {
    id: 'template_greeting',
    name: '👋 问候卡片',
    description: '显示欢迎语和时间的简单卡片',
    icon: '👋',
    color: 'from-blue-400 to-blue-600'
  },
  {
    id: 'template_counter',
    name: '🔢 计数器',
    description: '可以加减数字的小工具',
    icon: '🔢',
    color: 'from-green-400 to-green-600'
  },
  {
    id: 'template_todo',
    name: '✅ 待办清单',
    description: '记录要做的事情',
    icon: '✅',
    color: 'from-purple-400 to-purple-600'
  },
  {
    id: 'template_weather',
    name: '🌤️ 天气展示',
    description: '显示天气信息',
    icon: '🌤️',
    color: 'from-yellow-400 to-orange-500'
  },
  {
    id: 'blank',
    name: '🎨 空白画布',
    description: '从零开始自由创作',
    icon: '🎨',
    color: 'from-gray-400 to-gray-600'
  }
]

export default function PluginWizard({ onComplete, onCancel }: PluginWizardProps) {
  const { showToast } = useToast()
  const [currentStep, setCurrentStep] = useState<WizardStep>('intro')
  const [pluginData, setPluginData] = useState<Partial<BuildingPlugin>>({
    name: '',
    description: '',
    icon: '🧩'
  })
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step)
  }

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      goToStep(STEPS[nextIndex].id)
    }
  }

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      goToStep(STEPS[prevIndex].id)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = PLUGIN_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setPluginData(prev => ({
        ...prev,
        name: template.name.replace(/^[🧩👋🔢✅🌤️🎨]\s*/, ''),
        description: template.description,
        icon: template.icon
      }))
    }
  }

  const handleSavePlugin = (plugin: BuildingPlugin) => {
    setPluginData(plugin)
    showToast('success', '插件保存成功！')
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    // 模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    setGeneratedCode(`// 这是自动生成的代码！
export default function MyPlugin() {
  return (
    <div className="my-plugin">
      <h1>${pluginData.name}</h1>
      <p>${pluginData.description}</p>
    </div>
  )
}`)
    setIsGenerating(false)
    nextStep()
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    // 模拟部署过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsDeploying(false)
    goToStep('success')
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col z-50">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-md border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">插件魔法师</h1>
              <p className="text-sm text-gray-500">像搭积木一样创建插件</p>
            </div>
          </div>

          {/* 步骤指示器 */}
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => {
              const isActive = index === currentStepIndex
              const isCompleted = index < currentStepIndex
              
              return (
                <div key={step.id} className="flex items-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goToStep(step.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                      isActive && 'bg-indigo-500 text-white shadow-lg shadow-indigo-200',
                      isCompleted && 'bg-green-500 text-white',
                      !isActive && !isCompleted && 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : step.icon}
                    <span className="hidden md:inline">{step.title}</span>
                  </motion.button>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      'w-8 h-0.5 mx-1',
                      isCompleted ? 'bg-green-400' : 'bg-gray-200'
                    )} />
                  )}
                </div>
              )
            })}
          </div>

          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 主要内容区 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {/* 步骤 1: 介绍 */}
            {currentStep === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="text-center py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white text-5xl"
                  >
                    🪄
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    欢迎来到插件魔法师！
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    不需要写代码，只要像搭积木一样拖拽零件，就能创造出属于自己的网站插件。
                    只需要 3 步：设计 → 生成 → 部署！
                  </p>
                </div>

                {/* 模板选择 */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                    选择一个模板开始，或从空白开始创作
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {PLUGIN_TEMPLATES.map((template, index) => (
                      <motion.button
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTemplateSelect(template.id)}
                        className={cn(
                          'p-6 rounded-2xl border-2 text-left transition-all',
                          selectedTemplate === template.id
                            ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-200'
                            : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-lg'
                        )}
                      >
                        <div className={cn(
                          'w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-3xl mb-4',
                          template.color
                        )}>
                          {template.icon}
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                        <p className="text-sm text-gray-500">{template.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-center pt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={nextStep}
                    disabled={!selectedTemplate}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    开始设计
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* 步骤 2: 设计 */}
            {currentStep === 'design' && (
              <motion.div
                key="design"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="h-[calc(100vh-200px)]"
              >
                <div className="bg-white rounded-2xl shadow-xl border h-full overflow-hidden">
                  <PluginBuilder
                    initialPlugin={pluginData as BuildingPlugin}
                    onSave={handleSavePlugin}
                    onSaved={() => {}}
                  />
                </div>
              </motion.div>
            )}

            {/* 步骤 3: 预览 */}
            {currentStep === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl shadow-lg border p-8">
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-indigo-500" />
                    预览你的插件
                  </h3>
                  
                  <div className="bg-gray-50 rounded-xl p-8 min-h-[300px] flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{pluginData.icon}</span>
                        <div>
                          <h4 className="font-semibold text-lg">{pluginData.name}</h4>
                          <p className="text-sm text-gray-500">{pluginData.description}</p>
                        </div>
                      </div>
                      <div className="h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center text-gray-400">
                        插件内容预览区域
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4 mt-8">
                    <button
                      onClick={prevStep}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      返回修改
                    </button>
                    <button
                      onClick={nextStep}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600"
                    >
                      下一步：生成代码
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 步骤 4: 生成代码 */}
            {currentStep === 'generate' && (
              <motion.div
                key="generate"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl shadow-lg border p-8">
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Code className="w-5 h-5 text-indigo-500" />
                    生成代码
                  </h3>

                  {!generatedCode ? (
                    <div className="text-center py-12">
                      <motion.div
                        animate={{ rotate: isGenerating ? 360 : 0 }}
                        transition={{ duration: 2, repeat: isGenerating ? Infinity : 0, ease: 'linear' }}
                        className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white"
                      >
                        <Sparkles className="w-10 h-10" />
                      </motion.div>
                      <p className="text-lg text-gray-600 mb-6">
                        {isGenerating ? '正在施展魔法生成代码...' : '准备好生成代码了吗？'}
                      </p>
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-lg disabled:opacity-50 mx-auto"
                      >
                        {isGenerating ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-5 h-5" />
                            开始生成
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
                        <pre className="text-green-400 text-sm font-mono">
                          <code>{generatedCode}</code>
                        </pre>
                      </div>
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => setGeneratedCode(null)}
                          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                        >
                          重新生成
                        </button>
                        <button
                          onClick={nextStep}
                          className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600"
                        >
                          下一步：部署
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 步骤 5: 部署 */}
            {currentStep === 'deploy' && (
              <motion.div
                key="deploy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl shadow-lg border p-8">
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-indigo-500" />
                    部署插件
                  </h3>

                  <div className="text-center py-8">
                    <motion.div
                      animate={isDeploying ? { y: [0, -20, 0] } : {}}
                      transition={{ duration: 0.5, repeat: isDeploying ? Infinity : 0 }}
                      className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white text-4xl"
                    >
                      🚀
                    </motion.div>
                    
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      {isDeploying ? '正在发射到网站...' : '准备发射！'}
                    </h4>
                    <p className="text-gray-600 mb-8">
                      {isDeploying 
                        ? '你的插件正在部署到网站上，马上就能看到了！' 
                        : '点击发射按钮，让你的插件在网站上显示出来'}
                    </p>

                    <button
                      onClick={handleDeploy}
                      disabled={isDeploying}
                      className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-2xl font-bold text-xl shadow-lg shadow-orange-200 disabled:opacity-50 mx-auto"
                    >
                      {isDeploying ? (
                        <>
                          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                          部署中...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-6 h-6" />
                          🚀 发射插件！
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 步骤 6: 成功 */}
            {currentStep === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-8 flex items-center justify-center text-white text-6xl"
                >
                  🎉
                </motion.div>
                
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  恭喜你！插件创建成功！
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-xl mx-auto">
                  你的插件 <strong>{pluginData.name}</strong> 已经成功部署到网站上。
                  现在去前台页面看看吧！
                </p>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => goToStep('intro')}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                  >
                    再创建一个
                  </button>
                  <button
                    onClick={onComplete}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90"
                  >
                    完成
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 底部提示 */}
      {currentStep !== 'success' && (
        <div className="bg-white/80 backdrop-blur-md border-t px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <span>
                {currentStep === 'intro' && '选择一个喜欢的模板开始吧！'}
                {currentStep === 'design' && '拖拽左侧的零件到画布上，像搭积木一样搭建你的插件'}
                {currentStep === 'preview' && '看看你的插件长什么样子'}
                {currentStep === 'generate' && '系统会自动帮你生成代码，不需要你写一行代码！'}
                {currentStep === 'deploy' && '部署后你的插件就会显示在网站上了！'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {currentStepIndex > 0 && (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4" />
                  上一步
                </button>
              )}
              {currentStepIndex < STEPS.length - 1 && currentStep !== 'design' && (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                >
                  下一步
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
