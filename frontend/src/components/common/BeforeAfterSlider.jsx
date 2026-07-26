import React, { useState, useRef, useCallback } from "react";
import { Box, Typography, Paper, IconButton } from "@mui/material";
import { motion } from "framer-motion";

const BeforeAfterSlider = ({
  beforeImages = [],
  afterImages = [],
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const pairs = beforeImages.map((before, i) => ({
    before,
    after: afterImages[i] || { url: "", thumbnail_url: "" },
  }));

  const currentPair = pairs[activeIndex] || null;
  const modalPair = pairs[modalIndex] || null;

  const handleDrag = useCallback(
    (clientX) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.min(Math.max((x / rect.width) * 100, 0), 100);
      setSliderPosition(pct);
    },
    []
  );

  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(true);
      handleDrag(e.clientX);
    },
    [handleDrag]
  );

  const handleTouchStart = useCallback(
    (e) => {
      setIsDragging(true);
      handleDrag(e.touches[0].clientX);
    },
    [handleDrag]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      handleDrag(e.clientX);
    },
    [isDragging, handleDrag]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;
      handleDrag(e.touches[0].clientX);
    },
    [isDragging, handleDrag]
  );

  const handleUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const openModal = useCallback(
    (index) => {
      setModalIndex(index);
      setModalOpen(true);
    },
    []
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const badgeStyle = (gradient) => ({
    position: "absolute",
    top: 12,
    zIndex: 3,
    background: gradient,
    color: "#fff",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: 2,
    padding: "4px 14px",
    borderRadius: 20,
    boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
    textTransform: "uppercase",
    userSelect: "none",
  });

  const emptyState = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 320,
        color: "rgba(255,255,255,0.4)",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
        No before/after images available yet
      </Typography>
    </Box>
  );

  const sliderView = (pair, onImageClick) => (
    <Box
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleUp}
      onClick={(e) => {
        if (e.target === e.currentTarget || e.target.closest("[data-slider-content]")) {
          onImageClick?.();
        }
      }}
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/10",
        borderRadius: 3,
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "col-resize",
        userSelect: "none",
        background: "rgba(0,0,0,0.6)",
        touchAction: "none",
      }}
    >
      <Box data-slider-content sx={{ position: "absolute", inset: 0 }}>
        <Box
          component="img"
          src={pair.after?.url}
          alt="After"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <Box
          component="img"
          src={pair.before?.url}
          alt="Before"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        />
      </Box>

      <Box
        sx={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${sliderPosition}%`,
          width: 2,
          background: "rgba(255,255,255,0.9)",
          transform: "translateX(-50%)",
          zIndex: 5,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: `${sliderPosition}%`,
          transform: "translate(-50%,-50%)",
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 6,
          pointerEvents: "none",
          transition: isDragging ? "none" : "box-shadow 0.2s",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.25,
            color: "#333",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          <span>&#8249;</span>
          <span>&#8250;</span>
        </Box>
      </Box>

      <Box sx={badgeStyle("linear-gradient(135deg,#e53935,#ff9800)")} data-slider-content>
        BEFORE
      </Box>
      <Box
        sx={{
          ...badgeStyle("linear-gradient(135deg,#43a047,#66bb6a)"),
          right: 12,
          left: "auto",
        }}
        data-slider-content
      >
        AFTER
      </Box>
    </Box>
  );

  const thumbnailStrip = (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        mt: 2,
        pb: 0.5,
        overflowX: "auto",
        "&::-webkit-scrollbar": { height: 4 },
        "&::-webkit-scrollbar-thumb": {
          background: "rgba(255,255,255,0.15)",
          borderRadius: 4,
        },
      }}
    >
      {pairs.map((pair, i) => (
        <Box
          key={i}
          onClick={() => setActiveIndex(i)}
          sx={{
            flex: "0 0 auto",
            width: 72,
            height: 52,
            borderRadius: 1.5,
            overflow: "hidden",
            cursor: "pointer",
            border: i === activeIndex
              ? "2px solid rgba(255,255,255,0.8)"
              : "2px solid rgba(255,255,255,0.1)",
            transition: "border-color 0.2s, transform 0.2s",
            transform: i === activeIndex ? "scale(1.05)" : "scale(1)",
            "&:hover": { borderColor: "rgba(255,255,255,0.4)" },
            position: "relative",
          }}
        >
          <Box
            component="img"
            src={pair.before?.thumbnail_url || pair.before?.url}
            alt={`Pair ${i + 1}`}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </Box>
      ))}
    </Box>
  );

  const modalContent = modalPair && (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(12px)",
        p: 2,
      }}
      onClick={closeModal}
    >
      <Paper
        onClick={(e) => e.stopPropagation()}
        elevation={24}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: isFullscreen ? "100vw" : 960,
          maxHeight: isFullscreen ? "100vh" : "90vh",
          borderRadius: isFullscreen ? 0 : 4,
          overflow: "hidden",
          background: "rgba(15,15,20,0.95)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            p: 1,
            gap: 0.5,
          }}
        >
          <IconButton
            onClick={toggleFullscreen}
            sx={{ color: "rgba(255,255,255,0.7)" }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
              {isFullscreen ? "Exit" : "Fullscreen"}
            </Typography>
          </IconButton>
          <IconButton
            onClick={closeModal}
            sx={{ color: "rgba(255,255,255,0.7)" }}
          >
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>X</Typography>
          </IconButton>
        </Box>
        <Box sx={{ px: 2, pb: 2 }}>
          {sliderView(modalPair, undefined)}
        </Box>
        <Box sx={{ px: 2, pb: 2, display: "flex", gap: 1.5, overflowX: "auto" }}>
          {pairs.map((pair, i) => (
            <Box
              key={i}
              onClick={() => setModalIndex(i)}
              sx={{
                flex: "0 0 auto",
                width: 56,
                height: 40,
                borderRadius: 1,
                overflow: "hidden",
                cursor: "pointer",
                border: i === modalIndex
                  ? "2px solid rgba(255,255,255,0.8)"
                  : "2px solid rgba(255,255,255,0.1)",
                transition: "border-color 0.2s",
              }}
            >
              <Box
                component="img"
                src={pair.before?.thumbnail_url || pair.before?.url}
                alt={`Pair ${i + 1}`}
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );

  if (!pairs.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Paper
          elevation={0}
          sx={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 4,
            p: 4,
          }}
        >
          {emptyState}
        </Paper>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Paper
        elevation={0}
        sx={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 4,
          p: { xs: 2, sm: 3 },
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            borderRadius: 4,
            padding: "1px",
            background:
              "linear-gradient(135deg, rgba(229,57,53,0.3), rgba(67,160,71,0.3), rgba(255,255,255,0.05))",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            pointerEvents: "none",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: "rgba(255,255,255,0.85)",
              letterSpacing: 1,
              fontSize: { xs: 13, sm: 15 },
            }}
          >
            Before / After
          </Typography>
          <IconButton
            onClick={toggleFullscreen}
            sx={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              "&:hover": { color: "rgba(255,255,255,0.8)" },
            }}
          >
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Expand</Typography>
          </IconButton>
        </Box>

        {currentPair && sliderView(currentPair, () => openModal(activeIndex))}
        {pairs.length > 1 && thumbnailStrip}
      </Paper>

      {modalOpen && modalContent}
    </motion.div>
  );
};

export default BeforeAfterSlider;
