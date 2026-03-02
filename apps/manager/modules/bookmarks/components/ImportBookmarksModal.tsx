import { useState, useCallback } from 'react'
import { X, Upload, FileJson, AlertCircle, CheckCircle, Globe, FileType } from 'lucide-react'
import { importData, ImportResult } from '../../../lib/api'
import { useToast } from '../../../components/admin/Toast'
import { convertBrowserBookmarks, validateBookmarkFile } from '../../../lib/bookmark-import-utils'
import { Bookmark, Category } from '../../../types/bookmark'

interface ImportBookmarksModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ImportBookmarksModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportBookmarksModalProps) {
  const { showToast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [fileFormat, setFileFormat] = useState<string>('')
  const [importMode, setImportMode] = useState<'merge' | 'overwrite' | 'skip'>('merge')
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [previewData, setPreviewData] = useState<{ bookmarks: Bookmark[]; categories: Category[] } | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setIsValidating(true)
    setImportResult(null)
    setPreviewData(null)

    try {
      // 验证文件
      const validation = await validateBookmarkFile(selectedFile)
      
      if (!validation.valid) {
        showToast('error', validation.error || '文件验证失败')
        setIsValidating(false)
        return
      }

      // 读取并解析文件
      const content = await selectedFile.text()
      const converted = convertBrowserBookmarks(content)
      
      setFile(selectedFile)
      setFileFormat(validation.format || '')
      setPreviewData({
        bookmarks: converted.bookmarks.slice(0, 5), // 只显示前5个预览
        categories: converted.categories.slice(0, 5),
      })
      
      showToast('success', `检测到 ${validation.format} 格式，共 ${converted.count} 个书签`)
    } catch (err: any) {
      showToast('error', err.message || '文件解析失败')
    } finally {
      setIsValidating(false)
    }
  }, [showToast])

  const handleImport = useCallback(async () => {
    if (!file) {
      showToast('error', '请先选择文件')
      return
    }

    setIsImporting(true)
    try {
      const content = await file.text()
      
      // 尝试作为浏览器书签格式解析
      let importPayload: { bookmarks: Bookmark[]; categories: Category[] }
      
      try {
        importPayload = convertBrowserBookmarks(content)
      } catch {
        // 如果不是浏览器格式，尝试作为系统导出格式解析
        const parsed = JSON.parse(content)
        importPayload = {
          bookmarks: parsed.bookmarks || [],
          categories: parsed.categories || [],
        }
      }
      
      // 确保数据符合后端期望的格式
      const data = {
        bookmarks: importPayload.bookmarks || [],
        categories: importPayload.categories || [],
        themes: [],
        quotes: [],
        tags: [],
        widgets: [],
        customMetrics: [],
        serviceMonitors: [],
        settings: {},
        version: '2.0',
        exportedAt: new Date().toISOString(),
        exportedBy: 'browser-import',
      }
      
      const result = await importData(data, importMode)
      setImportResult(result)
      showToast('success', `成功导入 ${result.bookmarks.imported} 个书签，${result.categories.imported} 个分类`)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      showToast('error', err.message || '导入失败')
    } finally {
      setIsImporting(false)
    }
  }, [file, importMode, showToast, onSuccess])

  const handleClose = useCallback(() => {
    setFile(null)
    setFileFormat('')
    setImportResult(null)
    setPreviewData(null)
    setImportMode('merge')
    onClose()
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ 
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
          style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ background: 'var(--color-primary)' }}
            >
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 
                className="text-lg font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                导入书签
              </h2>
              <p 
                className="text-sm"
                style={{ color: 'var(--color-text-muted)' }}
              >
                支持 Chrome、Firefox、Edge、Safari 等浏览器导出的书签文件
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
          >
            <X className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              选择文件
            </label>
            <div
              className="relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer hover:border-solid"
              style={{ 
                borderColor: file ? 'var(--color-primary)' : 'var(--color-glass-border)',
                background: file ? 'var(--color-primary)/5' : 'transparent',
              }}
              onClick={() => document.getElementById('import-file')?.click()}
            >
              <input
                id="import-file"
                type="file"
                accept=".json,.html,.htm,application/json,text/html"
                onChange={handleFileChange}
                className="hidden"
              />
              {isValidating ? (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
                  <p style={{ color: 'var(--color-text-secondary)' }}>正在验证文件...</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ background: 'var(--color-primary)', color: 'white' }}
                    >
                      {fileFormat}
                    </span>
                  </div>
                  <p style={{ color: 'var(--color-text-primary)' }} className="font-medium">
                    {file.name}
                  </p>
                  <p style={{ color: 'var(--color-text-muted)' }} className="text-sm mt-1">
                    点击更换文件
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <FileJson className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} />
                    <FileType className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)' }} className="font-medium">
                    点击选择书签文件
                  </p>
                  <p style={{ color: 'var(--color-text-muted)' }} className="text-sm mt-1">
                    支持 Chrome、Firefox、Edge 导出的 bookmarks.json 或 bookmarks.html
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {previewData && (
            <div 
              className="p-4 rounded-xl"
              style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}
            >
              <h3 
                className="text-sm font-medium mb-3 flex items-center gap-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Globe className="w-4 h-4" />
                数据预览
              </h3>
              
              {previewData.categories.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    分类 ({previewData.categories.length} 个):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {previewData.categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="px-2 py-1 rounded text-xs"
                        style={{ 
                          background: 'var(--color-primary)/20',
                          color: 'var(--color-primary)',
                        }}
                      >
                        {cat.name}
                      </span>
                    ))}
                    {previewData.categories.length === 5 && (
                      <span style={{ color: 'var(--color-text-muted)' }} className="text-xs">
                        ...
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  书签预览:
                </p>
                <div className="space-y-1">
                  {previewData.bookmarks.map((bm, idx) => (
                    <div
                      key={bm.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded text-sm truncate"
                      style={{ background: 'var(--color-bg-primary)' }}
                    >
                      <span className="text-xs w-5" style={{ color: 'var(--color-text-muted)' }}>
                        {idx + 1}.
                      </span>
                      <span style={{ color: 'var(--color-text-primary)' }} className="truncate">
                        {bm.title}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)' }} className="text-xs truncate ml-auto">
                        {bm.url}
                      </span>
                    </div>
                  ))}
                  {previewData.bookmarks.length === 5 && (
                    <p style={{ color: 'var(--color-text-muted)' }} className="text-xs text-center py-1">
                      ...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Import Mode */}
          <div>
            <label 
              className="block text-sm font-medium mb-3"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              导入模式
            </label>
            <div className="space-y-2">
              {[
                { value: 'merge', label: '合并', desc: '与现有数据合并，重复项跳过' },
                { value: 'overwrite', label: '覆盖', desc: '完全替换现有数据' },
                { value: 'skip', label: '跳过', desc: '只导入不重复的数据' },
              ].map((mode) => (
                <label
                  key={mode.value}
                  className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  style={{ 
                    background: importMode === mode.value ? 'var(--color-primary)/10' : 'var(--color-glass)',
                    border: `1px solid ${importMode === mode.value ? 'var(--color-primary)' : 'var(--color-glass-border)'}`,
                  }}
                >
                  <input
                    type="radio"
                    name="importMode"
                    value={mode.value}
                    checked={importMode === mode.value}
                    onChange={(e) => setImportMode(e.target.value as typeof importMode)}
                    className="mt-0.5"
                  />
                  <div>
                    <span 
                      className="font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {mode.label}
                    </span>
                    <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">
                      {mode.desc}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Import Result */}
          {importResult && (
            <div 
              className="p-4 rounded-xl"
              style={{ background: 'var(--color-success)/10', border: '1px solid var(--color-success)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                <span 
                  className="font-medium"
                  style={{ color: 'var(--color-success)' }}
                >
                  导入成功
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div 
                  className="p-3 rounded-lg"
                  style={{ background: 'var(--color-bg-secondary)' }}
                >
                  <p style={{ color: 'var(--color-text-muted)' }} className="text-xs mb-1">书签</p>
                  <p style={{ color: 'var(--color-text-primary)' }} className="font-medium">
                    导入 {importResult.bookmarks.imported} 个
                  </p>
                  {importResult.bookmarks.skipped > 0 && (
                    <p style={{ color: 'var(--color-text-muted)' }} className="text-xs">
                      跳过 {importResult.bookmarks.skipped} 个
                    </p>
                  )}
                </div>
                <div 
                  className="p-3 rounded-lg"
                  style={{ background: 'var(--color-bg-secondary)' }}
                >
                  <p style={{ color: 'var(--color-text-muted)' }} className="text-xs mb-1">分类</p>
                  <p style={{ color: 'var(--color-text-primary)' }} className="font-medium">
                    导入 {importResult.categories.imported} 个
                  </p>
                  {importResult.categories.skipped > 0 && (
                    <p style={{ color: 'var(--color-text-muted)' }} className="text-xs">
                      跳过 {importResult.categories.skipped} 个
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="flex items-center justify-end gap-3 px-6 py-4 border-t sticky bottom-0"
          style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}
        >
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ 
              background: 'var(--color-glass)',
              color: 'var(--color-text-secondary)',
            }}
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all disabled:opacity-50"
            style={{ 
              background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))',
            }}
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                导入中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                开始导入
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
