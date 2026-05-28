import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'ScholarU — Find UVic Scholarships',
  description: 'Discover and track scholarships at the University of Victoria. Built by students at VikeLabs.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* Blocking script: sets dark class before first paint to prevent FOUC */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('scholar-u:theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();` }} />
      </head>
      <body className="h-full flex flex-col">
        <ThemeProvider>
          <Navbar />
          <div className="flex-1">
            {children}
          </div>
          <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                © {new Date().getFullYear()} ScholarU · Built by students at{' '}
                <span className="font-medium text-primary-600">VikeLabs</span>
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                University of Victoria scholarships database
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
