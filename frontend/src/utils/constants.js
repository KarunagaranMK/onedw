import {
  MdElectricBolt,
  MdPlumbing,
  MdCarpenter,
  MdFormatPaint,
  MdCleaningServices,
  MdAcUnit,
} from 'react-icons/md'
import { GiWaterTank, GiPlantSeed } from 'react-icons/gi'
import { FaTools } from 'react-icons/fa'

export const SERVICE_CATEGORIES = [
  { id: 'electrician', name: 'Electrician', icon: MdElectricBolt },
  { id: 'plumber', name: 'Plumber', icon: MdPlumbing },
  { id: 'carpenter', name: 'Carpenter', icon: MdCarpenter },
  { id: 'painter', name: 'Painter', icon: MdFormatPaint },
  { id: 'cleaning', name: 'Cleaning', icon: MdCleaningServices },
  { id: 'ac-repair', name: 'AC Repair', icon: MdAcUnit },
  { id: 'appliance-repair', name: 'Appliance Repair', icon: FaTools },
  { id: 'water-tank', name: 'Water Tank Cleaning', icon: GiWaterTank },
  { id: 'gardening', name: 'Gardening', icon: GiPlantSeed },
]

export const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Services', path: '/services' },
  { label: 'How It Works', path: '/#how-it-works' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
]