/**
 * ThemeCustomizer Component
 * Customer-facing theme customization panel
 */

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import Label from '@/components/ui/Label';
import Input from '@/components/ui/Input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Palette,
  Type,
  Layout,
  PanelLeft,
  Check,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BORDER_RADIUS_OPTIONS,
  DENSITY_OPTIONS,
  FONT_SIZE_OPTIONS,
  SIDEBAR_STYLE_OPTIONS,
  SHADOW_OPTIONS,
  PRESET_THEMES,
} from '@/config/theme.config';

// ============================================================================
// COLOR PICKER COMPONENT
// ============================================================================

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex items-center justify-between py-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border-0 p-0"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 h-8 text-xs"
        />
      </div>
    </div>
  );
};

// ============================================================================
// THEME PREVIEW CARD
// ============================================================================

interface ThemePreviewCardProps {
  theme: typeof PRESET_THEMES[0];
  isActive: boolean;
  onClick: () => void;
}

const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({
  theme,
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full text-left rounded-lg border-2 p-3 transition-all',
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      )}
    >
      <div
        className="h-16 rounded-md mb-2"
        style={{ background: theme.preview }}
      />
      <div className="font-medium text-sm">{theme.name}</div>
      <div className="text-xs text-muted-foreground">{theme.description}</div>
      {isActive && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
      {theme.isCustom && (
        <Badge variant="secondary" className="absolute bottom-2 right-2 text-[10px]">
          Custom
        </Badge>
      )}
    </button>
  );
};

// ============================================================================
// MAIN THEME CUSTOMIZER COMPONENT
// ============================================================================

