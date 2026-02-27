import { Layout } from 'lucide-react'
import DockConfigsPage from './pages/DockConfigsPage'

export const dockModule = {
  id: 'dock',
  name: 'Dock配置',
  icon: Layout,
  path: 'dock',
  component: DockConfigsPage,
  order: 15,
}

export default DockConfigsPage
