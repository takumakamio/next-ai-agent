'use client'

import type { ColumnDef } from '@tanstack/react-table'
import type { SelectQa } from '../schema'

export const useManageQaColumns = (): ColumnDef<SelectQa>[] => {
  return [
    {
      accessorKey: 'name',
      header: '質問',
      cell: ({ row }) => (
        <div className="flex gap-4 items-center">
          <p>{row.original.question}</p>
        </div>
      ),
    },
  ]
}
