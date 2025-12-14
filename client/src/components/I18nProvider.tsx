import React from 'react'
;
;

interface I18nProviderProps {
  children: React.ReactNode;
  locale?: string;
  messages?: Record<string, string>;
}

/**
 * I18nProvider stub for Storybook
 * In a real implementation, this would provide internationalization context
 * using libraries like react-intl, i18next, or similar.
 */
export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  locale = "en",
  messages = {},
}) => {
  // In a real implementation, this would provide i18n context
  return <>{children}</>;
};

/**
 * useI18n hook for consuming i18n context
 * This is a no-op in the stub implementation
 */
export const useI18n = () => ({
  t: (key: string, values?: Record<string, any>) => {
    if (!values) return key;
    return Object.entries(values).reduce(
      (msg, [k, v]) => msg.replace(`{{${k}}}`, String(v)),
      key,
    );
  },
  locale: "en",
  changeLanguage: () => Promise.resolve(),
  tReady: true,
});
