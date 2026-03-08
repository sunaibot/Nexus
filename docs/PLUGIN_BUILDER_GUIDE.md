# 插件构建器完整使用教程

## � 5分钟快速入门

### 第一步：理解概念

```
零件 (Part) = 乐高积木块
插件 (Plugin) = 用积木搭成的模型
```

**零件类型：**
- 🔘 按钮、📝 文本、🃏 卡片 - 基础UI
- 📊 图表、📋 列表 - 数据展示  
- 📥 输入框、🎚️ 滑块 - 交互组件
- 📐 布局容器 - 排列其他组件

### 第二步：打开零件工坊

1. 访问管理后台：`http://localhost:5174`
2. 进入「插件中心」→「零件工坊」
3. 看到系统预设的零件库

### 第三步：创建第一个零件

**目标：创建一个带图标的按钮**

1. 点击「新建零件」
2. 填写基本信息：
   - 名称：图标按钮
   - 分类：basic
   - 图标：🔘

3. 配置视觉样式：
```css
/* 基础样式 */
padding: 10px 20px
background-color: #3b82f6
color: #ffffff
border-radius: 8px
```

4. 添加悬停效果：
```css
/* 悬停状态 */
background-color: #2563eb
transform: translateY(-2px)
box-shadow: 0 4px 12px rgba(59,130,246,0.4)
```

5. 定义可配置属性：
   - 文字（字符串）
   - 图标（选择）
   - 颜色（颜色选择器）

6. 保存零件

### 第四步：使用插件构建器

1. 进入「插件构建器」标签
2. 点击「新建插件」
3. 设置画布大小（建议 800x600）
4. 从左侧面板拖拽零件到画布

**搭建一个简单的名片插件：**

```
┌─────────────────────────┐
│  🃏 卡片容器              │
│  ┌───────────────────┐  │
│  │ 👤 头像图片        │  │
│  │ 📝 姓名（大标题）   │  │
│  │ 📝 职位（小文本）   │  │
│  │ 🔘 联系按钮        │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### 第五步：添加数据

**让名片显示真实数据：**

1. 点击「数据源」面板
2. 添加API数据源：
   - 名称：用户信息
   - 接口：/api/users/profile
   - 方法：GET

3. 选中姓名文本组件
4. 在属性面板绑定数据：
   - 内容：`{{用户信息.name}}`

5. 选中职位文本组件
   - 内容：`{{用户信息.title}}`

### 第六步：添加交互

**让按钮可点击：**

1. 选中按钮组件
2. 在「事件」面板添加点击事件
3. 选择动作类型：「打开链接」
4. 配置链接：`mailto:{{用户信息.email}}`

### 第七步：保存并使用

1. 点击「保存插件」
2. 填写插件名称和描述
3. 设置可见性（公开/私有）
4. 在前台页面添加插件

---

## �📚 完整目录

1. [核心概念](#核心概念)
2. [零件工坊详细指南](#零件工坊使用指南)
3. [插件构建器详细指南](#插件构建器使用指南)
4. [实战教程：复刻内置插件](#内置插件复刻教程)
5. [数据流与API集成](#数据流与api集成)
6. [最佳实践](#最佳实践)

---

## 核心概念

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        插件系统架构                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   零件工坊    │───▶│  插件构建器   │───▶│  插件运行器   │  │
│  │  (造零件)     │    │  (搭插件)     │    │  (用插件)     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  ComponentPart│    │ BuildingPlugin│    │ CustomPlugin │  │
│  │  零件定义     │    │  插件蓝图     │    │  运行实例     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 三个核心概念

#### 1. 零件 (ComponentPart)
- **定义**: 可复用的UI组件单元
- **包含**: 视觉样式、交互行为、可配置属性
- **示例**: 按钮、卡片、输入框、图表等

#### 2. 插件蓝图 (BuildingPlugin)
- **定义**: 由零件搭建而成的完整插件设计
- **包含**: 画布布局、组件实例、数据源、交互逻辑
- **示例**: 名言展示插件、文件传输插件

#### 3. 插件实例 (CustomPlugin)
- **定义**: 实际运行的插件
- **包含**: 插件元数据 + 蓝图数据
- **状态**: 启用/禁用、公开/私有

---

## 零件工坊使用指南

### 什么是零件？

零件是可复用的UI组件单元，类似于乐高积木。每个零件包含：

```typescript
interface ComponentPart {
  id: string              // 唯一标识
  name: string            // 显示名称
  description: string     // 描述
  icon: string           // 图标（emoji或URL）
  category: string       // 分类（basic/layout/data/interactive/media/navigation）
  
