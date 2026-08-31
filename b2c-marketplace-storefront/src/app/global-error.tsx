"use client"
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div data-testid="global-error">
          <h2>Algo deu errado!</h2>
          <button onClick={() => reset()} data-testid="global-error-retry-button">Tentar novamente</button>
        </div>
      </body>
    </html>
  )
}
