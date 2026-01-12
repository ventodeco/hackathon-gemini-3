import { useEffect, useCallback } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { motion } from 'framer-motion'
import { useDrawerHeight, useDrawerGestures } from '@/hooks/useDrawerHeight'
import { DrawerHeader } from './DrawerHeader'
import { AnnotationContent } from './AnnotationContent'
import { Button } from '@/components/ui/button'
import { Bookmark } from 'lucide-react'
import type { Annotation } from '@/lib/types'

interface AnnotationDrawerProps {
  isOpen: boolean
  onClose: () => void
  annotation: Annotation | null
}

export function AnnotationDrawer({ isOpen, onClose, annotation }: AnnotationDrawerProps) {
  const { drawerState, expandDrawer, collapseDrawer } = useDrawerHeight()
  const { handleDragEnd } = useDrawerGestures(expandDrawer, collapseDrawer)

  useEffect(() => {
    if (isOpen && annotation) {
      collapseDrawer()
    }
  }, [isOpen, annotation, collapseDrawer])

  const handleSave = useCallback(() => {
    console.log('Save annotation:', annotation?.id)
  }, [annotation])

  const handleHeaderCollapse = useCallback(() => {
    if (drawerState === 'expanded') {
      collapseDrawer()
    }
  }, [drawerState, collapseDrawer])

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-white border-t border-gray-200 rounded-t-2xl p-6 overflow-hidden"
        style={{
          height: drawerState === 'closed' ? '0%' : drawerState === 'collapsed' ? '35vh' : '75vh',
          transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        aria-label="Annotation drawer"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col h-full">
          <motion.div 
            className="flex justify-center -mt-4 pb-2 cursor-grab active:cursor-grabbing"
            role="slider"
            aria-label="Drawer resize handle"
            aria-valuemin={0}
            aria-valuemax={2}
            aria-valuenow={drawerState === 'collapsed' ? 1 : drawerState === 'expanded' ? 2 : 0}
            tabIndex={0}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => handleDragEnd(_, info)}
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </motion.div>

          <DrawerHeader onClose={onClose} onCollapse={handleHeaderCollapse} />

          <div className="h-6" />

          {annotation && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <AnnotationContent
                key={drawerState}
                annotation={annotation}
                drawerState={drawerState}
              />
              
              <div className="h-4 shrink-0" />
              
              <Button
                onClick={handleSave}
                className="w-full h-12 bg-[#0F172A] text-white font-medium text-base shrink-0"
                size="lg"
              >
                <Bookmark className="w-5 h-5 mr-2" />
                Save Annotation
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