  // 视觉定义
  visual: {
    base: CSSProperties           // 基础样式
    states: {                      // 状态样式
      default: CSSProperties
      hover: CSSProperties
      active: CSSProperties
      focus: CSSProperties
      disabled: CSSProperties
    }
    animations?: AnimationConfig   // 动画配置
  }
  
  // 行为定义
  behavior: {
    events: EventDefinition[]      // 支持的事件
    dataBinding?: DataBindingConfig // 数据绑定
  }
  
  // 可配置属性
  properties: PropertyDefinition[]
}
```

### 创建零件步骤

#### 步骤1：选择零件类型

| 分类 | 用途 | 示例 |
|------|------|------|
| **basic** | 基础元素 | 按钮、文本、图标 |
| **layout** | 布局容器 | 卡片、网格、弹性布局 |
| **data** | 数据展示 | 表格、图表、列表 |
| **interactive** | 交互组件 | 输入框、下拉菜单、开关 |
| **media** | 媒体元素 | 图片、视频、音频 |
| **navigation** | 导航组件 | 菜单、标签页、面包屑 |

#### 步骤2：设计视觉样式

```typescript
// 示例：彩虹按钮的视觉定义
visual: {
  base: {
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: '500',
    color: '#ffffff',
    cursor: 'pointer'
  },
  states: {
    default: {
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
    },
    hover: {
      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
    },
    active: {
      transform: 'translateY(0)',
      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
    }
  }
}
```

#### 步骤3：定义交互行为

```typescript
behavior: {
  events: [
    {
      name: 'click',           // 事件标识
      label: '点击',           // 显示名称
      description: '点击时触发', // 描述
      actions: []              // 可绑定的动作
    },
    {
      name: 'hover',
      label: '悬停',
      description: '鼠标悬停时触发'
    }
  ],
  dataBinding: {
    supported: true,
    properties: [
      { name: 'text', type: 'string', description: '按钮文字' },
      { name: 'disabled', type: 'boolean', description: '是否禁用' }
    ]
  }
}
```

#### 步骤4：配置可调整属性

```typescript
properties: [
  {
    name: 'text',           // 属性名
    label: '按钮文字',      // 显示标签
    type: 'string',         // 类型：string/number/boolean/select/color
    defaultValue: '按钮',   // 默认值
    placeholder: '输入文字' // 提示文本
  },
  {
    name: 'size',
    label: '尺寸',
    type: 'select',
    defaultValue: 'medium',
    options: [
      { label: '小', value: 'small' },
      { label: '中', value: 'medium' },
      { label: '大', value: 'large' }
    ]
  },
  {
    name: 'backgroundColor',
    label: '背景颜色',
    type: 'color',
    defaultValue: '#3b82f6'
  }
]
```

### 零件分类详解

#### 基础零件 (Basic)

**按钮零件示例：**
```typescript
{
  id: 'button-primary',
  name: '主按钮',
  category: 'basic',
  visual: {
    base: {
      padding: '12px 24px',
      borderRadius: '8px',
      fontWeight: '500',
      textAlign: 'center',
      cursor: 'pointer',
      border: 'none'
    },
    states: {
      default: { backgroundColor: '#3b82f6', color: '#ffffff' },
      hover: { backgroundColor: '#2563eb', transform: 'translateY(-1px)' },
      active: { backgroundColor: '#1d4ed8', transform: 'translateY(0)' },
      disabled: { backgroundColor: '#9ca3af', cursor: 'not-allowed' }
    }
  },
  properties: [
    { name: 'text', label: '文字', type: 'string', defaultValue: '按钮' },
    { name: 'variant', label: '样式', type: 'select', 
      options: [{label: '主要', value: 'primary'}, {label: '次要', value: 'secondary'}] }
  ]
}
```

**文本零件示例：**
```typescript
{
  id: 'text-heading',
  name: '标题文本',
  category: 'basic',
  visual: {
    base: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#1f2937',
      lineHeight: '1.4'
    }
  },
  properties: [
    { name: 'content', label: '内容', type: 'string', defaultValue: '标题' },
    { name: 'level', label: '级别', type: 'select', 
      options: [{label: 'H1', value: '1'}, {label: 'H2', value: '2'}, {label: 'H3', value: '3'}] },
    { name: 'align', label: '对齐', type: 'select',
      options: [{label: '左', value: 'left'}, {label: '中', value: 'center'}, {label: '右', value: 'right'}] }
  ]
}
```

#### 布局零件 (Layout)

**卡片容器示例：**
```typescript
{
  id: 'card-container',
  name: '卡片容器',
  category: 'layout',
  visual: {
    base: {
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    states: {
      hover: {
        boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
        transform: 'translateY(-2px)'
      }
    }
  },
  properties: [
    { name: 'padding', label: '内边距', type: 'select',
      options: [{label: '小', value: '16px'}, {label: '中', value: '24px'}, {label: '大', value: '32px'}] },
    { name: 'shadow', label: '阴影', type: 'select',
      options: [{label: '无', value: 'none'}, {label: '小', value: 'sm'}, {label: '中', value: 'md'}, {label: '大', value: 'lg'}] }
  ]
}
```

**网格布局示例：**
```typescript
{
  id: 'grid-layout',
  name: '网格布局',
  category: 'layout',
  visual: {
    base: {
      display: 'grid',
      gap: '16px'
    }
  },
  properties: [
    { name: 'columns', label: '列数', type: 'number', defaultValue: 3, min: 1, max: 12 },
    { name: 'gap', label: '间距', type: 'string', defaultValue: '16px' },
    { name: 'responsive', label: '响应式', type: 'boolean', defaultValue: true }
  ]
}
```

#### 数据展示零件 (Data)

**数据卡片示例：**
```typescript
{
  id: 'data-card',
  name: '数据卡片',
  category: 'data',
  visual: {
    base: {
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }
  },
  properties: [
    { name: 'title', label: '标题', type: 'string', defaultValue: '数据标题' },
    { name: 'value', label: '数值', type: 'string', defaultValue: '0' },
    { name: 'unit', label: '单位', type: 'string', defaultValue: '' },
    { name: 'trend', label: '趋势', type: 'select',
      options: [{label: '上升', value: 'up'}, {label: '下降', value: 'down'}, {label: '持平', value: 'neutral'}] },
    { name: 'trendValue', label: '变化值', type: 'string', defaultValue: '0%' }
  ]
}
```

**列表组件示例：**
```typescript
{
  id: 'data-list',
  name: '数据列表',
  category: 'data',
  visual: {
    base: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }
  },
  properties: [
    { name: 'dataSource', label: '数据源', type: 'string', placeholder: 'API端点或变量名' },
    { name: 'itemTemplate', label: '项模板', type: 'string', placeholder: '{{name}} - {{value}}' },
    { name: 'showDivider', label: '显示分隔线', type: 'boolean', defaultValue: true }
  ]
}
```

#### 交互组件 (Interactive)

**输入框示例：**
```typescript
{
  id: 'input-text',
  name: '文本输入框',
  category: 'interactive',
  visual: {
    base: {
      padding: '10px 14px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      width: '100%'
    },
    states: {
      focus: {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
      }
    }
  },
  behavior: {
    events: [
      { name: 'change', label: '值改变', description: '输入内容改变时触发' },
      { name: 'focus', label: '获得焦点', description: '获得焦点时触发' },
      { name: 'blur', label: '失去焦点', description: '失去焦点时触发' }
    ]
  },
  properties: [
    { name: 'placeholder', label: '占位符', type: 'string', defaultValue: '请输入...' },
    { name: 'type', label: '类型', type: 'select',
      options: [{label: '文本', value: 'text'}, {label: '密码', value: 'password'}, {label: '数字', value: 'number'}] }
  ]
}
```

---

## 插件构建器使用指南

### 构建器界面说明

```
┌────────────────────────────────────────────────────────────────┐
│  工具栏                                                         │
│  [选择] [抓手] [放大] [缩小] [网格] [预览] [撤销] [重做] [保存]  │
├────────────────┬──────────────────────────────┬────────────────┤
│                │                              │                │
│   零件库        │                              │    属性面板     │
│   ┌──────────┐ │                              │   ┌──────────┐ │
│   │ 🔘 按钮  │ │      ┌──────────────────┐    │   │ 位置      │ │
│   │ 📝 文本  │ │      │                  │    │   │ X: 100    │ │
│   │ 🃏 卡片  │ │      │    画布区域       │    │   │ Y: 200    │ │
│   │ 📊 图表  │ │      │                  │    │   ├──────────┤ │
│   │ 📥 输入  │ │      │   [组件1]        │    │   │ 尺寸      │ │
│   └──────────┘ │      │   [组件2]        │    │   │ W: 200    │ │
│                │      │                  │    │   │ H: 100    │ │
│   分类筛选      │      │                  │    │   ├──────────┤ │
│   [全部] [基础] │      └──────────────────┘    │   │ 样式      │ │
│   [布局] [数据] │                              │   │ 背景色... │ │
│                │                              │   └──────────┘ │
└────────────────┴──────────────────────────────┴────────────────┘
```

### 基础操作流程

#### 1. 创建新插件

```typescript
// 插件基础信息
{
  name: '我的第一个插件',
  description: '这是一个示例插件',
  canvas: {
    width: 800,
    height: 600,
    backgroundColor: '#f3f4f6',
    gridSize: 10,
    snapToGrid: true,
    showGrid: true
  }
}
```

#### 2. 拖拽添加组件

1. 从左侧面板选择零件
2. 拖拽到画布上
3. 组件会自动创建实例

```typescript
// 组件实例结构
{
  id: 'comp_123',           // 唯一ID
  part: ComponentPart,      // 引用的零件
  position: { x: 100, y: 200 },  // 位置
  size: { width: 200, height: 100 }, // 尺寸
  props: {                  // 属性值
    text: '点击我',
    size: 'medium'
  },
  zIndex: 1                 // 层级
}
```

#### 3. 调整组件

**移动组件：**
- 选中组件
- 拖拽到新位置
- 按住 Shift 可精细调整

**调整大小：**
- 选中组件显示调整手柄
- 拖拽角落手柄等比例调整
- 拖拽边缘手柄单向调整

**多选操作：**
- Ctrl/Cmd + 点击多选
- 框选多个组件
- 对齐工具（左对齐、居中、右对齐）
- 分布工具（水平分布、垂直分布）

#### 4. 配置组件属性

选中组件后，在右侧面板可以配置：

```typescript
// 属性配置示例
props: {
  text: '按钮文字',        // 文本属性
  backgroundColor: '#3b82f6',  // 颜色属性
  size: 'large',          // 选择属性
  isVisible: true,        // 布尔属性
  padding: 20             // 数值属性
}
```

#### 5. 保存插件

```typescript
// 保存的插件数据结构
{
  id: 'plugin_123',
  name: '我的插件',
  description: '插件描述',
  icon: '🎯',
  builderData: {
    name: '我的插件',
    description: '插件描述',
    canvas: { width: 800, height: 600, ... },
    components: [...],     // 组件列表
    dataSources: [...],    // 数据源定义
    variables: [...],      // 变量定义
    actions: [...]         // 动作定义
  },
  visibility: 'public',    // public/private/role
  isEnabled: true
}
```

---

## 内置插件复刻教程

### 教程1：复刻【名言插件】

#### 分析原插件结构

原名言插件包含：
1. **前端展示**: 显示每日名言（内容、作者、来源）
2. **后端API**: 获取随机名言、获取每日名言
3. **数据库**: quotes表存储名言数据
4. **管理后台**: 名言管理页面

#### 使用构建器复刻步骤

**步骤1：创建数据模型零件**

```typescript
// 创建 "名言数据卡片" 零件
{
  id: 'quote-card',
  name: '名言卡片',
  category: 'data',
  visual: {
    base: {
      padding: '24px',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.1)'
    }
  },
  properties: [
    { name: 'content', label: '名言内容', type: 'string', defaultValue: '学而时习之，不亦说乎' },
    { name: 'author', label: '作者', type: 'string', defaultValue: '孔子' },
    { name: 'source', label: '出处', type: 'string', defaultValue: '论语' },
    { name: 'showIcon', label: '显示图标', type: 'boolean', defaultValue: true }
  ]
}
```

**步骤2：创建文本零件**

```typescript
// 创建 "名言文本" 零件
{
  id: 'quote-text',
  name: '名言文本',
  category: 'basic',
  visual: {
    base: {
      fontSize: '16px',
      lineHeight: '1.6',
      color: 'rgba(255,255,255,0.9)',
      fontStyle: 'italic'
    }
  },
  properties: [
    { name: 'content', label: '内容', type: 'string' },
    { name: 'align', label: '对齐', type: 'select', defaultValue: 'center' }
  ]
}

