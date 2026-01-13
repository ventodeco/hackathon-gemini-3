import { useState, useCallback } from 'react'
import type { Annotation } from '@/lib/types'
import {
  getAllSavedAnnotationsList,
  isAnnotationSaved,
  removeAnnotation,
  loadAnnotation,
} from '@/lib/storage'

export function useBookmarks() {
  const [savedAnnotations, setSavedAnnotations] = useState<Annotation[]>(() => {
    return getAllSavedAnnotationsList()
  })

  const refresh = useCallback(() => {
    setSavedAnnotations(getAllSavedAnnotationsList())
  }, [])

  const checkIsSaved = useCallback((annotationId: string): boolean => {
    return isAnnotationSaved(annotationId)
  }, [])

  const deleteAnnotation = useCallback((annotationId: string): void => {
    removeAnnotation(annotationId)
    setSavedAnnotations(getAllSavedAnnotationsList())
  }, [])

  const getAnnotationById = useCallback((annotationId: string): Annotation | null => {
    return loadAnnotation(annotationId)
  }, [])

  return {
    savedAnnotations,
    refresh,
    isSaved: checkIsSaved,
    removeAnnotation: deleteAnnotation,
    getAnnotation: getAnnotationById,
  }
}
