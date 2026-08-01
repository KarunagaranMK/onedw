import { useState, useEffect, useCallback } from 'react'
import {
  Box, Container, Typography, Grid, Paper, Avatar, Button, Chip,
  CircularProgress, Alert, useTheme, Tab, Tabs, LinearProgress,
  List, ListItem, ListItemText, ListItemAvatar, Divider, Card,
  CardContent, CardActions, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Tooltip, Badge, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Skeleton,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  MdEmojiEvents, MdStar, MdCardGiftcard, MdLeaderboard,
  MdHistory, MdWorkspacePremium, MdLoyalty, MdArrowBack,
  MdShare, MdCheckCircle, MdDiamond, MdLocalOffer, MdWallet,
  MdContentCopy, MdAutoAwesome, MdTrendingUp, MdPeople,
} from 'react-icons/md'
import {
  getMyLoyalty, getPointsHistory, getAllBadges, getRewards,
  redeemReward, getLeaderboard,
} from '../services/loyaltyService'
import { useAuth } from '../hooks/useAuth'

const MotionPaper = motion(Paper)

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  Bronze:   { color: '#CD7F32', gradient: 'linear-gradient(135deg, #CD7F32, #A0522D)', icon: '🥉', next: 'Silver',   nextAt: 500 },
  Silver:   { color: '#A8A9AD', gradient: 'linear-gradient(135deg, #A8A9AD, #6B7280)', icon: '🥈', next: 'Gold',     nextAt: 1500 },
  Gold:     { color: '#FFD700', gradient: 'linear-gradient(135deg, #FFD700, #F59E0B)', icon: '🥇', next: 'Platinum', nextAt: 4000 },
  Platinum: { color: '#B4C6FC', gradient: 'linear-gradient(135deg, #B4C6FC, #6C47FF)', icon: '💎', next: null,       nextAt: null },
}

// ─── Reward type config ───────────────────────────────────────────────────────
const REWARD_TYPE_CONFIG = {
  wallet_credit:   { color: '#10B981', label: 'Wallet Credit' },
  discount_coupon: { color: '#6C47FF', label: 'Discount Coupon' },
}

