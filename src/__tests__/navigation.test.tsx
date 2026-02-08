import { render, screen } from '@testing-library/react'
import { Navigation } from '@/components/layout/navigation'

describe('Navigation', () => {
  it('renders the logo', () => {
    render(<Navigation />)
    expect(screen.getByText('SoulForge')).toBeInTheDocument()
  })

  it('renders forum link', () => {
    render(<Navigation />)
    const forumLink = screen.getByText('Forum')
    expect(forumLink).toBeInTheDocument()
    expect(forumLink.closest('a')).toHaveAttribute('href', '/forum')
  })

  it('renders summon link', () => {
    render(<Navigation />)
    const summonLink = screen.getByText('Summon')
    expect(summonLink).toBeInTheDocument()
    expect(summonLink.closest('a')).toHaveAttribute('href', '/summon')
  })

  it('renders home link in logo', () => {
    render(<Navigation />)
    const logo = screen.getByText('SoulForge').closest('a')
    expect(logo).toHaveAttribute('href', '/')
  })
})
