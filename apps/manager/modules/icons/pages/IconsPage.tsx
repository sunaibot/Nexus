export default function IconsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          图标管理
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          管理自定义图标
        </p>
      </div>
      
      <div className="rounded-xl p-6" style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          图标管理
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          图标模块开发中...
        </p>
      </div>
    </div>
  )
}
