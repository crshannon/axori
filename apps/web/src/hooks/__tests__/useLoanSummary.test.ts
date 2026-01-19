import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLoanSummary } from '../useLoanSummary'
import type { Loan } from '@axori/shared'

// Mock loan data
const createMockLoan = (overrides: Partial<Loan> = {}): Loan => ({
  id: 'loan-1',
  propertyId: 'property-1',
  status: 'active',
  isPrimary: true,
  loanPosition: 1,
  lenderName: 'Test Bank',
  loanType: 'conventional',
  originalLoanAmount: '300000',
  interestRate: '0.065', // 6.5%
  termMonths: 360,
  currentBalance: '280000',
  totalMonthlyPayment: '1896',
  monthlyPrincipalInterest: '1896',
  monthlyEscrow: '0',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('useLoanSummary', () => {
  it('should return zero values for empty loans array', () => {
    const { result } = renderHook(() => useLoanSummary([]))
    
    expect(result.current.totalDebt).toBe(0)
    expect(result.current.weightedInterestRate).toBe(0)
    expect(result.current.totalMonthlyPayment).toBe(0)
    expect(result.current.loanCount).toBe(0)
    expect(result.current.primaryLoanBalance).toBeNull()
  })

  it('should return zero values for undefined loans', () => {
    const { result } = renderHook(() => useLoanSummary(undefined))
    
    expect(result.current.totalDebt).toBe(0)
    expect(result.current.weightedInterestRate).toBe(0)
    expect(result.current.totalMonthlyPayment).toBe(0)
    expect(result.current.loanCount).toBe(0)
    expect(result.current.primaryLoanBalance).toBeNull()
  })

  it('should calculate total debt correctly', () => {
    const loans: Array<Loan> = [
      createMockLoan({ currentBalance: '280000', id: 'loan-1' }),
      createMockLoan({ currentBalance: '50000', id: 'loan-2', isPrimary: false }),
    ]
    
    const { result } = renderHook(() => useLoanSummary(loans))
    
    expect(result.current.totalDebt).toBe(330000)
    expect(result.current.loanCount).toBe(2)
  })

  it('should calculate weighted interest rate correctly', () => {
    const loans: Array<Loan> = [
      createMockLoan({
        currentBalance: '200000',
        interestRate: '0.06', // 6%
        id: 'loan-1',
      }),
      createMockLoan({
        currentBalance: '100000',
        interestRate: '0.08', // 8%
        id: 'loan-2',
        isPrimary: false,
      }),
    ]
    
    const { result } = renderHook(() => useLoanSummary(loans))
    
    // Weighted rate: (0.06 * 200000 + 0.08 * 100000) / 300000 = 0.06667 = 6.67%
    expect(result.current.weightedInterestRate).toBeCloseTo(6.67, 2)
  })

  it('should calculate total monthly payment correctly', () => {
    const loans: Array<Loan> = [
      createMockLoan({ totalMonthlyPayment: '1896', id: 'loan-1' }),
      createMockLoan({ totalMonthlyPayment: '500', id: 'loan-2', isPrimary: false }),
    ]
    
    const { result } = renderHook(() => useLoanSummary(loans))
    
    expect(result.current.totalMonthlyPayment).toBe(2396)
  })

  it('should track primary loan balance', () => {
    const loans: Array<Loan> = [
      createMockLoan({
        currentBalance: '280000',
        isPrimary: true,
        id: 'loan-1',
      }),
      createMockLoan({
        currentBalance: '50000',
        isPrimary: false,
        id: 'loan-2',
      }),
    ]
    
    const { result } = renderHook(() => useLoanSummary(loans))
    
    expect(result.current.primaryLoanBalance).toBe(280000)
  })

  it('should handle loans with missing values', () => {
    const loans: Array<Loan> = [
      createMockLoan({
        currentBalance: null,
        interestRate: null,
        totalMonthlyPayment: null,
        monthlyPrincipalInterest: null,
        monthlyEscrow: null,
        id: 'loan-1',
      }),
    ]
    
    const { result } = renderHook(() => useLoanSummary(loans))
    
    expect(result.current.totalDebt).toBe(0)
    expect(result.current.weightedInterestRate).toBe(0)
    expect(result.current.totalMonthlyPayment).toBe(0)
  })

  it('should calculate monthly payment from P&I + Escrow when totalMonthlyPayment is null', () => {
    const loans: Array<Loan> = [
      createMockLoan({
        totalMonthlyPayment: null,
        monthlyPrincipalInterest: '1500',
        monthlyEscrow: '300',
        id: 'loan-1',
      }),
      createMockLoan({
        totalMonthlyPayment: null,
        monthlyPrincipalInterest: '800',
        monthlyEscrow: null,
        id: 'loan-2',
        isPrimary: false,
      }),
    ]
    
    const { result } = renderHook(() => useLoanSummary(loans))
    
    // Loan 1: 1500 + 300 = 1800
    // Loan 2: 800 (no escrow)
    expect(result.current.totalMonthlyPayment).toBe(2600)
  })

  it('should prefer totalMonthlyPayment over calculated value when both exist', () => {
    const loans: Array<Loan> = [
      createMockLoan({
        totalMonthlyPayment: '2000', // Should use this
        monthlyPrincipalInterest: '1500',
        monthlyEscrow: '300', // Would calculate to 1800, but should use 2000
        id: 'loan-1',
      }),
    ]
    
    const { result } = renderHook(() => useLoanSummary(loans))
    
    expect(result.current.totalMonthlyPayment).toBe(2000)
  })

  it('should handle multiple loans with different balances', () => {
    const loans: Array<Loan> = [
      createMockLoan({
        currentBalance: '300000',
        interestRate: '0.05',
        totalMonthlyPayment: '2000',
        id: 'loan-1',
        isPrimary: true,
      }),
      createMockLoan({
        currentBalance: '100000',
        interestRate: '0.08',
        totalMonthlyPayment: '800',
        id: 'loan-2',
        isPrimary: false,
      }),
      createMockLoan({
        currentBalance: '50000',
        interestRate: '0.10',
        totalMonthlyPayment: '500',
        id: 'loan-3',
        isPrimary: false,
      }),
    ]
    
    const { result } = renderHook(() => useLoanSummary(loans))
    
    expect(result.current.totalDebt).toBe(450000)
    expect(result.current.totalMonthlyPayment).toBe(3300)
    expect(result.current.loanCount).toBe(3)
    expect(result.current.primaryLoanBalance).toBe(300000)
    // Weighted rate: (0.05 * 300000 + 0.08 * 100000 + 0.10 * 50000) / 450000
    // = (15000 + 8000 + 5000) / 450000 = 28000 / 450000 = 0.06222 = 6.22%
    expect(result.current.weightedInterestRate).toBeCloseTo(6.22, 2)
  })
})

