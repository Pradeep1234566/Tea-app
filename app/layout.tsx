// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Inside Circle 😈',
  description: 'The anonymous social party game for your friend group.',
  openGraph: {
    title: 'Inside Circle 😈',
    description: 'Join the room. Vote anonymously. Get exposed.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
