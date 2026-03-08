import { Category } from '../types/bookmark'

export interface CategoryNode extends Category {
  children: CategoryNode[]
  level: number
  isLeaf: boolean
}

/**
 * 将平铺的分类列表转换为树形结构
 */
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const categoryMap = new Map<string, CategoryNode>()
  const rootCategories: CategoryNode[] = []

  // 首先创建所有节点的映射
  categories.forEach(cat => {
    categoryMap.set(cat.id, {
      ...cat,
      children: [],
      level: 0,
      isLeaf: true,
    })
  })

  // 构建树形结构
  categories.forEach(cat => {
    const node = categoryMap.get(cat.id)!
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      const parent = categoryMap.get(cat.parentId)!
      node.level = parent.level + 1
      parent.children.push(node)
      parent.isLeaf = false
    } else {
      rootCategories.push(node)
    }
  })

  // 按 orderIndex 排序
  const sortByOrder = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
    nodes.forEach(node => sortByOrder(node.children))
  }
  sortByOrder(rootCategories)

  return rootCategories
}

/**
 * 将树形结构扁平化为列表（用于遍历）
 */
export function flattenCategoryTree(nodes: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = []

  const traverse = (nodeList: CategoryNode[]) => {
    nodeList.forEach(node => {
      result.push(node)
      if (node.children.length > 0) {
        traverse(node.children)
      }
    })
  }

  traverse(nodes)
  return result
}

/**
 * 获取所有子分类ID（包括间接子分类）
 */
export function getAllChildrenIds(categories: Category[], parentId: string): string[] {
  const result: string[] = []
  const categoryMap = new Map(categories.map(c => [c.id, c]))

  const findChildren = (pid: string) => {
    categories
      .filter(c => c.parentId === pid)
      .forEach(child => {
        result.push(child.id)
        findChildren(child.id)
      })
  }

  findChildren(parentId)
  return result
}

/**
 * 获取分类的完整路径名称
 */
export function getCategoryFullPath(
  categories: Category[],
  categoryId: string,
  separator: string = ' / '
): string {
  const categoryMap = new Map(categories.map(c => [c.id, c]))
  const paths: string[] = []

  let current = categoryMap.get(categoryId)
  while (current) {
    paths.unshift(current.name)
    current = current.parentId ? categoryMap.get(current.parentId) : undefined
  }

  return paths.join(separator)
}
