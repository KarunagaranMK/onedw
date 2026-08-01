import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import MainLayout from './layouts/MainLayout'
import LoadingComponent from './components/common/LoadingComponent'
import LandingPage from './pages/LandingPage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/common/ProtectedRoute'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CreateRequest = lazy(() => import('./pages/CreateRequest'))
const MyRequests = lazy(() => import('./pages/MyRequests'))
const WorkerRecommendations = lazy(() => import('./pages/WorkerRecommendations'))
const BookingPage = lazy(() => import('./pages/BookingPage'))
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'))
const WorkerDashboard = lazy(() => import('./pages/WorkerDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const WorkerProfileSetup = lazy(() => import('./pages/WorkerProfileSetup'))
const WorkersList = lazy(() => import('./pages/WorkersList'))
const PaymentPage = lazy(() => import('./pages/PaymentPage'))
const IssueDetailsPage = lazy(() => import('./pages/IssueDetailsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const MyReviewsPage = lazy(() => import('./pages/MyReviewsPage'))
const MyComplaintsPage = lazy(() => import('./pages/MyComplaintsPage'))
const ComplaintPage = lazy(() => import('./pages/ComplaintPage'))
const ComplaintDetailPage = lazy(() => import('./pages/ComplaintDetailPage'))
const WalletPage = lazy(() => import('./pages/WalletPage'))
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const VideoInspectionPage = lazy(() => import('./pages/VideoInspectionPage'))
const LoyaltyPage = lazy(() => import('./pages/LoyaltyPage'))

function App() {
  return (
    <MainLayout>
      <Suspense fallback={<LoadingComponent />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          {/* Public Reviews page — no auth required */}
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/testimonials" element={<ReviewsPage />} />
          {/* Workers Discovery — public so anyone can browse */}
          <Route path="/workers" element={<WorkersList />} />
          <Route path="/workers-list" element={<WorkersList />} />

          {/* Smart role router — redirects to correct dashboard based on user.role */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* ── Customer Routes ── */}
          <Route
            path="/customer-dashboard"
            element={
              <ProtectedRoute>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-request"
            element={
              <ProtectedRoute>
                <CreateRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-requests"
            element={
              <ProtectedRoute>
                <MyRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/find-workers"
            element={
              <ProtectedRoute>
                <WorkerRecommendations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/issue-details"
            element={
              <ProtectedRoute>
                <IssueDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/:bookingId"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/:bookingId"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />

          {/* ── Worker Routes ── */}
          <Route
            path="/worker-dashboard"
            element={
              <ProtectedRoute>
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/profile/setup"
            element={
              <ProtectedRoute>
                <WorkerProfileSetup />
              </ProtectedRoute>
            }
          />

          {/* ── Profile Route ── */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* ── Reviews Routes ── */}
          <Route
            path="/my-reviews"
            element={
              <ProtectedRoute>
                <MyReviewsPage />
              </ProtectedRoute>
            }
          />

          {/* ── Wallet Route ── */}
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            }
          />

          {/* ── Chat & Video Routes ── */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:sessionId"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/video/:sessionId"
            element={
              <ProtectedRoute>
                <VideoInspectionPage />
              </ProtectedRoute>
            }
          />

          {/* ── Complaints Routes ── */}
          <Route
            path="/my-complaints"
            element={
              <ProtectedRoute>
                <MyComplaintsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaint/new"
            element={
              <ProtectedRoute>
                <ComplaintPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaint/:id"
            element={
              <ProtectedRoute>
                <ComplaintDetailPage />
              </ProtectedRoute>
            }
          />

          {/* ── Admin Routes ── */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Loyalty Route ── */}
          <Route
            path="/loyalty"
            element={
              <ProtectedRoute>
                <LoyaltyPage />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </MainLayout>
  )
}

export default App