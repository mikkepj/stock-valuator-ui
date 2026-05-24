import { Loader2 } from 'lucide-react'

interface Props {
  text?: string
}

export function Spinner({ text = 'Cargando...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
      <Loader2 size={28} className="animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  )
}
