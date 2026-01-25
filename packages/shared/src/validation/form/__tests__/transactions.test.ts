import { describe, it, expect } from "vitest"
import {
  transactionFormSchema,
  defaultTransactionFormValues,
  transformTransactionFormToApi,
  transformApiToTransactionForm,
  type TransactionFormData,
} from "../transactions"

describe("transactionFormSchema", () => {
  describe("valid transactions", () => {
    it("validates a valid expense transaction", () => {
      const validExpense: TransactionFormData = {
        ...defaultTransactionFormValues,
        type: "expense",
        transactionDate: "2024-01-15",
        amount: "100.50",
        category: "repairs",
        vendor: "Home Depot",
      }

      const result = transactionFormSchema.safeParse(validExpense)
      expect(result.success).toBe(true)
    })

    it("validates a valid income transaction", () => {
      const validIncome: TransactionFormData = {
        ...defaultTransactionFormValues,
        type: "income",
        transactionDate: "2024-01-15",
        amount: "1500.00",
        category: "rent",
        payer: "John Tenant",
      }

      const result = transactionFormSchema.safeParse(validIncome)
      expect(result.success).toBe(true)
    })

    it("validates a valid capital transaction", () => {
      const validCapital: TransactionFormData = {
        ...defaultTransactionFormValues,
        type: "capital",
        transactionDate: "2024-01-15",
        amount: "5000.00",
        category: "other",
      }

      const result = transactionFormSchema.safeParse(validCapital)
      expect(result.success).toBe(true)
    })

    it("accepts all optional fields", () => {
      const fullTransaction: TransactionFormData = {
        type: "expense",
        transactionDate: "2024-01-15",
        amount: "250.00",
        category: "maintenance",
        subcategory: "HVAC",
        vendor: "Cool Air Inc",
        payer: "",
        description: "Annual AC servicing",
        notes: "Filter replaced",
        taxCategory: "Maintenance",
        isTaxDeductible: true,
        isRecurring: true,
        isExcluded: false,
      }

      const result = transactionFormSchema.safeParse(fullTransaction)
      expect(result.success).toBe(true)
    })
  })

  describe("required field validation", () => {
    it("requires transaction date", () => {
      const noDate = {
        ...defaultTransactionFormValues,
        type: "expense" as const,
        transactionDate: "",
        amount: "100",
        category: "repairs",
        vendor: "Test",
      }

      const result = transactionFormSchema.safeParse(noDate)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("transactionDate"))).toBe(
          true
        )
      }
    })

    it("requires amount", () => {
      const noAmount = {
        ...defaultTransactionFormValues,
        type: "expense" as const,
        transactionDate: "2024-01-15",
        amount: "",
        category: "repairs",
        vendor: "Test",
      }

      const result = transactionFormSchema.safeParse(noAmount)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("amount"))).toBe(true)
      }
    })

    it("requires category", () => {
      const noCategory = {
        ...defaultTransactionFormValues,
        type: "expense" as const,
        transactionDate: "2024-01-15",
        amount: "100",
        category: "",
        vendor: "Test",
      }

      const result = transactionFormSchema.safeParse(noCategory)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("category"))).toBe(true)
      }
    })
  })

  describe("amount validation", () => {
    it("rejects negative amount", () => {
      const negativeAmount = {
        ...defaultTransactionFormValues,
        type: "expense" as const,
        transactionDate: "2024-01-15",
        amount: "-50",
        category: "repairs",
        vendor: "Test",
      }

      const result = transactionFormSchema.safeParse(negativeAmount)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("amount"))).toBe(true)
      }
    })

    it("rejects zero amount", () => {
      const zeroAmount = {
        ...defaultTransactionFormValues,
        type: "expense" as const,
        transactionDate: "2024-01-15",
        amount: "0",
        category: "repairs",
        vendor: "Test",
      }

      const result = transactionFormSchema.safeParse(zeroAmount)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("amount"))).toBe(true)
      }
    })

    it("rejects non-numeric amount", () => {
      const invalidAmount = {
        ...defaultTransactionFormValues,
        type: "expense" as const,
        transactionDate: "2024-01-15",
        amount: "abc",
        category: "repairs",
        vendor: "Test",
      }

      const result = transactionFormSchema.safeParse(invalidAmount)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("amount"))).toBe(true)
      }
    })

    it("accepts decimal amounts", () => {
      const decimalAmount = {
        ...defaultTransactionFormValues,
        type: "expense" as const,
        transactionDate: "2024-01-15",
        amount: "99.99",
        category: "repairs",
        vendor: "Test",
      }

      const result = transactionFormSchema.safeParse(decimalAmount)
      expect(result.success).toBe(true)
    })
  })

  describe("date validation", () => {
    it("requires YYYY-MM-DD format", () => {
      const invalidDate = {
        ...defaultTransactionFormValues,
        type: "expense" as const,
        transactionDate: "01/15/2024",
        amount: "100",
        category: "repairs",
        vendor: "Test",
      }

      const result = transactionFormSchema.safeParse(invalidDate)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("transactionDate"))).toBe(
          true
        )
      }
    })

    it("accepts valid YYYY-MM-DD format", () => {
      const validDate = {
        ...defaultTransactionFormValues,
        type: "expense" as const,
        transactionDate: "2024-01-15",
        amount: "100",
        category: "repairs",
        vendor: "Test",
      }

      const result = transactionFormSchema.safeParse(validDate)
      expect(result.success).toBe(true)
    })
  })

  describe("conditional vendor/payer validation", () => {
    it("requires vendor for expense transactions", () => {
      const expenseWithoutVendor = {
        ...defaultTransactionFormValues,
        type: "expense" as const,
        transactionDate: "2024-01-15",
        amount: "100",
        category: "repairs",
        vendor: "",
      }

      const result = transactionFormSchema.safeParse(expenseWithoutVendor)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("vendor"))).toBe(true)
        expect(
          result.error.issues.some((i) => i.message.includes("Vendor is required"))
        ).toBe(true)
      }
    })

    it("requires vendor to have non-whitespace content for expenses", () => {
      const expenseWithWhitespaceVendor = {
        ...defaultTransactionFormValues,
        type: "expense" as const,
        transactionDate: "2024-01-15",
        amount: "100",
        category: "repairs",
        vendor: "   ",
      }

      const result = transactionFormSchema.safeParse(expenseWithWhitespaceVendor)
      expect(result.success).toBe(false)
    })

    it("requires payer for income transactions", () => {
      const incomeWithoutPayer = {
        ...defaultTransactionFormValues,
        type: "income" as const,
        transactionDate: "2024-01-15",
        amount: "1000",
        category: "rent",
        payer: "",
      }

      const result = transactionFormSchema.safeParse(incomeWithoutPayer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("payer"))).toBe(true)
        expect(
          result.error.issues.some((i) => i.message.includes("Payer is required"))
        ).toBe(true)
      }
    })

    it("does not require vendor for income transactions", () => {
      const incomeWithoutVendor = {
        ...defaultTransactionFormValues,
        type: "income" as const,
        transactionDate: "2024-01-15",
        amount: "1000",
        category: "rent",
        payer: "John Tenant",
        vendor: "",
      }

      const result = transactionFormSchema.safeParse(incomeWithoutVendor)
      expect(result.success).toBe(true)
    })

    it("does not require payer for expense transactions", () => {
      const expenseWithoutPayer = {
        ...defaultTransactionFormValues,
        type: "expense" as const,
        transactionDate: "2024-01-15",
        amount: "100",
        category: "repairs",
        vendor: "Home Depot",
        payer: "",
      }

      const result = transactionFormSchema.safeParse(expenseWithoutPayer)
      expect(result.success).toBe(true)
    })

    it("does not require vendor or payer for capital transactions", () => {
      const capitalWithoutVendorOrPayer = {
        ...defaultTransactionFormValues,
        type: "capital" as const,
        transactionDate: "2024-01-15",
        amount: "5000",
        category: "other",
        vendor: "",
        payer: "",
      }

      const result = transactionFormSchema.safeParse(capitalWithoutVendorOrPayer)
      expect(result.success).toBe(true)
    })
  })

  describe("boolean field defaults", () => {
    it("defaults isTaxDeductible to true", () => {
      const result = transactionFormSchema.safeParse({
        type: "expense",
        transactionDate: "2024-01-15",
        amount: "100",
        category: "repairs",
        vendor: "Test",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isTaxDeductible).toBe(true)
      }
    })

    it("defaults isRecurring to false", () => {
      const result = transactionFormSchema.safeParse({
        type: "expense",
        transactionDate: "2024-01-15",
        amount: "100",
        category: "repairs",
        vendor: "Test",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isRecurring).toBe(false)
      }
    })

    it("defaults isExcluded to false", () => {
      const result = transactionFormSchema.safeParse({
        type: "expense",
        transactionDate: "2024-01-15",
        amount: "100",
        category: "repairs",
        vendor: "Test",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isExcluded).toBe(false)
      }
    })
  })
})

