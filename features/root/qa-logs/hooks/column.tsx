'use client'

import type { ColumnDef } from '@tanstack/react-table'
import type { SelectManageQaLog } from '../schema'

export const useManageQaLogColumns = ({
  onQaEditClick,
}: { onQaEditClick?: (id: string) => void } = {}): ColumnDef<SelectManageQaLog>[] => {
  const formatResponseTime = (responseTime: number) => {
    if (responseTime && responseTime > 0) {
      return (responseTime / 1000).toFixed(2)
    }
    return null
  }

  return [
    {
      accessorKey: 'userQuestion',
      header: 'ユーザーの質問',
      cell: ({ row }) => (
        <div className="flex gap-4 items-center">
          <p>{row.original.userQuestion}</p>
        </div>
      ),
    },
    {
      accessorKey: 'aiAnswer',
      header: 'AIの回答',
      cell: ({ row }) => (
        <div className="flex gap-4 items-center">
          <p>{row.original.aiAnswer}</p>
        </div>
      ),
    },
    {
      accessorKey: 'qaQuestion',
      header: 'Q&A質問',
      cell: ({ row }) => (
        <div className="flex gap-4 items-center">
          {row.original.qaId ? (
            onQaEditClick ? (
              <button
                type="button"
                onClick={() => onQaEditClick(row.original.qaId!)}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {row.original.qaQuestion}
              </button>
            ) : (
              <p>{row.original.qaQuestion}</p>
            )
          ) : (
            <p>{row.original.qaQuestion}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'similarityScore',
      header: '類似度スコア' + '%',
      cell: ({ row }) => (
        <div className="flex gap-4 items-center">
          {row.original.similarityScore && row.original.similarityScore > 0 ? (
            <p>{(row.original.similarityScore * 100).toFixed(2)}</p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: 'userRating',
      header: 'ユーザー評価',
      cell: ({ row }) => (
        <div className="flex gap-4 items-center">
          <p>{row.original.userRating}</p>
        </div>
      ),
    },
    {
      accessorKey: 'userFeedback',
      header: 'ユーザーフィードバック',
      cell: ({ row }) => (
        <div className="flex gap-4 items-center">
          <p>{row.original.userFeedback}</p>
        </div>
      ),
    },
    {
      accessorKey: 'responseTime',
      header: '応答時間' + '(' + '秒' + ')',
      cell: ({ row }) => (
        <div className="flex gap-4 items-center">
          {row.original.responseTime && row.original.responseTime > 0 ? (
            <p>{formatResponseTime(row.original.responseTime)}</p>
          ) : null}
        </div>
      ),
    },
  ]
}
