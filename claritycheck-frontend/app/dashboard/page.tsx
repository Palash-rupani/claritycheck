'use client'

import { useState, useEffect } from 'react'
import Header from '@/src/components/Header'
import Footer from '@/src/components/Footer'
import ProductCard from '@/src/components/ProductCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Product } from '@/src/types'
import Link from 'next/link'
import { Plus, AlertCircle, RotateCw } from 'lucide-react'

// ✅ IMPORT YOUR BASE URL FROM API UTIL
import { BASE_URL } from "@/src/lib/api";


export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'draft' | 'followups' | 'report'>('all')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      // ✅ USE DEPLOYED BACKEND (NOT LOCALHOST)
      const response = await fetch(`${BASE_URL}/products`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) throw new Error('Failed to load products')

      const data = await response.json()

      setProducts(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      console.error('Error loading products:', err)

      setError(
        'Unable to connect to backend. Make sure your API is deployed and reachable.'
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((p) => {
    if (filter === 'all') return true
    return p.status === filter
  })

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

          {/* Page Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="mt-2 text-muted-foreground">
                Manage your product transparency reports
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/products/new">
                <Plus className="h-4 w-4" />
                New Product
              </Link>
            </Button>
          </div>

          {/* Error Box */}
          {error && (
            <Card className="mb-6 border-destructive/50 bg-destructive/10 p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-destructive mb-1">
                    Connection Error
                  </h3>
                  <p className="text-sm text-destructive/80 mb-4">{error}</p>
                  <Button
                    onClick={loadProducts}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RotateCw className="h-3 w-3" />
                    Retry
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* FILTER TABS */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-8">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
              <TabsTrigger value="all">All ({products.length})</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="followups">Needs Followups</TabsTrigger>
              <TabsTrigger value="report">Report Ready</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Empty State */}
          {!loading && filteredProducts.length === 0 && !error && (
            <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-6">
                {filter === 'all'
                  ? 'Get started by adding your first product'
                  : `No products with status "${filter}"`}
              </p>
              <Button asChild>
                <Link href="/products/new">Add Your First Product</Link>
              </Button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-24 animate-pulse bg-muted" />
              ))}
            </div>
          )}

          {/* Products Grid */}
          {!loading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Future Feature */}
          {!error && !loading && products.length > 0 && (
            <div className="mt-12 rounded-2xl border border-border bg-card p-8 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Coming Soon: Supplier Sync
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Automatically sync with your suppliers' systems for real-time updates.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