describe("transformTransactionFormToApi", () => {
  it("converts amount string to number", () => {
    const formData: TransactionFormData = {
      ...defaultTransactionFormValues,
      type: "expense",
      transactionDate: "2024-01-15",
      amount: "100.50",
      category: "repairs",
      vendor: "Home Depot",
    }

    const apiData = transformTransactionFormToApi(formData)
    expect(apiData.amount).toBe(100.5)
    expect(typeof apiData.amount).toBe("number")
  })

  it("trims string fields", () => {
    const formData: TransactionFormData = {
      ...defaultTransactionFormValues,
      type: "expense",
      transactionDate: "2024-01-15",
      amount: "100",
      category: "repairs",
      vendor: "  Home Depot  ",
      description: "  Test description  ",
    }

    const apiData = transformTransactionFormToApi(formData)
    expect(apiData.vendor).toBe("Home Depot")
    expect(apiData.description).toBe("Test description")
  })

  it("converts empty strings to undefined", () => {
    const formData: TransactionFormData = {
      ...defaultTransactionFormValues,
      type: "expense",
      transactionDate: "2024-01-15",
      amount: "100",
      category: "repairs",
      vendor: "Test",
      description: "",
      notes: "",
    }

    const apiData = transformTransactionFormToApi(formData)
    expect(apiData.description).toBeUndefined()
    expect(apiData.notes).toBeUndefined()
  })

  it("preserves boolean fields", () => {
    const formData: TransactionFormData = {
      ...defaultTransactionFormValues,
      type: "expense",
      transactionDate: "2024-01-15",
      amount: "100",
      category: "repairs",
      vendor: "Test",
      isTaxDeductible: false,
      isRecurring: true,
      isExcluded: true,
    }

    const apiData = transformTransactionFormToApi(formData)
    expect(apiData.isTaxDeductible).toBe(false)
    expect(apiData.isRecurring).toBe(true)
    expect(apiData.isExcluded).toBe(true)
  })
})

