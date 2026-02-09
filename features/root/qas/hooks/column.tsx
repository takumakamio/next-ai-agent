'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import type { SelectQa } from '../schema'

export const useManageQaColumns = (): ColumnDef<SelectQa>[] => {
  const t = useTranslations()

  return [
    {
      accessorKey: 'name',
      header: t('Question'),
      cell: ({ row }) => (
        <div className="flex gap-4 items-center">
          <p>{row.original.question}</p>
        </div>
      ),
    },
  ]
}
