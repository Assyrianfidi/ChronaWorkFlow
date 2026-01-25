declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUserExperienceMode } from "@/components/adaptive/UserExperienceMode";
import { usePerformance } from "@/components/adaptive/UI-Performance-Engine";
import { useAccessibility } from "@/components/adaptive/AccessibilityModes";

// Interaction types and interfaces
export interface InteractionConfig {
  physics: {
    enabled: boolean;
    gravity: number;
    friction: number;
    bounce: number;
    mass: number;
  };
  haptics: {
    enabled: boolean;
    intensity: number;
    duration: number;
    patterns: HapticPattern[];
  };
  audio: {
    enabled: boolean;
    volume: number;
    sounds: AudioSound[];
  };
  gestures: {
    enabled: boolean;
    swipeThreshold: number;
    tapThreshold: number;
    longPressThreshold: number;
  };
  animations: {
    enabled: boolean;
    duration: number;
    easing: string;
    spring: SpringConfig;
  };
}

export interface HapticPattern {
  id: string;
  name: string;
  pattern: number[];
  description: string;
}

export interface AudioSound {
  id: string;
  name: string;
  url: string;
  type: "click" | "swipe" | "success" | "error" | "notification";
  volume: number;
}

export interface SpringConfig {
  tension: number;
  friction: number;
  mass: number;
}

export interface InteractionEvent {
  type:
    | "click"
    | "swipe"
    | "tap"
    | "longPress"
    | "drag"
    | "drop"
    | "hover"
    | "focus"
    | "blur";
  target: HTMLElement;
  timestamp: number;
  coordinates: { x: number; y: number };
  velocity?: { x: number; y: number };
  pressure?: number;
  duration?: number;
}

export interface ParticleSystem {
  particles: Particle[];
  active: boolean;
  bounds: DOMRect;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: "ripple" | "spark" | "bubble" | "trail";
}

export interface GestureState {
  isActive: boolean;
  startPoint: { x: number; y: number };
  currentPoint: { x: number; y: number };
  startTime: number;
  type: "swipe" | "drag" | "longPress" | null;
  velocity: { x: number; y: number };
}

const defaultConfig: InteractionConfig = {
  physics: {
    enabled: true,
    gravity: 0.5,
    friction: 0.95,
    bounce: 0.7,
    mass: 1,
  },
  haptics: {
    enabled: false,
    intensity: 0.5,
    duration: 100,
    patterns: [
      {
        id: "tap",
        name: "Tap",
        pattern: [10, 50, 10],
        description: "Light tap feedback",
      },
      {
        id: "success",
        name: "Success",
        pattern: [100, 50, 100, 50, 200],
        description: "Success confirmation",
      },
      {
        id: "error",
        name: "Error",
        pattern: [200, 100, 200],
        description: "Error notification",
      },
      {
        id: "long-press",
        name: "Long Press",
        pattern: [50, 30, 50, 30, 50, 30, 100],
        description: "Long press vibration",
      },
    ],
  },
  audio: {
    enabled: false,
    volume: 0.3,
    sounds: [
      {
        id: "click",
        name: "Click",
        url: "/sounds/click.mp3",
        type: "click",
        volume: 0.3,
      },
      {
        id: "swipe",
        name: "Swipe",
        url: "/sounds/swipe.mp3",
        type: "swipe",
        volume: 0.2,
      },
      {
        id: "success",
        name: "Success",
        url: "/sounds/success.mp3",
        type: "success",
        volume: 0.4,
      },
      {
        id: "error",
        name: "Error",
        url: "/sounds/error.mp3",
        type: "error",
        volume: 0.5,
      },
      {
        id: "notification",
        name: "Notification",
        url: "/sounds/notification.mp3",
        type: "notification",
        volume: 0.3,
      },
    ],
  },
  gestures: {
    enabled: true,
    swipeThreshold: 50,
    tapThreshold: 10,
    longPressThreshold: 500,
  },
  animations: {
    enabled: true,
    duration: 300,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: {
      tension: 170,
      friction: 26,
      mass: 1,
    },
  },
};

// Context for interaction engine
interface InteractionContextType {
  config: InteractionConfig;
  updateConfig: (updates: Partial<InteractionConfig>) => void;
  triggerHaptic: (pattern: string) => void;
  playSound: (type: string) => void;
  addParticle: (particle: Omit<Particle, "id" | "life" | "maxLife">) => void;
  particles: Particle[];
  gestureState: GestureState;
  interactions: InteractionEvent[];
  clearInteractions: () => void;
}

