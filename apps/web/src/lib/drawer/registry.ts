/**
 * Drawer Registry
 *
 * Centralized registry mapping drawer names to their components, schemas,
 * and permission requirements. This enables type-safe drawer management
 * from anywhere in the application.
 *
 * @see AXO-93 - URL-Based Drawer Factory
 */

import { z } from 'zod'
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { PortfolioRole } from '@axori/permissions'

/**
 * Permission requirement for a drawer
 * - 'none' = publicly accessible (still requires authentication)
 * - 'viewer' | 'member' | 'admin' | 'owner' = minimum role required
 */
export type DrawerPermission = 'none' | PortfolioRole

/**
 * Common props that all drawer components must accept
 */
export interface DrawerComponentProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Base entry for drawer registry
 */
export interface DrawerRegistryEntry<TParams extends z.ZodTypeAny = z.ZodTypeAny> {
  /** The drawer component (lazy loaded) */
  component: LazyExoticComponent<ComponentType<DrawerComponentProps & z.infer<TParams>>>
  /** Zod schema for validating URL params */
  paramsSchema: TParams
  /** Required permission level */
  permission: DrawerPermission
  /** Human-readable display name for errors/logging */
  displayName: string
}

// =============================================================================
// PARAM SCHEMAS
// =============================================================================

/**
 * Schema for property-based drawers (most common)
 */
export const propertyDrawerParamsSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
})

/**
 * Schema for loan drawer (property + optional loanId for edit mode)
 */
export const loanDrawerParamsSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  loanId: z.string().optional(),
})

/**
 * Schema for transaction drawer (property + optional transactionId for edit mode)
 */
export const transactionDrawerParamsSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  transactionId: z.string().optional(),
})

/**
 * Schema for bank account drawer
 */
export const bankAccountDrawerParamsSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  bankAccountId: z.string().optional(),
})


// =============================================================================
// DRAWER NAMES (for type safety)
// =============================================================================

/**
 * All valid drawer names in the application
 *
 * Note: LearningHubDrawer is not included as it requires data (snippets)
 * that cannot be passed via URL params. It uses local state management.
 */
export const DRAWER_NAMES = [
  // Settings Drawers
  'asset-config',
  'acquisition',
  'presumptions',
  'notifications',
  // Financials Drawers
  'add-loan',
  'add-transaction',
  'operating-expenses',
  'rental-income',
  'connect-bank-account',
  'property-acquisition',
  'valuation',
] as const

export type DrawerName = (typeof DRAWER_NAMES)[number]

// =============================================================================
// DRAWER REGISTRY
// =============================================================================

/**
 * Map of drawer names to their configurations
 * Components are lazy loaded for code splitting
 */
