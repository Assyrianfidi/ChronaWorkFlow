/**
 * Advanced Interaction Engine
 * Smart micro-interactions, haptic-inspired feedback, and dynamic physics
 */

export interface InteractionConfig {
  type: 'hover' | 'click' | 'focus' | 'drag' | 'scroll' | 'swipe';
  element: HTMLElement;
  options: {
    hapticFeedback?: boolean;
    soundFeedback?: boolean;
    visualFeedback?: boolean;
    physics?: {
      mass?: number;
      friction?: number;
      spring?: number;
      damping?: number;
    };
    easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
    duration?: number;
    delay?: number;
  };
}

export interface HapticPattern {
  pattern: number[];
  intensity: number;
  duration: number;
}

export interface SoundProfile {
  type: 'click' | 'hover' | 'success' | 'error' | 'notification';
  frequency: number;
  duration: number;
  volume: number;
}

export class InteractionEngine {
  private activeInteractions: Map<string, InteractionConfig> = new Map();
  private physicsEngine: PhysicsEngine;
  private hapticEngine: HapticEngine;
  private soundEngine: SoundEngine;
  private animationFrame: number | null = null;

  constructor() {
    this.physicsEngine = new PhysicsEngine();
    this.hapticEngine = new HapticEngine();
    this.soundEngine = new SoundEngine();
    this.initializeGlobalListeners();
  }

