import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import {
  defaultTransactionFormValues,
  transactionFormSchema,
  transformApiToTransactionForm,
  transformTransactionFormToApi,
} from "@axori/shared"

import type { TransactionFormData } from "@axori/shared"

import type { FieldErrors } from "@/lib/form-utils"
import { formatZodErrors } from "@/lib/form-utils"


import {
  useCreateTransaction,
  usePropertyTransaction,
  useUpdateTransaction,
} from "@/hooks/api/useTransactions"

interface UseTransactionFormOptions {
  propertyId: string
  transactionId?: string // If provided, we're in edit mode
  onSuccess?: () => void
  onClose?: () => void
}

/**
 * Custom hook for transaction form management with Zod validation.
 *
 * Provides:
 * - Form state management via TanStack Form
 * - Zod schema validation on change
 * - Create/update transaction mutations
 * - Automatic form population when editing
 * - Field-level error tracking
 *
 * @example
 * ```tsx
 * const { form, handleSubmit, getFieldError, isPending } = useTransactionForm({
 *   propertyId: "uuid",
 *   transactionId: "uuid", // optional, for edit mode
 *   onSuccess: () => console.log("Saved!"),
 *   onClose: () => setDrawerOpen(false),
 * })
 * ```
 */
export function useTransactionForm({
  propertyId,
  transactionId,
  onSuccess,
  onClose,
}: UseTransactionFormOptions) {
  const isEditMode = !!transactionId
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  // Mutations
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()

  // Fetch existing transaction data when editing
  const { data: existingTransaction } = usePropertyTransaction(
    propertyId,
    transactionId || null
  )

  // Create the form - following pattern from useOnboardingForm
  const form = useForm({
    defaultValues: defaultTransactionFormValues,
    validators: {
      onChange: ({ value }) => {
        const result = transactionFormSchema.safeParse(value)
        if (!result.success) {
          const errors = formatZodErrors(result.error)
          setFieldErrors(errors)
          // Return a single string for TanStack Form's form-level error
          return result.error.issues.map((err) => err.message).join(", ")
        }
        setFieldErrors({})
        return undefined
      },
    },
  })

  // Populate form when editing existing transaction
  useEffect(() => {
    if (existingTransaction && isEditMode) {
      const formData = transformApiToTransactionForm(
        existingTransaction as unknown as Record<string, unknown>
      )
      form.reset(formData)
      setFieldErrors({})
      setSubmitError(null)
    }
  }, [existingTransaction, isEditMode, form])

  // Reset form when opening in create mode (transactionId becomes undefined)
  useEffect(() => {
    if (!isEditMode) {
      form.reset(defaultTransactionFormValues)
      setFieldErrors({})
      setSubmitError(null)
    }
  }, [isEditMode, form])

  // Get error for a specific field
  const getFieldError = (
    fieldName: keyof TransactionFormData
  ): string | undefined => {
    return fieldErrors[fieldName]
  }

  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    setSubmitError(null)

    const formValues = form.state.values

    // Validate the form data
    const result = transactionFormSchema.safeParse(formValues)
    if (!result.success) {
      const errors = formatZodErrors(result.error)
      setFieldErrors(errors)
      return
    }

    try {
      // Transform form data to API format
      const apiData = transformTransactionFormToApi(result.data)

      if (isEditMode && transactionId) {
        await updateTransaction.mutateAsync({
          propertyId,
          transactionId,
          id: transactionId,
          ...apiData,
        } as Parameters<typeof updateTransaction.mutateAsync>[0])
      } else {
        await createTransaction.mutateAsync({
          propertyId,
          ...apiData,
        } as Parameters<typeof createTransaction.mutateAsync>[0])
      }

      onSuccess?.()
      onClose?.()
    } catch (error) {
      console.error("Error saving transaction:", error)
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to save transaction. Please try again."
      )
    }
  }

  return {
    form,
    isEditMode,
    isPending: createTransaction.isPending || updateTransaction.isPending,
    submitError,
    setSubmitError,
    handleSubmit,
    getFieldError,
    fieldErrors,
  }
}

export type TransactionForm = ReturnType<typeof useTransactionForm>
