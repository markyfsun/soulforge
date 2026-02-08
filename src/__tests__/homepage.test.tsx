import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

// Mock the OC API functions
vi.mock('@/lib/api/ocs', () => ({
  checkWorldHasOCs: vi.fn().mockResolvedValue(false),
  getOCCount: vi.fn().mockResolvedValue(0),
}))

// Mock the HeroSection component
vi.mock('@/components/homepage/hero-section', () => ({
  HeroSection: ({ hasOCs, ocCount }: { hasOCs: boolean; ocCount: number }) => (
    <div data-testid="hero-section">
      <div data-testid="has-ocs">{String(hasOCs)}</div>
      <div data-testid="oc-count">{ocCount}</div>
    </div>
  ),
}))

describe('HomePage', () => {
  it('renders the HeroSection with world state', async () => {
    const page = await HomePage()
    render(page)

    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
    expect(screen.getByTestId('has-ocs')).toHaveTextContent('false')
    expect(screen.getByTestId('oc-count')).toHaveTextContent('0')
  })
})
