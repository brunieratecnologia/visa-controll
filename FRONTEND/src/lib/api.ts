const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | null
}

const readErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json()

    if (typeof payload?.message === 'string') {
      return payload.message
    }

    const firstError = payload?.errors && Object.values(payload.errors)[0]
    if (Array.isArray(firstError) && typeof firstError[0] === 'string') {
      return firstError[0]
    }
  } catch {
    // ignore parse errors and fall back to generic text
  }

  return 'Não foi possível concluir a requisição.'
}

const isFormData = (body: RequestOptions['body']): body is FormData => body instanceof FormData
const isRawBody = (body: RequestOptions['body']): body is BodyInit =>
  typeof body === 'string' || body instanceof Blob || body instanceof URLSearchParams || body instanceof ArrayBuffer

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {})
  let body: BodyInit | undefined

  if (options.body === undefined || options.body === null) {
    body = undefined
  } else if (isFormData(options.body) || isRawBody(options.body)) {
    body = options.body
  } else {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.body)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body,
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return response.json() as Promise<T>
}