  private initializeGlobalListeners(): void {
    // Global mouse move for parallax effects
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // Global scroll for smooth scroll acceleration
    document.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    
    // Global resize for responsive interactions
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  public registerInteraction(id: string, config: InteractionConfig): void {
    this.activeInteractions.set(id, config);
    this.setupInteractionListeners(id, config);
  }

  public unregisterInteraction(id: string): void {
    const config = this.activeInteractions.get(id);
    if (config) {
      this.removeInteractionListeners(id, config);
      this.activeInteractions.delete(id);
    }
  }

  private setupInteractionListeners(id: string, config: InteractionConfig): void {
    const { element, type, options } = config;

    switch (type) {
      case 'hover':
        element.addEventListener('mouseenter', () => this.handleHover(id, true));
        element.addEventListener('mouseleave', () => this.handleHover(id, false));
        break;
      case 'click':
        element.addEventListener('click', () => this.handleClick(id));
        break;
      case 'focus':
        element.addEventListener('focus', () => this.handleFocus(id, true));
        element.addEventListener('blur', () => this.handleFocus(id, false));
        break;
      case 'drag':
        element.addEventListener('dragstart', () => this.handleDragStart(id));
        element.addEventListener('drag', () => this.handleDrag(id));
        element.addEventListener('dragend', () => this.handleDragEnd(id));
        break;
    }
  }

  private removeInteractionListeners(id: string, config: InteractionConfig): void {
    const { element, type } = config;

    switch (type) {
      case 'hover':
        element.removeEventListener('mouseenter', () => this.handleHover(id, true));
        element.removeEventListener('mouseleave', () => this.handleHover(id, false));
        break;
      case 'click':
        element.removeEventListener('click', () => this.handleClick(id));
        break;
      case 'focus':
        element.removeEventListener('focus', () => this.handleFocus(id, true));
        element.removeEventListener('blur', () => this.handleFocus(id, false));
        break;
      case 'drag':
        element.removeEventListener('dragstart', () => this.handleDragStart(id));
        element.removeEventListener('drag', () => this.handleDrag(id));
        element.removeEventListener('dragend', () => this.handleDragEnd(id));
        break;
    }
  }

  private handleHover(id: string, isEntering: boolean): void {
    const config = this.activeInteractions.get(id);
    if (!config || !config.options.visualFeedback) return;

    const { element, options } = config;
    const duration = options.duration || 200;
    const easing = this.getEasingFunction(options.easing || 'ease-out');

    if (isEntering) {
      // Haptic feedback
      if (options.hapticFeedback) {
        this.hapticEngine.triggerPattern('hover');
      }

      // Sound feedback
      if (options.soundFeedback) {
        this.soundEngine.playSound('hover');
      }

      // Visual feedback with physics
      this.physicsEngine.animate(element, {
        scale: 1.05,
        opacity: 1,
        duration,
        easing
      });

      // Add glow effect
      element.classList.add('interaction-hover');
    } else {
      this.physicsEngine.animate(element, {
        scale: 1,
        opacity: 1,
        duration,
        easing
      });

      element.classList.remove('interaction-hover');
    }
  }

  private handleClick(id: string): void {
    const config = this.activeInteractions.get(id);
    if (!config) return;

    const { element, options } = config;

    // Haptic feedback
    if (options.hapticFeedback) {
      this.hapticEngine.triggerPattern('click');
    }

    // Sound feedback
    if (options.soundFeedback) {
      this.soundEngine.playSound('click');
    }

    // Visual feedback
    if (options.visualFeedback) {
      this.createRippleEffect(element);
      this.physicsEngine.animate(element, {
        scale: 0.95,
        duration: 100,
        easing: 'ease-out',
        onComplete: () => {
          this.physicsEngine.animate(element, {
            scale: 1,
            duration: 100,
            easing: 'ease-out'
          });
        }
      });
    }
  }

  private handleFocus(id: string, isFocused: boolean): void {
    const config = this.activeInteractions.get(id);
    if (!config || !config.options.visualFeedback) return;

    const { element } = config;

    if (isFocused) {
      element.classList.add('interaction-focused');
      this.createFocusRing(element);
    } else {
      element.classList.remove('interaction-focused');
      this.removeFocusRing(element);
    }
  }

  private handleDragStart(id: string): void {
    const config = this.activeInteractions.get(id);
    if (!config) return;

    const { element, options } = config;

    if (options.hapticFeedback) {
      this.hapticEngine.triggerPattern('drag_start');
    }

    element.classList.add('interaction-dragging');
    element.style.cursor = 'grabbing';
  }

  private handleDrag(id: string): void {
    const config = this.activeInteractions.get(id);
    if (!config) return;

    // Continuous haptic feedback for dragging
    if (config.options.hapticFeedback) {
      this.hapticEngine.triggerPattern('drag_continuous');
    }
  }

  private handleDragEnd(id: string): void {
    const config = this.activeInteractions.get(id);
    if (!config) return;

    const { element } = config;

    element.classList.remove('interaction-dragging');
    element.style.cursor = 'grab';

    if (config.options.hapticFeedback) {
      this.hapticEngine.triggerPattern('drag_end');
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    // Parallax effect for interactive elements
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    this.activeInteractions.forEach((config, id) => {
      if (config.options.visualFeedback && config.element.classList.contains('parallax-enabled')) {
        const rect = config.element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = (mouseX - centerX) / window.innerWidth;
        const deltaY = (mouseY - centerY) / window.innerHeight;
        
        const maxRotation = 5; // degrees
        const rotateX = deltaY * maxRotation;
        const rotateY = deltaX * maxRotation;
        
        this.physicsEngine.animate(config.element, {
          rotateX,
          rotateY,
          duration: 100,
          easing: 'ease-out'
        });
      }
    });
  }

  private handleScroll(e: Event): void {
    // Smooth scroll acceleration
    const scrollY = window.scrollY;
    const scrollSpeed = Math.abs(e.deltaY || 0);

    if (scrollSpeed > 0) {
      // Apply smooth scroll physics
      this.physicsEngine.applyScrollPhysics(scrollY, scrollSpeed);
    }
  }

  private handleResize(): void {
    // Recalculate positions for responsive interactions
    this.activeInteractions.forEach((config) => {
      if (config.options.visualFeedback) {
        this.physicsEngine.recalculateBounds(config.element);
      }
    });
  }

  private createRippleEffect(element: HTMLElement): void {
    const ripple = document.createElement('div');
    ripple.className = 'interaction-ripple';
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.transform = 'translate(-50%, -50%)';
    
    element.appendChild(ripple);
    
    // Animate ripple
    this.physicsEngine.animate(ripple, {
      scale: 0,
      opacity: 0.6,
      duration: 0
    });
    
    this.physicsEngine.animate(ripple, {
      scale: 2,
      opacity: 0,
      duration: 600,
      easing: 'ease-out',
      onComplete: () => {
        ripple.remove();
      }
    });
  }

  private createFocusRing(element: HTMLElement): void {
    const focusRing = document.createElement('div');
    focusRing.className = 'interaction-focus-ring';
    
    const rect = element.getBoundingClientRect();
    focusRing.style.width = `${rect.width + 8}px`;
    focusRing.style.height = `${rect.height + 8}px`;
    focusRing.style.left = '-4px';
    focusRing.style.top = '-4px';
    
    element.appendChild(focusRing);
    
    this.physicsEngine.animate(focusRing, {
      scale: 0.8,
      opacity: 0,
      duration: 0
    });
    
    this.physicsEngine.animate(focusRing, {
      scale: 1,
      opacity: 1,
      duration: 200,
      easing: 'ease-out'
    });
  }

  private removeFocusRing(element: HTMLElement): void {
    const focusRing = element.querySelector('.interaction-focus-ring');
    if (focusRing) {
      this.physicsEngine.animate(focusRing, {
        scale: 1.2,
        opacity: 0,
        duration: 200,
        easing: 'ease-in',
        onComplete: () => {
          focusRing.remove();
        }
      });
    }
  }

  private getEasingFunction(type: string): string {
    const easingMap = {
      linear: 'linear',
      ease: 'ease',
      'ease-in': 'ease-in',
      'ease-out': 'ease-out',
      'ease-in-out': 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    };
    return easingMap[type as keyof typeof easingMap] || 'ease-out';
  }

  public destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.activeInteractions.forEach((config, id) => {
      this.unregisterInteraction(id);
    });
    
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('scroll', this.handleScroll.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this));
  }
}

