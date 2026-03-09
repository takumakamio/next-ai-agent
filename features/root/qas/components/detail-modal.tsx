import { Button } from '@/components/ui'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { X } from 'lucide-react'
import type React from 'react'
import type { RootQa } from '../schema'
import { QA_CATEGORIES } from '../schema'

interface QaDetailModalProps {
  qa: RootQa | null
  isOpen: boolean
  onClose: () => void
}

export const QaDetailModal: React.FC<QaDetailModalProps> = ({ qa, isOpen, onClose }) => {
  if (!qa) return null

  const categoryInfo = QA_CATEGORIES.find((cat) => cat.id === qa.category) || QA_CATEGORIES[0]

  const handleMainClose = () => {
    onClose()
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleMainClose} direction="left">
      <DrawerContent className="!w-[50vw] !max-w-3xl h-full fixed left-0 top-0 bottom-0 right-auto rounded-none border-r border-border border-l-0 border-t-0 border-b-0 bg-card/90 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
        <DrawerHeader className="bg-muted/80 backdrop-blur-sm text-foreground border-b border-border px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            {/* Category Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 text-sm font-bold text-white ${categoryInfo.color}`}>
                {categoryInfo.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMainClose}
              className="h-8 w-8 p-0 border border-border text-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <DrawerTitle className="text-xl font-black uppercase tracking-widest text-foreground pr-8">
            {qa.question}
          </DrawerTitle>
        </DrawerHeader>

        {/* Detail Content */}
        <div className="overflow-y-auto h-[calc(100vh-200px)] p-6 space-y-6">
          {/* Answer Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <h3 className="font-semibold text-foreground text-lg">{'回答'}</h3>
            </div>
            <div className="bg-primary/5 border border-primary/30 rounded-lg p-6">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed text-base">{qa.answer}</p>
            </div>
          </div>
          {/* Website Link QR Code Section */}
          {qa.websiteLink && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground text-lg">{'ウェブサイトリンク'}</h3>
              </div>
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-6">
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qa.websiteLink)}`}
                    alt="QR Code for Website"
                    className="w-32 h-32 border border-border bg-white rounded-lg"
                  />
                  <p className="text-sm text-muted-foreground text-center break-all">{qa.websiteLink}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
