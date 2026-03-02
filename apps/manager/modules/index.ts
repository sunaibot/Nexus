import { ModuleManager } from '../core/module-system'
import BookmarksModule from './bookmarks'
import CategoriesModule from './categories'
import { SettingsModule } from './settings'
import IconsModule from './icons'
import HealthCheckModule from './health-check'
import SystemMonitorModule from './system-monitor'
import AnalyticsModule from './analytics'
import QuotesModule from './quotes'
import PluginsModule from './plugins'
import MenusModule from './menus'
import UsersModule from './users'
import { ThemeModule } from './theme'
import FileTransferModule from './file-transfer'
import RssModule from './rss'
import NotesModule from './notes'
import SystemConfigsModule from './system-configs'

export const modules = [
  BookmarksModule,
  CategoriesModule,
  SettingsModule,
  IconsModule,
  HealthCheckModule,
  SystemMonitorModule,
  AnalyticsModule,
  QuotesModule,
  PluginsModule,
  MenusModule,
  UsersModule,
  ThemeModule,
  FileTransferModule,
  RssModule,
  NotesModule,
  SystemConfigsModule,
]

export function registerAllModules(moduleManager: ModuleManager) {
  modules.forEach(module => {
    moduleManager.register(module)
  })
}

export {
  BookmarksModule,
  CategoriesModule,
  SettingsModule,
  IconsModule,
  HealthCheckModule,
  SystemMonitorModule,
  AnalyticsModule,
  QuotesModule,
  PluginsModule,
  MenusModule,
  UsersModule,
  ThemeModule,
  FileTransferModule,
  RssModule,
  NotesModule,
  SystemConfigsModule,
}
