/**
 * Ultra-Advanced Glassmorphism v2.0 System
 * Multi-layer glass effects with depth, lighting, and motion optimization
 */

export interface GlassmorphismConfig {
  blur: number;
  opacity: number;
  borderOpacity: number;
  shadowIntensity: number;
  depth: 'shallow' | 'medium' | 'deep';
  reflectivity: number;
  lighting: {
    direction: number;
    intensity: number;
    color: string;
  };
}

export interface DepthTier {
  elevation: number;
  shadow: string;
  glow: string;
  scale: number;
}

export const DEPTH_TIERS: Record<'shallow' | 'medium' | 'deep', DepthTier> = {
  shallow: {
    elevation: 2,
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    glow: '0 0 0 rgba(0, 0, 0, 0)',
    scale: 1
  },
  medium: {
    elevation: 8,
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    glow: '0 0 20px rgba(59, 130, 246, 0.15)',
    scale: 1.02
  },
  deep: {
    elevation: 16,
    shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    glow: '0 0 40px rgba(59, 130, 246, 0.25)',
    scale: 1.04
  }
};

export const GLASSMORPHISM_PRESETS: Record<string, GlassmorphismConfig> = {
  glass: {
    blur: 12,
    opacity: 0.1,
    borderOpacity: 0.2,
    shadowIntensity: 0.1,
    depth: 'medium',
    reflectivity: 0.3,
    lighting: {
      direction: 135,
      intensity: 0.5,
      color: 'rgba(255, 255, 255, 0.4)'
    }
  },
  glassDark: {
    blur: 16,
    opacity: 0.15,
    borderOpacity: 0.3,
    shadowIntensity: 0.2,
    depth: 'deep',
    reflectivity: 0.4,
    lighting: {
      direction: 225,
      intensity: 0.6,
      color: 'rgba(255, 255, 255, 0.2)'
    }
  },
  crystal: {
    blur: 8,
    opacity: 0.05,
    borderOpacity: 0.15,
    shadowIntensity: 0.05,
    depth: 'shallow',
    reflectivity: 0.6,
    lighting: {
      direction: 45,
      intensity: 0.8,
      color: 'rgba(255, 255, 255, 0.6)'
    }
  },
  stealth: {
    blur: 4,
    opacity: 0.03,
    borderOpacity: 0.08,
    shadowIntensity: 0.02,
    depth: 'shallow',
    reflectivity: 0.1,
    lighting: {
      direction: 180,
      intensity: 0.2,
      color: 'rgba(255, 255, 255, 0.1)'
    }
  }
};

export const generateGlassmorphismCSS = (config: GlassmorphismConfig): string => {
  const tier = DEPTH_TIERS[config.depth];
  const lightingGradient = `linear-gradient(${config.lighting.direction}deg, ${config.lighting.color} 0%, transparent 100%)`;
  
  return `
    background: rgba(255, 255, 255, ${config.opacity});
    backdrop-filter: blur(${config.blur}px);
    -webkit-backdrop-filter: blur(${config.blur}px);
    border: 1px solid rgba(255, 255, 255, ${config.borderOpacity});
    box-shadow: ${tier.shadow};
    transform: scale(${tier.scale});
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${lightingGradient};
      border-radius: inherit;
      opacity: ${config.lighting.intensity};
      pointer-events: none;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent 30%,
        rgba(255, 255, 255, ${config.reflectivity}) 50%,
        transparent 70%
      );
      border-radius: inherit;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    &:hover::after {
      opacity: 1;
    }
  `;
};

export const MOTION_PROFILES = {
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  instant: 'cubic-bezier(0, 0, 0.1, 1)'
};

export const PARALLAX_LAYERS = {
  background: {
    speed: 0.2,
    blur: 20,
    opacity: 0.05
  },
  midground: {
    speed: 0.5,
    blur: 12,
    opacity: 0.1
  },
  foreground: {
    speed: 1,
    blur: 6,
    opacity: 0.15
  },
  interactive: {
    speed: 1.5,
    blur: 2,
    opacity: 0.2
  }
};

export const createParallaxEffect = (layer: keyof typeof PARALLAX_LAYERS) => {
  const config = PARALLAX_LAYERS[layer];
  return `
    transform: translate3d(0, 0, ${layer === 'background' ? -100 : layer === 'midground' ? -50 : layer === 'foreground' ? 0 : 50}px);
    filter: blur(${config.blur}px);
    opacity: ${config.opacity};
    will-change: transform;
  `;
};
