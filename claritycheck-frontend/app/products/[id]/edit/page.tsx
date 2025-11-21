'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/src/components/Header'
import Footer from '@/src/components/Footer'
import StepHeader from '@/src/components/StepHeader'
import FormField from '@/src/components/FormField'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getProduct, saveProfile } from '@/src/lib/api'
import { Product, ProductProfile } from '@/src/types'
import { AlertCircle, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function EditProduct() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [showCertificationFields, setShowCertificationFields] = useState(false)

  const [formData, setFormData] = useState({
    ingredients: '',
    sourcing: '',
    certifications: '',
    additionalDetails: '',
  })

  useEffect(() => {
    loadProduct()
  }, [productId])

  useEffect(() => {
    if (product?.claim) {
      const keywords = ['organic', 'certified', 'vegan', 'fair trade']
      const hasCertificationKeyword = keywords.some((kw) =>
        product.claim.toLowerCase().includes(kw)
      )
      setShowCertificationFields(hasCertificationKeyword)
    }
  }, [product])

  const loadProduct = async () => {
    try {
      setLoading(true)
      const data = await getProduct(productId)
      setProduct(data)
    } catch (err: any) {
      setError(
        err.message || 'Failed to load product. Ensure backend is running at http://localhost:8000'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await saveProfile(productId, formData)
      // Move to next step
      router.push(`/products/${productId}/followups`)
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="mx-auto max-w-2xl px-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-20 animate-pulse bg-muted" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          {/* Step Header */}
          <StepHeader
            currentStep={2}
            totalSteps={3}
            stepNames={['Create Product', 'Product Details', 'Followups & Report']}
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">
                  {product?.name}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Complete your product profile
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Product Info Summary */}
              <div className="mb-8 rounded-lg bg-muted/50 p-4 border border-border">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Claim:</span>{' '}
                    <span className="font-medium text-foreground">{product?.claim}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>{' '}
                    <span className="font-medium text-foreground">{product?.category}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {/* Ingredients */}
                <FormField
                  label="Ingredients"
                  type="textarea"
                  placeholder="List major ingredients, separated by commas"
                  value={formData.ingredients}
                  onChange={(v) => setFormData({ ...formData, ingredients: v })}
                  tooltip="Helps the AI suggest relevant sourcing and certification questions"
                />

                {/* Sourcing */}
                <FormField
                  label="Sourcing Information"
                  type="textarea"
                  placeholder="Where do you source materials? Any key suppliers or origin details?"
                  value={formData.sourcing}
                  onChange={(v) => setFormData({ ...formData, sourcing: v })}
                  tooltip="Provide geographic origin, supplier relationships, or supply chain details"
                />

                {/* Conditional Certification Fields */}
                <motion.div
                  initial={false}
                  animate={{ height: showCertificationFields ? 'auto' : 0, opacity: showCertificationFields ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  {showCertificationFields && (
                    <div className="space-y-6 rounded-lg border border-accent/20 bg-accent/5 p-4">
                      <div className="flex gap-2 text-sm text-accent">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span>Certification fields detected from your claim</span>
                      </div>
                      
                      <FormField
                        label="Certifications"
                        type="textarea"
                        placeholder="e.g., USDA Organic, Fair Trade, Vegan Society"
                        value={formData.certifications}
                        onChange={(v) => setFormData({ ...formData, certifications: v })}
                        tooltip="List any relevant certifications or standards your product meets"
                      />
                    </div>
                  )}
                </motion.div>

                {/* Additional Details */}
                <FormField
                  label="Additional Details"
                  type="textarea"
                  placeholder="Any other relevant information about your product"
                  value={formData.additionalDetails}
                  onChange={(v) => setFormData({ ...formData, additionalDetails: v })}
                  tooltip="Quality control, testing, manufacturing processes, etc."
                />

                {/* Buttons */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 gap-2"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {saving ? 'Saving...' : 'Continue to Followups'}
                    {!saving && <ArrowRight className="h-4 w-4" />}
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
