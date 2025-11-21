'use client'

import { FC } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Download, FileText, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnalysisResult } from '@/src/lib/reportEngine'

interface ReportPreviewProps {
  productName: string
  productClaim: string
  category: string
  answeredQuestions: number
  totalQuestions: number
  analysis?: AnalysisResult
  onDownload: () => void
  loading?: boolean
}

const ReportPreview: FC<ReportPreviewProps> = ({
  productName,
  productClaim,
  category,
  answeredQuestions,
  totalQuestions,
  analysis,
  onDownload,
  loading = false,
}) => {
  const completionPercentage = totalQuestions
    ? Math.round((answeredQuestions / totalQuestions) * 100)
    : 0

  return (
    <Card className="overflow-hidden shadow border rounded-2xl pdf-safe bg-white">
      {/* HEADER */}
      <CardHeader className="bg-gray-100 border-b">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold">{productName}</CardTitle>
            <CardDescription className="mt-1 text-base text-gray-700">
              {productClaim}
            </CardDescription>
          </div>
          <FileText className="h-8 w-8 text-black" />
        </div>
      </CardHeader>

      {/* CONTENT */}
      <CardContent className="pt-6 space-y-8">

        {/* META INFO */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-gray-200 p-4">
            <p className="text-xs text-gray-600 mb-1">Category</p>
            <p className="font-semibold">{category}</p>
          </div>

          <div className="rounded-xl bg-gray-200 p-4">
            <p className="text-xs text-gray-600 mb-1">Completion</p>
            <p className="font-semibold">{completionPercentage}%</p>
          </div>
        </div>

        {/* SCORES BLOCK */}
        {analysis && (
          <div className="rounded-xl border p-5 bg-gray-100 space-y-3">
            <h3 className="font-semibold text-base mb-2">
              Transparency Scores
            </h3>

            <ScoreItem label="Overall Score" value={analysis.overall} />
            <ScoreItem
              label="Ingredient Safety"
              value={analysis.ingredientSafety}
            />
            <ScoreItem
              label="Claim Credibility"
              value={analysis.claimCredibility}
            />
            <ScoreItem label="Traceability" value={analysis.traceability} />
            <ScoreItem label="Completeness" value={analysis.completeness} />
          </div>
        )}

        {/* HORIZONTAL SCORE BARS */}
        {analysis && (
          <div className="rounded-xl border p-5 bg-white space-y-4">
            <h3 className="font-semibold text-base">Score Breakdown</h3>

            <ScoreBar label="Overall Score" value={analysis.overall} />
            <ScoreBar
              label="Ingredient Safety"
              value={analysis.ingredientSafety}
            />
            <ScoreBar
              label="Claim Credibility"
              value={analysis.claimCredibility}
            />
            <ScoreBar label="Traceability" value={analysis.traceability} />
            <ScoreBar label="Completeness" value={analysis.completeness} />
          </div>
        )}

        {/* RADAR CHART */}
        {analysis && (
          <div className="rounded-xl border p-5 bg-white">
            <h3 className="font-semibold text-base mb-3">Radar Overview</h3>
            <RadarChart scores={analysis} />
          </div>
        )}

        {/* RISK FLAGS */}
        {analysis?.riskFlags?.length ? (
          <div className="rounded-xl border border-gray-400 bg-gray-200 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-black" />
              <h3 className="font-semibold text-black">Risk Flags</h3>
            </div>
            <ul className="list-disc pl-6 text-sm text-black">
              {analysis.riskFlags.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* SUMMARY */}
        {analysis && (
          <div className="rounded-xl border p-5 bg-gray-100">
            <h3 className="font-semibold">Summary</h3>
            <p className="text-sm text-gray-700 mt-1 leading-relaxed">
              {analysis.summary}
            </p>
          </div>
        )}

        {/* DOWNLOAD */}
        <div className="border-t pt-6">
          <Button
            onClick={onDownload}
            disabled={loading}
            className="w-full gap-2"
          >
            <Download className="h-4 w-4" />
            {loading ? "Generating PDF…" : "Download PDF"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ReportPreview

/* --------------------------------------------------------------------
   REUSABLE SCORE TEXT ROW
-------------------------------------------------------------------- */
const ScoreItem = ({ label, value }: { label: string; value: number }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-600">{label}</span>
    <span className="font-semibold">{value}/100</span>
  </div>
)

/* --------------------------------------------------------------------
   HORIZONTAL SCORE BAR GRAPH
-------------------------------------------------------------------- */
const ScoreBar = ({ label, value }: { label: string; value: number }) => {
  return (
    <div className="mb-2">
      <div className="flex justify-between mb-1 text-sm font-medium">
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div className="w-full h-3 bg-gray-300 rounded-full">
        <div
          className="h-3 bg-black rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------
   RADAR CHART (SVG - PDF SAFE)
-------------------------------------------------------------------- */
const RadarChart = ({ scores }: { scores: AnalysisResult }) => {
  const max = 100

  const values = [
    scores.overall / max,
    scores.ingredientSafety / max,
    scores.claimCredibility / max,
    scores.traceability / max,
    scores.completeness / max,
  ]

  const angle = (i: number) => (Math.PI * 2 * i) / values.length

  const points = values
    .map((v, i) => {
      const a = angle(i)
      const x = 110 + 80 * v * Math.cos(a)
      const y = 110 + 80 * v * Math.sin(a)
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg width="220" height="220" className="mx-auto">
      {/* Outer circle */}
      <circle cx="110" cy="110" r="80" fill="none" stroke="#ddd" />

      {/* Filled polygon */}
      <polygon points={points} fill="rgba(0,0,0,0.4)" stroke="black" />

      {/* Labels */}
      <text x="110" y="15" textAnchor="middle" className="text-xs">
        Overall
      </text>
      <text x="205" y="120" textAnchor="middle" className="text-xs">
        Ingredient
      </text>
      <text x="110" y="215" textAnchor="middle" className="text-xs">
        Claim
      </text>
      <text x="15" y="120" textAnchor="middle" className="text-xs">
        Traceability
      </text>
      <text x="110" y="110" textAnchor="middle" className="text-xs">
        Complete
      </text>
    </svg>
  )
}
