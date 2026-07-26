// androidBridge.js — Web-only stub (no Capacitor needed for browser)
// On the web platform, isNative() always returns false

import { isAndroid } from '../config/android'
import androidHttp from '../services/androidHttp'

class AndroidBridge {
  constructor() {
    this.initialized = false
  }

  async init() {
    if (this.initialized) return
    await androidHttp.init()
    this.initialized = true
  }

  isNative() {
    return isAndroid()  // always false on web
  }

  getPlatform() {
    return 'web'
  }

  isIOS() {
    return false
  }
}

const androidBridge = new AndroidBridge()
export default androidBridge
