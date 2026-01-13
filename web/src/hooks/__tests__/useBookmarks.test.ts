import { renderHook, act } from '@testing-library/react'
import { useBookmarks } from '../useBookmarks'
import type { Annotation } from '@/lib/types'

const mockAnnotations: Annotation[] = [
  {
    id: 'ann-1',
    scanID: 'scan-1',
    ocrResultID: 'ocr-1',
    selectedText: 'テスト',
    meaning: 'Test',
    usageExample: 'テストです',
    whenToUse: 'Testing',
    wordBreakdown: 'Test',
    alternativeMeanings: 'Exam',
    model: 'gemini-1.5-flash',
    promptVersion: '1.0',
    createdAt: '2026-01-10T10:00:00.000Z',
    context: 'Test context',
  },
  {
    id: 'ann-2',
    scanID: 'scan-2',
    ocrResultID: 'ocr-2',
    selectedText: '取消し',
    meaning: 'Cancellation',
    usageExample: '取消しです',
    whenToUse: 'Cancelling',
    wordBreakdown: 'Cancel',
    alternativeMeanings: 'Revocation',
    model: 'gemini-1.5-flash',
    promptVersion: '1.0',
    createdAt: '2026-01-12T10:00:00.000Z',
    context: 'Cancel context',
  },
]

let mockRemoveAnnotation = vi.fn()

vi.mock('@/lib/storage', () => ({
  getAllSavedAnnotationsList: vi.fn(() => mockAnnotations),
  isAnnotationSaved: vi.fn((id: string) => id === 'ann-1'),
  removeAnnotation: (...args: unknown[]) => mockRemoveAnnotation(...args),
  loadAnnotation: vi.fn((id: string) => mockAnnotations.find(a => a.id === id) || null),
}))

describe('useBookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRemoveAnnotation = vi.fn()
  })

  it('should load saved annotations on mount', () => {
    const { result } = renderHook(() => useBookmarks())
    expect(result.current.savedAnnotations).toHaveLength(2)
    expect(result.current.savedAnnotations[0].id).toBe('ann-1')
  })

  it('should call isSaved with correct annotation id', () => {
    const { result } = renderHook(() => useBookmarks())
    expect(result.current.isSaved('ann-1')).toBe(true)
    expect(result.current.isSaved('unknown')).toBe(false)
  })

  it('should call removeAnnotation with correct id', () => {
    const { result } = renderHook(() => useBookmarks())
    act(() => {
      result.current.removeAnnotation('ann-1')
    })
    expect(mockRemoveAnnotation).toHaveBeenCalledWith('ann-1')
  })

  it('should call getAnnotation with correct id', () => {
    const { result } = renderHook(() => useBookmarks())
    const annotation = result.current.getAnnotation('ann-1')
    expect(annotation).not.toBeNull()
    expect(annotation?.id).toBe('ann-1')
  })
})