// 创建 "作者文本" 零件
{
  id: 'author-text',
  name: '作者文本',
  category: 'basic',
  visual: {
    base: {
      fontSize: '14px',
      color: 'rgba(255,255,255,0.6)',
      textAlign: 'right'
    }
  }
}
```

**步骤3：在构建器中搭建**

1. 新建插件，命名为"每日名言"
2. 拖拽"名言卡片"到画布中央
3. 在卡片内添加"名言文本"和"作者文本"
4. 配置数据源：

```typescript
// 数据源配置
dataSources: [
  {
    id: 'quote-api',
    name: '名言API',
    type: 'api',
    config: {
      endpoint: '/api/quotes/daily',
      method: 'GET',
      refreshInterval: 86400000  // 24小时刷新
    }
  }
]
```

5. 绑定数据：

```typescript
// 数据绑定
components: [
  {
    id: 'quote-text-1',
    part: 'quote-text',
    dataBinding: {
      content: '{{quote-api.content}}'
    }
  },
  {
    id: 'author-text-1',
    part: 'author-text', 
    dataBinding: {
      content: '—— {{quote-api.author}}'
    }
  }
]
```

**步骤4：添加交互**

```typescript
// 添加刷新按钮
{
  id: 'refresh-btn',
  part: 'button-ghost',
  props: { text: '换一条', icon: 'refresh' },
  events: [
    {
      name: 'click',
      action: {
        type: 'refreshData',
        target: 'quote-api'
      }
    }
  ]
}
```

### 教程2：复刻【文件快传插件】

#### 分析原插件结构

1. **前端展示**: 文件上传区域、文件列表、下载按钮
2. **后端API**: 上传文件、获取文件列表、下载文件、删除文件
3. **数据库**: file_transfers表
4. **管理后台**: 文件传输管理

#### 使用构建器复刻步骤

**步骤1：创建上传区域零件**

```typescript
{
  id: 'file-upload-zone',
  name: '文件上传区',
  category: 'interactive',
  visual: {
    base: {
      padding: '40px',
      border: '2px dashed #d1d5db',
      borderRadius: '12px',
      textAlign: 'center',
      backgroundColor: '#f9fafb',
      cursor: 'pointer'
    },
    states: {
      hover: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff'
      },
      dragover: {
        borderColor: '#3b82f6',
        backgroundColor: '#dbeafe'
      }
    }
  },
  behavior: {
    events: [
      { name: 'fileSelect', label: '选择文件' },
      { name: 'fileDrop', label: '拖放文件' }
    ]
  },
  properties: [
    { name: 'accept', label: '允许类型', type: 'string', defaultValue: '*' },
    { name: 'maxSize', label: '最大大小(MB)', type: 'number', defaultValue: 100 },
    { name: 'multiple', label: '多文件', type: 'boolean', defaultValue: true },
    { name: 'text', label: '提示文字', type: 'string', defaultValue: '拖拽文件到此处或点击上传' }
  ]
}
```

**步骤2：创建文件列表零件**

```typescript
{
  id: 'file-list',
  name: '文件列表',
  category: 'data',
  visual: {
    base: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }
  },
  properties: [
    { name: 'dataSource', label: '数据源', type: 'string' },
    { name: 'showSize', label: '显示大小', type: 'boolean', defaultValue: true },
    { name: 'showDate', label: '显示日期', type: 'boolean', defaultValue: true },
    { name: 'allowDelete', label: '允许删除', type: 'boolean', defaultValue: true }
  ]
}
```

**步骤3：创建进度条零件**

```typescript
{
  id: 'progress-bar',
  name: '进度条',
  category: 'data',
  visual: {
    base: {
      height: '8px',
      backgroundColor: '#e5e7eb',
      borderRadius: '4px',
      overflow: 'hidden'
    }
  },
  properties: [
    { name: 'progress', label: '进度(%)', type: 'number', defaultValue: 0, min: 0, max: 100 },
    { name: 'color', label: '颜色', type: 'color', defaultValue: '#3b82f6' },
    { name: 'showText', label: '显示文字', type: 'boolean', defaultValue: true }
  ]
}
```

**步骤4：搭建插件界面**

```typescript
// 插件结构
{
  name: '文件快传',
  canvas: { width: 600, height: 500 },
  components: [
    // 标题
    { id: 'title', part: 'text-heading', props: { content: '文件快传', level: '2' } },
    
    // 上传区域
    { id: 'upload-zone', part: 'file-upload-zone', position: { x: 20, y: 60 } },
    
    // 进度条（默认隐藏）
    { id: 'progress', part: 'progress-bar', position: { x: 20, y: 200 }, props: { progress: 0 } },
    
    // 文件列表
    { id: 'file-list', part: 'file-list', position: { x: 20, y: 240 } }
  ],
  
  dataSources: [
    {
      id: 'files-api',
      name: '文件列表',
      type: 'api',
      config: {
        endpoint: '/api/file-transfers',
        method: 'GET'
      }
    }
  ],
  
  actions: [
    {
      id: 'upload-action',
      name: '上传文件',
      type: 'api',
      config: {
        endpoint: '/api/file-transfers',
        method: 'POST'
      }
    },
    {
      id: 'delete-action',
      name: '删除文件',
      type: 'api',
      config: {
        endpoint: '/api/file-transfers/{{id}}',
        method: 'DELETE'
      }
    }
  ]
}
```

### 教程3：复刻【RSS订阅插件】

#### 分析原插件结构

1. **前端展示**: RSS源列表、文章列表、文章详情
2. **后端API**: 管理RSS源、获取文章、标记已读
3. **数据库**: rss_feeds表、rss_articles表
4. **管理后台**: RSS源管理

#### 使用构建器复刻步骤

**步骤1：创建RSS源列表零件**

```typescript
{
  id: 'rss-feed-list',
  name: 'RSS源列表',
  category: 'data',
  visual: {
    base: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      maxHeight: '300px',
      overflowY: 'auto'
    }
  },
  properties: [
    { name: 'dataSource', label: '数据源', type: 'string' },
    { name: 'showUnreadCount', label: '显示未读数', type: 'boolean', defaultValue: true },
    { name: 'activeColor', label: '选中颜色', type: 'color', defaultValue: '#3b82f6' }
  ]
}
```

**步骤2：创建文章列表零件**

```typescript
{
  id: 'rss-article-list',
  name: 'RSS文章列表',
  category: 'data',
  visual: {
    base: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }
  },
  properties: [
    { name: 'dataSource', label: '数据源', type: 'string' },
    { name: 'showSummary', label: '显示摘要', type: 'boolean', defaultValue: true },
    { name: 'maxSummaryLength', label: '摘要长度', type: 'number', defaultValue: 100 }
  ]
}
```

**步骤3：搭建RSS阅读器**

```typescript
{
  name: 'RSS订阅',
  canvas: { width: 900, height: 600 },
  components: [
    // 左侧源列表
    { 
      id: 'feed-list', 
      part: 'rss-feed-list', 
      position: { x: 0, y: 0 },
      size: { width: 200, height: 600 }
    },
    
    // 右侧文章列表
    { 
      id: 'article-list', 
      part: 'rss-article-list', 
      position: { x: 220, y: 0 },
      size: { width: 680, height: 600 }
    }
  ],
  
  dataSources: [
    {
      id: 'feeds-api',
      name: 'RSS源',
      type: 'api',
      config: { endpoint: '/api/rss/feeds', method: 'GET' }
    },
    {
      id: 'articles-api',
      name: '文章列表',
      type: 'api',
      config: { 
        endpoint: '/api/rss/articles?feedId={{selectedFeed}}',
        method: 'GET'
      }
    }
  ],
  
  variables: [
    { name: 'selectedFeed', defaultValue: null },
    { name: 'selectedArticle', defaultValue: null }
  ]
}
```

---

## 数据流与API集成

### 数据流架构

```
┌─────────────────────────────────────────────────────────────┐
│                        数据流图                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐          │
│   │  数据源   │────▶│  变量池   │────▶│  组件属性 │          │
│   │ DataSource│     │ Variables │     │  Props   │          │
│   └──────────┘     └──────────┘     └──────────┘          │
│        │                  │                  │             │
│        │                  │                  │             │
│        ▼                  ▼                  ▼             │
│   ┌──────────────────────────────────────────────────┐    │
│   │                    后端API                        │    │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐          │    │
│   │  │ GET     │  │ POST    │  │ DELETE  │          │    │
│   │  │ /api/xx │  │ /api/xx │  │ /api/xx │          │    │
│   │  └─────────┘  └─────────┘  └─────────┘          │    │
│   └──────────────────────────────────────────────────┘    │
│                          │                                 │
│                          ▼                                 │
│   ┌──────────────────────────────────────────────────┐    │
│   │                   数据库                          │    │
│   │         SQLite / PostgreSQL / MySQL              │    │
│   └──────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 数据源配置

