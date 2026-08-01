import { Box } from '@mui/material'
import HeroSection from '../components/home/HeroSection'
import ServiceCategories from '../components/home/ServiceCategories'
import HowItWorks from '../components/home/HowItWorks'
import WhyChooseUs from '../components/home/WhyChooseUs'
import StatisticsSection from '../components/home/StatisticsSection'
import Testimonials from '../components/home/Testimonials'

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