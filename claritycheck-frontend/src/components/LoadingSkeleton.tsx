'use client'

import { FC } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  variant?: 'card' | 'text' | 'form'
  count?: number
  className?: string
}

const LoadingSkeleton: FC<LoadingSkeletonProps> = ({
  variant = 'card',
  count = 1,
  className,
}) => {
  if (variant === 'text') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-muted rounded animate-pulse"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'form') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-muted rounded w-20 animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="h-24 bg-muted animate-pulse" />
      ))}
    </div>
  )
}

export default LoadingSkeleton