#### API数据源

```typescript
{
  id: 'users-api',
  name: '用户列表',
  type: 'api',
  config: {
    endpoint: '/api/users',
    method: 'GET',
    headers: {},
    params: {},
    refreshInterval: 0,        // 自动刷新间隔（毫秒），0表示不自动刷新
    transform: 'data.users'    // 数据转换路径
  }
}
```

#### 变量数据源

```typescript
{
  id: 'local-state',
  name: '本地状态',
  type: 'variable',
  config: {
    initialValue: {},
    persist: true              // 是否持久化到localStorage
  }
}
```

#### 静态数据源

```typescript
{
  id: 'static-data',
  name: '静态数据',
  type: 'static',
  config: {
    data: [
      { id: 1, name: '选项1' },
      { id: 2, name: '选项2' }
    ]
  }
}
```

### 数据绑定语法

#### 基础绑定

```typescript
// 直接绑定
props: {
  text: '{{users-api.name}}',
  count: '{{users-api.length}}'
}

// 表达式绑定
props: {
  text: '共 {{users-api.length}} 条记录',
  visible: '{{users-api.length}} > 0'
}

// 条件绑定
props: {
  color: '{{users-api.status}} === "active" ? "#10b981" : "#ef4444"'
}
```

#### 列表渲染

