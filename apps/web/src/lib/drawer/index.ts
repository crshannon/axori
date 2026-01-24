/**
 * Drawer Factory Module
 *
 * Centralized drawer management system that allows any drawer to be opened
 * from anywhere in the application via URL query params.
 *
 * @see AXO-93 - URL-Based Drawer Factory
 */

export {
  // Registry
  DRAWER_REGISTRY,
  DRAWER_NAMES,
  // Schemas
  propertyDrawerParamsSchema,
  loanDrawerParamsSchema,
  transactionDrawerParamsSchema,
  bankAccountDrawerParamsSchema,
  // Types
  type DrawerName,
  type DrawerParams,
  type DrawerPermission,
  type DrawerRegistryEntry,
  type DrawerComponentProps,
  // Utilities
  isValidDrawerName,
  getDrawerEntry,
  validateDrawerParams,
} from './registry'

export {
  // Hook
  useDrawer,
  // Types
  type UseDrawerResult,
  type OpenDrawerOptions,
} from './useDrawer'

export {
  // Provider
  DrawerProvider,
  DrawerRenderer,
} from './DrawerProvider'