// Physics Engine for smooth animations
class PhysicsEngine {
  private animations: Map<HTMLElement, AnimationState> = new Map();

  public animate(element: HTMLElement, properties: AnimationProperties): void {
    const state: AnimationState = {
      element,
      properties: { ...properties },
      startTime: performance.now(),
      startValues: this.getCurrentValues(element),
      isAnimating: true
    };

    this.animations.set(element, state);
    this.startAnimationLoop();
  }

  public applyScrollPhysics(scrollY: number, scrollSpeed: number): void {
    // Apply smooth scroll deceleration
    const targetScrollY = scrollY + scrollSpeed * 0.5;
    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  }

  public recalculateBounds(element: HTMLElement): void {
    // Recalculate element bounds for responsive interactions
    const rect = element.getBoundingClientRect();
    // Update any cached position data
  }

  private getCurrentValues(element: HTMLElement): Record<string, number> {
    const style = window.getComputedStyle(element);
    const transform = style.transform;
    
    return {
      scale: this.extractScale(transform),
      rotateX: this.extractRotation(transform, 'X'),
      rotateY: this.extractRotation(transform, 'Y'),
      opacity: parseFloat(style.opacity) || 1
    };
  }

  private extractScale(transform: string): number {
    const match = transform.match(/scale\(([\d.]+)\)/);
    return match ? parseFloat(match[1]) : 1;
  }

  private extractRotation(transform: string, axis: 'X' | 'Y'): number {
    const match = transform.match(/rotate([XY])\(([-\d.]+)deg\)/);
    if (match && match[1] === axis) {
      return parseFloat(match[2]);
    }
    return 0;
  }