```typescript
// 列表组件数据绑定
{
  id: 'user-list',
  part: 'data-list',
  dataBinding: {
    items: '{{users-api}}',
    itemTemplate: {
      title: '{{name}}',
      subtitle: '{{email}}',
      avatar: '{{avatar}}'
    }
  }
}
```

### 动作系统

#### 动作类型

```typescript
// API调用动作
{
  id: 'fetch-users',
  name: '获取用户',
  type: 'api',
  config: {
    endpoint: '/api/users',
    method: 'GET',
    targetDataSource: 'users-api'  // 结果存储到数据源
  }
}

// 变量更新动作
{
  id: 'set-selected',
  name: '设置选中',
  type: 'setVariable',
  config: {
    variable: 'selectedUser',
    value: '{{event.payload}}'
  }
}

// 页面跳转动作
{
  id: 'navigate-detail',
  name: '查看详情',
  type: 'navigate',
  config: {
    url: '/user/{{selectedUser.id}}',
    target: '_blank'
  }
}

// 条件动作
{
  id: 'conditional-action',
  name: '条件执行',
  type: 'condition',
  config: {
    condition: '{{user.role}} === "admin"',
    trueAction: 'show-admin-panel',
    falseAction: 'show-access-denied'
  }
}
```

#### 事件绑定

