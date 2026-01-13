import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { EmptyHistory } from '../EmptyHistory'

describe('EmptyHistory', () => {
  it('should render empty state message', () => {
    render(
      <MemoryRouter>
        <EmptyHistory />
      </MemoryRouter>
    )
    expect(screen.getByText('No saved annotations')).toBeInTheDocument()
    expect(
      screen.getByText('When you save annotations from your scans, they will appear here for easy access.')
    ).toBeInTheDocument()
  })

  it('should render start scanning button', () => {
    render(
      <MemoryRouter>
        <EmptyHistory />
      </MemoryRouter>
    )
    const button = screen.getByRole('link', { name: /start scanning/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('href', '/welcome')
  })

  it('should render bookmark icon', () => {
    render(
      <MemoryRouter>
        <EmptyHistory />
      </MemoryRouter>
    )
    const icon = screen.getByLabelText('bookmark icon')
    expect(icon).toBeInTheDocument()
  })
})
