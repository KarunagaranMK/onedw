import {
  Box, Slider, Typography, FormGroup, FormControlLabel,
  Checkbox, Divider, Paper, Button,
} from '@mui/material'
import { useState } from 'react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function FilterSidebar({ filters, onChange }) {
  // maxBudget = upper price bound. Renamed from priceRange[1] to avoid min_price confusion.
  const [maxBudget, setMaxBudget] = useState(filters.priceRange?.[1] || 2000)
  const [minRating, setMinRating] = useState(filters.minRating || 0)
  const [minExp, setMinExp] = useState(filters.minExp || 0)
  const [days, setDays] = useState(filters.days || [])
  const [onlineOnly, setOnlineOnly] = useState(filters.onlineOnly || false)

  const apply = () => {
    // priceRange[0] is always 0 — we only filter by max budget, not minimum
    onChange({ priceRange: [0, maxBudget], minRating, minExp, days, onlineOnly })
  }

  const reset = () => {
    setMaxBudget(2000)
    setMinRating(0)
    setMinExp(0)
    setDays([])
    setOnlineOnly(false)
    onChange({ priceRange: [0, 2000], minRating: 0, minExp: 0, days: [], onlineOnly: false })
  }

  const toggleDay = (day) => {
    setDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day])
  }

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(99,102,241,0.12)' }}>
      <Typography variant="h6" fontWeight={800} mb={2} sx={{ color: '#6366f1' }}>
        🎛 Filters
      </Typography>

      {/* Max Budget / Price */}
      <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
        Max Budget (₹/hr)
      </Typography>
      <Typography variant="caption" color="text.secondary" mb={1} display="block">
        Show workers charging up to ₹{maxBudget}/hr
      </Typography>
      <Slider
        value={maxBudget}
        onChange={(_, v) => setMaxBudget(v)}
        min={100} max={2000} step={50}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => `₹${v}`}
        sx={{ color: '#6366f1', mb: 0.5 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="caption" color="text.secondary">Any price</Typography>
        <Typography variant="caption" fontWeight={700} color="#6366f1">₹{maxBudget}/hr</Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Min Rating */}
      <Typography variant="subtitle2" fontWeight={700} mb={1}>Minimum Rating ⭐</Typography>
      <Slider
        value={minRating} onChange={(_, v) => setMinRating(v)}
        min={0} max={5} step={0.5}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => v === 0 ? 'Any' : `${v}★`}
        sx={{ color: '#f59e0b', mb: 2 }}
      />

      <Divider sx={{ my: 2 }} />

      {/* Experience */}
      <Typography variant="subtitle2" fontWeight={700} mb={1}>Min Experience (yrs)</Typography>
      <Slider
        value={minExp} onChange={(_, v) => setMinExp(v)}
        min={0} max={20} step={1}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => v === 0 ? 'Any' : `${v}yr`}
        sx={{ color: '#10b981', mb: 2 }}
      />

      <Divider sx={{ my: 2 }} />

      {/* Availability days */}
      <Typography variant="subtitle2" fontWeight={700} mb={1}>Availability</Typography>
      <FormGroup>
        {DAYS.map((day) => (
          <FormControlLabel
            key={day}
            control={<Checkbox checked={days.includes(day)} onChange={() => toggleDay(day)} size="small" sx={{ color: '#6366f1', py: 0.3 }} />}
            label={<Typography variant="body2">{day.slice(0, 3)}</Typography>}
          />
        ))}
      </FormGroup>

      <Divider sx={{ my: 2 }} />

      {/* Online only */}
      <FormControlLabel
        control={<Checkbox checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} sx={{ color: '#10b981' }} />}
        label={<Typography variant="body2" fontWeight={600}>Online Only 🟢</Typography>}
      />

      <Box sx={{ mt: 2.5, display: 'flex', gap: 1 }}>
        <Button variant="contained" fullWidth onClick={apply}
          sx={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontWeight: 700 }}>
          Apply
        </Button>
        <Button variant="outlined" onClick={reset} sx={{ borderColor: '#6366f1', color: '#6366f1' }}>
          Reset
        </Button>
      </Box>
    </Paper>
  )
}