```typescript
// 组件事件绑定
{
  id: 'user-card',
  part: 'data-card',
  events: [
    {
      name: 'click',
      actions: ['set-selected', 'navigate-detail']
    },
    {
      name: 'hover',
      actions: ['preview-user']
    }
  ]
}
```

---

## 最佳实践

### 1. 零件设计原则

#### 单一职责
- 每个零件只做一件事
- 按钮只负责点击，不处理数据加载
- 卡片只负责布局，不处理业务逻辑

#### 可配置性
- 提供合理的默认值
- 关键样式可配置（颜色、大小、间距）
- 支持数据绑定

#### 状态完整
- 定义所有必要的状态（default/hover/active/focus/disabled）
- 状态切换要有视觉反馈
- 考虑无障碍访问

### 2. 插件设计原则

#### 模块化
- 将复杂插件拆分为多个小组件
- 使用容器组件管理状态
- 展示组件只负责渲染

#### 数据驱动
- 明确数据源和流向
- 避免组件间直接通信
- 通过变量池共享状态

#### 响应式
- 考虑不同屏幕尺寸
- 使用相对单位（%、vw、vh）
- 测试移动端显示效果

### 3. 性能优化

#### 数据加载
- 使用分页加载大数据列表
- 图片懒加载
- 数据缓存和防抖

