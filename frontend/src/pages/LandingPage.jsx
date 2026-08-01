import { lazy, Suspense } from 'react'
import { Box, CircularProgress } from '@mui/material'
import HeroSection from '../components/home/HeroSection'
import ServiceCategories from '../components/home/ServiceCategories'
import HowItWorks from '../components/home/HowItWorks'
import WhyChooseUs from '../components/home/WhyChooseUs'
import StatisticsSection from '../components/home/StatisticsSection'
import Testimonials from '../components/home/Testimonials'

const Loading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
    <CircularProgress sx={{ color: '#2563eb' }} />
  </Box>
)

export default function LandingPage() {
  return (
    <Box>
      <HeroSection />
      <ServiceCategories />
      <HowItWorks />
      <StatisticsSection />
      <WhyChooseUs />
      <Testimonials />
    </Box>
  )
}