describe("transformApiToTransactionForm", () => {
  it("converts numeric amount to string", () => {
    const apiData = {
      type: "expense",
      transactionDate: "2024-01-15",
      amount: 100.5,
      category: "repairs",
      vendor: "Home Depot",
    }

    const formData = transformApiToTransactionForm(apiData)
    expect(formData.amount).toBe("100.5")
    expect(typeof formData.amount).toBe("string")
  })

  it("handles string amount from API", () => {
    const apiData = {
      type: "expense",
      transactionDate: "2024-01-15",
      amount: "100.50",
      category: "repairs",
      vendor: "Home Depot",
    }

    const formData = transformApiToTransactionForm(apiData)
    expect(formData.amount).toBe("100.5")
  })

  it("provides defaults for missing fields", () => {
    const apiData = {
      type: "income",
      transactionDate: "2024-01-15",
      amount: 1000,
      category: "rent",
    }

    const formData = transformApiToTransactionForm(apiData)
    expect(formData.vendor).toBe("")
    expect(formData.payer).toBe("")
    expect(formData.description).toBe("")
    expect(formData.isTaxDeductible).toBe(true)
    expect(formData.isRecurring).toBe(false)
    expect(formData.isExcluded).toBe(false)
  })

  it("handles null values", () => {
    const apiData = {
      type: "expense",
      transactionDate: "2024-01-15",
      amount: 100,
      category: "repairs",
      vendor: null,
      description: null,
    }

    const formData = transformApiToTransactionForm(apiData)
    expect(formData.vendor).toBe("")
    expect(formData.description).toBe("")
  })
})

describe("defaultTransactionFormValues", () => {
  it("has correct default type", () => {
    expect(defaultTransactionFormValues.type).toBe("expense")
  })

  it("has today's date as default", () => {
    const today = new Date().toISOString().split("T")[0]
    expect(defaultTransactionFormValues.transactionDate).toBe(today)
  })

  it("has empty amount", () => {
    expect(defaultTransactionFormValues.amount).toBe("")
  })

  it("has empty category", () => {
    expect(defaultTransactionFormValues.category).toBe("")
  })

  it("has correct boolean defaults", () => {
    expect(defaultTransactionFormValues.isTaxDeductible).toBe(true)
    expect(defaultTransactionFormValues.isRecurring).toBe(false)
    expect(defaultTransactionFormValues.isExcluded).toBe(false)
  })
})
