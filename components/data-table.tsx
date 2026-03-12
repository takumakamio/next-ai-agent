'use client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type Row,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, CircleAlert, Columns3, Ellipsis, Plus, Trash } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { type ReactNode, useEffect, useMemo, useState } from 'react'

interface DataTableProps<TData extends { id: string | number }, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  dataKey: string
  header?: ReactNode
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  isView?: boolean
  isNew?: boolean
  isEdit?: boolean
  onDelete?: (id: string) => void
  onBulkDelete?: (ids: string[]) => void
  pageTransitionLink?: string
  onNewClick?: () => void
  onEditClick?: (id: string) => void
  onViewClick?: (id: string) => void
  onSearchChange?: (search: string) => void
  onPageChange?: (page: number) => void
}

export default function DataTable<TData extends { id: string | number }, TValue>({
  columns,
  data: initialData,
  dataKey,
  header,
  meta,
  isView = false,
  isNew = false,
  isEdit = false,
  onDelete,
  onBulkDelete,
  onNewClick,
  onEditClick,
  onViewClick,
  onSearchChange,
  onPageChange,
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: meta ? meta.page - 1 : 0,
    pageSize: meta?.limit || 100,
  })

  const [sorting, setSorting] = useState<SortingState>([])

  const [data, setData] = useState(initialData || [])

  // State for search input value
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')

  // Update data when initialData changes
  useEffect(() => {
    if (initialData) {
      setData(initialData)
    }
  }, [initialData])

  // Sync pagination state with URL when meta changes
  useEffect(() => {
    if (meta) {
      setPagination({
        pageIndex: meta.page - 1,
        pageSize: meta.limit,
      })
    }
  }, [meta])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(searchValue)
      } else {
        const params = new URLSearchParams(searchParams.toString())
        if (searchValue) {
          params.set('search', searchValue)
        } else {
          params.delete('search')
        }
        router.push(`?${params.toString()}`)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchValue, searchParams, router, onSearchChange])

  // Handle URL-based pagination
  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage + 1)
    } else {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', (newPage + 1).toString())
      if (meta?.limit) {
        params.set('limit', meta.limit.toString())
      }
      router.push(`?${params.toString()}`)
    }
  }

  // Add select column if not already present
  const tableColumns = useMemo(() => {
    // Check if select column already exists
    const hasSelectColumn = columns.some((col) => col.id === 'select')

    if (hasSelectColumn) {
      return columns
    }

    // Add select column
    const selectColumn = {
      id: 'select',
      header: ({ table }: { table: any }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: { row: Row<TData> }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 28,
      enableSorting: false,
      enableHiding: false,
    }

    // Add actions column if not present
    const hasActionsColumn = columns.some((col) => col.id === 'actions')
    const actionsColumn = {
      id: 'actions',
      header: () => <span className="sr-only">{'アクション'}</span>,
      cell: ({ row }: { row: Row<TData> }) => (
        <RowActions
          row={row}
          dataKey={dataKey}
          isView={isView}
          isNew={isNew}
          isEdit={isEdit}
          onDelete={onDelete}
          onEditClick={onEditClick}
          onViewClick={onViewClick}
        />
      ),
      size: 60,
      enableHiding: false,
    }

    const updatedColumns = [selectColumn, ...columns]
    if (!hasActionsColumn) {
      updatedColumns.push(actionsColumn)
    }

    return updatedColumns
  }, [columns])

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    ...(meta
      ? {
          manualPagination: true,
          pageCount: meta.totalPages,
        }
      : {
          getPaginationRowModel: getPaginationRowModel(),
        }),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
  })

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">{header}</div>
        <div className="flex items-center gap-2">
          {/* Search input */}
          {meta && (
            <div className="relative">
              <Input
                placeholder={'名前で検索'}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-9 w-64 rounded-lg border border-border"
              />
            </div>
          )}

          {/* Toggle columns visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:bg-muted rounded-lg">
                <Columns3 className="size-4" />
                {'列'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{'列の表示切り替え'}</DropdownMenuLabel>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete button */}
          {table.getSelectedRowModel().rows.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="ml-auto rounded-lg border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  variant="outline"
                >
                  <Trash className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                  {'削除'}
                  <span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                    {table.getSelectedRowModel().rows.length}
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
                    aria-hidden="true"
                  >
                    <CircleAlert className="opacity-80" size={16} strokeWidth={2} />
                  </div>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{'本当によろしいですか？'}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {`この操作は取り消せません。選択した${table.getSelectedRowModel().rows.length}件の行を完全に削除します。`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>{'キャンセル'}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      if (onBulkDelete) {
                        const selectedIds = table.getSelectedRowModel().rows.map((row) => String(row.original.id))
                        await onBulkDelete(selectedIds)
                        table.resetRowSelection()
                      }
                    }}
                  >
                    {'削除'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {/* Add new item button */}
          {isNew &&
            (onNewClick ? (
              <Button
                onClick={onNewClick}
                className="ml-auto cursor-pointer rounded-lg border border-primary hover:bg-primary hover:text-primary-foreground"
                variant="outline"
              >
                <Plus className="opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
              </Button>
            ) : (
              <Link href={`/${dataKey}/new`}>
                <Button
                  className="ml-auto cursor-pointer rounded-lg border border-primary hover:bg-primary hover:text-primary-foreground"
                  variant="outline"
                >
                  <Plus className="opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                </Button>
              </Link>
            ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card/80 backdrop-blur-sm dmp-shadow">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        width: header.column.getSize ? `${header.column.getSize()}px` : 'auto',
                      }}
                      className="h-11 text-xs font-bold uppercase tracking-wider"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className={cn(
                            header.column.getCanSort() && 'flex h-full cursor-pointer select-none items-center gap-2',
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault()
                              header.column.getToggleSortingHandler()?.(e)
                            }
                          }}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: (
                              <ChevronUp className="shrink-0 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                            ),
                            desc: (
                              <ChevronDown
                                className="shrink-0 opacity-60"
                                size={16}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                            ),
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="bg-card/60 hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="last:py-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                  {'結果がありません'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-8">
        {/* Page number information */}
        <div className="flex grow whitespace-nowrap text-sm text-muted-foreground">
          <p className="whitespace-nowrap text-sm text-muted-foreground" aria-live="polite">
            <span className="text-foreground">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
              {Math.min(
                Math.max(
                  table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
                    table.getState().pagination.pageSize,
                  0,
                ),
                meta?.total || table.getRowCount(),
              )}
            </span>{' '}
            {'件中'} <span className="text-foreground">{meta?.total || table.getRowCount()}</span>
          </p>
        </div>

        {/* Pagination buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="size-8 hover:bg-muted"
            onClick={() => (meta ? handlePageChange(pagination.pageIndex - 1) : table.previousPage())}
            disabled={!table.getCanPreviousPage()}
          >
            ←
          </Button>
          {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => (
            <Button
              key={i}
              variant="ghost"
              size="sm"
              className={cn(
                'size-8 rounded-lg',
                table.getState().pagination.pageIndex === i
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'hover:bg-muted',
              )}
              onClick={() => (meta ? handlePageChange(i) : table.setPageIndex(i))}
            >
              {i + 1}
            </Button>
          ))}
          {table.getPageCount() > 5 && (
            <>
              <span className="px-2 text-sm text-muted-foreground">...</span>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 hover:bg-muted"
                onClick={() =>
                  meta ? handlePageChange(table.getPageCount() - 1) : table.setPageIndex(table.getPageCount() - 1)
                }
              >
                {table.getPageCount()}
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="size-8 hover:bg-muted"
            onClick={() => (meta ? handlePageChange(pagination.pageIndex + 1) : table.nextPage())}
            disabled={!table.getCanNextPage()}
          >
            →
          </Button>
        </div>
      </div>
    </div>
  )
}

function RowActions({
  row,
  dataKey,
  isView,
  isEdit,
  onDelete,
  onEditClick,
  onViewClick,
}: {
  row: Row<any>
  dataKey: string
  isView: boolean
  isNew: boolean
  isEdit: boolean
  onDelete?: (id: string) => void
  onEditClick?: (id: string) => void
  onViewClick?: (id: string) => void
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex justify-end">
            <Button size="icon" variant="ghost" className="shadow-none" aria-label="Edit item">
              <Ellipsis size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isView &&
            (onViewClick ? (
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onViewClick(String(row.original.id))}>
                  <span>{'表示'}</span>
                  <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            ) : (
              <Link href={`/${dataKey}/${row.original.id}`}>
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <span>{'表示'}</span>
                    <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </Link>
            ))}
          {isEdit &&
            (onEditClick ? (
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onEditClick(String(row.original.id))}>
                  <span>{'編集'}</span>
                  <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            ) : (
              <Link href={`/${dataKey}/${row.original.id}/edit`}>
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <span>{'編集'}</span>
                    <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </Link>
            ))}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <span>{'削除'}</span>
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
              aria-hidden="true"
            >
              <CircleAlert className="opacity-80" size={16} strokeWidth={2} />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle>{'本当によろしいですか？'}</AlertDialogTitle>
              <AlertDialogDescription>{'この操作は取り消せません。このアイテムを完全に削除します。'}</AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>{'キャンセル'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.(row.original.id)
                setShowDeleteDialog(false)
              }}
            >
              {'削除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
