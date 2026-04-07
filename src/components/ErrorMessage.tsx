import './ErrorMessage.css'

interface Props {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="error-box">
      <span className="error-icon">⚠</span>
      <p className="error-text">{message}</p>
      {onRetry && (
        <button className="btn-action" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}
