'use client'

import { ManageQaForm } from '@/features/qas/components/form'
import { ManageQaTable } from '@/features/qas/components/table'
import type { SelectQa } from '@/features/qas/schema'
import { clientDelete, clientFetch } from '@/lib/client-fetcher'
import { rpc } from '@/lib/rpc'
import { MessageCircleQuestion } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

export const QasTab = () => {
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editingQa, setEditingQa] = useState<SelectQa | undefined>(undefined)
  const [data, setData] = useState<SelectQa[]>([])
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await clientFetch(rpc.api.qas, {
        query: {
          page,
          limit: 50,
          ...(search && { search }),
        },
      })
      setData(response.data)
      setMeta(response.meta)
    } catch (error) {
      console.error('Failed to fetch QAs:', error)
      toast('Failed to fetch QAs')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async (id: string) => {
    try {
      await clientDelete(rpc.api.qas[':id'], { param: { id } })
      toast('Deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Failed to delete QA:', error)
      toast('Failed to delete')
    }
  }

  const handleNewClick = () => {
    setEditingQa(undefined)
    setView('form')
  }

  const handleEditClick = async (id: string) => {
    try {
      const qa = await clientFetch(rpc.api.qas[':id'], { param: { id } })
      setEditingQa(qa)
      setView('form')
    } catch (error) {
      console.error('Failed to fetch QA:', error)
      toast('Failed to load QA')
    }
  }

  const handleFormSuccess = (id: string, isNew: boolean) => {
    if (isNew) {
      // After creating, load the new QA for editing
      handleEditClick(id)
    }
    fetchData()
  }

  const handleFormCancel = () => {
    setView('list')
    setEditingQa(undefined)
  }

  if (view === 'form') {
    return (
      <div className="p-4">
        <ManageQaForm qa={editingQa} onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
      </div>
    )
  }

  return (
    <div className="p-4">
      {loading && data.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <ManageQaTable
          data={data}
          meta={meta}
          onDelete={handleDelete}
          dataKey="qas"
          header={
            <div className="flex items-center gap-3">
              <MessageCircleQuestion className="size-7" />
              <h1 className="text-2xl font-black uppercase tracking-widest text-foreground">{'Q&A'}</h1>
            </div>
          }
          onNewClick={handleNewClick}
          onEditClick={handleEditClick}
          onSearchChange={setSearch}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