export const ThemeCustomizer: React.FC = () => {
  const {
    currentTheme,
    presetThemes,
    customThemes,
    applyPresetTheme,
    updateThemeColors,
    updateThemeTypography,
    updateThemeLayout,
    updateThemeSidebar,
    createCustomTheme,
    deleteCustomTheme,
    resetToDefault,
  } = useTheme();

  const [activeTab, setActiveTab] = useState('presets');
  const [newThemeName, setNewThemeName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Combine preset and custom themes
  const allThemes = [...presetThemes, ...customThemes];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Customize Theme</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Theme Customizer
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6 pb-2">
            <TabsTrigger value="presets" className="gap-2">
              <Palette className="h-4 w-4" />
              Presets
            </TabsTrigger>
            <TabsTrigger value="colors" className="gap-2">
              <PanelLeft className="h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="typography" className="gap-2">
              <Type className="h-4 w-4" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="layout" className="gap-2">
              <Layout className="h-4 w-4" />
              Layout
            </TabsTrigger>
          </TabsList>

          {/* PRESETS TAB */}
          <TabsContent value="presets" className="px-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Choose a Theme</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateDialog(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Custom
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-2 gap-4 pr-4">
                  {allThemes.map((theme) => (
                    <ThemePreviewCard
                      key={theme.id}
                      theme={theme}
                      isActive={currentTheme.id === theme.id}
                      onClick={() => applyPresetTheme(theme.id)}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Create Custom Theme Dialog */}
              {showCreateDialog && (
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">Create Custom Theme</h4>
                  <div className="space-y-2">
                    <Label>Theme Name</Label>
                    <Input
                      value={newThemeName}
                      onChange={(e) => setNewThemeName(e.target.value)}
                      placeholder="My Custom Theme"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (newThemeName) {
                          createCustomTheme(newThemeName, currentTheme.id);
                          setNewThemeName('');
                          setShowCreateDialog(false);
                        }
                      }}
                      disabled={!newThemeName}
                    >
                      Create
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateDialog(false);
                        setNewThemeName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Custom Themes Management */}
              {customThemes.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-3">Your Custom Themes</h3>
                    <div className="space-y-2">
                      {customThemes.map((theme) => (
                        <div
                          key={theme.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded"
                              style={{ background: theme.preview }}
                            />
                            <span className="font-medium">{theme.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => deleteCustomTheme(theme.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* COLORS TAB */}
          <TabsContent value="colors" className="px-6 py-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-6 pr-4">
                {/* Primary Colors */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Primary Colors</h3>
                  <div className="space-y-1 border rounded-lg p-4">
                    <ColorPicker
                      label="Primary"
                      value={currentTheme.colors.primary}
                      onChange={(v) => updateThemeColors({ primary: v })}
                    />
                    <ColorPicker
                      label="Primary Foreground"
                      value={currentTheme.colors.primaryForeground}
                      onChange={(v) => updateThemeColors({ primaryForeground: v })}
                    />
                    <ColorPicker
                      label="Secondary"
                      value={currentTheme.colors.secondary}
                      onChange={(v) => updateThemeColors({ secondary: v })}
                    />
                    <ColorPicker
                      label="Secondary Foreground"
                      value={currentTheme.colors.secondaryForeground}
                      onChange={(v) => updateThemeColors({ secondaryForeground: v })}
                    />
                  </div>
                </div>

                {/* Background Colors */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Background</h3>
                  <div className="space-y-1 border rounded-lg p-4">
                    <ColorPicker
                      label="Background"
                      value={currentTheme.colors.background}
                      onChange={(v) => updateThemeColors({ background: v })}
                    />
                    <ColorPicker
                      label="Foreground"
                      value={currentTheme.colors.foreground}
                      onChange={(v) => updateThemeColors({ foreground: v })}
                    />
                    <ColorPicker
                      label="Card"
                      value={currentTheme.colors.card}
                      onChange={(v) => updateThemeColors({ card: v })}
                    />
                    <ColorPicker
                      label="Card Foreground"
                      value={currentTheme.colors.cardForeground}
                      onChange={(v) => updateThemeColors({ cardForeground: v })}
                    />
                  </div>
                </div>

                {/* Accent & Border */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Accent & Border</h3>
                  <div className="space-y-1 border rounded-lg p-4">
                    <ColorPicker
                      label="Accent"
                      value={currentTheme.colors.accent}
                      onChange={(v) => updateThemeColors({ accent: v })}
                    />
                    <ColorPicker
                      label="Accent Foreground"
                      value={currentTheme.colors.accentForeground}
                      onChange={(v) => updateThemeColors({ accentForeground: v })}
                    />
                    <ColorPicker
                      label="Border"
                      value={currentTheme.colors.border}
                      onChange={(v) => updateThemeColors({ border: v })}
                    />
                    <ColorPicker
                      label="Ring (Focus)"
                      value={currentTheme.colors.ring}
                      onChange={(v) => updateThemeColors({ ring: v })}
                    />
                  </div>
                </div>

                {/* Status Colors */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Status Colors</h3>
                  <div className="space-y-1 border rounded-lg p-4">
                    <ColorPicker
                      label="Success"
                      value={currentTheme.colors.success}
                      onChange={(v) => updateThemeColors({ success: v })}
                    />
                    <ColorPicker
                      label="Warning"
                      value={currentTheme.colors.warning}
                      onChange={(v) => updateThemeColors({ warning: v })}
                    />
                    <ColorPicker
                      label="Error"
                      value={currentTheme.colors.error}
                      onChange={(v) => updateThemeColors({ error: v })}
                    />
                    <ColorPicker
                      label="Info"
                      value={currentTheme.colors.info}
                      onChange={(v) => updateThemeColors({ info: v })}
                    />
                  </div>
                </div>

                {/* Sidebar Colors */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Sidebar</h3>
                  <div className="space-y-1 border rounded-lg p-4">
                    <ColorPicker
                      label="Sidebar Background"
                      value={currentTheme.sidebar.background}
                      onChange={(v) => updateThemeSidebar({ background: v })}
                    />
                    <ColorPicker
                      label="Sidebar Foreground"
                      value={currentTheme.sidebar.foreground}
                      onChange={(v) => updateThemeSidebar({ foreground: v })}
                    />
                    <ColorPicker
                      label="Sidebar Accent"
                      value={currentTheme.sidebar.accentColor}
                      onChange={(v) => updateThemeSidebar({ accentColor: v })}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* TYPOGRAPHY TAB */}
          <TabsContent value="typography" className="px-6 py-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-6 pr-4">
                {/* Font Family */}
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <select
                    value={currentTheme.typography.fontFamily}
                    onChange={(e) => updateThemeTypography({ fontFamily: e.target.value })}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="Inter, system-ui, sans-serif">Inter (Modern)</option>
                    <option value="Georgia, serif">Georgia (Classic)</option>
                    <option value="Arial, Helvetica, sans-serif">Arial (Clean)</option>
                    <option value="system-ui, sans-serif">System UI</option>
                  </select>
                </div>

                {/* Font Size */}
                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {FONT_SIZE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateThemeTypography({ fontSize: option.value as any })}
                        className={cn(
                          'p-3 text-sm border rounded-lg text-left transition-all',
                          currentTheme.typography.fontSize === option.value
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        )}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Letter Spacing */}
                <div className="space-y-2">
                  <Label>Letter Spacing</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {['tight', 'default', 'wide'].map((spacing) => (
                      <button
                        key={spacing}
                        onClick={() => updateThemeTypography({ letterSpacing: spacing as any })}
                        className={cn(
                          'p-3 text-sm border rounded-lg capitalize transition-all',
                          currentTheme.typography.letterSpacing === spacing
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        )}
                      >
                        {spacing}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="border rounded-lg p-4 space-y-2">
                  <Label>Preview</Label>
                  <p
                    className="text-lg"
                    style={{
                      fontFamily: currentTheme.typography.fontFamily,
                      letterSpacing: currentTheme.typography.letterSpacing === 'tight' ? '-0.025em' :
                        currentTheme.typography.letterSpacing === 'wide' ? '0.025em' : '0',
                    }}
                  >
                    The quick brown fox jumps over the lazy dog.
                  </p>
                  <p
                    className="text-sm text-muted-foreground"
                    style={{
                      fontFamily: currentTheme.typography.fontFamily,
                    }}
                  >
                    ABC abc 123 The quick brown fox jumps over the lazy dog.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* LAYOUT TAB */}
          <TabsContent value="layout" className="px-6 py-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-6 pr-4">
                {/* Density */}
                <div className="space-y-2">
                  <Label>Content Density</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {DENSITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateThemeLayout({ density: option.value as any })}
                        className={cn(
                          'p-3 text-sm border rounded-lg text-left transition-all',
                          currentTheme.layout.density === option.value
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        )}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Radius */}
                <div className="space-y-2">
                  <Label>Border Radius</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {BORDER_RADIUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateThemeLayout({ borderRadius: option.value as any })}
                        className={cn(
                          'p-3 text-sm border text-center transition-all',
                          currentTheme.layout.borderRadius === option.value
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50',
                          option.value === 'none' ? 'rounded-none' :
                            option.value === 'small' ? 'rounded-sm' :
                            option.value === 'default' ? 'rounded-md' :
                            option.value === 'large' ? 'rounded-lg' :
                            'rounded-full'
                        )}
                      >
                        <div className="font-medium text-xs">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shadows */}
                <div className="space-y-2">
                  <Label>Shadow Style</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {SHADOW_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateThemeLayout({ shadows: option.value as any })}
                        className={cn(
                          'p-3 text-sm border rounded-lg text-left transition-all',
                          option.value === 'none' ? '' :
                            option.value === 'subtle' ? 'shadow-sm' :
                            option.value === 'default' ? 'shadow-md' :
                            'shadow-lg',
                          currentTheme.layout.shadows === option.value
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        )}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sidebar Style */}
                <div className="space-y-2">
                  <Label>Sidebar Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SIDEBAR_STYLE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateThemeSidebar({ style: option.value as any })}
                        className={cn(
                          'p-3 text-sm border rounded-lg text-left transition-all',
                          currentTheme.sidebar.style === option.value
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        )}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sidebar Width */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Sidebar Width</Label>
                    <span className="text-sm text-muted-foreground">{currentTheme.sidebar.expandedWidth}px</span>
                  </div>
                  <Slider
                    value={[currentTheme.sidebar.expandedWidth]}
                    onValueChange={([v]) => updateThemeSidebar({ expandedWidth: v })}
                    min={240}
                    max={400}
                    step={10}
                  />
                </div>

                {/* Collapsed Width */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Collapsed Width</Label>
                    <span className="text-sm text-muted-foreground">{currentTheme.sidebar.collapsedWidth}px</span>
                  </div>
                  <Slider
                    value={[currentTheme.sidebar.collapsedWidth]}
                    onValueChange={([v]) => updateThemeSidebar({ collapsedWidth: v })}
                    min={60}
                    max={100}
                    step={4}
                  />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefault}
            className="gap-2 text-red-500 hover:text-red-600"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </Button>
          <div className="text-xs text-muted-foreground">
            Current: <span className="font-medium">{currentTheme.name}</span>
            {currentTheme.isCustom && (
              <Badge variant="secondary" className="ml-2">Custom</Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThemeCustomizer;
