import './Spinner.css'

interface Props {
  text?: string
}

export function Spinner({ text = 'Cargando...' }: Props) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" aria-hidden="true" />
      <span className="spinner-text">{text}</span>
    </div>
  )
}
