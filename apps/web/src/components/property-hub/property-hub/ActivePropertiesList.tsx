import { useMemo, useState } from 'react'
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Body, Caption, Card, Overline, Typography } from '@axori/ui'
import { formatCashFlow, formatPropertyValue } from './utils'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import type { Property } from '@/hooks/api/useProperties'
import { useTheme } from '@/utils/providers/theme-provider'
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
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'
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
        header: 'Asset Profile',
        cell: ({ row }) => (
          <div>
            <Overline
              className={cn(
                'mb-1',
                isDark ? 'text-white/60' : 'text-slate-500',
              )}
            >
              {row.original.strategy || '—'}
            </Overline>
            <Body
              weight="black"
              className={cn(
                'text-base tracking-tight',
                isDark ? 'text-white' : 'text-slate-900',
              )}
            >
              {row.original.address}
            </Body>
            <Caption
              className={cn(
                'text-xs opacity-60',
                isDark ? 'text-white/60' : 'text-slate-500',
              )}
            >
              {row.original.city}, {row.original.state}
            </Caption>
          </div>
        ),
      },
      {
        accessorKey: 'strategy',
        header: 'Strategy / Status',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="opacity-40">
              {row.original.strategy || '—'}
            </span>
            <span
              className={
                row.original.status === 'Active'
                  ? 'text-emerald-500'
                  : 'text-amber-500'
              }
            >
              {row.original.status}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'score',
        header: 'Score',
        cell: ({ row }) => {
          const score = row.original.score
          return (
            <div className="flex items-center gap-3">
              <Typography
                variant="h3"
                className={cn(
                  'text-2xl font-black tabular-nums tracking-tighter',
                  score > 80 ? 'text-emerald-500' : 'text-amber-500',
                )}
              >
                {score}
              </Typography>
              <div
                className={cn(
                  'h-1.5 w-16 rounded-full overflow-hidden',
                  isDark ? 'bg-white/10' : 'bg-slate-500/10',
                )}
              >
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
                className={cn(
                  'text-sm font-black tracking-tight uppercase transition-colors flex items-center gap-2',
                  isDark
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-amber-600 hover:text-amber-700',
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isDark ? 'bg-amber-400' : 'bg-amber-500',
                  )}
                />
                Add Rent
              </button>
            )
          }

          return (
            <Typography
              variant="h3"
              className={cn(
                'text-xl font-black tabular-nums tracking-tighter',
                cashFlow >= 0 ? 'text-emerald-500' : 'text-red-500',
              )}
            >
              {formatted}
            </Typography>
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
                  className={cn(
                    'text-sm font-black tracking-tight uppercase transition-colors flex items-center gap-2 ml-auto',
                    isDark
                      ? 'text-amber-400 hover:text-amber-300'
                      : 'text-amber-600 hover:text-amber-700',
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      isDark ? 'bg-amber-400' : 'bg-amber-500',
                    )}
                  />
                  Add Value
                </button>
              </div>
            )
          }

          return (
            <Typography
              variant="h3"
              className={cn(
                'text-xl font-black tabular-nums tracking-tighter text-right',
                isDark ? 'text-white' : 'text-slate-900',
              )}
            >
              {row.original.currentValue}
            </Typography>
          )
        },
      },
    ],
    [isDark],
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
      padding="md"
      radius="lg"
      className="p-0 overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className={cn(
                  'border-b',
                  isDark ? 'border-white/5' : 'border-slate-100',
                )}
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'p-6 text-[9px] font-black uppercase tracking-[0.3em]',
                      isDark ? 'text-white/60' : 'text-slate-500',
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
          <tbody className="text-xs font-black uppercase">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onPropertyClick(row.original.id)}
                className={cn(
                  'border-b last:border-0 cursor-pointer transition-all duration-300',
                  isDark
                    ? 'border-white/5 hover:bg-white/[0.02]'
                    : 'border-slate-100 hover:bg-slate-50',
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-6">
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
