# 安全功能更新日志

## 2024-03-08 SSRF防护配置界面增强

### 新增功能

#### 1. 管理后台SSRF配置面板
- **位置**: 安全管理 → SSRF防护标签页
- **功能**:
  - 可视化开关控制内网访问权限
  - 实时显示当前配置状态和安全建议
  - 列出始终禁止访问的地址（localhost, 169.254.169.254等）
  - 提供部署场景建议（纯内网NAS、公网暴露、反向代理）

#### 2. 初始化默认配置
- **文件**: `apps/server/src/db/init.ts`
- **改进**: 新安装时自动创建SSRF安全设置
- **默认值**: `allowPrivateIPs = false`（公网安全模式）
- **提示**: 安装日志会显示当前安全模式和建议

#### 3. 安装指南
- **文件**: `INSTALL_GUIDE.md`
- **内容**:
  - 快速开始步骤
  - NAS部署安全配置说明
  - SSRF配置API使用示例
  - Docker部署配置
  - 常见问题解答

### 界面预览

```
安全管理页面
├── CSRF 防护 (原有)
├── SSRF 防护 (新增) ⭐
│   ├── 说明卡片：什么是SSRF防护
│   ├── 配置开关：允许访问内网地址
│   ├── 状态提示：当前配置安全建议
│   ├── 禁止地址：始终阻止的IP列表
│   └── 部署建议：不同场景的配置指南
├── 安全日志 (原有)
└── 异常告警 (原有)
```

### 使用说明

#### 纯内网NAS部署
1. 登录管理后台
2. 进入"安全管理" → "SSRF防护"
3. 开启"允许访问内网地址"
4. 点击"保存配置"
5. 现在可以添加内网服务监控（如路由器、NAS管理界面）

#### 公网暴露部署
- 保持默认配置（禁止内网访问）
- 如需监控内网服务，建议使用反向代理或VPN

### 技术实现

#### 后端API
```typescript
// 获取SSRF配置
GET /api/v2/system/security/ssrf

// 更新SSRF配置
PUT /api/v2/system/security/ssrf
Body: { allowPrivateIPs: boolean }
```

#### 前端组件
- `apps/manager/components/admin/SSRFConfig.tsx` - SSRF配置面板
- `apps/manager/modules/security/pages/SecurityPage.tsx` - 集成到安全管理页面

### 安全特性

1. **分层防护策略**
   - 🔴 严格禁止：本地回环、云元数据服务
   - 🟡 可配置：私有网络地址
   - 🟢 允许访问：公网地址

2. **功能特定策略**
   - 元数据抓取：严格模式（禁止所有内网）
   - 服务监控：可配置（根据设置决定）
   - 壁纸API：严格模式（只允许公网）

3. **缓存机制**
   - 配置变更后自动清除缓存
   - 下次请求时重新加载最新配置

### 相关文件

- `apps/server/src/utils/ssrfProtection.ts` - SSRF防护工具
- `apps/server/src/routes/v2/system.ts` - SSRF配置API
- `apps/server/src/db/init.ts` - 初始化默认配置
- `apps/manager/components/admin/SSRFConfig.tsx` - 配置面板组件
- `apps/manager/modules/security/pages/SecurityPage.tsx` - 安全管理页面
- `INSTALL_GUIDE.md` - 安装指南
- `SECURITY_DEEP_ANALYSIS.md` - 安全分析文档

---

## 历史更新

### 2024-03-08 安全审计与加固
- 修复文件路径穿越漏洞
- 添加CSRF防护
- 配置Helmet安全头
- 实现SSRF防护策略
- 修复敏感数据泄露问题
- 修复权限提升漏洞
