import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ScanImage from '../ScanImage'
import { getScanImageUrl } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  getScanImageUrl: vi.fn((url: string) => `http://localhost:8080${url}`),
}))

describe('ScanImage', () => {
  it('should render image with correct src', () => {
    render(<ScanImage imageUrl="/v1/scans/test-scan-id/image" />)

    const img = screen.getByRole('img')
    expect(getScanImageUrl).toHaveBeenCalledWith('/v1/scans/test-scan-id/image')
    expect(img).toHaveAttribute('src', 'http://localhost:8080/v1/scans/test-scan-id/image')
  })

  it('should use custom alt text', () => {
    render(<ScanImage imageUrl="/v1/scans/test-id/image" alt="Custom alt" />)

    const img = screen.getByAltText('Custom alt')
    expect(img).toBeInTheDocument()
  })

  it('should return null when imageUrl is undefined', () => {
    const { container } = render(<ScanImage imageUrl={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })
})
