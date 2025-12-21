/**
 * Accessibility Modes Component
 * WCAG AAA compliant accessibility settings and mode controls
 */

import React, { useState, useEffect } from "react";
import AccessibilityEngine, {
  AccessibilityConfig,
} from "@/accessibility/a11y-engine";

interface AccessibilityModesProps {
  engine: AccessibilityEngine;
  onConfigChange?: (config: AccessibilityConfig) => void;
  className?: string;
}

const AccessibilityModes: React.FC<AccessibilityModesProps> = ({
  engine,
  onConfigChange,
  className = "",
}) => {
  const [config, setConfig] = useState<AccessibilityConfig>(engine.getConfig());
  const [isOpen, setIsOpen] = useState(false);
  const [validationScore, setValidationScore] = useState<number>(100);
  const [validationIssues, setValidationIssues] = useState<any[]>([]);

  useEffect(() => {
    const validateAccessibility = () => {
      const validation = engine.validateAccessibility();
      setValidationScore(validation.score);
      setValidationIssues(validation.issues);
    };

    validateAccessibility();

    // Validate every 5 seconds
    const interval = setInterval(validateAccessibility, 5000);
    return () => clearInterval(interval);
  }, [engine]);

  const handleConfigUpdate = (updates: Partial<AccessibilityConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    engine.updateConfig(updates);
    onConfigChange?.(newConfig);
  };

  const toggleMode = (mode: string) => {
    switch (mode) {
      case "high-contrast":
        handleConfigUpdate({
          visual: {
            ...config.visual,
            highContrast: !config.visual.highContrast,
          },
        });
        break;
      case "large-text":
        handleConfigUpdate({
          visual: { ...config.visual, largeText: !config.visual.largeText },
        });
        break;
      case "reduced-motion":
        handleConfigUpdate({
          visual: {
            ...config.visual,
            reducedMotion: !config.visual.reducedMotion,
          },
        });
        break;
      case "simplified-ui":
        handleConfigUpdate({
          cognitive: {
            ...config.cognitive,
            simplifiedUI: !config.cognitive.simplifiedUI,
          },
        });
        break;
      case "large-targets":
        handleConfigUpdate({
          motor: {
            ...config.motor,
            largerClickTargets: !config.motor.largerClickTargets,
          },
        });
        break;
    }
  };

  const setColorBlindnessFilter = (
    type: "none" | "protanopia" | "deuteranopia" | "tritanopia",
  ) => {
    handleConfigUpdate({
      visual: {
        ...config.visual,
        colorBlindness: {
          type,
          enabled: type !== "none",
        },
      },
    });
    engine.setColorBlindnessFilter(type);
  };

  const setReadingLevel = (level: "basic" | "intermediate" | "advanced") => {
    handleConfigUpdate({
      cognitive: { ...config.cognitive, readingLevel: level },
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Needs Improvement";
  };

  return (
    <div className={`accessibility-modes ${className}`}>
      {/* Accessibility Toggle Button */}
      <button
        className="accessibility-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Accessibility settings"
        aria-expanded={isOpen}
      >
        <span className="accessibility-icon">♿</span>
        <span
          className="accessibility-score"
          style={{ color: getScoreColor(validationScore) }}
        >
          {validationScore}%
        </span>
      </button>

      {/* Accessibility Panel */}
      {isOpen && (
        <div className="accessibility-panel">
          <div className="panel-header">
            <h2>Accessibility Settings</h2>
            <button
              className="close-panel"
              onClick={() => setIsOpen(false)}
              aria-label="Close accessibility settings"
            >
              ×
            </button>
          </div>

          {/* Accessibility Score */}
          <div className="accessibility-score-section">
            <h3>Accessibility Score</h3>
            <div className="score-display">
              <div className={`score-circle ${getScoreColor(validationScore)}`}>
                <span className="score-number">{validationScore}%</span>
              </div>
              <div className="score-details">
                <div
                  className={`score-label ${getScoreColor(validationScore)}`}
                >
                  {getScoreLabel(validationScore)}
                </div>
                <div className="score-description">
                  {validationIssues.length === 0
                    ? "No accessibility issues detected"
                    : `${validationIssues.length} issue(s) found`}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Settings */}
          <div className="settings-section">
            <h3>Visual Settings</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="setting-label">

        <label htmlFor="input-cign08db4" className="sr-only">
          Checkbox
        </label>
        <input id="input-cign08db4"
                    type="checkbox"
                    checked={config.visual.highContrast}
                    onChange={() =>
       toggleMode("high-contrast")}
                  />
                  <span className="setting-text">
                    <strong>High Contrast</strong>
                    <span className="setting-description">
                      Increase contrast for better visibility
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">

        <label htmlFor="input-4227ksz1x" className="sr-only">
          Checkbox
        </label>
        <input id="input-4227ksz1x"
                    type="checkbox"
                    checked={config.visual.largeText}
                    onChange={() =>
       toggleMode("large-text")}
                  />
                  <span className="setting-text">
                    <strong>Large Text</strong>
                    <span className="setting-description">
                      Increase font size by 20%
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">

        <label htmlFor="input-j9zqzmlnr" className="sr-only">
          Checkbox
        </label>
        <input id="input-j9zqzmlnr"
                    type="checkbox"
                    checked={config.visual.reducedMotion}
                    onChange={() =>
       toggleMode("reduced-motion")}
                  />
                  <span className="setting-text">
                    <strong>Reduced Motion</strong>
                    <span className="setting-description">
                      Minimize animations and transitions
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  <strong>Color Blindness Filter</strong>
                  <select
                    value={config.visual.colorBlindness.type}
                    onChange={(e) =>
                      setColorBlindnessFilter(e.target.value as any)
                    }
                    className="setting-select"
                  >
                    <option value="none">None</option>
                    <option value="protanopia">Protanopia (Red-Blind)</option>
                    <option value="deuteranopia">
                      Deuteranopia (Green-Blind)
                    </option>
                    <option value="tritanopia">Tritanopia (Blue-Blind)</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* Cognitive Settings */}
          <div className="settings-section">
            <h3>Cognitive Settings</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="setting-label">
                  
        <label htmlFor="input-aet4fz43b" className="sr-only">
          Checkbox
        </label>
        <input id="input-aet4fz43b"
                    type="checkbox"
                    checked={config.cognitive.simplifiedUI}
                    onChange={() =>
       toggleMode("simplified-ui")}
                  />
                  <span className="setting-text">
                    <strong>Simplified Interface</strong>
                    <span className="setting-description">
                      Remove complex visual elements
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  <strong>Reading Level</strong>
                  <select
                    value={config.cognitive.readingLevel}
                    onChange={(e) => setReadingLevel(e.target.value as any)}
                    className="setting-select"
                  >
                    <option value="basic">Basic (Simple language)</option>
                    <option value="intermediate">
                      Intermediate (Standard)
                    </option>
                    <option value="advanced">Advanced (Technical)</option>
                  </select>
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  
        <label htmlFor="input-koi2isrfq" className="sr-only">
          Checkbox
        </label>
        <input id="input-koi2isrfq"
                    type="checkbox"
                    checked={config.cognitive.helpText}
                    onChange={() =>
      
                      handleConfigUpdate({
                        cognitive: {
                          ...config.cognitive,
                          helpText: !config.cognitive.helpText,
                        },
                      })
                    }
                  />
                  <span className="setting-text">
                    <strong>Show Help Text</strong>
                    <span className="setting-description">
                      Display additional guidance
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  
        <label htmlFor="input-yaetlw5fu" className="sr-only">
          Checkbox
        </label>
        <input id="input-yaetlw5fu"
                    type="checkbox"
                    checked={config.cognitive.errorPrevention}
                    onChange={() =>
      
                      handleConfigUpdate({
                        cognitive: {
                          ...config.cognitive,
                          errorPrevention: !config.cognitive.errorPrevention,
                        },
                      })
                    }
                  />
                  <span className="setting-text">
                    <strong>Error Prevention</strong>
                    <span className="setting-description">
                      Additional confirmation steps
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Motor Settings */}
          <div className="settings-section">
            <h3>Motor Settings</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="setting-label">
                  
        <label htmlFor="input-14bfew8lm" className="sr-only">
          Checkbox
        </label>
        <input id="input-14bfew8lm"
                    type="checkbox"
                    checked={config.motor.largerClickTargets}
                    onChange={() =>
       toggleMode("large-targets")}
                  />
                  <span className="setting-text">
                    <strong>Larger Click Targets</strong>
                    <span className="setting-description">
                      Minimum 44x44px interactive elements
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  
        <label htmlFor="input-ascymcyr3" className="sr-only">
          Checkbox
        </label>
        <input id="input-ascymcyr3"
                    type="checkbox"
                    checked={config.motor.gestureAlternatives}
                    onChange={() =>
      
                      handleConfigUpdate({
                        motor: {
                          ...config.motor,
                          gestureAlternatives:
                            !config.motor.gestureAlternatives,
                        },
                      })
                    }
                  />
                  <span className="setting-text">
                    <strong>Gesture Alternatives</strong>
                    <span className="setting-description">
                      Keyboard alternatives to gestures
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  
        <label htmlFor="input-vcz9dksph" className="sr-only">
          Checkbox
        </label>
        <input id="input-vcz9dksph"
                    type="checkbox"
                    checked={config.motor.voiceControl}
                    onChange={() =>
      
                      handleConfigUpdate({
                        motor: {
                          ...config.motor,
                          voiceControl: !config.motor.voiceControl,
                        },
                      })
                    }
                  />
                  <span className="setting-text">
                    <strong>Voice Control</strong>
                    <span className="setting-description">
                      Enable voice commands
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  
        <label htmlFor="input-bur1jtka4" className="sr-only">
          Checkbox
        </label>
        <input id="input-bur1jtka4"
                    type="checkbox"
                    checked={config.motor.switchNavigation}
                    onChange={() =>
      
                      handleConfigUpdate({
                        motor: {
                          ...config.motor,
                          switchNavigation: !config.motor.switchNavigation,
                        },
                      })
                    }
                  />
                  <span className="setting-text">
                    <strong>Switch Navigation</strong>
                    <span className="setting-description">
                      Navigate with single switch
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Focus Management */}
          <div className="settings-section">
            <h3>Focus Management</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="setting-label">
                  
        <label htmlFor="input-r6sxei1jx" className="sr-only">
          Checkbox
        </label>
        <input id="input-r6sxei1jx"
                    type="checkbox"
                    checked={config.focusManagement.visibleFocus}
                    onChange={() =>
      
                      handleConfigUpdate({
                        focusManagement: {
                          ...config.focusManagement,
                          visibleFocus: !config.focusManagement.visibleFocus,
                        },
                      })
                    }
                  />
                  <span className="setting-text">
                    <strong>Visible Focus</strong>
                    <span className="setting-description">
                      Show clear focus indicators
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  
        <label htmlFor="input-h6ly857wn" className="sr-only">
          Checkbox
        </label>
        <input id="input-h6ly857wn"
                    type="checkbox"
                    checked={config.focusManagement.focusTrap}
                    onChange={() =>
      
                      handleConfigUpdate({
                        focusManagement: {
                          ...config.focusManagement,
                          focusTrap: !config.focusManagement.focusTrap,
                        },
                      })
                    }
                  />
                  <span className="setting-text">
                    <strong>Focus Trapping</strong>
                    <span className="setting-description">
                      Trap focus in modals and dialogs
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  
        <label htmlFor="input-jvz1lmt8h" className="sr-only">
          Checkbox
        </label>
        <input id="input-jvz1lmt8h"
                    type="checkbox"
                    checked={config.focusManagement.skipLinks}
                    onChange={() =>
      
                      handleConfigUpdate({
                        focusManagement: {
                          ...config.focusManagement,
                          skipLinks: !config.focusManagement.skipLinks,
                        },
                      })
                    }
                  />
                  <span className="setting-text">
                    <strong>Skip Links</strong>
                    <span className="setting-description">
                      Show skip to content links
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Screen Reader Settings */}
          <div className="settings-section">
            <h3>Screen Reader Settings</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="setting-label">
                  
        <label htmlFor="input-3vo0c8s41" className="sr-only">
          Checkbox
        </label>
        <input id="input-3vo0c8s41"
                    type="checkbox"
                    checked={config.screenReader.announcements}
                    onChange={() =>
      
                      handleConfigUpdate({
                        screenReader: {
                          ...config.screenReader,
                          announcements: !config.screenReader.announcements,
                        },
                      })
                    }
                  />
                  <span className="setting-text">
                    <strong>Screen Reader Announcements</strong>
                    <span className="setting-description">
                      Announce important changes
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  
        <label htmlFor="input-1ouxoifg5" className="sr-only">
          Checkbox
        </label>
        <input id="input-1ouxoifg5"
                    type="checkbox"
                    checked={config.screenReader.landmarks}
                    onChange={() =>
      
                      handleConfigUpdate({
                        screenReader: {
                          ...config.screenReader,
                          landmarks: !config.screenReader.landmarks,
                        },
                      })
                    }
                  />
                  <span className="setting-text">
                    <strong>Landmark Navigation</strong>
                    <span className="setting-description">
                      Add ARIA landmarks
                    </span>
                  </span>
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  
        <label htmlFor="input-5cixgj3w6" className="sr-only">
          Checkbox
        </label>
        <input id="input-5cixgj3w6"
                    type="checkbox"
                    checked={config.screenReader.descriptions}
                    onChange={() =>
      
                      handleConfigUpdate({
                        screenReader: {
                          ...config.screenReader,
                          descriptions: !config.screenReader.descriptions,
                        },
                      })
                    }
                  />
                  <span className="setting-text">
                    <strong>Enhanced Descriptions</strong>
                    <span className="setting-description">
                      Add detailed ARIA descriptions
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Validation Issues */}
          {validationIssues.length > 0 && (
            <div className="settings-section">
              <h3>Accessibility Issues</h3>
              <div className="issues-list">
                {validationIssues.map((issue, index) => (
                  <div key={index} className={`issue-item ${issue.type}`}>
                    <div className="issue-header">
                      <span className="issue-type">
                        {issue.type.toUpperCase()}
                      </span>
                      <span className="issue-wcag">WCAG {issue.wcag}</span>
                    </div>
                    <div className="issue-description">{issue.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts */}
          <div className="settings-section">
            <h3>Keyboard Shortcuts</h3>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <kbd>Alt</kbd> + <kbd>H</kbd>
                <span>Toggle high contrast</span>
              </div>
              <div className="shortcut-item">
                <kbd>Alt</kbd> + <kbd>L</kbd>
                <span>Toggle large text</span>
              </div>
              <div className="shortcut-item">
                <kbd>Alt</kbd> + <kbd>M</kbd>
                <span>Toggle reduced motion</span>
              </div>
              <div className="shortcut-item">
                <kbd>Alt</kbd> + <kbd>S</kbd>
                <span>Skip to main content</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>K</kbd>
                <span>Open command palette</span>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="panel-footer">
            <button
              className="reset-button"
              onClick={() => {
                const defaultConfig = new AccessibilityEngine().getConfig();
                handleConfigUpdate(defaultConfig);
              }}
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .accessibility-modes {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
        }

        .accessibility-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid #005fcc;
          rounded-2;
          padding: 0.75rem 1rem;
          font-weight: 600;
          cursor: pointer;
          transition-colors duration-200;
          shadow-md;
        }

        .accessibility-togglehover:bg-#005fcc

        .accessibility-icon {
          font-size: 1.25rem;
        }

        .accessibility-score {
          font-size: 0.875rem;
          font-weight: 700;
        }

        .accessibility-panel {
          position: absolute;
          top: 60px;
          right: 0;
          width: 400px;
          max-height: 80vh;
          background: white;
          border: 1px solid #ddd;
          rounded-2;
          shadow-md;
          overflow-y: auto;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
          background: #f8f9fa;
          rounded-2 8px 0 0;
        }

        .panel-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #333;
        }

        .close-panel {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0.25rem;
          rounded-1;
        }

        .close-panelhover:bg-#e9ecef

        .accessibility-score-section {
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
        }

        .accessibility-score-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          color: #333;
        }

        .score-display {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.125rem;
          border: 3px solid currentColor;
        }

        .score-details {
          flex: 1;
        }

        .score-label {
          font-weight: 600;
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
        }

        .score-description {
          color: #666;
          font-size: 0.875rem;
        }

        .settings-section {
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
        }

        .settings-section:last-child {
          border-bottom: none;
        }

        .settings-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          color: #333;
        }

        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .setting-item {
          padding: 0.75rem;
          border: 1px solid #e9ecef;
          rounded-2;
          background: #fafbfc;
        }

        .setting-label {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
        }

        .setting-label input[type="checkbox"] {
          margin-top: 0.125rem;
          flex-shrink: 0;
        }

        .setting-text {
          flex: 1;
        }

        .setting-text strong {
          display: block;
          margin-bottom: 0.25rem;
          color: #333;
        }

        .setting-description {
          display: block;
          font-size: 0.875rem;
          color: #666;
          line-height: 1.4;
        }

        .setting-select {
          margin-top: 0.5rem;
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          rounded-1;
          font-size: 0.875rem;
        }

        .issues-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .issue-item {
          padding: 1rem;
          rounded-2;
          border-left: 4px solid;
        }

        .issue-item.error {
          background: #fef2f2;
          border-left-color: #dc2626;
        }

        .issue-item.warning {
          background: #fefce8;
          border-left-color: #ca8a04;
        }

        .issue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .issue-type {
          font-size: 0.75rem;
          font-weight: 600;
          color: #666;
        }

        .issue-wcag {
          font-size: 0.75rem;
          color: #666;
        }

        .issue-description {
          font-size: 0.875rem;
          color: #333;
        }

        .shortcuts-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .shortcut-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: #f8f9fa;
          rounded-2;
        }

        .shortcut-item kbd {
          background: #e9ecef;
          border: 1px solid #ced4da;
          rounded-1;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          font-family: monospace;
        }

        .shortcut-item span {
          flex: 1;
          font-size: 0.875rem;
          color: #666;
        }

        .panel-footer {
          padding: 1.5rem;
          border-top: 1px solid #eee;
          background: #f8f9fa;
          border-radius: 0 0 8px 8px;
        }

        .reset-button {
          background: #dc3545;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          rounded-2;
          font-weight: 600;
          cursor: pointer;
          transition-colors duration-200;
        }

        .reset-buttonhover:bg-#c82333

        /* High contrast mode adjustments */
        .a11y-high-contrast .accessibility-toggle {
          background: #000;
          color: #fff;
          border-color: #fff;
        }

        .a11y-high-contrast .accessibility-panel {
          background: #000;
          color: #fff;
          border-color: #fff;
        }

        .a11y-high-contrast .panel-header,
        .a11y-high-contrast .panel-footer {
          background: #111;
          border-color: #fff;
        }

        .a11y-high-contrast .setting-item {
          background: #111;
          border-color: #fff;
        }

        /* Large text mode adjustments */
        .a11y-large-text .accessibility-toggle {
          font-size: 1.2rem;
          padding: 0.9rem 1.2rem;
        }

        .a11y-large-text .accessibility-panel {
          width: 480px;
        }

        .a11y-large-text .panel-header h2 {
          font-size: 1.5rem;
        }

        .a11y-large-text .settings-section h3 {
          font-size: 1.35rem;
        }

        /* Reduced motion adjustments */
        .a11y-reduced-motion .accessibility-toggle,
        .a11y-reduced-motion .accessibility-panel {
          transition-colors duration-200;
        }
      `}</style>
    </div>
  );
};

export default AccessibilityModes;
