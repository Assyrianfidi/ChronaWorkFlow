// Cookie Consent Component for GDPR compliance
import React, { useState, useEffect } from 'react';

interface CookieConsentProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ 
  onAccept, 
  onDecline 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    onAccept?.();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
    onDecline?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="cookie-consent-banner">
      <div className="cookie-consent-content">
        <h3>Cookie Consent</h3>
        <p>
          We use cookies to enhance your experience, analyze site traffic, 
          and personalize content. By continuing to use our site, you agree 
          to our use of cookies in accordance with our{' '}
          <a href="/privacy-policy">Privacy Policy</a>.
        </p>
        <div className="cookie-consent-actions">
          <button 
            onClick={handleAccept}
            className="btn btn-primary"
            aria-label="Accept cookies"
          >
            Accept All
          </button>
          <button 
            onClick={handleDecline}
            className="btn btn-secondary"
            aria-label="Decline cookies"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;