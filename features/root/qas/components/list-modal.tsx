import { Button } from '@/components/ui'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { clientFetch } from '@/lib/client-fetcher'
import { rpc } from '@/lib/rpc'
import { Calendar, ChevronRight, Eye, X } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import type { QaCategory, QaContentType, RootQa } from '../schema'
import { QA_CATEGORIES, QA_CONTENT_TYPES } from '../schema'
import { QaDetailModal } from './detail-modal'

interface QaListModalProps {
  isOpen: boolean
  onClose: () => void
}

export const QaListModal: React.FC<QaListModalProps> = ({ isOpen, onClose }) => {
  const [qas, setQas] = useState<RootQa[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedQa, setSelectedQa] = useState<RootQa | null>(null)

  useEffect(() => {
    if (isOpen && qas.length === 0) {
      fetchQas()
    }
  }, [isOpen, qas.length])

  const fetchQas = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await clientFetch(rpc.api.root.qas, { query: {} })
      setQas(response.data)
    } catch (err) {
      setError('コンテンツ生成エラー')
      console.error('Error fetching Q&As:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId)
  }, [])

  const clearAllFilters = useCallback(() => {
    setSelectedCategory('all')
  }, [])

  const filteredQas = qas.filter((qa) => {
    if (selectedCategory !== 'all' && qa.category !== selectedCategory) {
      return false
    }

    return true
  })

  const handleClose = useCallback(() => {
    setSelectedCategory('all')
    setSelectedQa(null)
    onClose()
  }, [onClose])

  const getCategoryInfo = useCallback(
    (categoryId: string): QaCategory => {
      const category = QA_CATEGORIES.find((cat) => cat.id === categoryId) || QA_CATEGORIES[0]
      return category
    },
    [],
  )

  const getContentTypeInfo = useCallback(
    (typeId: string): QaContentType => {
      const type = QA_CONTENT_TYPES.find((type) => type.id === typeId) || QA_CONTENT_TYPES[0]
      return type
    },
    [],
  )

  return (
    <>
      <Drawer open={isOpen} onOpenChange={handleClose} direction="left">
        <DrawerContent className="!w-[60vw] !max-w-4xl h-full fixed left-0 top-0 bottom-0 right-auto rounded-none border-r border-border border-l-0 border-t-0 border-b-0 bg-card/90 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
          <DrawerHeader className="bg-muted/80 backdrop-blur-sm text-foreground border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-2xl font-black uppercase tracking-widest text-foreground">
                  {'よくある質問'}
                </DrawerTitle>
                <DrawerDescription className="text-muted-foreground">
                  {'よくある質問と回答を閲覧する'}
                </DrawerDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 border border-border text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>

          <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
            <div className="flex-shrink-0 p-6 border-b space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{'カテゴリ'}</h3>
                <div className="flex flex-wrap gap-2">
                  {QA_CATEGORIES.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleCategoryChange(category.id)}
                      className={`text-sm transition-colors duration-200 rounded-lg ${selectedCategory === category.id ? 'bg-primary text-primary-foreground border border-primary' : 'border border-border'}`}
                    >
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${category.color}`} />
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sort and Clear */}
              <div className="flex items-center justify-between">
                {selectedCategory !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-sm text-destructive hover:text-destructive/80"
                  >
                    {'すべてのフィルターをクリア'}
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-muted border-t-primary"></div>
                  <span className="ml-2 text-muted-foreground">{'Q&Aを読み込み中'}...</span>
                </div>
              )}

              {error && (
                <div className="p-6 text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={fetchQas} variant="default">
                    {'再試行'}
                  </Button>
                </div>
              )}

              {!loading && !error && filteredQas.length === 0 && (
                <div className="p-6 text-center text-muted-foreground">
                  {selectedCategory !== 'all' ? (
                    <div>
                      <p className="mb-2">{'フィルター条件に一致するQ&Aが見つかりません'}</p>
                      <p className="text-sm">{'フィルター条件を調整してみてください'}</p>
                    </div>
                  ) : (
                    '利用可能なQ&Aがありません'
                  )}
                </div>
              )}

              {!loading && !error && filteredQas.length > 0 && (
                <div className="space-y-4">
                  {filteredQas.map((qa) => {
                    const categoryInfo = getCategoryInfo(qa.category)
                    const contentTypeInfo = getContentTypeInfo(qa.contentType)

                    return (
                      <div
                        key={qa.id}
                        className="bg-card/80 backdrop-blur-sm border border-border rounded-lg dmp-shadow overflow-hidden hover:border-primary/50 cursor-pointer transition-all duration-300"
                        onClick={() => setSelectedQa(qa)}
                      >
                        <div className="p-5">
                          {/* Header with badges */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-3 py-1 text-xs font-bold text-white ${categoryInfo.color}`}>
                                {categoryInfo.name}
                              </span>
                              <span className="border border-border bg-muted text-foreground font-bold px-3 py-1 text-xs rounded">
                                {contentTypeInfo.name}
                              </span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          </div>

                          {/* Question */}
                          <h3 className="font-medium text-foreground mb-4 line-clamp-3 leading-relaxed text-base">
                            {qa.question}
                          </h3>

                          {/* Metadata */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <Eye className="h-3 w-3" />
                                <span className="font-medium">
                                  {qa.viewCount} {'閲覧数'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" />
                                <span className="font-medium">{new Date(qa.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <QaDetailModal qa={selectedQa} isOpen={!!selectedQa} onClose={() => setSelectedQa(null)} />
    </>
  )
}