```typescript
{
  id: 'large-list',
  type: 'api',
  config: {
    endpoint: '/api/items',
    method: 'GET',
    pagination: {
      enabled: true,
      pageSize: 20,
      pageParam: 'page'
    },
    cache: {
      enabled: true,
      ttl: 300000  // 5分钟
    }
  }
}
```

#### 渲染优化
- 虚拟滚动长列表
- 组件懒加载
- 避免不必要的重渲染

### 4. 调试技巧

#### 使用预览模式
- 构建器中的预览功能
- 检查数据绑定是否正确
- 验证交互流程

#### 查看数据流
- 开启调试模式查看变量变化
- 监控API请求和响应
- 检查动作执行顺序

#### 常见问题排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 数据不显示 | 绑定路径错误 | 检查数据源ID和字段名 |
| 样式不生效 | CSS优先级问题 | 使用!important或提高选择器权重 |
| 事件不触发 | 事件名不匹配 | 检查零件定义的事件名 |
| API报错 | 参数错误 | 检查请求参数和认证信息 |

### 5. 发布与分享

#### 零件发布
1. 在零件工坊完成设计
2. 填写元数据（名称、描述、标签）
3. 设置可见性（公开/私有）
4. 发布到零件市场

#### 插件发布
1. 在构建器中完成搭建
2. 测试所有功能
3. 配置插件信息
4. 选择发布范围（公开/指定角色）
5. 提交审核（如需要）

