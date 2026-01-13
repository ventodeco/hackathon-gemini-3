import { useParams } from 'react-router-dom'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import BottomActionBar from '@/components/layout/BottomActionBar'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Annotation } from '@/lib/types'
import { useScan } from '@/hooks/useScan'
import { useTextSelection } from '@/hooks/useTextSelection'
import { AnnotationDrawer } from '@/components/scanpage/AnnotationDrawer'
import { getMockAnnotation } from '@/lib/mockAnnotations'
import LoadingSpinner from '@/components/scanpage/LoadingSpinner'
import ErrorAlert from '@/components/scanpage/ErrorAlert'

export default function ScanPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isPending, isError, error } = useScan(id)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null)
  const [isLoadingAnnotation, setIsLoadingAnnotation] = useState(false)
  const { selectedText, handleSelection, clearSelection } = useTextSelection()

  if (isPending) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header title="Scan Result" />
        <div className="flex flex-1 items-center justify-center p-6">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header title="Scan Result" />
        <div className="flex flex-1 items-center justify-center p-6">
          <ErrorAlert
            title="Failed to load scan"
            message={error instanceof Error ? error.message : 'Failed to load scan'}
          />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header title="Scan Result" />
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-gray-600">Scan not found</p>
        </div>
      </div>
    )
  }

  const handleTextSelect = () => {
    const selection = window.getSelection()
    if (!selection || selection.toString().trim() === '') {
      clearSelection()
      return
    }
    handleSelection(selection.toString())
  }

  const handleExplain = async () => {
    if (!selectedText) return
    
    setIsLoadingAnnotation(true)
    
    setTimeout(() => {
      const mockAnnotation = getMockAnnotation(selectedText)
      setCurrentAnnotation(mockAnnotation)
      setIsLoadingAnnotation(false)
      setIsDrawerOpen(true)
    }, 500)
  }

  const handleDrawerClose = () => {
    setIsDrawerOpen(false)
    setCurrentAnnotation(null)
    clearSelection()
  }

  const imageUrl = data.imageUrl

  return (
    <div className="flex min-h-screen flex-col bg-white pb-20">
      <Header title="Scan Result" />
      <ScrollArea className="flex-1">
        <div className="p-6">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Scanned document"
              className="mb-6 w-full rounded-lg"
            />
          )}
          <p
            className="text-base/relaxed whitespace-pre-wrap text-gray-900"
            onMouseUp={handleTextSelect}
            onTouchEnd={handleTextSelect}
          >
            {data.fullText}
          </p>
        </div>
      </ScrollArea>
      <BottomActionBar 
        disabled={!selectedText || isLoadingAnnotation}
        isLoading={isLoadingAnnotation}
        onExplain={handleExplain} 
      />
      <AnnotationDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        annotation={currentAnnotation}
      />
    </div>
  )
}
