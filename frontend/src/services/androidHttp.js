// androidHttp.js — Web-only fallback (no Capacitor needed for browser)
// All requests go through standard fetch / Axios on web

import { getApiBase } from '../config/android'

class AndroidHttpPlugin {
  constructor() {
    this.isNative = false
    this.isWebFallback = true  // always use web fetch in browser
  }

  async init() {
    // No-op in web mode
    this.isNative = false
  }

  async get(url, headers = {}) {
    return this.webFetch(url, 'GET', headers)
  }

  async post(url, body, headers = {}) {
    return this.webFetch(url, 'POST', headers, body)
  }

  async put(url, body, headers = {}) {
    return this.webFetch(url, 'PUT', headers, body)
  }

  async delete(url, headers = {}) {
    return this.webFetch(url, 'DELETE', headers)
  }

  async webFetch(url, method, headers = {}, body = null) {
    const fetchHeaders = { ...headers }
    if (body && !fetchHeaders['Content-Type']) {
      fetchHeaders['Content-Type'] = 'application/json'
    }

    const response = await fetch(url, {
      method,
      headers: fetchHeaders,
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    })

    const data = await response.json()
    return { status: response.status, data }
  }
}

const androidHttp = new AndroidHttpPlugin()
export default androidHttp
