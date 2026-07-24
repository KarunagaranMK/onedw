import { useState } from 'react'
import {
  Box, TextField, InputAdornment, Button, Select, MenuItem,
  FormControl, InputLabel, Paper, IconButton, Chip,
} from '@mui/material'
import { MdSearch, MdMyLocation, MdTune } from 'react-icons/md'

const SERVICE_OPTIONS = [
  'All Services', 'Electrician', 'Plumber', 'Painter', 'Cleaner',
  'Mechanic', 'Carpenter', 'AC Technician', 'Appliance Repair', 'Home Cleaning',
]

export default function SearchBar({ onSearch, onDetectLocation }) {
  const [service, setService] = useState('')
  const [query, setQuery] = useState('')

  const handleSearch = () => {
    onSearch({ service: service === 'All Services' ? '' : service, query })
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2, borderRadius: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center',
        border: '1px solid rgba(99,102,241,0.15)',
        background: 'linear-gradient(135deg,rgba(99,102,241,0.03),rgba(139,92,246,0.03))',
      }}
    >
      <FormControl sx={{ minWidth: 180 }} size="small">
        <InputLabel>Service Type</InputLabel>
        <Select label="Service Type" value={service} onChange={(e) => setService(e.target.value)}>
          {SERVICE_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </Select>
      </FormControl>

      <TextField
        size="small"
        placeholder="Search by name, location, skill..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        sx={{ flex: 1, minWidth: 200 }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><MdSearch color="#6366f1" /></InputAdornment>,
        }}
      />

      <IconButton onClick={onDetectLocation} title="Use my location"
        sx={{ bgcolor: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
        <MdMyLocation />
      </IconButton>

      <Button variant="contained" onClick={handleSearch} startIcon={<MdSearch />}
        sx={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontWeight: 700, borderRadius: 2 }}>
        Search
      </Button>
    </Paper>
  )
}
