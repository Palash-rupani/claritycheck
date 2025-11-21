'use client'

import { FC } from 'react'
import Link from 'next/link'

const Footer: FC = () => {
  return (
    <footer className="border-t border-border bg-muted/30 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="col-span-1">
            <h3 className="font-bold text-foreground">ClarityCheck</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Building trust through product transparency and AI-powered insights.
            </p>
          </div>

          {/* Values Column */}
          <div>
            <h4 className="font-semibold text-foreground">Mission</h4>
            <ul className="mt-4 space-y-2">
              <li className="text-sm text-muted-foreground">Health</li>
              <li className="text-sm text-muted-foreground">Wisdom</li>
              <li className="text-sm text-muted-foreground">Virtue</li>
            </ul>
          </div>

          {/* Links Column */}
          <div>
            <h4 className="font-semibold text-foreground">Product</h4>
            <ul className="mt-4 space-y-2">
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-semibold text-foreground">Legal</h4>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 ClarityCheck. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
