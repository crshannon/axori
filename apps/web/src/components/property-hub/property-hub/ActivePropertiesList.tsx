import { useMemo, useState } from 'react'
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Body, Caption, Card } from '@axori/ui'
import { formatCashFlow, formatPropertyValue } from './utils'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import type { Property } from '@/hooks/api/useProperties'
import { cn } from '@/utils/helpers'

interface ActivePropertiesListProps {
  properties: Array<Property>
  onPropertyClick: (propertyId: string) => void
  onAddRentalIncome?: (propertyId: string) => void
  onAddCurrentValue?: (propertyId: string) => void
}

type PropertyRow = {
  id: string
  address: string
  city: string
  state: string
  strategy: string | null
  status: string
  score: number
  cashFlow: number
  currentValue: string
  missingRentalIncome: boolean
  missingCurrentValue: boolean
  property: Property
}

export const ActivePropertiesList = ({
  properties,
  onPropertyClick,
  onAddRentalIncome,
  onAddCurrentValue,
}: ActivePropertiesListProps) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'address', desc: false },
  ])

  // Transform properties to PropertyRow[]
  // Calculate metrics inline (can't use hooks in map, so we duplicate the logic)
  const propertyRows = useMemo<Array<PropertyRow>>(() => {
    return properties.map((p) => {
      // Calculate completeness score
      const checks = [
        p.valuation?.currentValue || p.acquisition?.currentValue,
        p.rentalIncome?.monthlyRent,
        p.operatingExpenses,
        p.acquisition?.purchaseDate,
        p.characteristics?.propertyType,
        p.loans?.some((l) => l.status === 'active'),
      ]
      const filled = checks.filter(Boolean).length
      const score = Math.round((filled / checks.length) * 100)

      // Get current value
      const rawCurrentValue =
        p.valuation?.currentValue ?? p.acquisition?.currentValue
      const currentValue =
        rawCurrentValue !== null && rawCurrentValue !== undefined
          ? (typeof rawCurrentValue === 'string'
              ? parseFloat(rawCurrentValue)
              : Number(rawCurrentValue)) || null
          : null

      const currentValueNum =
        currentValue !== null &&
        !isNaN(currentValue) &&
        isFinite(currentValue) &&
        currentValue > 0
          ? currentValue
          : null

      // Calculate cash flow (simple version)
      const monthlyRent = Number(p.rentalIncome?.monthlyRent || 0)
      const monthlyExpenses = 0
      const activeLoan = p.loans?.find(
        (l) => l.status === 'active' && l.isPrimary,
      )
      const monthlyLoanPayment = activeLoan?.monthlyPrincipalInterest
        ? Number(activeLoan.monthlyPrincipalInterest)
        : 0
      const cashFlow = monthlyRent - monthlyExpenses - monthlyLoanPayment

      // Check data completeness
      const hasRentalIncome = monthlyRent > 0
      const hasCurrentValue = currentValueNum !== null && currentValueNum > 0

      return {
        id: p.id,
        address: p.address,
        city: p.city,
        state: p.state,
        strategy: p.strategy?.investmentStrategy || null,
        status: p.status.charAt(0).toUpperCase() + p.status.slice(1),
        score,
        cashFlow,
        currentValue: formatPropertyValue(currentValueNum),
        missingRentalIncome: !hasRentalIncome,
        missingCurrentValue: !hasCurrentValue,
        property: p,
      }
    })
  }, [properties])

  // Define columns for TanStack Table
  const columns = useMemo<Array<ColumnDef<PropertyRow>>>(
    () => [
      {
        accessorKey: 'address',
        header: 'Property',
        cell: ({ row }) => (
          <div>
            <Body
              size="sm"
              weight="bold"
              className="tracking-tight text-slate-900 dark:text-white"
            >
              {row.original.address}
            </Body>
            <Caption className="text-slate-500 dark:text-white/50">
              {row.original.city}, {row.original.state}
            </Caption>
          </div>
        ),
      },
      {
        accessorKey: 'strategy',
        header: 'Strategy',
        cell: ({ row }) => (
          <Body size="sm" className="text-slate-600 dark:text-white/70">
            {row.original.strategy || '—'}
          </Body>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Body
            size="sm"
            weight="semibold"
            className={
              row.original.status === 'Active'
                ? 'text-emerald-500'
                : 'text-amber-500'
            }
          >
            {row.original.status}
          </Body>
        ),
      },
      {
        accessorKey: 'score',
        header: 'Score',
        cell: ({ row }) => {
          const score = row.original.score
          return (
            <div className="flex items-center gap-2">
              <Body
                size="sm"
                weight="bold"
                className={cn(
                  'tabular-nums',
                  score > 80 ? 'text-emerald-500' : 'text-amber-500',
                )}
              >
                {score}
              </Body>
              <div className="h-1 w-12 rounded-full overflow-hidden bg-slate-200 dark:bg-white/10">
                <div
                  className={cn(
                    'h-full',
                    score > 80 ? 'bg-emerald-500' : 'bg-amber-500',
                  )}
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'cashFlow',
        header: 'Cash Flow',
        cell: ({ row }) => {
          const cashFlow = row.original.cashFlow
          const formatted = formatCashFlow(cashFlow)
          const isMissing = row.original.missingRentalIncome

          if (isMissing && onAddRentalIncome) {
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddRentalIncome(row.original.id)
                }}
                className="text-xs font-bold tracking-tight uppercase transition-colors flex items-center gap-1.5 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
              >
                <span className="w-1 h-1 rounded-full bg-amber-500 dark:bg-amber-400" />
                Add Rent
              </button>
            )
          }

          return (
            <Body
              size="sm"
              weight="bold"
              className={cn(
                'tabular-nums',
                cashFlow >= 0 ? 'text-emerald-500' : 'text-red-500',
              )}
            >
              {formatted}
            </Body>
          )
        },
      },
      {
        accessorKey: 'currentValue',
        header: 'Value',
        cell: ({ row }) => {
          const isMissing = row.original.missingCurrentValue

          if (isMissing && onAddCurrentValue) {
            return (
              <div className="text-right">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddCurrentValue(row.original.id)
                  }}
                  className="text-xs font-bold tracking-tight uppercase transition-colors flex items-center gap-1.5 ml-auto text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                >
                  <span className="w-1 h-1 rounded-full bg-amber-500 dark:bg-amber-400" />
                  Add Value
                </button>
              </div>
            )
          }

          return (
            <Body
              size="sm"
              weight="bold"
              className="tabular-nums text-right text-slate-900 dark:text-white"
            >
              {row.original.currentValue}
            </Body>
          )
        },
      },
    ],
    [],
  )

  // Initialize TanStack Table
  const table = useReactTable({
    data: propertyRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  })

  return (
    <Card
      variant="rounded"
      padding="sm"
      radius="sm"
      className="overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-slate-100 dark:border-white/5"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'px-4 py-6 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/50',
                      header.id === 'currentValue' && 'text-right',
                    )}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          'flex items-center gap-2',
                          header.column.getCanSort() &&
                            'cursor-pointer select-none hover:opacity-70',
                          header.id === 'currentValue' && 'justify-end',
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {typeof header.column.columnDef.header === 'function'
                          ? header.column.columnDef.header(header.getContext())
                          : header.column.columnDef.header}
                        {{
                          asc: ' ↑',
                          desc: ' ↓',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onPropertyClick(row.original.id)}
                className="border-b last:border-0 cursor-pointer transition-all duration-200 border-slate-100 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/[0.02]"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {typeof cell.column.columnDef.cell === 'function'
                      ? cell.column.columnDef.cell(cell.getContext())
                      : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