// ─── Points balance card ──────────────────────────────────────────────────────
const PointsCard = ({ account }) => {
  const tier = TIER_CONFIG[account?.tier] || TIER_CONFIG.Bronze
  const points = account?.points || 0
  const progress = tier.nextAt ? Math.min((points / tier.nextAt) * 100, 100) : 100
  const remaining = tier.nextAt ? Math.max(0, tier.nextAt - points) : 0

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        p: 0, borderRadius: 4, overflow: 'hidden',
        background: tier.gradient,
        boxShadow: `0 20px 60px ${tier.color}40`,
      }}
    >
      <Box sx={{ p: { xs: 3, md: 4 }, position: 'relative', color: '#fff' }}>
        {/* Background decorations */}
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', fontSize: 10 }}>
              Loyalty Points Balance
            </Typography>
            <Typography variant="h2" fontWeight={900} sx={{ mt: 0.5, lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              {points.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>points</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 52 }}>{tier.icon}</Typography>
            <Typography variant="subtitle2" fontWeight={800} sx={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
              {account?.tier || 'Bronze'}
            </Typography>
          </Box>
        </Box>

        {/* Progress to next tier */}
        {tier.next && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 600 }}>Progress to {tier.next}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700 }}>{remaining} pts needed</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8, borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 4 },
              }}
            />
          </Box>
        )}

        {/* Referral code */}
        {account?.referral_code && (
          <Box sx={{ mt: 2.5, display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.15)' }}>
            <MdShare size={16} />
            <Typography variant="caption" fontWeight={700}>Referral Code: {account.referral_code}</Typography>
            <IconButton
              size="small"
              onClick={() => navigator.clipboard?.writeText(account.referral_code)}
              sx={{ color: '#fff', ml: 'auto', p: 0.25 }}
            >
              <MdContentCopy size={14} />
            </IconButton>
          </Box>
        )}

        {/* Stats row */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2.5 }}>
          {[
            { label: 'Earned', value: account?.total_earned || 0 },
            { label: 'Redeemed', value: account?.total_redeemed || 0 },
            { label: 'Badges', value: (account?.badges || []).length },
          ].map(({ label, value }) => (
            <Box key={label} sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h6" fontWeight={900}>{value.toLocaleString()}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.75, fontSize: 10 }}>{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </MotionPaper>
  )
}

// ─── Badge card ───────────────────────────────────────────────────────────────
const BadgeCard = ({ badge, earned }) => (
  <motion.div
    whileHover={earned ? { scale: 1.08, y: -4 } : {}}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Paper sx={{
      p: 2, borderRadius: 3, textAlign: 'center',
      border: earned ? `2px solid ${earned ? '#6C47FF' : 'transparent'}22` : '2px solid rgba(0,0,0,0.06)',
      bgcolor: earned ? undefined : 'rgba(0,0,0,0.02)',
      filter: earned ? 'none' : 'grayscale(1)',
      opacity: earned ? 1 : 0.5,
      cursor: 'default',
      transition: 'all 0.3s',
    }}>
      <Typography sx={{ fontSize: 36, mb: 0.5 }}>{badge.icon}</Typography>
      <Typography variant="caption" fontWeight={800} display="block" noWrap>{badge.name}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>{badge.description}</Typography>
      {earned && <Chip label="Earned" size="small" sx={{ mt: 0.75, height: 18, fontSize: 9, bgcolor: '#6C47FF22', color: '#6C47FF', fontWeight: 700 }} />}
    </Paper>
  </motion.div>
)

// ─── Reward card ──────────────────────────────────────────────────────────────
const RewardCard = ({ reward, userPoints, onRedeem }) => {
  const cfg = REWARD_TYPE_CONFIG[reward.reward_type] || REWARD_TYPE_CONFIG.wallet_credit
  const canAfford = userPoints >= reward.points_required
  return (
    <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card sx={{
        borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column',
        border: canAfford ? `1.5px solid ${cfg.color}33` : '1.5px solid transparent',
        boxShadow: canAfford ? `0 4px 20px ${cfg.color}20` : 'none',
        transition: 'all 0.3s',
      }}>
        <CardContent sx={{ flex: 1, textAlign: 'center', pt: 3 }}>
          <Typography sx={{ fontSize: 40, mb: 1 }}>{reward.icon}</Typography>
          <Typography variant="body2" fontWeight={800} gutterBottom>{reward.name}</Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
            {reward.description}
          </Typography>
          <Chip
            label={`${reward.points_required} pts`}
            sx={{ fontWeight: 800, bgcolor: canAfford ? `${cfg.color}20` : 'action.hover', color: canAfford ? cfg.color : 'text.disabled', fontSize: 12 }}
          />
        </CardContent>
        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button
            fullWidth
            variant={canAfford ? 'contained' : 'outlined'}
            disabled={!canAfford}
            onClick={() => onRedeem(reward)}
            sx={{
              borderRadius: 2.5, fontWeight: 700, fontSize: 12,
              ...(canAfford ? {
                background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`,
                '&:hover': { transform: 'none', boxShadow: `0 8px 20px ${cfg.color}40` },
              } : {}),
            }}
          >
            {canAfford ? 'Redeem Now' : `Need ${reward.points_required - userPoints} more pts`}
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  )
}

// ─── Main Loyalty Page ───────────────────────────────────────────────────────
export default function LoyaltyPage() {
  const theme = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isDark = theme.palette.mode === 'dark'

  const [tab, setTab] = useState(0)
  const [account, setAccount] = useState(null)
  const [history, setHistory] = useState([])
  const [badges, setBadges] = useState([])
  const [rewards, setRewards] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [redeemDialog, setRedeemDialog] = useState({ open: false, reward: null })
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemResult, setRedeemResult] = useState(null)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [acc, hist, bdgs, rwds, lb] = await Promise.all([
        getMyLoyalty(),
        getPointsHistory(),
        getAllBadges(),
        getRewards(),
        getLeaderboard(20),
      ])
      setAccount(acc)
      setHistory(hist)
      setBadges(bdgs)
      setRewards(rwds)
      setLeaderboard(lb)
    } catch (e) {
      setError('Failed to load loyalty data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRedeem = async () => {
    if (!redeemDialog.reward) return
    setRedeemLoading(true)
    try {
      const result = await redeemReward(redeemDialog.reward.id)
      setRedeemResult(result)
      setAccount(prev => ({
        ...prev,
        points: result.new_balance,
        tier: result.tier,
        total_redeemed: (prev?.total_redeemed || 0) + redeemDialog.reward.points_required,
      }))
      await getPointsHistory().then(h => setHistory(h)).catch(() => {})
    } catch (e) {
      setError(e?.response?.data?.detail || 'Redemption failed.')
      setRedeemDialog({ open: false, reward: null })
    } finally {
      setRedeemLoading(false)
    }
  }

  const earnedBadgeIds = new Set(account?.badges || [])

  const myRank = leaderboard.findIndex(entry => entry.user_id === account?.user_id) + 1

  const TABS = ['Overview', 'Badges', 'Rewards', 'Leaderboard', 'History']

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Skeleton variant="rounded" height={180} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: isDark ? '#0a0f1e' : '#f8faff', pb: 8 }}>
      {/* Header Banner */}
      <Box sx={{
        background: isDark
          ? 'linear-gradient(135deg, #1a0a3d 0%, #0f1a35 50%, #0a1628 100%)'
          : 'linear-gradient(135deg, #f0ebff 0%, #e8efff 50%, #faf5ff 100%)',
        pt: { xs: 3, md: 4 }, pb: 6, borderBottom: 1, borderColor: 'divider',
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
              <MdArrowBack size={20} />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: 3,
                background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(108,71,255,0.4)',
              }}>
                <MdLoyalty size={24} color="white" />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1.2 }}>Loyalty Program</Typography>
                <Typography variant="caption" color="text.secondary">Earn points, unlock rewards</Typography>
              </Box>
            </Box>
            {myRank > 0 && (
              <Chip
                icon={<MdLeaderboard size={14} />}
                label={`Rank #${myRank}`}
                sx={{ ml: 'auto', fontWeight: 800, bgcolor: '#FFD70022', color: '#F59E0B', border: '1px solid #FFD70044' }}
              />
            )}
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

          {/* Points card */}
          {account && <PointsCard account={account} />}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -3, position: 'relative', zIndex: 1 }}>
        {/* How to Earn Banner */}
        <Paper sx={{
          p: 2.5, borderRadius: 3, mb: 3,
          background: isDark ? 'rgba(108,71,255,0.1)' : 'rgba(108,71,255,0.05)',
          border: '1px solid rgba(108,71,255,0.2)',
        }}>
          <Typography variant="subtitle2" fontWeight={800} color="primary" mb={1.5}>
            <MdAutoAwesome size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            How to Earn Points
          </Typography>
          <Grid container spacing={1.5}>
            {[
              { icon: '📅', text: 'Booking completed', pts: '1 pt / ₹10' },
              { icon: '✍️', text: 'Leave a review', pts: '+50 pts' },
              { icon: '🤝', text: 'Refer a friend', pts: '+100 pts' },
              { icon: '✅', text: 'Complete profile', pts: '+20 pts' },
            ].map(({ icon, text, pts }) => (
              <Grid item xs={6} sm={3} key={text}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: 20 }}>{icon}</Typography>
                  <Box>
                    <Typography variant="caption" display="block" fontWeight={600}>{text}</Typography>
                    <Typography variant="caption" color="primary.main" fontWeight={800}>{pts}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1, borderColor: 'divider',
              '& .MuiTab-root': { fontWeight: 700, minWidth: 100 },
              '& .Mui-selected': { color: '#6C47FF' },
              '& .MuiTabs-indicator': { bgcolor: '#6C47FF' },
            }}
          >
            {TABS.map(label => <Tab key={label} label={label} />)}
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <AnimatePresence mode="wait">

          {/* Overview Tab */}
          {tab === 0 && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Grid container spacing={3}>
                {/* Tier Roadmap */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="subtitle1" fontWeight={800} mb={2}>
                      <MdWorkspacePremium size={18} style={{ marginRight: 8, verticalAlign: 'middle', color: '#6C47FF' }} />
                      Tier Roadmap
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      {Object.entries(TIER_CONFIG).map(([name, cfg], i, arr) => {
                        const isActive = account?.tier === name
                        const isPassed = arr.slice(0, i).map(([n]) => n).includes(account?.tier) ? false
                          : ['Bronze','Silver','Gold','Platinum'].indexOf(account?.tier) > i
                        return (
                          <Box key={name} sx={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? 1 : 'unset' }}>
                            <Tooltip title={`${name}: ${i === 0 ? '0' : arr[i-1]?.[1]?.nextAt} – ${cfg.nextAt || '∞'} pts`}>
                              <Box sx={{
                                width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 24, flexShrink: 0,
                                background: isActive ? cfg.gradient : (isPassed ? cfg.gradient : 'rgba(0,0,0,0.06)'),
                                boxShadow: isActive ? `0 0 0 4px ${cfg.color}44, 0 8px 24px ${cfg.color}33` : 'none',
                                border: isActive ? `2px solid ${cfg.color}` : '2px solid transparent',
                                transition: 'all 0.3s',
                              }}>
                                {cfg.icon}
                              </Box>
                            </Tooltip>
                            <Box sx={{ flex: 1, height: 4, bgcolor: isPassed ? cfg.color : 'rgba(0,0,0,0.08)', mx: 0.5, borderRadius: 2, display: i < arr.length - 1 ? 'block' : 'none' }} />
                          </Box>
                        )
                      })}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 0.5 }}>
                      {Object.keys(TIER_CONFIG).map(name => (
                        <Typography key={name} variant="caption" fontWeight={account?.tier === name ? 900 : 500} color={account?.tier === name ? 'primary' : 'text.secondary'} sx={{ fontSize: 10, width: 52, textAlign: 'center', flexShrink: 0 }}>
                          {name}
                        </Typography>
                      ))}
                    </Box>
                  </Paper>
                </Grid>

                {/* Recent history preview */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                    <Typography variant="subtitle1" fontWeight={800} mb={2}>
                      <MdHistory size={18} style={{ marginRight: 8, verticalAlign: 'middle', color: '#6C47FF' }} />
                      Recent Activity
                    </Typography>
                    {history.slice(0, 5).map((item, i) => (
                      <Box key={item.id || i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: i < 4 ? 1 : 0, borderColor: 'divider' }}>
                        <Typography sx={{ fontSize: 20, flexShrink: 0 }}>
                          {item.reason === 'booking' ? '📅' : item.reason === 'review' ? '✍️' : item.reason === 'referral' ? '🤝' : item.reason === 'redemption' ? '🎁' : item.reason === 'badge_earned' ? '🏅' : '⭐'}
                        </Typography>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" fontWeight={700} noWrap>{item.description}</Typography>
                          <Typography variant="caption" color="text.disabled" display="block" sx={{ fontSize: 10 }}>
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                          </Typography>
                        </Box>
                        {item.points !== 0 && (
                          <Typography variant="caption" fontWeight={900}
                            color={item.action === 'earn' ? 'success.main' : 'error.main'}
                          >
                            {item.action === 'earn' ? '+' : ''}{item.points} pts
                          </Typography>
                        )}
                      </Box>
                    ))}
                    {history.length === 0 && (
                      <Typography variant="caption" color="text.disabled">No activity yet. Complete a booking to earn points!</Typography>
                    )}
                    <Button size="small" sx={{ mt: 1, color: '#6C47FF', fontWeight: 700 }} onClick={() => setTab(4)}>View All →</Button>
                  </Paper>
                </Grid>

                {/* Earned badges preview */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                    <Typography variant="subtitle1" fontWeight={800} mb={2}>
                      <MdEmojiEvents size={18} style={{ marginRight: 8, verticalAlign: 'middle', color: '#6C47FF' }} />
                      My Badges ({(account?.badges || []).length}/{badges.length})
                    </Typography>
                    <Grid container spacing={1}>
                      {badges.slice(0, 6).map(badge => (
                        <Grid item xs={4} key={badge.id}>
                          <BadgeCard badge={badge} earned={earnedBadgeIds.has(badge.id)} />
                        </Grid>
                      ))}
                    </Grid>
                    <Button size="small" sx={{ mt: 1, color: '#6C47FF', fontWeight: 700 }} onClick={() => setTab(1)}>All Badges →</Button>
                  </Paper>
                </Grid>
              </Grid>
            </motion.div>
          )}

          {/* Badges Tab */}
          {tab === 1 && (
            <motion.div key="badges" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={800} mb={0.5}>Achievement Badges</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Earn badges by completing milestones. {earnedBadgeIds.size}/{badges.length} earned.
                </Typography>
                <Grid container spacing={2}>
                  {badges.map(badge => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={badge.id}>
                      <BadgeCard badge={badge} earned={earnedBadgeIds.has(badge.id)} />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </motion.div>
          )}

          {/* Rewards Tab */}
          {tab === 2 && (
            <motion.div key="rewards" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Box mb={2}>
                <Typography variant="h6" fontWeight={800} mb={0.5}>Rewards Catalog</Typography>
                <Typography variant="body2" color="text.secondary">
                  You have <strong>{(account?.points || 0).toLocaleString()} points</strong>. Redeem them for wallet credits and discount coupons.
                </Typography>
              </Box>
              <Grid container spacing={2.5}>
                {rewards.map(reward => (
                  <Grid item xs={12} sm={6} md={4} key={reward.id}>
                    <RewardCard
                      reward={reward}
                      userPoints={account?.points || 0}
                      onRedeem={(r) => setRedeemDialog({ open: true, reward: r })}
                    />
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          )}

          {/* Leaderboard Tab */}
          {tab === 3 && (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{
                  p: 3, background: 'linear-gradient(135deg, #6C47FF22, #8B5CF622)',
                  display: 'flex', alignItems: 'center', gap: 2,
                }}>
                  <MdLeaderboard size={28} color="#6C47FF" />
                  <Box>
                    <Typography variant="h6" fontWeight={800}>Top Customers Leaderboard</Typography>
                    <Typography variant="caption" color="text.secondary">Rankings update in real-time</Typography>
                  </Box>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 800, fontSize: 12 } }}>
                        <TableCell>Rank</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Tier</TableCell>
                        <TableCell align="right">Points</TableCell>
                        <TableCell align="right">Badges</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaderboard.map((entry, i) => {
                        const isMe = entry.user_id === account?.user_id
                        const tierCfg = TIER_CONFIG[entry.tier] || TIER_CONFIG.Bronze
                        return (
                          <TableRow
                            key={entry.user_id}
                            sx={{
                              bgcolor: isMe ? `${tierCfg.color}11` : undefined,
                              '&:hover': { bgcolor: 'action.hover' },
                              border: isMe ? `2px solid ${tierCfg.color}44` : undefined,
                            }}
                          >
                            <TableCell>
                              {i < 3 ? (
                                <Typography sx={{ fontSize: 20 }}>{['🥇','🥈','🥉'][i]}</Typography>
                              ) : (
                                <Typography variant="body2" fontWeight={700} color="text.secondary">#{entry.rank}</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{
                                  width: 32, height: 32, fontSize: 13, fontWeight: 800,
                                  background: tierCfg.gradient,
                                }}>
                                  {(entry.name || 'U')[0].toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={700}>
                                    {entry.name}{isMe ? ' (You)' : ''}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${tierCfg.icon} ${entry.tier}`}
                                size="small"
                                sx={{ fontSize: 10, fontWeight: 700, bgcolor: `${tierCfg.color}22`, color: tierCfg.color }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={900} color="primary">
                                {entry.points.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600}>🏅 {entry.badges_count}</Typography>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </motion.div>
          )}

          {/* History Tab */}
          {tab === 4 && (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" fontWeight={800}>Points History</Typography>
                  <Typography variant="caption" color="text.secondary">All your point earn and redeem transactions</Typography>
                </Box>
                <List disablePadding>
                  {history.length === 0 && (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography color="text.disabled">No history yet. Complete a booking to earn your first points!</Typography>
                    </Box>
                  )}
                  <AnimatePresence>
                    {history.map((item, i) => {
                      const isEarn = item.action === 'earn'
                      const isBadge = item.action === 'badge'
                      return (
                        <motion.div key={item.id || i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                          <ListItem divider={i < history.length - 1} sx={{ py: 1.5 }}>
                            <ListItemAvatar>
                              <Avatar sx={{
                                width: 38, height: 38, fontSize: 18,
                                bgcolor: isBadge ? '#6C47FF22' : (isEarn ? '#10B98122' : '#EF444422'),
                              }}>
                                {item.reason === 'booking' ? '📅' : item.reason === 'review' ? '✍️' : item.reason === 'referral' ? '🤝' : item.reason === 'redemption' ? '🎁' : item.reason === 'badge_earned' ? '🏅' : item.reason === 'profile' ? '✅' : '⭐'}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={<Typography variant="body2" fontWeight={700}>{item.description}</Typography>}
                              secondary={
                                <Typography variant="caption" color="text.disabled">
                                  {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                                </Typography>
                              }
                            />
                            {item.points !== 0 && (
                                <Chip
                                label={`${isEarn ? '+' : ''}${item.points} pts`}
                                size="small"
                                sx={{
                                  fontWeight: 900, ml: 1,
                                  bgcolor: isEarn ? '#10B98122' : '#EF444422',
                                  color: isEarn ? '#10B981' : '#EF4444',
                                }}
                              />
                            )}
                          </ListItem>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </List>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>

      {/* Redeem Confirmation Dialog */}
      <Dialog
        open={redeemDialog.open}
        onClose={() => { setRedeemDialog({ open: false, reward: null }); setRedeemResult(null) }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        {redeemResult ? (
          <>
            <DialogContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ fontSize: 56, mb: 1 }}>🎉</Typography>
              <Typography variant="h6" fontWeight={800} gutterBottom>Reward Redeemed!</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {redeemDialog.reward?.reward_type === 'wallet_credit'
                  ? `₹${redeemResult.wallet_credit} has been added to your wallet.`
                  : `Your coupon code is: `}
              </Typography>
              {redeemResult.coupon_code && (
                <Chip
                  label={redeemResult.coupon_code}
                  sx={{ fontWeight: 900, fontSize: 16, p: 1, bgcolor: '#6C47FF22', color: '#6C47FF', letterSpacing: 2 }}
                />
              )}
              <Typography variant="body2" mt={2} color="text.secondary">
                New balance: <strong>{redeemResult.new_balance?.toLocaleString()} pts</strong>
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button
                fullWidth variant="contained"
                onClick={() => { setRedeemDialog({ open: false, reward: null }); setRedeemResult(null) }}
                sx={{ borderRadius: 2.5, fontWeight: 700, bgcolor: '#6C47FF', '&:hover': { bgcolor: '#5535CC' } }}
              >
                Done
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', pt: 3 }}>
              Confirm Redemption
            </DialogTitle>
            <DialogContent sx={{ textAlign: 'center' }}>
              {redeemDialog.reward && (
                <Box>
                  <Typography sx={{ fontSize: 48, mb: 1 }}>{redeemDialog.reward.icon}</Typography>
                  <Typography variant="h6" fontWeight={800} gutterBottom>{redeemDialog.reward.name}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>{redeemDialog.reward.description}</Typography>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="body2">
                      Cost: <strong>{redeemDialog.reward.points_required} points</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Balance after: <strong>{((account?.points || 0) - redeemDialog.reward.points_required).toLocaleString()} pts</strong>
                    </Typography>
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
              <Button
                onClick={() => setRedeemDialog({ open: false, reward: null })}
                sx={{ borderRadius: 2.5, fontWeight: 700, flex: 1 }}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRedeem}
                disabled={redeemLoading}
                variant="contained"
                sx={{ borderRadius: 2.5, fontWeight: 700, flex: 1, bgcolor: '#6C47FF', '&:hover': { bgcolor: '#5535CC' } }}
              >
                {redeemLoading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Redeem'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}
