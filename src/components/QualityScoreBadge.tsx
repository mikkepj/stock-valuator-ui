import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface QualityScoreBadgeProps {
  score: number
}

function category(score: number): { label: string; className: string } {
  if (score >= 80) return { label: 'Excelente', className: 'text-green-500' }
  if (score >= 60) return { label: 'Bueno', className: 'text-blue-500' }
  if (score >= 40) return { label: 'Moderado', className: 'text-yellow-500' }
  return { label: 'Débil', className: 'text-red-500' }
}

export function QualityScoreBadge({ score }: QualityScoreBadgeProps) {
  const { label, className } = category(score)

  return (
    <TooltipProvider>
      <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 cursor-help">
          <span className={`text-lg font-bold tabular-nums leading-none ${className}`}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground leading-none">/ 100</span>
          <span className={`text-xs font-medium leading-none ${className}`}>{label}</span>
          <Info size={12} className="text-muted-foreground ml-0.5" />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-xs">
        Score de calidad del negocio: FCF Growth, Consistencia, ROIC vs WACC, Apalancamiento, Tendencia de márgenes
      </TooltipContent>
    </Tooltip>
    </TooltipProvider>
  )
}
