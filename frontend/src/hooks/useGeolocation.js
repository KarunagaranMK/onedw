import { useState, useEffect } from 'react'

export const useGeolocation = () => {
  const [location, setLocation] = useState({ lat: null, lon: null, loading: true, error: null })

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: null, lon: null, loading: false, error: 'Geolocation not supported' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          loading: false,
          error: null,
        })
      },
      (err) => {
        setLocation({ lat: 12.9716, lon: 77.5946, loading: false, error: err.message })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  return location
}
