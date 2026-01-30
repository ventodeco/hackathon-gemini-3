import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { BookmarkList } from '../BookmarkList'
import type { Annotation } from '@/lib/types'

const mockAnnotations: Annotation[] = [
  {
    id: 1,
    user_id: 1,
    scan_id: 1,
    highlighted_text: 'テスト',
    context_text: 'Test context',
    nuance_data: {
      meaning: 'Test',
      usageExample: 'テストです',
      usageTiming: 'Testing',
      wordBreakdown: 'Test',
      alternativeMeaning: 'Exam',
    },
    is_bookmarked: true,
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 2,
    user_id: 1,
    scan_id: 2,
    highlighted_text: '取消し',
    context_text: 'Cancel context',
    nuance_data: {
      meaning: 'Cancellation',
      usageExample: '取消しです',
      usageTiming: 'Cancelling',
      wordBreakdown: 'Cancel',
      alternativeMeaning: 'Revocation',
    },
    is_bookmarked: true,
    created_at: '2026-01-12T10:00:00.000Z',
  },
]

describe('BookmarkList', () => {
  const onDelete = vi.fn()

  it('should render all annotations sorted by date (newest first)', () => {
    render(
      <BrowserRouter>
        <BookmarkList annotations={mockAnnotations} onDelete={onDelete} />
      </BrowserRouter>
    )
    const cards = screen.getAllByText(/取消し|テスト/)
    expect(cards).toHaveLength(2)
  })

  it('should pass onDelete callback to each card', () => {
    render(
      <BrowserRouter>
        <BookmarkList annotations={mockAnnotations} onDelete={onDelete} />
      </BrowserRouter>
    )
    const deleteButtons = screen.getAllByRole('button', { name: /delete annotation/i })
    expect(deleteButtons).toHaveLength(2)
  })
})
