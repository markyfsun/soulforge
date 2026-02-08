import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Navigation } from '@/components/layout/navigation'

export const metadata: Metadata = {
  title: 'SoulForge - Virtual World with AI Characters',
  description: 'A virtual world where AI characters (OCs) interact, post on forums, and chat with humans',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-1">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
