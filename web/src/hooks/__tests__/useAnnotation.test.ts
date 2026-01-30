import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useAnnotation } from '../useAnnotation'
import { analyzeText, createAnnotation } from '@/lib/api'

vi.mock('@/lib/api')

describe('useAnnotation', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }

  it('should submit annotation successfully', async () => {
    const mockNuanceResponse = {
      meaning: 'test meaning',
      usageExample: 'test example',
      whenToUse: 'test when',
      wordBreakdown: 'test breakdown',
      alternativeMeanings: 'test alt',
    }
    const mockAnnotationResponse = {
      id: 'ann-id',
      scanId: 'scan-id',
      highlightedText: 'test text',
      contextText: 'test context',
      nuanceData: mockNuanceResponse,
    }

    vi.mocked(analyzeText).mockResolvedValueOnce(mockNuanceResponse)
    vi.mocked(createAnnotation).mockResolvedValueOnce(mockAnnotationResponse)

    const { result } = renderHook(() => useAnnotation(123), { wrapper })

    result.current.mutate({ textToAnalyze: 'test text', context: 'test context' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockAnnotationResponse)
    expect(analyzeText).toHaveBeenCalledWith({
      textToAnalyze: 'test text',
      context: 'test context',
    })
    expect(createAnnotation).toHaveBeenCalledWith({
      scanId: 123,
      highlightedText: 'test text',
      contextText: 'test context',
      nuanceData: mockNuanceResponse,
    })
  })

  it('should handle errors', async () => {
    const error = new Error('Failed to annotate')
    vi.mocked(analyzeText).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useAnnotation(123), { wrapper })

    result.current.mutate({ textToAnalyze: 'test text', context: 'test context' })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(error)
  })
})
