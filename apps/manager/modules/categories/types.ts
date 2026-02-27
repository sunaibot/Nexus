export interface CategoriesModuleConfig {
  enableNestedCategories: boolean
  maxCategoryDepth: number
  defaultIcon: string
  defaultColor: string
}

export const defaultCategoriesConfig: CategoriesModuleConfig = {
  enableNestedCategories: true,
  maxCategoryDepth: 3,
  defaultIcon: 'folder',
  defaultColor: '#667eea',
}
