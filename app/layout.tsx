import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'ScholarU — Find UVic Scholarships',
  description: 'Discover and track scholarships at the University of Victoria. Built by students at VikeLabs.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex flex-col">
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <footer className="border-t border-slate-200 bg-white mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} ScholarU · Built by students at{' '}
              <span className="font-medium text-primary-600">VikeLabs</span>
            </p>
            <p className="text-sm text-slate-400">
              University of Victoria scholarships database
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