---

## 快速参考卡片

### 常用CSS属性

```typescript
// 布局
{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }

// 间距
{ padding: '16px', margin: '8px', gap: '12px' }

// 外观
{ backgroundColor: '#3b82f6', color: '#ffffff', borderRadius: '8px' }

// 文字
{ fontSize: '14px', fontWeight: '500', textAlign: 'center' }

// 效果
{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)', opacity: 0.8, transform: 'scale(1.05)' }
```

### 常用事件

| 事件名 | 触发时机 | 常用场景 |
|--------|----------|----------|
| click | 点击时 | 按钮、链接、卡片 |
| hover | 悬停时 | 提示、预览 |
| change | 值改变时 | 输入框、选择器 |
| focus/blur | 获得/失去焦点 | 表单验证 |
| submit | 提交时 | 表单 |
| load | 加载完成时 | 图片、数据 |

### 数据绑定表达式

```typescript
// 简单绑定
'{{data.field}}'

// 条件表达式
'{{data.status}} === "active" ? "启用" : "禁用"'

// 计算表达式
'{{data.price}} * {{data.quantity}}'

// 字符串拼接
'{{data.firstName}} {{data.lastName}}'

// 数组长度
'{{data.items.length}}'

// 默认值
'{{data.name}} || "未命名"'
```

---

## 示例：完整插件配置

```typescript
// 一个完整的待办事项插件
{
  name: '待办事项',
  description: '简单的任务管理插件',
  icon: '✅',
  
  canvas: {
    width: 400,
    height: 500,
    backgroundColor: '#ffffff'
  },
  
  components: [
    {
      id: 'header',
      part: 'text-heading',
      position: { x: 20, y: 20 },
      props: { content: '待办事项', level: '2' }
    },
    {
      id: 'input',
      part: 'input-text',
      position: { x: 20, y: 70 },
      size: { width: 280, height: 40 },
      props: { placeholder: '添加新任务...' }
    },
    {
      id: 'add-btn',
      part: 'button-primary',
      position: { x: 310, y: 70 },
      size: { width: 70, height: 40 },
      props: { text: '添加' }
    },
    {
      id: 'list',
      part: 'todo-list',
      position: { x: 20, y: 130 },
      size: { width: 360, height: 350 }
    }
  ],
  
  dataSources: [
    {
      id: 'todos',
      name: '任务列表',
      type: 'api',
      config: {
        endpoint: '/api/todos',
        method: 'GET'
      }
    }
  ],
  
  variables: [
    { name: 'newTaskText', defaultValue: '' },
    { name: 'editingId', defaultValue: null }
  ],
  
  actions: [
    {
      id: 'add-todo',
      name: '添加任务',
      type: 'api',
      config: {
        endpoint: '/api/todos',
        method: 'POST',
        body: { text: '{{newTaskText}}' }
      }
    },
    {
      id: 'toggle-todo',
      name: '切换状态',
      type: 'api',
      config: {
        endpoint: '/api/todos/{{id}}',
        method: 'PATCH',
        body: { completed: '{{completed}}' }
      }
    },
    {
      id: 'delete-todo',
      name: '删除任务',
      type: 'api',
      config: {
        endpoint: '/api/todos/{{id}}',
        method: 'DELETE'
      }
    }
  ]
}
```

---

## 结语

通过零件工坊和插件构建器，你可以：

1. **像搭积木一样创建UI** - 拖拽零件，配置属性
2. **零代码实现数据交互** - 配置数据源，绑定变量
3. **快速复刻现有功能** - 分析结构，选择零件，搭建界面
4. **发布和分享** - 将作品发布到市场，与他人共享

记住：**零件是原子，插件是分子**。先设计好原子，再用原子构建分子，最后用分子组成完整的应用！

祝你构建愉快！🎉
