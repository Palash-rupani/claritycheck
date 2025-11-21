'use client'

import { FC, ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  tooltip?: string
  error?: string
  required?: boolean
  type?: 'text' | 'textarea' | 'email' | 'number'
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
}

const FormField: FC<FormFieldProps> = ({
  label,
  tooltip,
  error,
  required = false,
  type = 'text',
  placeholder,
  value,
  onChange,
  className,
}) => {
  const InputComponent = type === 'textarea' ? Textarea : Input

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <InputComponent
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          error && 'border-destructive focus-visible:ring-destructive'
        )}
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

export default FormField
