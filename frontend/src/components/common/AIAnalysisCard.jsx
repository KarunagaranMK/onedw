import { Box, Typography, Paper, Chip, CircularProgress, LinearProgress } from "@mui/material";
import { motion } from "framer-motion";
import {
  MdAutoAwesome,
  MdAccessTime,
  MdEngineering,
  MdSpeed,
  MdPsychology,
} from "react-icons/md";

const MotionPaper = motion.create(Paper);

const difficultyColors = {
  Easy: "#22c55e",
  Medium: "#eab308",
  Hard: "#f97316",
  Expert: "#ef4444",
};

const chipColors = [
  { bg: "rgba(239,68,68,0.12)", color: "#ef4444", border: "rgba(239,68,68,0.25)" },
  { bg: "rgba(249,115,22,0.12)", color: "#f97316", border: "rgba(249,115,22,0.25)" },
  { bg: "rgba(234,179,8,0.12)", color: "#eab308", border: "rgba(234,179,8,0.25)" },
  { bg: "rgba(34,197,94,0.12)", color: "#22c55e", border: "rgba(34,197,94,0.25)" },
  { bg: "rgba(99,102,241,0.12)", color: "#6366f1", border: "rgba(99,102,241,0.25)" },
  { bg: "rgba(139,92,246,0.12)", color: "#8b5cf6", border: "rgba(139,92,246,0.25)" },
];

const shimmerSx = {
  position: "relative",
  overflow: "hidden",
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
    animation: "shimmer 1.8s infinite",
  },
  "@keyframes shimmer": {
    "0%": { transform: "translateX(-100%)" },
    "100%": { transform: "translateX(100%)" },
  },
};

const cardSx = {
  background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))",
  border: "1px solid rgba(99,102,241,0.2)",
  borderRadius: 3,
  p: 3,
  position: "relative",
  overflow: "hidden",
  boxShadow:
    "0 8px 32px rgba(99,102,241,0.10), 0 2px 8px rgba(139,92,246,0.06)",
  backdropFilter: "blur(12px)",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "2px",
    background: "linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1)",
  },
};

const rowSx = {
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  py: 0.75,
};

const iconBoxSx = {
  width: 36,
  height: 36,
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const LoadingSkeleton = () => (
  <Paper sx={{ ...cardSx, ...shimmerSx }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
      <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: "rgba(99,102,241,0.15)" }} />
      <Box sx={{ width: 140, height: 22, borderRadius: 1, bgcolor: "rgba(99,102,241,0.12)" }} />
    </Box>
    <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
      {[1, 2, 3].map((i) => (
        <Box key={i} sx={{ width: 80 + i * 20, height: 28, borderRadius: 2, bgcolor: "rgba(99,102,241,0.08)" }} />
      ))}
    </Box>
    {[1, 2, 3, 4].map((i) => (
      <Box key={i} sx={{ ...rowSx }}>
        <Box sx={{ ...iconBoxSx, bgcolor: "rgba(99,102,241,0.08)" }} />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ width: 100, height: 12, borderRadius: 1, bgcolor: "rgba(99,102,241,0.08)", mb: 0.5 }} />
          <Box sx={{ width: 160, height: 16, borderRadius: 1, bgcolor: "rgba(99,102,241,0.06)" }} />
        </Box>
      </Box>
    ))}
  </Paper>
);

const AIAnalysisCard = ({ analysis, loading }) => {
  if (loading || !analysis) {
    return <LoadingSkeleton />;
  }

  const {
    possible_problems = [],
    estimated_difficulty,
    recommended_worker,
    estimated_duration,
    confidence_score,
  } = analysis;

  const normalizedConfidence = Math.round((confidence_score ?? 0) * 100);
  const difficultyColor = difficultyColors[estimated_difficulty] || "#6366f1";

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      sx={cardSx}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
        <Box
          sx={{
            ...iconBoxSx,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
          }}
        >
          <MdAutoAwesome size={18} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          AI Analysis
        </Typography>
      </Box>

      {possible_problems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Box sx={{ display: "flex", gap: 1, mb: 2.5, flexWrap: "wrap" }}>
            {possible_problems.map((problem, idx) => {
              const c = chipColors[idx % chipColors.length];
              return (
                <Chip
                  key={idx}
                  label={problem}
                  size="small"
                  sx={{
                    bgcolor: c.bg,
                    color: c.color,
                    border: `1px solid ${c.border}`,
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    height: 28,
                    "& .MuiChip-label": { px: 1.25 },
                  }}
                />
              );
            })}
          </Box>
        </motion.div>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        {estimated_difficulty && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Box sx={rowSx}>
              <Box sx={{ ...iconBoxSx, bgcolor: `${difficultyColor}18` }}>
                <MdSpeed size={18} color={difficultyColor} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.2 }}>
                  Difficulty
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: difficultyColor }}>
                  {estimated_difficulty}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        )}

        {recommended_worker && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Box sx={rowSx}>
              <Box sx={{ ...iconBoxSx, bgcolor: "rgba(139,92,246,0.10)" }}>
                <MdEngineering size={18} color="#8b5cf6" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.2 }}>
                  Recommended Worker
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {recommended_worker}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        )}

        {estimated_duration && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Box sx={rowSx}>
              <Box sx={{ ...iconBoxSx, bgcolor: "rgba(99,102,241,0.10)" }}>
                <MdAccessTime size={18} color="#6366f1" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.2 }}>
                  Estimated Duration
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {estimated_duration}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        )}

        {confidence_score != null && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Box sx={{ ...rowSx, alignItems: "center" }}>
              <Box sx={{ ...iconBoxSx, bgcolor: "rgba(99,102,241,0.10)", position: "relative" }}>
                <CircularProgress
                  variant="determinate"
                  value={normalizedConfidence}
                  size={36}
                  thickness={3.5}
                  sx={{
                    color: "#6366f1",
                    position: "absolute",
                    "& .MuiCircularProgress-circle": {
                      strokeLinecap: "round",
                    },
                  }}
                />
                <MdPsychology size={14} color="#6366f1" style={{ position: "relative", zIndex: 1 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.2 }}>
                  Confidence Score
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {normalizedConfidence}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={normalizedConfidence}
                    sx={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: "rgba(99,102,241,0.10)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 3,
                        background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </motion.div>
        )}
      </Box>
    </MotionPaper>
  );
};

export default AIAnalysisCard;
