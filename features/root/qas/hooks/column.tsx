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
    {
      accessorKey: 'embeddingModel',
      header: 'Embedding',
      cell: ({ row }) => {
        const model = row.original.embeddingModel
        return (
          <div className="flex items-center gap-2">
            {model ? (
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                {model}
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 rounded">
                未生成
              </span>
            )}
          </div>
        )
      },
    },
  ]
}
