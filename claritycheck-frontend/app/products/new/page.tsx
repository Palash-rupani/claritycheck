'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/src/components/Header'
import Footer from '@/src/components/Footer'
import StepHeader from '@/src/components/StepHeader'
import FormField from '@/src/components/FormField'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createProduct } from '@/src/lib/api'
import { AlertCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function NewProduct() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    claim: '',
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.category.trim()) newErrors.category = 'Category is required'
    if (!formData.claim.trim()) newErrors.claim = 'Product claim is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      const response = await createProduct(formData)
      const productId = response.id || response.data?.id
      
      if (productId) {
        router.push(`/products/${productId}/edit`)
      } else {
        setError('Failed to create product')
      }
    } catch (err: any) {
      setError(
        err.message || 'Failed to create product. Ensure backend is running at http://localhost:8000'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          {/* Step Header */}
          <StepHeader
            currentStep={1}
            totalSteps={3}
            stepNames={['Create Product', 'Product Details', 'Followups & Report']}
          />

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">
                  Create Your Product
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Start by providing basic product information
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Name */}
                <FormField
                  label="Product Name"
                  placeholder="e.g., Organic Spinach Powder"
                  value={formData.name}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                  error={errors.name}
                  required
                  tooltip="The name of your product as it appears on packaging"
                />

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Category
                    <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select a category</option>
                    <option value="food">Food & Beverages</option>
                    <option value="supplements">Supplements</option>
                    <option value="cosmetics">Cosmetics</option>
                    <option value="textiles">Textiles</option>
                    <option value="electronics">Electronics</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.category && (
                    <p className="text-xs text-destructive">{errors.category}</p>
                  )}
                </div>

                {/* Description */}
                <FormField
                  label="Description"
                  type="textarea"
                  placeholder="Describe your product in detail"
                  value={formData.description}
                  onChange={(v) => setFormData({ ...formData, description: v })}
                  tooltip="Key features, ingredients, or manufacturing process"
                />

                {/* Main Claim */}
                <FormField
                  label="Main Claim"
                  type="textarea"
                  placeholder="What is your primary product claim? e.g., 'Organic', 'Sustainably sourced', 'Fair trade certified'"
                  value={formData.claim}
                  onChange={(v) => setFormData({ ...formData, claim: v })}
                  error={errors.claim}
                  required
                  tooltip="The main claim you want verified (helps our AI generate relevant questions)"
                />

                {/* Buttons */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 gap-2"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? 'Creating...' : 'Create Product'}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
