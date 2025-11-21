'use client'

import { FC } from 'react'
import { motion } from 'framer-motion'

interface StepHeaderProps {
  currentStep: number
  totalSteps: number
  stepNames: string[]
}

const StepHeader: FC<StepHeaderProps> = ({ currentStep, totalSteps, stepNames }) => {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="w-full space-y-6 py-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {stepNames[currentStep - 1] || 'Step'}
          </h2>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: `${(currentStep - 1) / totalSteps * 100}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between gap-2">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <motion.div
            key={idx}
            className={`flex-1 rounded-lg py-2 text-center text-xs font-medium transition-all ${
              idx + 1 <= currentStep
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
            initial={{ scale: 0.95, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            Step {idx + 1}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default StepHeader
