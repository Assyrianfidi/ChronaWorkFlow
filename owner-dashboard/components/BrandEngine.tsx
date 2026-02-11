/**
 * Brand & White-Label Engine
 * Multi-tenant branding with safe rollout capabilities
 * 
 * Features:
 * - Brand entity with name, logo, colors, domains
 * - Active brand switch without restart
 * - White-label toggle per tenant
 * - Brand preview mode with canary rollout
 * - Instant rollback capability
 * - No schema coupling to brand name
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

// Brand Configuration
export interface BrandConfig {
  id: string;
  name: string;
  shortName: string;
  tagline?: string;
  
  // Visual Assets
  logo: {
    light: string;  // URL or SVG
    dark: string;
    favicon: string;
  };
  
  // Colors
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  
  // Typography
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  
  // Domains
  domains: {
    app: string;
    api: string;
    docs: string;
    status: string;
  };
  
  // Email Templates
  email: {
    fromName: string;
    fromAddress: string;
    replyTo: string;
    signature: string;
  };
  
  // Legal
  legal: {
    companyName: string;
    copyright: string;
    termsUrl: string;
    privacyUrl: string;
    supportUrl: string;
  };
  
  // White-label options
  whiteLabel: {
    enabled: boolean;
    showPoweredBy: boolean;
    customCss?: string;
    hideAccuBooksBranding: boolean;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  rolloutPercentage: number; // 0-100 for canary
  isDefault: boolean;
  isActive: boolean;
}

// Default AccuBooks Brand (Legacy - preserved for rollback)
export const defaultBrand: BrandConfig = {
  id: 'accubooks-default',
  name: 'AccuBooks Enterprise',
  shortName: 'AccuBooks',
  tagline: 'Enterprise Accounting That Scales',
  
  logo: {
    light: '/branding/accubooks-logo-light.svg',
    dark: '/branding/accubooks-logo-dark.svg',
    favicon: '/branding/accubooks-favicon.ico',
  },
  
  colors: {
    primary: '#2563EB',
    secondary: '#7C3AED',
    accent: '#06B6D4',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    textMuted: '#64748B',
  },
  
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  
  domains: {
    app: 'app.accubooks.io',
    api: 'api.accubooks.io',
    docs: 'docs.accubooks.io',
    status: 'status.accubooks.io',
  },
  
  email: {
    fromName: 'AccuBooks',
    fromAddress: 'noreply@accubooks.io',
    replyTo: 'support@accubooks.io',
    signature: 'The AccuBooks Team',
  },
  
  legal: {
    companyName: 'AccuBooks Inc.',
    copyright: `© ${new Date().getFullYear()} AccuBooks Inc.`,
    termsUrl: 'https://accubooks.io/terms',
    privacyUrl: 'https://accubooks.io/privacy',
    supportUrl: 'https://support.accubooks.io',
  },
  
  whiteLabel: {
    enabled: false,
    showPoweredBy: true,
    hideAccuBooksBranding: false,
  },
  
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
  createdBy: 'system',
  rolloutPercentage: 100,
  isDefault: true,
  isActive: true,
};

export const chronaWorkFlowBrand: BrandConfig = {
  id: 'chronaworkflow-active',
  name: 'ChronaWorkFlow',
  shortName: 'ChronaWorkFlow',
  tagline: 'Enterprise Workflow Automation',
  
  logo: {
    light: 'C:\FidiMyProjects2025\Software_Projects\AccuBooks\ChronaWorkFlow-LOGO\chronaworkflow-logo-1-removebg.png',
    dark: 'C:\FidiMyProjects2025\Software_Projects\AccuBooks\ChronaWorkFlow-LOGO\chronaworkflow-logo-1-removebg.png',
    favicon: '/branding/chronaworkflow-favicon.ico',
  },
  
  colors: {
    primary: '#2563EB',
    secondary: '#7C3AED',
    accent: '#06B6D4',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    textMuted: '#64748B',
  },
  
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  
  domains: {
    app: 'app.chronaworkflow.io',
    api: 'api.chronaworkflow.io',
    docs: 'docs.chronaworkflow.io',
    status: 'status.chronaworkflow.io',
  },
  
  email: {
    fromName: 'ChronaWorkFlow',
    fromAddress: 'noreply@chronaworkflow.io',
    replyTo: 'support@chronaworkflow.io',
    signature: 'The ChronaWorkFlow Team',
  },
  
  legal: {
    companyName: 'ChronaWorkFlow Inc.',
    copyright: `© ${new Date().getFullYear()} ChronaWorkFlow Inc.`,
    termsUrl: 'https://chronaworkflow.io/terms',
    privacyUrl: 'https://chronaworkflow.io/privacy',
    supportUrl: 'https://support.chronaworkflow.io',
  },
  
  whiteLabel: {
    enabled: false,
    showPoweredBy: true,
    hideAccuBooksBranding: true, // Hide old branding
  },
  
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'system',
  rolloutPercentage: 0, // Start at 0%, controlled by feature flag
  isDefault: false,
  isActive: true,
};

// Brand Context
interface BrandContextType {
  currentBrand: BrandConfig;
  availableBrands: BrandConfig[];
  isPreviewMode: boolean;
  previewBrand: BrandConfig | null;
  
  // Actions
  switchBrand: (brandId: string) => void;
  enterPreviewBrand: (brandId: string) => void;
  exitPreview: () => void;
  applyPreview: () => Promise<void>;
  
  // Rollout
  updateRolloutPercentage: (brandId: string, percentage: number) => void;
  rollbackBrand: (brandId: string) => void;
  
  // White-label
  toggleWhiteLabel: (enabled: boolean) => void;
  updateWhiteLabelConfig: (config: Partial<BrandConfig['whiteLabel']>) => void;
}

const BrandContext = createContext<BrandContextType | null>(null);

// Brand Provider
export const BrandProvider: React.FC<{
  children: React.ReactNode;
  initialBrand?: BrandConfig;
  availableBrands?: BrandConfig[];
}> = ({ 
  children, 
  initialBrand = defaultBrand,
  availableBrands: initialBrands = [defaultBrand, chronaWorkFlowBrand]
}) => {
  const [currentBrand, setCurrentBrand] = useState<BrandConfig>(initialBrand);
  const [availableBrands, setAvailableBrands] = useState<BrandConfig[]>(initialBrands);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewBrandState, setPreviewBrandState] = useState<BrandConfig | null>(null);

  // Apply brand CSS variables
  const applyBrandStyles = useCallback((brand: BrandConfig) => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    // Apply color variables
    Object.entries(brand.colors).forEach(([key, value]) => {
      root.style.setProperty(`--brand-${key}`, value);
    });
    
    // Apply font variables
    root.style.setProperty('--brand-font-heading', brand.fonts.heading);
    root.style.setProperty('--brand-font-body', brand.fonts.body);
    root.style.setProperty('--brand-font-mono', brand.fonts.mono);
    
    // Set data attributes for conditional styling
    root.setAttribute('data-brand-id', brand.id);
    root.setAttribute('data-white-label', brand.whiteLabel.enabled ? 'true' : 'false');
    
    // Apply custom CSS if white-label enabled
    if (brand.whiteLabel.enabled && brand.whiteLabel.customCss) {
      let styleEl = document.getElementById('brand-custom-css');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'brand-custom-css';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = brand.whiteLabel.customCss;
    }
  }, []);

  // Switch to a different brand
  const switchBrand = useCallback((brandId: string) => {
    const brand = availableBrands.find(b => b.id === brandId);
    if (brand && brand.isActive) {
      setCurrentBrand(brand);
      applyBrandStyles(brand);
      
      // Persist preference
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('accubooks-brand-id', brandId);
      }
    }
  }, [availableBrands, applyBrandStyles]);

  // Preview a brand without committing
  const enterPreviewBrand = useCallback((brandId: string) => {
    const brand = availableBrands.find(b => b.id === brandId);
    if (brand) {
      setPreviewBrandState(brand);
      setIsPreviewMode(true);
      applyBrandStyles(brand);
    }
  }, [availableBrands, applyBrandStyles]);

  // Exit preview mode
  const exitPreview = useCallback(() => {
    setIsPreviewMode(false);
    setPreviewBrandState(null);
    applyBrandStyles(currentBrand);
  }, [currentBrand, applyBrandStyles]);

  // Apply preview changes
  const applyPreview = useCallback(async () => {
    if (!previewBrandState) return;
    
    // Simulate API call for brand rollout
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCurrentBrand(previewBrandState);
    setIsPreviewMode(false);
    setPreviewBrandState(null);
    
    // Update available brands
    setAvailableBrands(prev => 
      prev.map(b => b.id === previewBrandState.id ? previewBrandState : b)
    );
    
    // Persist
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('accubooks-brand-id', previewBrandState.id);
    }
  }, [previewBrandState]);

  // Update rollout percentage (canary)
  const updateRolloutPercentage = useCallback((brandId: string, percentage: number) => {
    setAvailableBrands(prev =>
      prev.map(b =>
        b.id === brandId ? { ...b, rolloutPercentage: Math.max(0, Math.min(100, percentage)) } : b
      )
    );
  }, []);

  // Rollback brand to default
  const rollbackBrand = useCallback((brandId: string) => {
    const defaultBr = availableBrands.find(b => b.isDefault);
    if (defaultBr) {
      switchBrand(defaultBr.id);
      
      // Deactivate the rolled back brand
      setAvailableBrands(prev =>
        prev.map(b =>
          b.id === brandId ? { ...b, isActive: false, rolloutPercentage: 0 } : b
        )
      );
    }
  }, [availableBrands, switchBrand]);

  // Toggle white-label mode
  const toggleWhiteLabel = useCallback((enabled: boolean) => {
    const updated = { ...currentBrand, whiteLabel: { ...currentBrand.whiteLabel, enabled: enabled } };
    setCurrentBrand(updated);
    applyBrandStyles(updated);
  }, [currentBrand, applyBrandStyles]);

  // Update white-label config
  const updateWhiteLabelConfig = useCallback((config: Partial<BrandConfig['whiteLabel']>) => {
    const updated = {
      ...currentBrand,
      whiteLabel: { ...currentBrand.whiteLabel, ...config }
    };
    setCurrentBrand(updated);
    applyBrandStyles(updated);
  }, [currentBrand, applyBrandStyles]);

  // Restore saved brand on mount
  React.useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const savedBrandId = localStorage.getItem('accubooks-brand-id');
      if (savedBrandId && savedBrandId !== currentBrand.id) {
        const savedBrand = availableBrands.find(b => b.id === savedBrandId);
        if (savedBrand?.isActive) {
          setCurrentBrand(savedBrand);
          applyBrandStyles(savedBrand);
        }
      }
    }
  }, []);

  return (
    <BrandContext.Provider
      value={{
        currentBrand,
        availableBrands,
        isPreviewMode,
        previewBrand: previewBrandState,
        switchBrand,
        enterPreviewBrand,
        exitPreview,
        applyPreview,
        updateRolloutPercentage,
        rollbackBrand,
        toggleWhiteLabel,
        updateWhiteLabelConfig,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
};

// Hook to use brand context
export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}

// Brand Logo Component
export const BrandLogo: React.FC<{
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ variant = 'light', size = 'md', className = '' }) => {
  const { currentBrand, isPreviewMode, previewBrand } = useBrand();
  const brand = isPreviewMode && previewBrand ? previewBrand : currentBrand;
  
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
  };
  
  return (
    <img
      src={variant === 'dark' ? brand.logo.dark : brand.logo.light}
      alt={brand.name}
      className={`${sizeClasses[size]} w-auto object-contain ${className}`}
      onError={(e) => {
        // Fallback to text logo
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  );
};

// Brand Text Logo (fallback)
export const BrandTextLogo: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}> = ({ size = 'md', showTagline = false, className = '' }) => {
  const { currentBrand, isPreviewMode, previewBrand } = useBrand();
  const brand = isPreviewMode && previewBrand ? previewBrand : currentBrand;
  
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };
  
  return (
    <div className={`flex flex-col ${className}`}>
      <span 
        className={`font-bold ${sizeClasses[size]}`}
        style={{ color: brand.colors.primary, fontFamily: brand.fonts.heading }}
      >
        {brand.shortName}
      </span>
      {showTagline && brand.tagline && (
        <span 
          className="text-sm text-slate-500"
          style={{ fontFamily: brand.fonts.body }}
        >
          {brand.tagline}
        </span>
      )}
    </div>
  );
};

// Powered By Footer (respects white-label settings)
export const PoweredBy: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { currentBrand } = useBrand();
  
  if (!currentBrand.whiteLabel.showPoweredBy) {
    return null;
  }
  
  return (
    <div className={`text-xs text-slate-400 ${className}`}>
      Powered by{' '}
      <a 
        href="https://accubooks.io" 
        target="_blank" 
        rel="noopener noreferrer"
        className="font-medium hover:text-slate-600 transition-colors"
      >
        AccuBooks Enterprise
      </a>
    </div>
  );
};

// Brand Preview Banner
export const BrandPreviewBanner: React.FC = () => {
  const { isPreviewMode, previewBrand, exitPreview, applyPreview } = useBrand();
  
  if (!isPreviewMode || !previewBrand) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-purple-600 text-white px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Preview Mode:</span>
          <span>Viewing &ldquo;{previewBrand.name}&rdquo; brand</span>
          <span className="px-2 py-0.5 bg-purple-700 rounded text-xs">
            {previewBrand.rolloutPercentage}% rollout
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exitPreview}
            className="px-3 py-1 bg-purple-700 hover:bg-purple-800 rounded text-sm transition-colors"
          >
            Exit Preview
          </button>
          <button
            onClick={applyPreview}
            className="px-3 py-1 bg-white text-purple-600 hover:bg-purple-50 rounded text-sm font-medium transition-colors"
          >
            Apply Brand
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandProvider;