export const DRAWER_REGISTRY: Record<DrawerName, DrawerRegistryEntry<any>> = {
  // ==========================================================================
  // Settings Drawers
  // ==========================================================================
  'asset-config': {
    component: lazy(() =>
      import('@/components/drawers/AssetConfigurationDrawer').then((m) => ({
        default: m.AssetConfigurationDrawer,
      }))
    ),
    paramsSchema: propertyDrawerParamsSchema,
    permission: 'member',
    displayName: 'Asset Configuration',
  },

  'acquisition': {
    component: lazy(() =>
      import('@/components/drawers/AcquisitionMetadataDrawer').then((m) => ({
        default: m.AcquisitionMetadataDrawer,
      }))
    ),
    paramsSchema: propertyDrawerParamsSchema,
    permission: 'member',
    displayName: 'Acquisition Metadata',
  },

  'presumptions': {
    component: lazy(() =>
      import('@/components/drawers/CalculationPresumptionsDrawer').then((m) => ({
        default: m.CalculationPresumptionsDrawer,
      }))
    ),
    paramsSchema: propertyDrawerParamsSchema,
    permission: 'member',
    displayName: 'Calculation Presumptions',
  },

  'notifications': {
    component: lazy(() =>
      import('@/components/drawers/NotificationSettingsDrawer').then((m) => ({
        default: m.NotificationSettingsDrawer,
      }))
    ),
    paramsSchema: propertyDrawerParamsSchema,
    permission: 'member',
    displayName: 'Notification Settings',
  },

  // ==========================================================================
  // Financials Drawers
  // ==========================================================================
  'add-loan': {
    component: lazy(() =>
      import('@/components/drawers/AddLoanDrawer').then((m) => ({
        default: m.AddLoanDrawer,
      }))
    ),
    paramsSchema: loanDrawerParamsSchema,
    permission: 'member',
    displayName: 'Add/Edit Loan',
  },

  'add-transaction': {
    component: lazy(() =>
      import('@/components/drawers/AddTransactionDrawer').then((m) => ({
        default: m.AddTransactionDrawer,
      }))
    ),
    paramsSchema: transactionDrawerParamsSchema,
    permission: 'member',
    displayName: 'Add/Edit Transaction',
  },

  'operating-expenses': {
    component: lazy(() =>
      import('@/components/drawers/OperatingExpensesDrawer').then((m) => ({
        default: m.OperatingExpensesDrawer,
      }))
    ),
    paramsSchema: propertyDrawerParamsSchema,
    permission: 'member',
    displayName: 'Operating Expenses',
  },

  'rental-income': {
    component: lazy(() =>
      import('@/components/drawers/RentalIncomeDrawer').then((m) => ({
        default: m.RentalIncomeDrawer,
      }))
    ),
    paramsSchema: propertyDrawerParamsSchema,
    permission: 'member',
    displayName: 'Rental Income',
  },

  'connect-bank-account': {
    component: lazy(() =>
      import('@/components/drawers/BankAccountConnectionDrawer').then((m) => ({
        default: m.BankAccountConnectionDrawer,
      }))
    ),
    paramsSchema: bankAccountDrawerParamsSchema,
    permission: 'admin',
    displayName: 'Connect Bank Account',
  },

  'property-acquisition': {
    component: lazy(() =>
      import('@/components/drawers/PropertyAcqusitionDrawer').then((m) => ({
        default: m.PropertyAcquisitionDrawer,
      }))
    ),
    paramsSchema: propertyDrawerParamsSchema,
    permission: 'member',
    displayName: 'Property Acquisition',
  },

  'valuation': {
    component: lazy(() =>
      import('@/components/drawers/ValuationDrawer').then((m) => ({
        default: m.ValuationDrawer,
      }))
    ),
    paramsSchema: propertyDrawerParamsSchema,
    permission: 'member',
    displayName: 'Property Valuation',
  },
}

// =============================================================================
// TYPE HELPERS
// =============================================================================

/**
 * Get the params type for a specific drawer
 */
export type DrawerParams<T extends DrawerName> = z.infer<
  (typeof DRAWER_REGISTRY)[T]['paramsSchema']
>

/**
 * Check if a string is a valid drawer name
 */
export function isValidDrawerName(name: string): name is DrawerName {
  return DRAWER_NAMES.includes(name as DrawerName)
}

/**
 * Get a drawer entry from the registry
 * Returns null if the drawer doesn't exist
 */
export function getDrawerEntry(name: string): DrawerRegistryEntry | null {
  if (!isValidDrawerName(name)) {
    return null
  }
  return DRAWER_REGISTRY[name] ?? null
}

/**
 * Validate drawer params against the schema
 * Returns the parsed params or null if validation fails
 */
export function validateDrawerParams<T extends DrawerName>(
  name: T,
  params: Record<string, unknown>
): DrawerParams<T> | null {
  const entry = getDrawerEntry(name)
  if (!entry) {
    return null
  }

  const result = entry.paramsSchema.safeParse(params)
  if (!result.success) {
    console.warn(`[DrawerRegistry] Invalid params for drawer "${name}":`, result.error.errors)
    return null
  }

  return result.data
}
