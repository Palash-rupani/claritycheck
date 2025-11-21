// Type definitions for ClarityCheck platform

export interface Product {
  id: string
  name: string
  category: string
  description: string
  claim: string
  status: 'draft' | 'followups' | 'report'
  createdAt: string
  updatedAt: string
}

export interface ProductProfile {
  id: string
  productId: string
  ingredients: string
  sourcing: string
  certifications: string
  additionalDetails?: string
  updatedAt: string
}

export interface FollowupQuestion {
  id: string
  productId: string
  question: string
  category: string
  isAnswered: boolean
  answer?: string
  order: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
