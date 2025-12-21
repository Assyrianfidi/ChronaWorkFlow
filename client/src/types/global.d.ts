// Working type declarations for AccuBooks Frontend

declare global {
  interface Window {
    __ACCUBOOKS_CONFIG__?: any;
    __NEXT_DATA__?: any;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    fbq?: (...args: any[]) => void;
    performance?: any;
    IntersectionObserver?: any;
    ResizeObserver?: any;
    MutationObserver?: any;
    Chart?: any;
  }

  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
    }
  }
}

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.css" {
  const content: string;
  export default content;
}

declare module "*.scss" {
  const content: string;
  export default content;
}

declare module "*.svg" {
  import React = require("react");
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}

declare module "*.ico" {
  const src: string;
  export default src;
}

declare module "*.bmp" {
  const src: string;
  export default src;
}

declare module "*.json" {
  const value: any;
  export default value;
}

declare module "react-chartjs-2" {
  import React = require("react");
  export const Line: React.FC<any>;
  export const Bar: React.FC<any>;
  export const Pie: React.FC<any>;
  export const Doughnut: React.FC<any>;
}

declare module "chart.js" {
  export const Chart: any;
  export const registerables: any[];
}

declare module "recharts" {
  import React = require("react");
  export const LineChart: React.FC<any>;
  export const BarChart: React.FC<any>;
  export const PieChart: React.FC<any>;
  export const XAxis: React.FC<any>;
  export const YAxis: React.FC<any>;
  export const CartesianGrid: React.FC<any>;
  export const Tooltip: React.FC<any>;
  export const Legend: React.FC<any>;
}

declare module "@tanstack/react-table" {
  export function useTable(options: any): any;
  export const Column: any;
  export const HeaderGroup: any;
}

declare module "@tanstack/react-virtual" {
  export function useVirtualizer(options: any): any;
}

declare module "framer-motion" {
  import React = require("react");
  export const motion: any;
  export const AnimatePresence: React.FC<any>;
}

declare module "lucide-react" {
  import React = require("react");
  export const ChevronDown: React.FC<any>;
  export const ChevronUp: React.FC<any>;
  export const Plus: React.FC<any>;
  export const Minus: React.FC<any>;
  export const X: React.FC<any>;
  export const Check: React.FC<any>;
  export const AlertCircle: React.FC<any>;
  export const Settings: React.FC<any>;
  export const User: React.FC<any>;
  export const LogOut: React.FC<any>;
}

declare global {
  // Web Speech API (minimal ambient typings for TS builds)
  // Some TS lib.dom versions omit these types, so we provide safe aliases.
  type SpeechRecognition = any;
  type SpeechRecognitionEvent = any;
  type SpeechRecognitionErrorEvent = any;
}

export type ID = string | number;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type EventHandler<T = any> = (event: T) => void;
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

export type ApiResponse<T = any> = {
  data?: T;
  error?: string;
  success?: boolean;
  message?: string;
};

export type FormField<T = any> = {
  value: T;
  error?: string;
  touched?: boolean;
};

export type FormState<T = Record<string, any>> = {
  [K in keyof T]: FormField<T[K]>;
};

export {};
