/**
 * Micro-Loading Indicators
 * Ultra-smooth, performance-optimized loading animations
 */

import React, { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface MicroLoadingProps {
  type?:
    | "spinner"
    | "dots"
    | "pulse"
    | "skeleton"
    | "progress"
    | "wave"
    | "morph"
    | "orbit";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  speed?: "slow" | "normal" | "fast";
  className?: string;
  progress?: number;
  text?: string;
  overlay?: boolean;
  centered?: boolean;
}

const MicroLoadingIndicators: React.FC<MicroLoadingProps> = ({
  type = "spinner",
  size = "md",
  color = "#3b82f6",
  speed = "normal",
  className = "",
  progress,
  text,
  overlay = false,
  centered = false,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getSizeValue = () => {
    switch (size) {
      case "xs":
        return 16;
      case "sm":
        return 24;
      case "md":
        return 32;
      case "lg":
        return 48;
      case "xl":
        return 64;
      default:
        return 32;
    }
  };

  const getStrokeWidth = () => {
    const sizeValue = getSizeValue();
    return Math.max(1, sizeValue / 16);
  };

  const getSpeedDuration = () => {
    switch (speed) {
      case "slow":
        return 2;
      case "normal":
        return 1;
      case "fast":
        return 0.5;
      default:
        return 1;
    }
  };

  const renderSpinner = () => (
    <svg
      width={getSizeValue()}
      height={getSizeValue()}
      viewBox="0 0 50 50"
      className="spinner-svg"
    >
      <motion.circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={color}
        strokeWidth={getStrokeWidth()}
        strokeLinecap="round"
        strokeDasharray="31.416 31.416"
        animate={{
          rotate: [0, 360],
          strokeDashoffset: [31.416, 0],
        }}
        transition={{
          duration: getSpeedDuration(),
          repeat: Infinity,
          ease: "linear",
        }}
        transform="rotate(90 25 25)"
      />
    </svg>
  );

  const renderDots = () => {
    const dotCount = 3;
    const dotSize = getSizeValue() / 4;
    const gap = getSizeValue() / 6;

    return (
      <div
        className="dots-container"
        style={{
          display: "flex",
          alignItems: "center",
          gap: gap,
          width: getSizeValue() * 1.5,
          height: getSizeValue(),
        }}
      >
        {Array.from({ length: dotCount }).map((_, index) => (
          <motion.div
            key={index}
            className="dot"
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: "50%",
              backgroundColor: color,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: getSpeedDuration(),
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );
  };

  const renderPulse = () => (
    <div
      className="pulse-container"
      style={{
        position: "relative",
        width: getSizeValue(),
        height: getSizeValue(),
      }}
    >
      <motion.div
        className="pulse-circle"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: getSizeValue(),
          height: getSizeValue(),
          borderRadius: "50%",
          backgroundColor: color,
          opacity: 0.3,
        }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: getSpeedDuration(),
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="pulse-core"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: getSizeValue() * 0.6,
          height: getSizeValue() * 0.6,
          borderRadius: "50%",
          backgroundColor: color,
          transform: "translate(-50%, -50%)",
        }}
        animate={{
          scale: [1, 0.8, 1],
        }}
        transition={{
          duration: getSpeedDuration() * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );

  const renderSkeleton = () => {
    const skeletonHeight = getSizeValue();
    const skeletonWidth = getSizeValue() * 2;

    return (
      <div
        className="skeleton-container"
        style={{
          width: skeletonWidth,
          height: skeletonHeight,
        }}
      >
        <motion.div
          className="skeleton-shimmer"
          style={{
            width: "100%",
            height: "100%",
            background: `linear-gradient(90deg, transparent, ${color}20, transparent)`,
            borderRadius: 4,
          }}
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: getSpeedDuration() * 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
    );
  };

  const renderProgress = () => {
    const progressValue = progress !== undefined ? progress : 0;

    return (
      <div
        className="progress-container"
        style={{
          width: getSizeValue() * 2,
          height: getSizeValue() / 2,
        }}
      >
        <div
          className="progress-track"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: `${color}20`,
            borderRadius: getSizeValue() / 4,
            overflow: "hidden",
          }}
        >
          <motion.div
            className="progress-fill"
            style={{
              height: "100%",
              backgroundColor: color,
              borderRadius: getSizeValue() / 4,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressValue}%` }}
            transition={{
              duration: getSpeedDuration(),
              ease: "easeOut",
            }}
          />
        </div>
        {text && (
          <div
            className="progress-text"
            style={{
              fontSize: getSizeValue() / 3,
              color: color,
              marginTop: 4,
              textAlign: "center",
            }}
          >
            {Math.round(progressValue)}%
          </div>
        )}
      </div>
    );
  };

  const renderWave = () => {
    const waveCount = 5;
    const waveHeight = getSizeValue();

    return (
      <div
        className="wave-container"
        style={{
          display: "flex",
          alignItems: "end",
          gap: 2,
          width: getSizeValue() * 1.5,
          height: waveHeight,
        }}
      >
        {Array.from({ length: waveCount }).map((_, index) => (
          <motion.div
            key={index}
            className="wave-bar"
            style={{
              width: waveHeight / 8,
              backgroundColor: color,
              borderRadius: 2,
            }}
            animate={{
              height: [waveHeight * 0.3, waveHeight, waveHeight * 0.3],
            }}
            transition={{
              duration: getSpeedDuration(),
              repeat: Infinity,
              delay: index * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );
  };

  const renderMorph = () => (
    <div
      className="morph-container"
      style={{
        width: getSizeValue(),
        height: getSizeValue(),
      }}
    >
      <motion.div
        className="morph-shape"
        style={{
          width: getSizeValue(),
          height: getSizeValue(),
          backgroundColor: color,
        }}
        animate={{
          borderRadius: ["50%", "20%", "50%", "20%", "50%"],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: getSpeedDuration() * 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );

  const renderOrbit = () => {
    const orbitSize = getSizeValue();
    const dotSize = orbitSize / 6;

    return (
      <div
        className="orbit-container"
        style={{
          position: "relative",
          width: orbitSize,
          height: orbitSize,
        }}
      >
        <motion.div
          className="orbit-center"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: dotSize,
            height: dotSize,
            backgroundColor: color,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        {Array.from({ length: 3 }).map((_, index) => (
          <motion.div
            key={index}
            className="orbit-dot"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: dotSize,
              height: dotSize,
              backgroundColor: color,
              borderRadius: "50%",
              opacity: 0.6,
            }}
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: getSpeedDuration() * (index + 1),
              repeat: Infinity,
              ease: "linear",
              delay: index * 0.2,
            }}
          />
        ))}
      </div>
    );
  };

  const renderLoadingIndicator = () => {
    switch (type) {
      case "dots":
        return renderDots();
      case "pulse":
        return renderPulse();
      case "skeleton":
        return renderSkeleton();
      case "progress":
        return renderProgress();
      case "wave":
        return renderWave();
      case "morph":
        return renderMorph();
      case "orbit":
        return renderOrbit();
      default:
        return renderSpinner();
    }
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: text ? 8 : 0,
    ...(overlay && {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(4px)",
      zIndex: 9999,
    }),
    ...(centered && {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    }),
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`micro-loading ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: text ? 8 : 0,
          ...(overlay && {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
          }),
          ...(centered && {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }),
        }}
      >
        {renderLoadingIndicator()}
        {text && (
          <motion.div
            className="loading-text"
            style={{
              fontSize: getSizeValue() / 3,
              color: color,
              textAlign: "center",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {text}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Preset loading components for common use cases
export const LoadingSpinner = memo((props: Omit<MicroLoadingProps, "type">) => (
  <MicroLoadingIndicators type="spinner" {...props} />
));
LoadingSpinner.displayName = "LoadingSpinner";

export const LoadingDots = memo((props: Omit<MicroLoadingProps, "type">) => (
  <MicroLoadingIndicators type="dots" {...props} />
));
LoadingDots.displayName = "LoadingDots";

export const LoadingPulse = memo((props: Omit<MicroLoadingProps, "type">) => (
  <MicroLoadingIndicators type="pulse" {...props} />
));
LoadingPulse.displayName = "LoadingPulse";

export const LoadingSkeleton = memo(
  (props: Omit<MicroLoadingProps, "type">) => (
    <MicroLoadingIndicators type="skeleton" {...props} />
  ),
);
LoadingSkeleton.displayName = "LoadingSkeleton";

export const LoadingProgress = memo(
  (props: Omit<MicroLoadingProps, "type">) => (
    <MicroLoadingIndicators type="progress" {...props} />
  ),
);
LoadingProgress.displayName = "LoadingProgress";

export const LoadingWave = memo((props: Omit<MicroLoadingProps, "type">) => (
  <MicroLoadingIndicators type="wave" {...props} />
));
LoadingWave.displayName = "LoadingWave";

export const LoadingMorph = memo((props: Omit<MicroLoadingProps, "type">) => (
  <MicroLoadingIndicators type="morph" {...props} />
));
LoadingMorph.displayName = "LoadingMorph";

export const LoadingOrbit = memo((props: Omit<MicroLoadingProps, "type">) => (
  <MicroLoadingIndicators type="orbit" {...props} />
));
LoadingOrbit.displayName = "LoadingOrbit";

// Full-screen loading overlay
export const FullScreenLoading = memo(
  (props: Omit<MicroLoadingProps, "overlay" | "centered">) => (
    <MicroLoadingIndicators overlay centered size="lg" {...props} />
  ),
);
FullScreenLoading.displayName = "FullScreenLoading";

// Button loading state wrapper
export interface LoadingButtonProps {
  loading?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  loadingType?: MicroLoadingProps["type"];
  loadingSize?: MicroLoadingProps["size"];
  loadingColor?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  children,
  disabled = false,
  className = "",
  loadingType = "spinner",
  loadingSize = "sm",
  loadingColor = "#ffffff",
}) => {
  return (
    <button
      className={`loading-button ${className}`}
      disabled={disabled || loading}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minWidth: 100,
        ...(!loading && { opacity: disabled ? 0.5 : 1 }),
      }}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <MicroLoadingIndicators
              type={loadingType}
              size={loadingSize}
              color={loadingColor}
            />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

// Card loading skeleton
export interface CardSkeletonProps {
  lines?: number;
  showAvatar?: boolean;
  showTitle?: boolean;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  lines = 3,
  showAvatar = true,
  showTitle = true,
  className = "",
}) => {
  return (
    <div className={`card-skeleton ${className}`} style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {showAvatar && <LoadingSkeleton size="md" />}
        <div style={{ flex: 1 }}>
          {showTitle && (
            <LoadingSkeleton size="sm" className="skeleton-title" />
          )}
          {Array.from({ length: lines }).map((_, index) => (
            <LoadingSkeleton
              key={index}
              size="sm"
              className={`skeleton-line ${index === lines - 1 ? "skeleton-line-short" : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Table loading skeleton
export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = "",
}) => {
  return (
    <div className={`table-skeleton ${className}`}>
      {showHeader && (
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {Array.from({ length: columns }).map((_, index) => (
            <LoadingSkeleton
              key={`header-${index}`}
              size="sm"
              className="skeleton-header-cell"
            />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          style={{ display: "flex", gap: 16, padding: "12px 0" }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <LoadingSkeleton
              key={`cell-${rowIndex}-${colIndex}`}
              size="sm"
              className="skeleton-cell"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default MicroLoadingIndicators;

// CSS styles for skeleton components
const skeletonStyles = `
.skeleton-title {
  margin-bottom: 8px;
  width: 60%;
}

.skeleton-line {
  margin-bottom: 4px;
  width: 100%;
}

.skeleton-line-short {
  width: 80%;
}

.skeleton-header-cell {
  flex: 1;
}

.skeleton-cell {
  flex: 1;
}
`;

// Inject styles into document head
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = skeletonStyles;
  document.head.appendChild(styleSheet);
}
