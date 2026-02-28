/**
 * UI 组件库导出
 * 包含所有可复用的UI组件
 */

// 动画组件
export { AnimatedNumber } from './AnimatedNumber'

// 3D效果组件
export { Card3D } from './3d-card'

// 高级效果组件
export {
  MovingBorder,
  Button,
} from './moving-border'

// 背景效果
export { BackgroundBeamsWithCollision } from './background-beams-with-collision'
export { AuroraBackground } from './aurora-background'

// Bento Grid
export { BentoGrid, BentoGridItem } from './bento-grid'

// 效果组件
export {
  Meteors,
  Sparkles,
} from './effects'

// 浮动Dock
export { FloatingDock } from './floating-dock'
export { MobileFloatingDock } from './mobile-floating-dock'

// 懒加载组件
export {
  LazyImage,
  BlurImage,
} from './LazyImage'

export {
  createLazyComponent,
  InViewLazy,
  prefetchComponent,
  usePrefetch,
  type LazyComponentOptions,
  type LoadingProps,
  type ErrorProps,
} from './LazyComponent'

// 滚动到顶部
export { ScrollToTop } from './scroll-to-top'

// 侧边栏导航
export { SidebarNav } from './sidebar-nav'

// 聚光灯效果
export { SpotlightCard } from './spotlight-card'
export { SpotlightSearch } from './spotlight-search'

// 打字机效果
export { Typewriter } from './typewriter'

// 高级效果
export {
  BorderBeam,
} from './advanced-effects'
