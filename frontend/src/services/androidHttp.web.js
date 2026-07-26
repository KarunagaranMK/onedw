export default class WebHttpFallback {
  async fetch(options) {
    const response = await fetch(options.url, {
      method: options.method || 'GET',
      headers: options.headers ? JSON.parse(options.headers) : {},
      body: options.body || undefined,
    })
    const data = await response.text()
    return { status: response.status, data }
  }
}
