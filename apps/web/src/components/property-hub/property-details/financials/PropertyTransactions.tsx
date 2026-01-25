import { useMemo, useState } from 'react'
import { Button, Card, Input, Typography } from '@axori/ui'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
} from '@tanstack/react-table'
import { usePropertyTransactions } from '@/hooks/api/useTransactions'
import { usePropertyPermissions } from '@/hooks/api'
import { useTheme } from '@/utils/providers/theme-provider'
import { cn } from '@/utils/helpers/cn'
import { ReadOnlyBanner } from '@/components/property-hub/ReadOnlyBanner'
import { DRAWERS, useDrawer } from '@/lib/drawer'

interface PropertyTransactionsProps {
  propertyId: string
}

type TransactionRow = {
  id: string
  type: 'income' | 'expense' | 'capital'
  date: string
  amount: number
  payee: string
  description: string
  category: string
  subcategory: string | null
  source: string
  documentId: string | null
  notes: string | null
  reviewStatus: 'pending' | 'approved' | 'flagged' | 'excluded'
  isExcluded: boolean
  taxCategory: string | null
}

/**
 * PropertyTransactions component - Displays transaction history
 *
 * @see AXO-93 - Uses drawer factory for opening add/edit transaction drawer
 */
export const PropertyTransactions = ({
  propertyId,
}: PropertyTransactionsProps) => {
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'
  const { openDrawer } = useDrawer()
  const { canEdit, isReadOnly } = usePropertyPermissions(propertyId)

  const [searchQuery, setSearchQuery] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true }, // Newest first by default
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Fetch transactions data
  const {
    data: transactionsData,
    isLoading,
    refetch,
  } = usePropertyTransactions(propertyId, {
    page: 1,
    pageSize: 100, // Get more for client-side filtering/sorting
  })

  // Transform transactions to transaction rows
  const transactions = useMemo<Array<TransactionRow>>(() => {
    if (!transactionsData?.transactions) return []

    return transactionsData.transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      date: tx.transactionDate,
      amount: parseFloat(tx.amount),
      payee:
        tx.type === 'expense' ? tx.vendor || 'Unknown' : tx.payer || 'Unknown',
      description: tx.description || '',
      category: tx.category,
      subcategory: tx.subcategory,
      source: tx.source || 'manual',
      documentId: tx.documentId,
      notes: tx.notes || null,
      reviewStatus: tx.reviewStatus || 'pending',
      isExcluded: tx.isExcluded || false,
      taxCategory: tx.taxCategory,
    }))
  }, [transactionsData])

  // Filter transactions based on search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions

    const query = searchQuery.toLowerCase()
    return transactions.filter((t) => {
      return (
        t.payee.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        (t.subcategory && t.subcategory.toLowerCase().includes(query)) ||
        (t.notes && t.notes.toLowerCase().includes(query))
      )
    })
  }, [transactions, searchQuery])

  // Define columns
  const columns = useMemo<Array<ColumnDef<TransactionRow>>>(
    () => [
      {
        accessorKey: 'date',
        header: 'Timestamp',
        cell: ({ row }) => {
          const date = new Date(row.original.date)
          return (
            <div className="tabular-nums opacity-40">
              {date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          )
        },
      },
      {
        accessorKey: 'payee',
        header: 'Payee / Entity',
        cell: ({ row }) => (
          <span className="text-sm font-black tracking-tight">
            {row.original.payee}
          </span>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
          const type = row.original.type
          return (
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  type === 'income'
                    ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                    : type === 'capital'
                      ? 'bg-amber-500'
                      : 'bg-rose-500',
                )}
              />
              <span
                className={cn(
                  'opacity-60',
                  row.original.isExcluded && 'line-through opacity-30',
                )}
              >
                {row.original.description || '—'}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'category',
        header: 'Cat / Tax Box',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span
              className={cn(
                'px-2 py-0.5 rounded-md text-[8px] font-black uppercase w-fit',
                isDark
                  ? 'bg-white/5 border border-white/10'
                  : 'bg-slate-100 border border-slate-200',
              )}
            >
              {row.original.category}
            </span>
            {row.original.taxCategory && (
              <span className="text-[7px] font-black text-slate-500 italic">
                Sch E: {row.original.taxCategory}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'source',
        header: 'Source',
        cell: ({ row }) => {
          const source = row.original.source
          const isExtracted = source === 'document_ai'
          const isBankSync = source === 'plaid'

          return (
            <div className="flex items-center gap-2">
              {isExtracted && (
                <svg
                  className="text-sky-500 animate-pulse"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                >
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
              )}
              {isBankSync && (
                <svg
                  className="text-emerald-500"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                >
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 16h5v5" />
                </svg>
              )}
              <span
                className={cn(
                  'text-[9px] font-black',
                  isExtracted
                    ? 'text-sky-500'
                    : isBankSync
                      ? 'text-emerald-500'
                      : 'opacity-40',
                )}
              >
                {source === 'document_ai'
                  ? 'Extracted'
                  : source === 'plaid'
                    ? 'Bank Sync'
                    : source === 'manual'
                      ? 'Manual'
                      : source}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'documentId',
        header: 'Ref',
        cell: ({ row }) => {
          const docId = row.original.documentId
          return docId ? (
            <a
              href={`#doc-${docId}`}
              className="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all text-slate-500"
              title="View document"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </a>
          ) : (
            <span className="opacity-10 text-[10px]">—</span>
          )
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => {
          const type = row.original.type
          const amount = row.original.amount
          const isExcluded = row.original.isExcluded

          return (
            <div
              className={cn(
                'text-right text-base font-black tabular-nums',
                type === 'income' ? 'text-emerald-500' : '',
                isExcluded && 'opacity-30 line-through',
              )}
            >
              {type === 'income' ? '+' : '-'}${amount.toLocaleString()}
            </div>
          )
        },
      },
    ],
    [isDark],
  )

  const table = useReactTable({
    data: filteredTransactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Export functionality to be implemented')
  }

  const handleAddTransaction = () => {
    openDrawer(DRAWERS.ADD_TRANSACTION, { propertyId })
  }

  const handleRowClick = (transactionId: string) => {
    openDrawer(DRAWERS.ADD_TRANSACTION, { propertyId, transactionId })
  }

  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="lg:col-span-12 flex flex-col gap-12"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-4">
          <div>
            <Typography
              variant="h3"
              className="text-3xl font-black uppercase tracking-tighter"
            >
              Historical P&L Registry
            </Typography>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 italic">
              Institutional Transcript — Audit Proof
            </p>
          </div>
          {isReadOnly && <ReadOnlyBanner variant="badge" />}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-grow">
            <svg
              className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <Input
              type="text"
              placeholder="Filter by payee, category or text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-80 pl-14 pr-8 py-4 rounded-3xl text-[10px] font-black uppercase"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
            {canEdit && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddTransaction}
                className="px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl"
              >
                Add Transaction
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest"
            >
              Export Ledger
            </Button>
          </div>
        </div>
      </header>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 dark:border-[#E8FF4D] mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">
              Loading transactions...
            </p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-20 text-center opacity-30 italic font-medium">
            {searchQuery
              ? `No records matching "${searchQuery}" found in registry.`
              : 'No transactions found.'}
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse min-w-[1000px]">
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
                          'p-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500',
                          header.id === 'amount' && 'text-right',
                        )}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              'flex items-center gap-2',
                              header.column.getCanSort() &&
                                'cursor-pointer select-none hover:opacity-70',
                              header.id === 'amount' && 'justify-end',
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {typeof header.column.columnDef.header ===
                            'function'
                              ? header.column.columnDef.header(
                                  header.getContext(),
                                )
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
              <tbody className="text-[11px] font-bold uppercase tracking-tight">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => handleRowClick(row.original.id)}
                    className={cn(
                      'border-b last:border-0 group transition-all duration-300 cursor-pointer',
                      isDark
                        ? 'border-white/5 hover:bg-white/[0.02]'
                        : 'border-slate-100 hover:bg-slate-50',
                      row.original.isExcluded && 'opacity-50',
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

            {/* Pagination */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="text-[10px] font-black uppercase"
                >
                  Previous
                </Button>
                <span className="text-[10px] font-black text-slate-500">
                  Page {table.getState().pagination.pageIndex + 1} of{' '}
                  {table.getPageCount()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="text-[10px] font-black uppercase"
                >
                  Next
                </Button>
              </div>
              <div className="text-[10px] font-black text-slate-500">
                Showing {table.getRowModel().rows.length} of{' '}
                {filteredTransactions.length} transactions
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
