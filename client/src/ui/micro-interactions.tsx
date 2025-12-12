
declare global {
  interface Window {
    [key: string]: any;
  }
}

/**
 * Micro-Interactions & Animations System V3
 * Delightful micro-interactions, fluid animations, haptic feedback, sound effects
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useAnimation,
} from "framer-motion";
// @ts-ignore
import { useSuperAccessibility } from '../accessibility/super-accessibility.js.js';
// @ts-ignore
import { useGPUAcceleration } from '../performance/gpu-acceleration.js.js';

// Micro-Interaction Types
export type MicroInteractionType =
  | "hover"
  | "focus"
  | "click"
  | "drag"
  | "swipe"
  | "pinch"
  | "scroll"
  | "load"
  | "success"
  | "error"
  | "warning"
  | "info";

export type AnimationPreset =
  | "bounce"
  | "pulse"
  | "slide"
  | "fade"
  | "scale"
  | "rotate"
  | "flip"
  | "shake"
  | "wiggle"
  | "glow"
  | "ripple"
  | "morph";

// Haptic Feedback Interface
interface HapticPattern {
  type:
    | "light"
    | "medium"
    | "heavy"
    | "success"
    | "warning"
    | "error"
    | "custom";
  pattern?: number[];
  intensity?: number;
  duration?: number;
}

// Sound Effect Interface
interface SoundEffect {
  id: string;
  name: string;
  url: string;
  volume: number;
  pitch: number;
  loop: boolean;
  category: "ui" | "feedback" | "notification" | "ambient";
}

// Animation Configuration
interface AnimationConfig {
  type: AnimationPreset;
  duration: number;
  delay: number;
  easing: string;
  repeat: number | "infinite";
  direction: "normal" | "reverse" | "alternate" | "alternate-reverse";
  springConfig?: {
    stiffness: number;
    damping: number;
    mass: number;
  };
}

// Micro-Interaction Component
interface MicroInteractionProps {
  children: React.ReactNode;
  type: MicroInteractionType;
  animation?: AnimationPreset;
  haptic?: boolean;
  sound?: boolean;
  disabled?: boolean;
  className?: string;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  config?: Partial<AnimationConfig>;
}

// @ts-ignore
export const MicroInteraction: React.FC<MicroInteractionProps> = ({
  children,
  type,
  animation = "bounce",
  haptic = false,
  sound = false,
  disabled = false,
  className = "",
  onAnimationStart,
  onAnimationComplete,
  config = {},
}) => {
  const { getMotionPreference } = useSuperAccessibility();
  const { createAnimation } = useGPUAcceleration();
  const [isAnimating, setIsAnimating] = useState(false);
  const controls = useAnimation();

  const animationConfig: AnimationConfig = useMemo(
    () => ({
      type: animation,
      duration: 0.3,
      delay: 0,
      easing: "easeOut",
      repeat: 1,
      direction: "normal",
      ...config,
    }),
    [animation, config],
  );

  const motionPreference = useMemo(
    () => getMotionPreference(),
    [getMotionPreference],
  );

  const getAnimationVariants = useCallback(() => {
    const variants: Record<AnimationPreset, any> = {
      bounce: {
        initial: { scale: 1 },
        animate: { scale: [1, 1.1, 0.9, 1] },
        transition: {
          duration: animationConfig.duration,
          times: [0, 0.3, 0.6, 1],
        },
      },
      pulse: {
        initial: { scale: 1 },
        animate: { scale: [1, 1.05, 1] },
        transition: {
          duration: animationConfig.duration,
          repeat:
            animationConfig.repeat === "infinite"
              ? Infinity
              : animationConfig.repeat,
        },
      },
      slide: {
        initial: { x: 0 },
        animate: { x: [0, 10, -10, 0] },
        transition: { duration: animationConfig.duration },
      },
      fade: {
        initial: { opacity: 1 },
        animate: { opacity: [1, 0.5, 1] },
        transition: { duration: animationConfig.duration },
      },
      scale: {
        initial: { scale: 1 },
        animate: { scale: [1, 1.2, 1] },
        transition: { duration: animationConfig.duration },
      },
      rotate: {
        initial: { rotate: 0 },
        animate: { rotate: 360 },
        transition: { duration: animationConfig.duration },
      },
      flip: {
        initial: { rotateY: 0 },
        animate: { rotateY: 360 },
        transition: { duration: animationConfig.duration },
      },
      shake: {
        initial: { x: 0 },
        animate: { x: [0, -5, 5, -5, 5, 0] },
        transition: { duration: animationConfig.duration },
      },
      wiggle: {
        initial: { rotate: 0 },
        animate: { rotate: [-3, 3, -3, 3, 0] },
        transition: { duration: animationConfig.duration },
      },
      glow: {
        initial: { boxShadow: "0 0 0 rgba(59, 130, 246, 0)" },
        animate: { boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" },
        transition: { duration: animationConfig.duration },
      },
      ripple: {
        initial: { scale: 0, opacity: 1 },
        animate: { scale: 2, opacity: 0 },
        transition: { duration: animationConfig.duration },
      },
      morph: {
        initial: { borderRadius: "8px" },
        animate: { borderRadius: ["8px", "50%", "8px"] },
        transition: { duration: animationConfig.duration },
      },
    };

    return variants[animation];
  }, [animation, animationConfig.duration, animationConfig.repeat]);

  const triggerAnimation = useCallback(async () => {
    if (disabled || motionPreference === "reduced") return;

    setIsAnimating(true);
    onAnimationStart?.();

    // Trigger haptic feedback
    if (haptic) {
      triggerHaptic(type);
    }

    // Play sound effect
    if (sound) {
      playSoundEffect(type);
    }

    // Execute animation
    const variants = getAnimationVariants();
    await controls.start(variants.animate);

    setIsAnimating(false);
    onAnimationComplete?.();
  }, [
    disabled,
    motionPreference,
    type,
    haptic,
    sound,
    onAnimationStart,
    onAnimationComplete,
    controls,
    getAnimationVariants,
  ]);

  const triggerHaptic = useCallback((interactionType: MicroInteractionType) => {
    if (!("vibrate" in navigator)) return;

    const patterns: Record<MicroInteractionType, HapticPattern> = {
      hover: { type: "light" },
      focus: { type: "light" },
      click: { type: "medium" },
      drag: { type: "heavy" },
      swipe: { type: "medium" },
      pinch: { type: "medium" },
      scroll: { type: "light" },
      load: { type: "success" },
      success: { type: "success" },
      error: { type: "error" },
      warning: { type: "warning" },
      info: { type: "light" },
    };

    const pattern = patterns[interactionType];

    switch (pattern.type) {
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(20);
        break;
      case "heavy":
        navigator.vibrate(30);
        break;
      case "success":
        navigator.vibrate([10, 50, 10]);
        break;
      case "warning":
        navigator.vibrate([20, 30, 20]);
        break;
      case "error":
        navigator.vibrate([30, 20, 30, 20, 30]);
        break;
    }
  }, []);

  const playSoundEffect = useCallback(
    (interactionType: MicroInteractionType) => {
      // Sound effect implementation would go here
      // This is a placeholder for the actual sound playing logic
      console.log(`Playing sound effect for ${interactionType}`);
    },
    [],
  );

  const eventHandlers = useMemo(() => {
    const handlers: any = {};

    switch (type) {
      case "hover":
        handlers.onMouseEnter = triggerAnimation;
        break;
      case "focus":
        handlers.onFocus = triggerAnimation;
        break;
      case "click":
        handlers.onClick = triggerAnimation;
        break;
      case "drag":
        handlers.onDragStart = triggerAnimation;
        break;
      case "swipe":
        handlers.onSwipe = triggerAnimation;
        break;
      case "pinch":
        handlers.onPinch = triggerAnimation;
        break;
      case "scroll":
        handlers.onScroll = triggerAnimation;
        break;
      case "load":
        useEffect(() => {
          triggerAnimation();
        }, []);
        break;
    }

    return handlers;
  }, [type, triggerAnimation]);

  return (
    <motion.div className={className} animate={controls} {...eventHandlers}>
      {children}
    </motion.div>
  );
};

// Ripple Effect Component
interface RippleEffectProps {
  children: React.ReactNode;
  color?: string;
  duration?: number;
  size?: number;
  disabled?: boolean;
  className?: string;
}

// @ts-ignore
export const RippleEffect: React.FC<RippleEffectProps> = ({
  children,
  color = "rgba(255, 255, 255, 0.5)",
  duration = 600,
  size = 100,
  disabled = false,
  className = "",
}) => {
  const [ripples, setRipples] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      timestamp: number;
    }>
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const rippleIdCounter = useRef(0);

  const createRipple = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newRipple = {
        id: rippleIdCounter.current++,
        x,
        y,
        timestamp: Date.now(),
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, duration);
    },
    [disabled, duration],
  );

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseDown={createRipple}
    >
      {children}

      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x - size / 2,
              top: ripple.y - size / 2,
              width: size,
              height: size,
              backgroundColor: color,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: duration / 1000, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Magnetic Button Component
interface MagneticButtonProps {
  children: React.ReactNode;
  strength?: number;
  radius?: number;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

// @ts-ignore
export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  strength = 0.3,
  radius = 100,
  disabled = false,
  className = "",
  onClick,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;

      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (event.clientX - centerX) * strength;
      const deltaY = (event.clientY - centerY) * strength;

      // Limit movement within radius
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = radius * strength;

      if (distance > maxDistance) {
        const angle = Math.atan2(deltaY, deltaX);
        setMousePosition({
          x: Math.cos(angle) * maxDistance,
          y: Math.sin(angle) * maxDistance,
        });
      } else {
        setMousePosition({ x: deltaX, y: deltaY });
      }
    },
    [disabled, strength, radius],
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  }, []);

  return (
    <motion.button
      ref={buttonRef}
      className={`relative transition-transform duration-200 ${className}`}
      animate={{
        x: mousePosition.x,
        y: mousePosition.y,
        scale: isHovered ? 1.05 : 1,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
};

// Parallax Component
interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  disabled?: boolean;
  className?: string;
}

// @ts-ignore
export const Parallax: React.FC<ParallaxProps> = ({
  children,
  speed = 0.5,
  disabled = false,
  className = "",
}) => {
  const [scrollY, setScrollY] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [disabled]);

  const translateY = useMemo(() => {
    if (disabled) return 0;
    return scrollY * speed;
  }, [scrollY, speed, disabled]);

  return (
    <div ref={elementRef} className={`relative ${className}`}>
      <motion.div
        style={{ y: translateY }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Stagger Animation Component
interface StaggerAnimationProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale" | "fade";
  disabled?: boolean;
  className?: string;
}

// @ts-ignore
export const StaggerAnimation: React.FC<StaggerAnimationProps> = ({
  children,
  staggerDelay = 0.1,
  direction = "up",
  disabled = false,
  className = "",
}) => {
  const getVariants = useCallback(() => {
    const variants: Record<string, any> = {
      up: {
        initial: { y: 50, opacity: 0 },
        animate: { y: 0, opacity: 1 },
      },
      down: {
        initial: { y: -50, opacity: 0 },
        animate: { y: 0, opacity: 1 },
      },
      left: {
        initial: { x: 50, opacity: 0 },
        animate: { x: 0, opacity: 1 },
      },
      right: {
        initial: { x: -50, opacity: 0 },
        animate: { x: 0, opacity: 1 },
      },
      scale: {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
      },
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
      },
    };

    return variants[direction];
  }, [direction]);

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          initial="initial"
          animate="animate"
          variants={getVariants()}
          transition={{
            delay: disabled ? 0 : index * staggerDelay,
            duration: 0.5,
            ease: "easeOut",
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

// Morphing Shape Component
interface MorphingShapeProps {
  shapes: string[];
  duration?: number;
  disabled?: boolean;
  className?: string;
}

// @ts-ignore
export const MorphingShape: React.FC<MorphingShapeProps> = ({
  shapes,
  duration = 2,
  disabled = false,
  className = "",
}) => {
  const [currentShapeIndex, setCurrentShapeIndex] = useState(0);

  useEffect(() => {
    if (disabled) return;

    const interval = setInterval(() => {
      setCurrentShapeIndex((prev) => (prev + 1) % shapes.length);
    }, duration * 1000);

    return () => clearInterval(interval);
  }, [shapes.length, duration, disabled]);

  return (
    <motion.div
      className={className}
      animate={{
        d: shapes[currentShapeIndex],
      }}
      transition={{
        duration,
        ease: "easeInOut",
      }}
    >
      <svg viewBox="0 0 100 100">
        <path d={shapes[currentShapeIndex]} fill="currentColor" />
      </svg>
    </motion.div>
  );
};

// Floating Action Button Component
interface FABProps {
  icon: React.ReactNode;
  label?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  color?: string;
  size?: "sm" | "md" | "lg";
  extended?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

// @ts-ignore
export const FloatingActionButton: React.FC<FABProps> = ({
  icon,
  label,
  position = "bottom-right",
  color = "blue",
  size = "md",
  extended = false,
  disabled = false,
  onClick,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getPositionClasses = useCallback(() => {
    const positions = {
      "bottom-right": "bottom-6 right-6",
      "bottom-left": "bottom-6 left-6",
      "top-right": "top-6 right-6",
      "top-left": "top-6 left-6",
    };
    return positions[position];
  }, [position]);

  const getSizeClasses = useCallback(() => {
    const sizes = {
      sm: "w-12 h-12",
      md: "w-14 h-14",
      lg: "w-16 h-16",
    };
    return sizes[size];
  }, [size]);

  const getColorClasses = useCallback(() => {
    const colors = {
      blue: "bg-blue-500 hover:bg-blue-600",
      green: "bg-green-500 hover:bg-green-600",
      red: "bg-red-500 hover:bg-red-600",
      purple: "bg-purple-500 hover:bg-purple-600",
      yellow: "bg-yellow-500 hover:bg-yellow-600",
    };
// @ts-ignore
    return colors[color as keyof typeof colors];
  }, [color]);

  return (
    <motion.div
      className={`fixed ${getPositionClasses()} ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <motion.button
        className={`
          ${getSizeClasses()}
          ${getColorClasses()}
          rounded-full shadow-lg text-white
          flex items-center justify-center
          transition-colors duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${extended ? "px-6 gap-3" : ""}
        `}
        whileHover={{ scale: disabled ? 1 : 1.1 }}
        whileTap={{ scale: disabled ? 1 : 0.9 }}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            onClick?.();
          }
        }}
        disabled={disabled}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {icon}
        </motion.div>

        {extended && label && (
          <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {label}
          </motion.span>
        )}
      </motion.button>
    </motion.div>
  );
};

// Loading Dots Component
interface LoadingDotsProps {
  size?: number;
  color?: string;
  count?: number;
  duration?: number;
  className?: string;
}

// @ts-ignore
export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 8,
  color = "blue",
  count = 3,
  duration = 1.4,
  className = "",
}) => {
  const getColorClasses = useCallback(() => {
    const colors = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      red: "bg-red-500",
      purple: "bg-purple-500",
      yellow: "bg-yellow-500",
    };
// @ts-ignore
    return colors[color as keyof typeof colors];
  }, [color]);

  return (
    <div className={`flex gap-1 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <motion.div
          key={index}
          className={`${getColorClasses()} rounded-full`}
          style={{ width: size, height: size }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration,
            repeat: Infinity,
            delay: index * (duration / count / 2),
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Progress Ring Component
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  showPercentage?: boolean;
  className?: string;
}

// @ts-ignore
export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = "blue",
  backgroundColor = "gray",
  animated = true,
  showPercentage = false,
  className = "",
}) => {
  const getColorClasses = useCallback(() => {
    const colors = {
      blue: "#3B82F6",
      green: "#10B981",
      red: "#EF4444",
      purple: "#8B5CF6",
      yellow: "#F59E0B",
    };
// @ts-ignore
    return colors[color as keyof typeof colors];
  }, [color]);

  const getBackgroundColorClasses = useCallback(() => {
    const colors = {
      gray: "#E5E7EB",
      blue: "#DBEAFE",
      green: "#D1FAE5",
      red: "#FEE2E2",
      purple: "#EDE9FE",
      yellow: "#FEF3C7",
    };
// @ts-ignore
    return colors[backgroundColor as keyof typeof colors];
  }, [backgroundColor]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getBackgroundColorClasses()}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColorClasses()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: animated ? strokeDashoffset : strokeDashoffset,
          }}
          transition={{ duration: 1, ease: "easeInOut" }}
          strokeLinecap="round"
        />
      </svg>

      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Particle Effect Component
interface ParticleEffectProps {
  count?: number;
  size?: number;
  color?: string;
  duration?: number;
  spread?: number;
  disabled?: boolean;
  className?: string;
}

// @ts-ignore
export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  count = 20,
  size = 4,
  color = "blue",
  duration = 1,
  spread = 100,
  disabled = false,
  className = "",
}) => {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
    }>
  >([]);

  const getColorClasses = useCallback(() => {
    const colors = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      red: "bg-red-500",
      purple: "bg-purple-500",
      yellow: "bg-yellow-500",
    };
// @ts-ignore
    return colors[color as keyof typeof colors];
  }, [color]);

  const createParticles = useCallback(() => {
    if (disabled) return;

    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: 0,
      y: 0,
      vx: (Math.random() - 0.5) * spread,
      vy: (Math.random() - 0.5) * spread,
    }));

    setParticles(newParticles);

    // Remove particles after animation
    setTimeout(() => {
      setParticles([]);
    }, duration * 1000);
  }, [count, spread, duration, disabled]);

  useEffect(() => {
    createParticles();
  }, [createParticles]);

  return (
    <div className={`relative ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${getColorClasses()}`}
          style={{ width: size, height: size }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{
            x: particle.vx,
            y: particle.vy,
            opacity: 0,
          }}
          transition={{
            duration,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

// Gesture Indicator Component
interface GestureIndicatorProps {
  gesture:
    | "swipe-left"
    | "swipe-right"
    | "swipe-up"
    | "swipe-down"
    | "tap"
    | "long-press";
  active?: boolean;
  size?: number;
  color?: string;
  className?: string;
}

// @ts-ignore
export const GestureIndicator: React.FC<GestureIndicatorProps> = ({
  gesture,
  active = false,
  size = 60,
  color = "blue",
  className = "",
}) => {
  const getColorClasses = useCallback(() => {
    const colors = {
      blue: "stroke-blue-500",
      green: "stroke-green-500",
      red: "stroke-red-500",
      purple: "stroke-purple-500",
      yellow: "stroke-yellow-500",
    };
// @ts-ignore
    return colors[color as keyof typeof colors];
  }, [color]);

  const getGesturePath = useCallback(() => {
    const paths = {
      "swipe-left": "M 40 30 L 20 30 M 25 25 L 20 30 L 25 35",
      "swipe-right": "M 20 30 L 40 30 M 35 25 L 40 30 L 35 35",
      "swipe-up": "M 30 40 L 30 20 M 25 25 L 30 20 L 35 25",
      "swipe-down": "M 30 20 L 30 40 M 25 35 L 30 40 L 35 35",
      tap: "M 30 20 L 30 40 M 20 30 L 40 30",
      "long-press": "M 30 25 A 5 5 0 0 1 30 35 A 5 5 0 0 1 30 25",
    };
    return paths[gesture];
  }, [gesture]);

  return (
    <motion.div
      className={className}
      animate={{
        scale: active ? 1.2 : 1,
        opacity: active ? 1 : 0.3,
      }}
      transition={{ duration: 0.2 }}
    >
      <svg width={size} height={size} viewBox="0 0 60 60" className="transform">
        <motion.path
          d={getGesturePath()}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={getColorClasses()}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: active ? 1 : 0.3 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </svg>
    </motion.div>
  );
};

export default {
  MicroInteraction,
  RippleEffect,
  MagneticButton,
  Parallax,
  StaggerAnimation,
  MorphingShape,
  FloatingActionButton,
  LoadingDots,
  ProgressRing,
  ParticleEffect,
  GestureIndicator,
};