  private startAnimationLoop(): void {
    if (this.animations.size === 0) return;

    const animate = (currentTime: number) => {
      this.animations.forEach((state, element) => {
        if (!state.isAnimating) return;

        const elapsed = currentTime - state.startTime;
        const progress = Math.min(elapsed / (state.properties.duration || 200), 1);
        
        const easedProgress = this.applyEasing(progress, state.properties.easing || 'ease-out');
        
        this.updateElementProperties(element, state, easedProgress);
        
        if (progress >= 1) {
          state.isAnimating = false;
          this.animations.delete(element);
          
          if (state.properties.onComplete) {
            state.properties.onComplete();
          }
        }
      });

      if (this.animations.size > 0) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  private updateElementProperties(element: HTMLElement, state: AnimationState, progress: number): void {
    const { properties, startValues } = state;
    const currentTransform = element.style.transform || '';
    
    let newTransform = currentTransform;
    
    if (properties.scale !== undefined) {
      const scale = startValues.scale + (properties.scale - startValues.scale) * progress;
      newTransform = this.updateTransformValue(newTransform, 'scale', scale);
    }
    
    if (properties.rotateX !== undefined) {
      const rotateX = startValues.rotateX + (properties.rotateX - startValues.rotateX) * progress;
      newTransform = this.updateTransformValue(newTransform, 'rotateX', rotateX);
    }
    
    if (properties.rotateY !== undefined) {
      const rotateY = startValues.rotateY + (properties.rotateY - startValues.rotateY) * progress;
      newTransform = this.updateTransformValue(newTransform, 'rotateY', rotateY);
    }
    
    element.style.transform = newTransform;
    
    if (properties.opacity !== undefined) {
      element.style.opacity = String(startValues.opacity + (properties.opacity - startValues.opacity) * progress);
    }
  }

  private updateTransformValue(transform: string, property: string, value: number): string {
    const regex = new RegExp(`${property}\\([^)]+\\)`, 'g');
    const newValue = `${property}(${value}deg)`;
    
    if (property === 'scale') {
      return regex.test(transform) 
        ? transform.replace(regex, newValue.replace('deg', ''))
        : `${transform} ${newValue.replace('deg', '')}`.trim();
    }
    
    return regex.test(transform)
      ? transform.replace(regex, newValue)
      : `${transform} ${newValue}`.trim();
  }

  private applyEasing(progress: number, easing: string): number {
    switch (easing) {
      case 'linear':
        return progress;
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return 1 - Math.pow(1 - progress, 2);
      case 'ease-in-out':
        return progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case 'bounce':
        if (progress < 0.5) {
          return 8 * progress * progress * progress * progress;
        } else {
          return 1 - Math.pow(-2 * progress + 2, 3) / 2;
        }
      case 'elastic':
        return progress === 0 || progress === 1
          ? progress
          : -Math.pow(2, 10 * progress - 10) * Math.sin((progress * 10 - 10.75) * (2 * Math.PI) / 3);
      default:
        return progress;
    }
  }
}

// Haptic Engine for touch feedback
class HapticEngine {
  private patterns: Map<string, HapticPattern> = new Map();

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    this.patterns.set('hover', {
      pattern: [10],
      intensity: 0.3,
      duration: 10
    });

    this.patterns.set('click', {
      pattern: [50],
      intensity: 0.5,
      duration: 50
    });

    this.patterns.set('drag_start', {
      pattern: [100],
      intensity: 0.7,
      duration: 100
    });

    this.patterns.set('drag_continuous', {
      pattern: [20],
      intensity: 0.2,
      duration: 20
    });

    this.patterns.set('drag_end', {
      pattern: [80],
      intensity: 0.6,
      duration: 80
    });
  }

  public triggerPattern(patternName: string): void {
    if (!('vibrate' in navigator)) return;

    const pattern = this.patterns.get(patternName);
    if (pattern) {
      navigator.vibrate(pattern.pattern);
    }
  }
}

// Sound Engine for audio feedback
class SoundEngine {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, SoundProfile> = new Map();

  constructor() {
    this.initializeAudio();
    this.initializeSounds();
  }

  private initializeAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported');
    }
  }

  private initializeSounds(): void {
    this.sounds.set('hover', {
      type: 'hover',
      frequency: 800,
      duration: 50,
      volume: 0.1
    });

    this.sounds.set('click', {
      type: 'click',
      frequency: 1000,
      duration: 100,
      volume: 0.2
    });

    this.sounds.set('success', {
      type: 'success',
      frequency: 1200,
      duration: 200,
      volume: 0.3
    });

    this.sounds.set('error', {
      type: 'error',
      frequency: 300,
      duration: 200,
      volume: 0.3
    });

    this.sounds.set('notification', {
      type: 'notification',
      frequency: 600,
      duration: 150,
      volume: 0.25
    });
  }

  public playSound(soundName: string): void {
    if (!this.audioContext) return;

    const sound = this.sounds.get(soundName);
    if (!sound) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = sound.frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(sound.volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration / 1000);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + sound.duration / 1000);
  }
}

// TypeScript interfaces
interface AnimationProperties {
  scale?: number;
  rotateX?: number;
  rotateY?: number;
  opacity?: number;
  duration?: number;
  easing?: string;
  onComplete?: () => void;
}

interface AnimationState {
  element: HTMLElement;
  properties: AnimationProperties;
  startTime: number;
  startValues: Record<string, number>;
  isAnimating: boolean;
}

export default InteractionEngine;
