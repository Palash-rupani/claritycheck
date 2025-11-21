'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/src/components/Header'
import Footer from '@/src/components/Footer'
import StepHeader from '@/src/components/StepHeader'
import QuestionCard from '@/src/components/QuestionCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { fetchLatestFollowups, saveAnswers } from '@/src/lib/api'
import { FollowupQuestion } from '@/src/types'
import { AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function FollowupsPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<FollowupQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})

  useEffect(() => {
    loadFollowups()
  }, [productId])

  const loadFollowups = async () => {
    try {
      setLoading(true)
      const data = await fetchLatestFollowups(productId)

      console.log('Followup API data:', data)

      // Ensure we always get an array
      const questionsList: FollowupQuestion[] = Array.isArray(data.followups)
        ? data.followups
        : []

      setQuestions(questionsList)

      // Initialize answers object
      const initialAnswers: Record<string, string> = {}
      questionsList.forEach((q) => {
        initialAnswers[q.id] = q.answer || ''
      })
      setAnswers(initialAnswers)
    } catch (err: any) {
      console.error(err)
      setError(
        err.message || 'Failed to load questions. Ensure backend is running at http://localhost:8000'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAnswers = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await saveAnswers(productId, answers)
      router.push(`/products/${productId}/report`)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to save answers')
    } finally {
      setSaving(false)
    }
  }

  const answeredCount = Object.values(answers).filter((a) => a.trim()).length

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="mx-auto max-w-2xl px-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-40 animate-pulse bg-muted" />
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
          <StepHeader
            currentStep={3}
            totalSteps={3}
            stepNames={['Create Product', 'Product Details', 'Followups & Report']}
          />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4"
            >
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h1 className="text-2xl font-bold text-foreground">
              Answer Followup Questions
            </h1>
            <p className="mt-2 text-muted-foreground">
              These AI-generated questions help verify your product claims. Answer as many as you can.
            </p>
          </motion.div>

          <Card className="mb-8 p-4 bg-accent/5 border-accent/20">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">Progress</span>
                <span className="text-accent font-medium">
                  {answeredCount} of {questions.length} answered
                </span>
              </div>
              <div className="h-2 bg-accent/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent"
                  initial={{ width: '0%' }}
                  animate={{ width: `${(answeredCount / questions.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </Card>

          {questions.length === 0 ? (
            <Card className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold text-foreground mb-2">No questions yet</h3>
              <p className="text-muted-foreground">
                Check back soon or try adjusting your product details
              </p>
            </Card>
          ) : (
            <form onSubmit={handleSaveAnswers} className="space-y-6">
              {questions.map((question, idx) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  answer={answers[question.id] || ''}
                  onAnswerChange={(value) =>
                    setAnswers({ ...answers, [question.id]: value })
                  }
                  index={idx}
                />
              ))}

              <div className="flex gap-4 pt-6">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Back
                </Button>
                <Button type="submit" disabled={saving} className="flex-1 gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Generating Report...' : 'Generate Report'}
                  {!saving && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
