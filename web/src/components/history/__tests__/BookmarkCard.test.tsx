import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { BookmarkCard } from '../BookmarkCard'
import type { Annotation } from '@/lib/types'
import { toast } from 'sonner'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

let mockGetMockScan = vi.fn(() => null)
vi.mock('@/lib/mockData', () => ({
  getMockScan: (...args: unknown[]) => mockGetMockScan(...args),
}))

const mockAnnotation: Annotation = {
  id: 'ann-1',
  scanID: 'scan-1',
  ocrResultID: 'ocr-1',
  selectedText: 'お忙しい中',
  meaning: 'While you are busy',
  usageExample: 'お忙しい中ありがとうございます',
  whenToUse: 'When making requests',
  wordBreakdown: 'お忙しい (busy) 中 (during)',
  alternativeMeanings: 'Amidst your busy schedule',
  model: 'gemini-1.5-flash',
  promptVersion: '1.0',
  createdAt: '2026-01-12T10:00:00.000Z',
  context: 'Business email context',
}

describe('BookmarkCard', () => {
  const onDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMockScan = vi.fn(() => null)
  })

  it('should render selected text and meaning', () => {
    render(
      <BrowserRouter>
        <BookmarkCard annotation={mockAnnotation} onDelete={onDelete} />
      </BrowserRouter>
    )
    expect(screen.getByText('お忙しい中')).toBeInTheDocument()
    expect(screen.getByText('While you are busy')).toBeInTheDocument()
  })

  it('should display formatted date', () => {
    render(
      <BrowserRouter>
        <BookmarkCard annotation={mockAnnotation} onDelete={onDelete} />
      </BrowserRouter>
    )
    expect(screen.getByText('Jan 12, 2026')).toBeInTheDocument()
  })

  it('should show error toast when scan does not exist', () => {
    render(
      <BrowserRouter>
        <BookmarkCard annotation={mockAnnotation} onDelete={onDelete} />
      </BrowserRouter>
    )
    const card = screen.getByRole('button', { name: /お忙しい中/ })
    fireEvent.click(card)
    expect(toast.error).toHaveBeenCalledWith('Scan not found', expect.any(Object))
  })

  it('should call onDelete when delete button is clicked', () => {
    render(
      <BrowserRouter>
        <BookmarkCard annotation={mockAnnotation} onDelete={onDelete} />
      </BrowserRouter>
    )
    const deleteButton = screen.getByRole('button', { name: /delete annotation/i })
    fireEvent.click(deleteButton)
    expect(onDelete).toHaveBeenCalledWith('ann-1')
    expect(toast.success).toHaveBeenCalledWith('Annotation removed', expect.any(Object))
  })
})
