'use client'

import DataTable from '@/components/data-table'
import { useManageQaColumns } from '@/features/root/qas/hooks/column'
import type { SelectQa } from '@/features/root/qas/schema'
import type { ReactNode } from 'react'

interface ManageQaTableProps {
  data: SelectQa[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onDelete: (id: string) => Promise<void>
  dataKey: string
  header?: ReactNode
  onNewClick?: () => void
  onEditClick?: (id: string) => void
  onSearchChange?: (search: string) => void
  onPageChange?: (page: number) => void
}

export const ManageQaTable = ({ data, meta, onDelete, dataKey, header, onNewClick, onEditClick, onSearchChange, onPageChange }: ManageQaTableProps) => {
  const columns = useManageQaColumns()

  return (
    <DataTable
      columns={columns}
      data={data}
      meta={meta}
      dataKey={dataKey}
      header={header}
      isNew={true}
      isEdit={true}
      onDelete={onDelete}
      onNewClick={onNewClick}
      onEditClick={onEditClick}
      onSearchChange={onSearchChange}
      onPageChange={onPageChange}
    />
  )
}
