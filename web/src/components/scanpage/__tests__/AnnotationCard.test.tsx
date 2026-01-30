import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AnnotationCard from '../AnnotationCard'
import type { Annotation } from '@/lib/types'

describe('AnnotationCard', () => {
  const mockAnnotation: Annotation = {
    id: 1,
    user_id: 1,
    scan_id: 1,
    highlighted_text: 'テスト',
    context_text: 'Test context',
    nuance_data: {
      meaning: 'Test meaning',
      usageExample: 'Usage example',
      usageTiming: 'When to use',
      wordBreakdown: 'Word breakdown',
      alternativeMeaning: 'Alternative meanings',
    },
    is_bookmarked: false,
    created_at: '2024-01-01T00:00:00Z',
  }

  it('should render annotation fields', () => {
    render(<AnnotationCard annotation={mockAnnotation} />)

    expect(screen.getByText('Annotation')).toBeInTheDocument()
    expect(screen.getByText(/テスト/)).toBeInTheDocument()
    expect(screen.getByText('Test meaning')).toBeInTheDocument()
    expect(screen.getByText('Usage example')).toBeInTheDocument()
  })

  it('should render all required fields', () => {
    render(<AnnotationCard annotation={mockAnnotation} />)

    expect(screen.getByText('Meaning')).toBeInTheDocument()
    expect(screen.getByText('Usage Example')).toBeInTheDocument()
    expect(screen.getByText('When to Use')).toBeInTheDocument()
    expect(screen.getByText('Word Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Alternative Meanings')).toBeInTheDocument()
  })
})
