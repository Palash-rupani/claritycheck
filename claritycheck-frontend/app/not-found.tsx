import Header from '@/src/components/Header'
import Footer from '@/src/components/Footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-md w-full px-4 text-center">
          <div className="flex justify-center mb-6">
            <Search className="h-16 w-16 text-muted-foreground opacity-50" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            404
          </h1>
          <p className="text-muted-foreground mb-6">
            Page not found. The product or page you're looking for doesn't exist.
          </p>
          <div className="flex gap-3">
            <Button asChild className="flex-1">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
