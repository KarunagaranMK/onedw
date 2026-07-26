export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const ISSUE_CATEGORIES = {
  Plumber: [
    { value: 'pipe_leakage', label: 'Pipe Leakage' },
    { value: 'tap_repair', label: 'Tap Repair' },
    { value: 'toilet_repair', label: 'Toilet Repair' },
    { value: 'water_tank', label: 'Water Tank Issue' },
    { value: 'other_plumbing', label: 'Other' },
  ],
  Electrician: [
    { value: 'wiring', label: 'Wiring Issue' },
    { value: 'switch_repair', label: 'Switch/Socket Repair' },
    { value: 'fan_install', label: 'Fan Installation' },
    { value: 'light_fix', label: 'Light Fixture' },
    { value: 'other_electrical', label: 'Other' },
  ],
  Carpenter: [
    { value: 'furniture_repair', label: 'Furniture Repair' },
    { value: 'door_fix', label: 'Door/Window Fix' },
    { value: 'shelf_install', label: 'Shelf Installation' },
    { value: 'other_carpentry', label: 'Other' },
  ],
  Painter: [
    { value: 'wall_painting', label: 'Wall Painting' },
    { value: 'exterior_paint', label: 'Exterior Painting' },
    { value: 'other_painting', label: 'Other' },
  ],
  Cleaning: [
    { value: 'home_cleaning', label: 'Home Deep Cleaning' },
    { value: 'kitchen_clean', label: 'Kitchen Cleaning' },
    { value: 'bathroom_clean', label: 'Bathroom Cleaning' },
    { value: 'other_cleaning', label: 'Other' },
  ],
  'AC Repair': [
    { value: 'ac_install', label: 'AC Installation' },
    { value: 'ac_service', label: 'AC Servicing' },
    { value: 'ac_repair', label: 'AC Repair' },
    { value: 'other_ac', label: 'Other' },
  ],
}

export const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: '#4caf50' },
  { value: 'medium', label: 'Medium', color: '#ff9800' },
  { value: 'high', label: 'High', color: '#f44336' },
  { value: 'emergency', label: 'Emergency', color: '#b71c1c' },
]
