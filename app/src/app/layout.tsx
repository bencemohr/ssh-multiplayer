import type { Metadata } from 'next'
import { Cousine, Arimo } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'

const cousine = Cousine({ 
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-cousine',
})

const arimo = Arimo({ 
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-arimo',
})

export const metadata: Metadata = {
  title: 'SSH Capture The Flag',
  description: 'Maritime Cyber Training Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${cousine.variable} ${arimo.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <div className="min-h-screen">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