const InteractionContext = React.createContext<InteractionContextType | null>(
  null,
);

// Audio Context Manager
class AudioManager {
  private context: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private volume: number = 0.3;

  constructor() {
    if (typeof window !== "undefined" && "AudioContext" in window) {
      this.context = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
  }

  async loadSound(sound: AudioSound): Promise<void> {
    if (!this.context) return;

    try {
      const response = await fetch(sound.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.sounds.set(sound.id, audioBuffer);
    } catch (error) {
      console.warn(`Failed to load sound: ${sound.name}`, error);
    }
  }

  playSound(soundId: string, volume?: number): void {
    if (!this.context) return;

    const audioBuffer = this.sounds.get(soundId);
    if (!audioBuffer) return;

    const source = this.context.createBufferSource();
    const gainNode = this.context.createGain();

    source.buffer = audioBuffer;
    gainNode.gain.value = volume || this.volume;

    source.connect(gainNode);
    gainNode.connect(this.context.destination);

    source.start(0);
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  dispose(): void {
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    this.sounds.clear();
  }
}

// Haptic Feedback Manager
class HapticManager {
  private enabled: boolean = false;
  private intensity: number = 0.5;
  private patterns: HapticPattern[] = [];

  constructor(config: InteractionConfig["haptics"]) {
    this.enabled = config.enabled;
    this.intensity = config.intensity;
    this.patterns = config.patterns;
  }

  updateConfig(config: InteractionConfig["haptics"]): void {
    this.enabled = config.enabled;
    this.intensity = config.intensity;
    this.patterns = config.patterns;
  }

  triggerPattern(patternId: string): void {
    if (!this.enabled || !("vibrate" in navigator)) return;

    const pattern = this.patterns.find((p) => p.id === patternId);
    if (!pattern) return;

    const scaledPattern = pattern.pattern.map(
      (duration) => duration * this.intensity,
    );
    navigator.vibrate(scaledPattern);
  }

  triggerCustom(pattern: number[]): void {
    if (!this.enabled || !("vibrate" in navigator)) return;

    const scaledPattern = pattern.map((duration) => duration * this.intensity);
    navigator.vibrate(scaledPattern);
  }
}

// Particle System Manager
class ParticleSystemManager {
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private bounds: DOMRect = {
    top: 0,
    left: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
    width: window.innerWidth,
    height: window.innerHeight,
    x: 0,
    y: 0,
    toJSON: () => {},
  };

  constructor(private config: InteractionConfig["physics"]) {}

  addParticle(particle: Omit<Particle, "id" | "life" | "maxLife">): void {
    const newParticle: Particle = {
      ...particle,
      id: Math.random().toString(36).substr(2, 9),
      life: 1,
      maxLife: 1,
    };

    this.particles.push(newParticle);

    if (!this.animationId) {
      this.startAnimation();
    }
  }

  private startAnimation(): void {
    const animate = () => {
      this.updateParticles();
      this.renderParticles();

      if (this.particles.length > 0) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = null;
      }
    };

    animate();
  }

  private updateParticles(): void {
    this.particles = this.particles.filter((particle) => {
      // Apply physics
      particle.vy += this.config.gravity;
      particle.vx *= this.config.friction;
      particle.vy *= this.config.friction;

      particle.x += particle.vx;
      particle.y += particle.vy;

      // Bounce off walls
      if (particle.x <= 0 || particle.x >= this.bounds.width) {
        particle.vx *= -this.config.bounce;
        particle.x = Math.max(0, Math.min(this.bounds.width, particle.x));
      }

      if (particle.y >= this.bounds.height) {
        particle.vy *= -this.config.bounce;
        particle.y = this.bounds.height;
        particle.vx *= 0.9; // Additional friction on ground
      }

      // Update life
      particle.life -= 0.02;

      return particle.life > 0;
    });
  }

  private renderParticles(): void {
    // This would render particles to a canvas or DOM elements
    // For simplicity, we'll just update the particle array
  }

  getParticles(): Particle[] {
    return [...this.particles];
  }

  clear(): void {
    this.particles = [];
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  updateBounds(bounds: DOMRect): void {
    this.bounds = bounds;
  }

  dispose(): void {
    this.clear();
  }
}

// Gesture Recognition Manager
class GestureManager {
  private state: GestureState = {
    isActive: false,
    startPoint: { x: 0, y: 0 },
    currentPoint: { x: 0, y: 0 },
    startTime: 0,
    type: null,
    velocity: { x: 0, y: 0 },
  };

  private lastPoint: { x: number; y: number; time: number } = {
    x: 0,
    y: 0,
    time: 0,
  };
  private callbacks: Map<string, (event: InteractionEvent) => void> = new Map();

  constructor(private config: InteractionConfig["gestures"]) {}

  updateConfig(config: InteractionConfig["gestures"]): void {
    this.config = config;
  }

  onStart(point: { x: number; y: number }, timestamp: number): void {
    this.state = {
      isActive: true,
      startPoint: point,
      currentPoint: point,
      startTime: timestamp,
      type: null,
      velocity: { x: 0, y: 0 },
    };

    this.lastPoint = { ...point, time: timestamp };
  }

  onMove(
    point: { x: number; y: number },
    timestamp: number,
  ): InteractionEvent | null {
    if (!this.state.isActive) return null;

    this.state.currentPoint = point;

    // Calculate velocity
    const dt = timestamp - this.lastPoint.time;
    if (dt > 0) {
      this.state.velocity = {
        x: ((point.x - this.lastPoint.x) / dt) * 1000,
        y: ((point.y - this.lastPoint.y) / dt) * 1000,
      };
    }

    this.lastPoint = { ...point, time: timestamp };

    // Detect gesture type
    const deltaX = point.x - this.state.startPoint.x;
    const deltaY = point.y - this.state.startPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = timestamp - this.state.startTime;

    if (distance > this.config.swipeThreshold && !this.state.type) {
      this.state.type = "swipe";
      return this.createEvent("swipe", point, timestamp);
    }

    return null;
  }

  onEnd(
    point: { x: number; y: number },
    timestamp: number,
  ): InteractionEvent | null {
    if (!this.state.isActive) return null;

    const deltaX = point.x - this.state.startPoint.x;
    const deltaY = point.y - this.state.startPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = timestamp - this.state.startTime;

    let eventType: InteractionEvent["type"] | null = null;

    if (distance < this.config.tapThreshold) {
      if (duration >= this.config.longPressThreshold) {
        eventType = "longPress";
      } else {
        eventType = "tap";
      }
    } else if (this.state.type === "swipe") {
      eventType = "swipe";
    } else if (distance > this.config.tapThreshold) {
      eventType = "drag";
    }

    const event = eventType
      ? this.createEvent(eventType, point, timestamp)
      : null;

    // Reset state
    this.state = {
      isActive: false,
      startPoint: { x: 0, y: 0 },
      currentPoint: { x: 0, y: 0 },
      startTime: 0,
      type: null,
      velocity: { x: 0, y: 0 },
    };

    return event;
  }

  private createEvent(
    type: InteractionEvent["type"],
    point: { x: number; y: number },
    timestamp: number,
  ): InteractionEvent {
    return {
      type,
      target: document.body, // This would be the actual target element
      timestamp,
      coordinates: point,
      velocity: this.state.velocity,
      duration: timestamp - this.state.startTime,
    };
  }

  registerCallback(
    id: string,
    callback: (event: InteractionEvent) => void,
  ): void {
    this.callbacks.set(id, callback);
  }

  unregisterCallback(id: string): void {
    this.callbacks.delete(id);
  }

  getState(): GestureState {
    return { ...this.state };
  }
}

// Main Interaction Engine Component
export function InteractionEngine({ children }: { children: React.ReactNode }) {
  const { currentMode } = useUserExperienceMode();
  const { isLowPerformanceMode } = usePerformance();
  const accessibilityContext: any = useAccessibility();
  const accessibilityConfig = accessibilityContext?.config ?? accessibilityContext ?? {};
  const reducedMotion = Boolean(accessibilityConfig.reducedMotion);

  const [config, setConfig] = useState<InteractionConfig>(defaultConfig);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [interactions, setInteractions] = useState<InteractionEvent[]>([]);

  const audioManagerRef = useRef<AudioManager>();
  const hapticManagerRef = useRef<HapticManager>();
  const particleManagerRef = useRef<ParticleSystemManager>();
  const gestureManagerRef = useRef<GestureManager>();
  const animationFrameRef = useRef<number>();

  // Initialize managers
  useEffect(() => {
    audioManagerRef.current = new AudioManager();
    hapticManagerRef.current = new HapticManager(config.haptics);
    particleManagerRef.current = new ParticleSystemManager(config.physics);
    gestureManagerRef.current = new GestureManager(config.gestures);

    // Load audio files
    config.audio.sounds.forEach((sound) => {
      audioManagerRef.current?.loadSound(sound);
    });

    return () => {
      audioManagerRef.current?.dispose();
      particleManagerRef.current?.dispose();
    };
  }, []);

  // Update managers when config changes
  useEffect(() => {
    if (hapticManagerRef.current) {
      hapticManagerRef.current.updateConfig(config.haptics);
    }
    if (particleManagerRef.current) {
      particleManagerRef.current.updateBounds(
        document.body.getBoundingClientRect(),
      );
    }
    if (gestureManagerRef.current) {
      gestureManagerRef.current.updateConfig(config.gestures);
    }
    if (audioManagerRef.current) {
      audioManagerRef.current.setVolume(config.audio.volume);
    }
  }, [config]);

  // Adapt to user experience mode
  useEffect(() => {
    const updates: Partial<InteractionConfig> = {
      animations: {
        ...config.animations,
        enabled:
          currentMode.animations !== "minimal" &&
          !isLowPerformanceMode &&
          !reducedMotion,
        duration:
          currentMode.animations === "minimal"
            ? 150
            : currentMode.animations === "enhanced"
              ? 500
              : 300,
      },
      haptics: {
        ...config.haptics,
        enabled: currentMode.sounds && "vibrate" in navigator,
      },
      audio: {
        ...config.audio,
        enabled: currentMode.sounds && !isLowPerformanceMode,
      },
      physics: {
        ...config.physics,
        enabled: !isLowPerformanceMode,
      },
    };

    setConfig((prev) => ({ ...prev, ...updates }));
  }, [currentMode, isLowPerformanceMode, reducedMotion]);

  // Animation loop for particles
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const userAgent = String(navigator.userAgent || "");
      if (userAgent.toLowerCase().includes("jsdom")) return;
    }

    const animate = () => {
      if (particleManagerRef.current) {
        const nextParticles = particleManagerRef.current.getParticles();
        setParticles(nextParticles);

        if (nextParticles.length > 0) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
        return;
      }
    };

    if (config.physics.enabled && config.animations.enabled) {
      animate();
    }

    return () => {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [config.physics.enabled, config.animations.enabled]);

  // Global event listeners for gesture recognition
  useEffect(() => {
    if (!config.gestures.enabled) return;

    const handlePointerDown = (e: PointerEvent) => {
      gestureManagerRef.current?.onStart(
        { x: e.clientX, y: e.clientY },
        e.timeStamp,
      );
    };

    const handlePointerMove = (e: PointerEvent) => {
      const event = gestureManagerRef.current?.onMove(
        { x: e.clientX, y: e.clientY },
        e.timeStamp,
      );
      if (event) {
        setInteractions((prev) => [...prev, event]);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const event = gestureManagerRef.current?.onEnd(
        { x: e.clientX, y: e.clientY },
        e.timeStamp,
      );
      if (event) {
        setInteractions((prev) => [...prev, event]);

        // Trigger haptic feedback
        if (event.type === "tap") {
          triggerHaptic("tap");
        } else if (event.type === "swipe") {
          triggerHaptic("long-press");
        }

        // Play sound
        playSound(event.type);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [config.gestures.enabled]);

  const updateConfig = useCallback((updates: Partial<InteractionConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const triggerHaptic = useCallback((pattern: string) => {
    hapticManagerRef.current?.triggerPattern(pattern);
  }, []);

  const playSound = useCallback(
    (type: string) => {
      const sound = config.audio.sounds.find((s) => s.type === type);
      if (sound) {
        audioManagerRef.current?.playSound(sound.id, sound.volume);
      }
    },
    [config.audio.sounds],
  );

  const addParticle = useCallback(
    (particle: Omit<Particle, "id" | "life" | "maxLife">) => {
      particleManagerRef.current?.addParticle(particle);
    },
    [],
  );

  const clearInteractions = useCallback(() => {
    setInteractions([]);
    particleManagerRef.current?.clear();
  }, []);

  const contextValue: InteractionContextType = {
    config,
    updateConfig,
    triggerHaptic,
    playSound,
    addParticle,
    particles,
    gestureState: gestureManagerRef.current?.getState() || {
      isActive: false,
      startPoint: { x: 0, y: 0 },
      currentPoint: { x: 0, y: 0 },
      startTime: 0,
      type: null,
      velocity: { x: 0, y: 0 },
    },
    interactions,
    clearInteractions,
  } as InteractionContextType;

  return (
    <InteractionContext.Provider value={contextValue}>
      {children}
      <InteractionCanvas />
    </InteractionContext.Provider>
  );
}

// Canvas for particle rendering
function InteractionCanvas() {
  const { particles } = React.useContext(InteractionContext)!;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (typeof navigator !== "undefined") {
      const userAgent = String(navigator.userAgent || "");
      if (userAgent.toLowerCase().includes("jsdom")) return;
    }

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      return;
    }
    if (!ctx) return;

    let animationFrameId: number | null = null;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [particles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

// Hook for using interaction engine
export function useInteractionEngine() {
  const context = React.useContext(InteractionContext);
  if (!context) {
    throw new Error(
      "useInteractionEngine must be used within InteractionEngine",
    );
  }
  return context;
}

// Interactive Component HOC
export function withInteraction<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    haptic?: string;
    sound?: string;
    particles?: Omit<Particle, "id" | "life" | "maxLife">[];
  } = {},
) {
  return function InteractiveComponent(props: P) {
    const { triggerHaptic, playSound, addParticle } = useInteractionEngine();

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (options.haptic) {
          triggerHaptic(options.haptic);
        }
        if (options.sound) {
          playSound(options.sound);
        }
        if (options.particles) {
          options.particles.forEach((particle) => {
            addParticle({
              ...particle,
              x: e.clientX,
              y: e.clientY,
            });
          });
        }
      },
      [triggerHaptic, playSound, addParticle, options],
    );

    return <Component {...(props as P)} onClick={handleClick} />;
  };
}

// Gesture Handler Component
export function GestureHandler({
  children,
  onSwipe,
  onTap,
  onLongPress,
  onDrag,
}: {
  children: React.ReactNode;
  onSwipe?: (event: InteractionEvent) => void;
  onTap?: (event: InteractionEvent) => void;
  onLongPress?: (event: InteractionEvent) => void;
  onDrag?: (event: InteractionEvent) => void;
}) {
  const { interactions } = useInteractionEngine();
  const gestureManagerRef = useRef<GestureManager>();

  useEffect(() => {
    gestureManagerRef.current = new GestureManager({
      enabled: true,
      swipeThreshold: 50,
      tapThreshold: 10,
      longPressThreshold: 500,
    });

    return () => {
      gestureManagerRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    interactions.forEach((interaction) => {
      switch (interaction.type) {
        case "swipe":
          onSwipe?.(interaction);
          break;
        case "tap":
          onTap?.(interaction);
          break;
        case "longPress":
          onLongPress?.(interaction);
          break;
        case "drag":
          onDrag?.(interaction);
          break;
      }
    });
  }, [interactions, onSwipe, onTap, onLongPress, onDrag]);

  return <>{children}</>;
}

// Physics-based Animation Component
export function PhysicsAnimation({
  children,
  mass = 1,
  tension = 170,
  friction = 26,
  disabled = false,
}: {
  children:
    | React.ReactNode
    | ((args: { animate: (targetStyle: React.CSSProperties) => void }) => React.ReactNode);
  mass?: number;
  tension?: number;
  friction?: number;
  disabled?: boolean;
}) {
  const { config } = useInteractionEngine();
  const [style, setStyle] = React.useState<React.CSSProperties>({});

  const animate = useCallback(
    (targetStyle: React.CSSProperties) => {
      if (disabled || !config.animations.enabled) {
        setStyle(targetStyle);
        return;
      }

      // Spring physics animation
      const spring = {
        mass,
        tension,
        friction,
      };

      // Simplified spring animation - in production, use a proper physics library
      setStyle({
        ...targetStyle,
        transition: "all 200ms ease",
      });
    },
    [disabled, config.animations, mass, tension, friction],
  );

  return (
    <div style={style}>
      {typeof children === "function" ? children({ animate }) : children}
    </div>
  );
}

export default InteractionEngine;
