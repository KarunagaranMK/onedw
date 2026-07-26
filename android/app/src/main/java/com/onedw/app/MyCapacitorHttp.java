package com.onedw.app

import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

@CapacitorPlugin(name = "MyCapacitorHttp")
class MyCapacitorHttp : Plugin() {
    @PluginMethod
    fun fetch(call: PluginCall) {
        val url = call.getString("url") ?: ""
        val method = call.getString("method") ?: "GET"

        try {
            val conn = URL(url).openConnection() as HttpURLConnection
            conn.requestMethod = method
            conn.connectTimeout = 15000
            conn.readTimeout = 15000

            val responseCode = conn.responseCode
            val reader = BufferedReader(InputStreamReader(if (responseCode < 400) conn.inputStream else conn.errorStream))
            val response = reader.readText()
            reader.close()
            conn.disconnect()

            val result = JSObject()
            result.put("status", responseCode)
            result.put("data", response)
            call.resolve(result)
        } catch (e: Exception) {
            call.reject("HTTP fetch failed: ${e.message}")
        }
    }
}
