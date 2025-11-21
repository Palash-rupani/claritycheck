"use client"

import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface QuestionCardProps {
  question: {
    id: string
    text: string
    type: string
    options?: string[] | null
  }
  answer: string
  onAnswerChange: (value: string) => void
  index: number
}

export default function QuestionCard({ question, answer, onAnswerChange, index }: QuestionCardProps) {
  return (
    <Card className="p-4 shadow-sm border border-muted">
      <p className="font-medium text-foreground mb-2">
        {index + 1}. {question.text}
      </p>

      <Textarea
        placeholder="Type your answer…"
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
      />
    </Card>
  )
}
