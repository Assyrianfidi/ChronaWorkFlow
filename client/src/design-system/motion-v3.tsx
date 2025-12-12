
declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState } from 'react';
/**
 * Motion & Animations System V3
 * Parallax physics, quantum-curve motion paths, 144fps-capable engine
 */

import {
  motion,
  AnimatePresence,
  MotionValue,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";

export interface MotionV3Config {
  // Performance settings
  performance: {
    targetFPS: 60 | 120 | 144;
    reducedMotion: boolean;
    gpuAcceleration: boolean;
    optimizationLevel: "performance" | "quality" | "balanced";
  };

  // Physics simulation
  physics: {
    gravity: number;
    friction: number;
    tension: number;
    mass: number;
    velocityDamping: number;
  };

  // Quantum-curve motion paths
  quantumPaths: {
    enabled: boolean;
    complexity: number;
    randomness: number;
    smoothing: number;
  };

  // Parallax system
  parallax: {
    enabled: boolean;
    depth: number;
    sensitivity: number;
    perspective: number;
  };

  // Animation stacks
  animationStacks: {
    maxConcurrent: number;
    priorityQueue: boolean;
    autoOptimize: boolean;
  };
}

export interface QuantumPath {
  points: Array<{ x: number; y: number; z?: number }>;
  controlPoints: Array<{ x: number; y: number; z?: number }>;
  duration: number;
  easing: string;
  randomness: number;
}

export class MotionV3Engine {
  private static instance: MotionV3Engine;
  private config: MotionV3Config;
  private animationFrame: number | null = null;
  private activeAnimations: Map<string, Animation> = new Map();
  private performanceMonitor: PerformanceMonitor;
  private parallaxElements: Map<string, HTMLElement> = new Map();

  private constructor() {
    this.config = this.getDefaultConfig();
    this.performanceMonitor = new PerformanceMonitor();
    this.initializeParallax();
  }

  static getInstance(): MotionV3Engine {
    if (!MotionV3Engine.instance) {
      MotionV3Engine.instance = new MotionV3Engine();
    }
    return MotionV3Engine.instance;
  }

  private getDefaultConfig(): MotionV3Config {
    return {
      performance: {
        targetFPS: 144,
        reducedMotion: false,
        gpuAcceleration: true,
        optimizationLevel: "balanced",
      },
      physics: {
        gravity: 9.81,
        friction: 0.1,
        tension: 0.2,
        mass: 1,
        velocityDamping: 0.95,
      },
      quantumPaths: {
        enabled: true,
        complexity: 3,
        randomness: 0.1,
        smoothing: 0.8,
      },
      parallax: {
        enabled: true,
        depth: 1000,
        sensitivity: 0.5,
        perspective: 1000,
      },
      animationStacks: {
        maxConcurrent: 10,
        priorityQueue: true,
        autoOptimize: true,
      },
    };
  }

  private initializeParallax(): void {
    if (!this.config.parallax.enabled || typeof window === "undefined") {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      const mouseY = (event.clientY / window.innerHeight - 0.5) * 2;

      this.parallaxElements.forEach((element, id) => {
        const depth = parseFloat(element.dataset.depth || "1");
        const moveX = mouseX * this.config.parallax.sensitivity * depth;
        const moveY = mouseY * this.config.parallax.sensitivity * depth;

        element.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Clean up on unmount
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }

  // Quantum-curve path generation
  generateQuantumPath(
    start: { x: number; y: number },
    end: { x: number; y: number },
    options?: {
      complexity?: number;
      randomness?: number;
      smoothing?: number;
    },
  ): QuantumPath {
    const complexity =
      options?.complexity ?? this.config.quantumPaths.complexity;
    const randomness =
      options?.randomness ?? this.config.quantumPaths.randomness;
    const smoothing = options?.smoothing ?? this.config.quantumPaths.smoothing;

    const points: Array<{ x: number; y: number }> = [start];
    const controlPoints: Array<{ x: number; y: number }> = [];

    // Generate intermediate points with quantum randomness
    for (let i = 1; i < complexity; i++) {
      const t = i / complexity;
      const baseX = start.x + (end.x - start.x) * t;
      const baseY = start.y + (end.y - start.y) * t;

      // Add quantum randomness
      const randomX = (Math.random() - 0.5) * randomness * 100;
      const randomY = (Math.random() - 0.5) * randomness * 100;

      points.push({
        x: baseX + randomX,
        y: baseY + randomY,
      });

      // Generate control points for smooth curves
      if (i > 0) {
        const prevPoint = points[i - 1];
        const currentPoint = points[i];

        controlPoints.push({
          x: (prevPoint.x + currentPoint.x) / 2,
          y: (prevPoint.y + currentPoint.y) / 2,
        });
      }
    }

    points.push(end);

    // Apply smoothing
    if (smoothing > 0) {
      this.smoothPath(points, smoothing);
    }

    return {
      points,
      controlPoints,
      duration: 1000 + Math.random() * 500,
      easing: "ease-in-out",
      randomness,
    };
  }

  private smoothPath(
    points: Array<{ x: number; y: number }>,
    smoothing: number,
  ): void {
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];

      current.x =
        current.x * (1 - smoothing) + ((prev.x + next.x) / 2) * smoothing;
      current.y =
        current.y * (1 - smoothing) + ((prev.y + next.y) / 2) * smoothing;
    }
  }

  // Physics simulation
  simulatePhysics(
    element: HTMLElement,
    initialVelocity: { x: number; y: number },
    options?: {
      gravity?: number;
      friction?: number;
      tension?: number;
    },
  ): void {
    const gravity = options?.gravity ?? this.config.physics.gravity;
    const friction = options?.friction ?? this.config.physics.friction;
    const tension = options?.tension ?? this.config.physics.tension;

    const velocity = { ...initialVelocity };
    const position = { x: 0, y: 0 };
    let time = 0;

    const animate = () => {
      time += 0.016; // 60fps timestep

      // Apply physics
      velocity.y += gravity * 0.016;
      velocity.x *= 1 - friction;
      velocity.y *= 1 - friction;

      // Apply tension (spring force)
      position.x += velocity.x * 0.016;
      position.y += velocity.y * 0.016;

      // Apply spring force back to origin
      const springForceX = -tension * position.x;
      const springForceY = -tension * position.y;

      velocity.x += springForceX * 0.016;
      velocity.y += springForceY * 0.016;

      // Apply transform
      element.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;

      // Continue animation if velocity is significant
      if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
        requestAnimationFrame(animate);
      } else {
        // Reset to origin
        element.style.transform = "translate3d(0, 0, 0)";
      }
    };

    requestAnimationFrame(animate);
  }

  // 144fps-capable animation loop
  startHighFPSAnimation(
    callback: (timestamp: number, deltaTime: number) => void,
  ): void {
    const targetFPS = this.config.performance.targetFPS;
    const frameInterval = 1000 / targetFPS;
    let lastFrameTime = 0;

    const animate = (timestamp: number) => {
      if (lastFrameTime === 0) {
        lastFrameTime = timestamp;
      }

      const deltaTime = timestamp - lastFrameTime;

      if (deltaTime >= frameInterval) {
        callback(timestamp, deltaTime);
        lastFrameTime = timestamp - (deltaTime % frameInterval);
      }

      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  stopHighFPSAnimation(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  // Parallax element registration
  registerParallaxElement(element: HTMLElement, depth: number): void {
    const id = `parallax-${Date.now()}-${Math.random()}`;
    element.dataset.depth = depth.toString();
    this.parallaxElements.set(id, element);

    return () => {
      this.parallaxElements.delete(id);
    };
  }

  // Animation stack management
  addAnimationToStack(
    id: string,
    animation: Animation,
    priority: number = 0,
  ): void {
    if (
      this.activeAnimations.size >= this.config.animationStacks.maxConcurrent
    ) {
      // Remove lowest priority animation
      let lowestPriority = Infinity;
      let lowestId = "";

      this.activeAnimations.forEach((anim, animId) => {
        if (priority > lowestPriority) {
          lowestPriority = priority;
          lowestId = animId;
        }
      });

      if (lowestId) {
        this.activeAnimations.get(lowestId)?.cancel();
        this.activeAnimations.delete(lowestId);
      }
    }

    this.activeAnimations.set(id, animation);
  }

  removeAnimationFromStack(id: string): void {
    const animation = this.activeAnimations.get(id);
    if (animation) {
      animation.cancel();
      this.activeAnimations.delete(id);
    }
  }

  // Performance monitoring
  getPerformanceMetrics(): {
    currentFPS: number;
    averageFPS: number;
    frameDrops: number;
    memoryUsage: number;
  } {
    return this.performanceMonitor.getMetrics();
  }

  updateConfig(newConfig: Partial<MotionV3Config>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): MotionV3Config {
    return { ...this.config };
  }
}

class PerformanceMonitor {
  private frameTimestamps: number[] = [];
  private frameDrops: number = 0;
  private lastFrameTime: number = 0;

  recordFrame(timestamp: number): void {
    if (this.lastFrameTime > 0) {
      const frameDelta = timestamp - this.lastFrameTime;

      // Count frame drops (frames taking longer than 16.67ms for 60fps)
      if (frameDelta > 16.67 * 2) {
        this.frameDrops++;
      }
    }

    this.frameTimestamps.push(timestamp);
    this.lastFrameTime = timestamp;

    // Keep only last 60 frames for average calculation
    if (this.frameTimestamps.length > 60) {
      this.frameTimestamps.shift();
    }
  }

  getMetrics(): {
    currentFPS: number;
    averageFPS: number;
    frameDrops: number;
    memoryUsage: number;
  } {
    const now = performance.now();
    const recentFrames = this.frameTimestamps.filter((t) => now - t < 1000);

    let currentFPS = 0;
    if (this.frameTimestamps.length >= 2) {
      const lastTwo = this.frameTimestamps.slice(-2);
      const frameDelta = lastTwo[1] - lastTwo[0];
      currentFPS = 1000 / frameDelta;
    }

    let averageFPS = 0;
    if (recentFrames.length >= 2) {
      const totalTime = recentFrames[recentFrames.length - 1] - recentFrames[0];
      averageFPS = (recentFrames.length - 1) / (totalTime / 1000);
    }

// @ts-ignore
// @ts-ignore
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

    return {
      currentFPS,
      averageFPS,
      frameDrops: this.frameDrops,
      memoryUsage,
    };
  }
}

// React hooks for Motion V3
// @ts-ignore
export function useMotionV3(config?: Partial<MotionV3Config>) {
  const engine = MotionV3Engine.getInstance();
  const motionValue = useMotionValue(0);
  const springConfig = { stiffness: 300, damping: 30 };

  React.useEffect(() => {
    if (config) {
      engine.updateConfig(config);
    }
  }, [config]);

  const createQuantumMotion = React.useCallback(
    (
      element: HTMLElement,
      start: { x: number; y: number },
      end: { x: number; y: number },
      options?: {
        duration?: number;
        complexity?: number;
        randomness?: number;
      },
    ) => {
      const path = engine.generateQuantumPath(start, end, options);

      // Create animation using the quantum path
      const animation = element.animate(
        [
          { transform: `translate(${start.x}px, ${start.y}px)` },
          ...path.points.map((point, index) => ({
            transform: `translate(${point.x}px, ${point.y}px)`,
            offset: index / (path.points.length - 1),
          })),
          { transform: `translate(${end.x}px, ${end.y}px)` },
        ],
        {
          duration: path.duration,
// @ts-ignore
// @ts-ignore
          easing: path.easing as any,
          fill: "forwards",
        },
      );

      return animation;
    },
    [engine],
  );

  const applyPhysics = React.useCallback(
    (
      element: HTMLElement,
      velocity: { x: number; y: number },
      options?: {
        gravity?: number;
        friction?: number;
        tension?: number;
      },
    ) => {
      engine.simulatePhysics(element, velocity, options);
    },
    [engine],
  );

  const registerParallax = React.useCallback(
    (element: HTMLElement, depth: number) => {
      return engine.registerParallaxElement(element, depth);
    },
    [engine],
  );

  return {
    engine,
    motionValue,
    createQuantumMotion,
    applyPhysics,
    registerParallax,
    springConfig,
  };
}

// Motion components
// @ts-ignore
export const MotionContainer: React.FC<{
  children: React.ReactNode;
  config?: Partial<MotionV3Config>;
  className?: string;
}> = ({ children, config, className }) => {
  const { engine } = useMotionV3(config);

  React.useEffect(() => {
    // Start performance monitoring
    const monitorPerformance = () => {
      const metrics = engine.getPerformanceMetrics();

      // Adjust quality based on performance
      if (metrics.currentFPS < 30) {
        engine.updateConfig({
          performance: {
            ...engine.getConfig().performance,
            optimizationLevel: "performance",
          },
        });
      } else if (metrics.currentFPS > 60) {
        engine.updateConfig({
          performance: {
            ...engine.getConfig().performance,
            optimizationLevel: "quality",
          },
        });
      }
    };

    const interval = setInterval(monitorPerformance, 1000);
    return () => clearInterval(interval);
  }, [engine]);

  return <motion.div className={className}>{children}</motion.div>;
};

// @ts-ignore
export const QuantumPathMotion: React.FC<{
  children: React.ReactNode;
  path: QuantumPath;
  className?: string;
}> = ({ children, path, className }) => {
  const [currentPoint, setCurrentPoint] = React.useState(path.points[0]);

  React.useEffect(() => {
    let currentIndex = 0;

    const animate = () => {
      if (currentIndex < path.points.length) {
        setCurrentPoint(path.points[currentIndex]);
        currentIndex++;
      }
    };

    const interval = setInterval(animate, path.duration / path.points.length);
    return () => clearInterval(interval);
  }, [path]);

  return (
    <motion.div
      className={className}
      animate={{
        x: currentPoint.x,
        y: currentPoint.y,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
    >
      {children}
    </motion.div>
  );
};

export default MotionV3Engine;
