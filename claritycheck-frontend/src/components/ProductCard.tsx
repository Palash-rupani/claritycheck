'use client'

import { FC } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Product } from '@/types'
import { ChevronRight, FileText, AlertCircle, Check } from 'lucide-react'

interface ProductCardProps {
  product: Product
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: AlertCircle },
  followups: { label: 'Needs Followups', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: AlertCircle },
  report: { label: 'Report Ready', color: 'bg-accent text-accent-foreground', icon: Check },
}

const ProductCard: FC<ProductCardProps> = ({ product }) => {
  const status = statusConfig[product.status as keyof typeof statusConfig] || statusConfig.draft
  const StatusIcon = status.icon

  return (
    <Link href={`/products/${product.id}/edit`}>
      <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate text-lg">{product.name}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {product.claim || product.description}
              </CardDescription>
            </div>
            <Badge className={status.color} variant="secondary">
              <StatusIcon className="mr-1 h-3 w-3" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {product.category}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default ProductCard
