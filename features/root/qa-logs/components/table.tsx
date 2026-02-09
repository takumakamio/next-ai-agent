'use client'

import DataTable from '@/components/data-table'
import { useManageQaLogColumns } from '@/features/root/qa-logs/hooks/column'
import type { SelectManageQaLog } from '@/features/root/qa-logs/schema'
import type { ReactNode } from 'react'

interface ManageQaLogTableProps {
  data: SelectManageQaLog[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  dataKey: string
  header?: ReactNode
  onSearchChange?: (search: string) => void
  onPageChange?: (page: number) => void
  onQaEditClick?: (id: string) => void
}

export const ManageQaLogTable = ({ data, meta, dataKey, header, onSearchChange, onPageChange, onQaEditClick }: ManageQaLogTableProps) => {
  const columns = useManageQaLogColumns({ onQaEditClick })

  return <DataTable columns={columns} data={data} meta={meta} dataKey={dataKey} header={header} onSearchChange={onSearchChange} onPageChange={onPageChange} />
}
