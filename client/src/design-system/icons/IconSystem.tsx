/**
 * Enhanced Iconography System
 * Ultra-modern, accessible, and performance-optimized icon library
 */

import React, { memo, useMemo } from "react";

export interface IconProps {
  name: string;
  size?: number | string;
  color?: string;
  variant?: "solid" | "outline" | "duotone" | "light";
  className?: string;
  ariaLabel?: string;
  title?: string;
  spin?: boolean;
  pulse?: boolean;
  bounce?: boolean;
  rotate?: number;
  flip?: "horizontal" | "vertical" | "both";
  badge?: string | number;
  gradient?: string;
}

// Icon definitions with multiple variants
const iconDefinitions: Record<string, Record<string, string>> = {
  // Navigation Icons
  home: {
    solid: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    outline: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    duotone: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    light: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  },
  dashboard: {
    solid: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    outline: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    duotone: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    light: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  },
  settings: {
    solid:
      "M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.65-.07-.97l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.08-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.32-.07.64-.07.97c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z",
    outline:
      "M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.65-.07-.97l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.08-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.32-.07.64-.07.97c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z",
    duotone:
      "M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.65-.07-.97l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.08-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.32-.07.64-.07.97c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z",
    light:
      "M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.65-.07-.97l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.08-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.32-.07.64-.07.97c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z",
  },

  // Business Icons
  "chart-bar": {
    solid:
      "M22 21H2V3h2v16h2v-8h2v8h2v-6h2v6h2v-4h2v4h2v-2h2v2h2v-6h2v6h2v-4h2v4h2v-2h2v2z",
    outline:
      "M22 21H2V3h2v16h2v-8h2v8h2v-6h2v6h2v-4h2v4h2v-2h2v2h2v-6h2v6h2v-4h2v4h2v-2h2v2z",
    duotone:
      "M22 21H2V3h2v16h2v-8h2v8h2v-6h2v6h2v-4h2v4h2v-2h2v2h2v-6h2v6h2v-4h2v4h2v-2h2v2z",
    light:
      "M22 21H2V3h2v16h2v-8h2v8h2v-6h2v6h2v-4h2v4h2v-2h2v2h2v-6h2v6h2v-4h2v4h2v-2h2v2z",
  },
  wallet: {
    solid:
      "M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 0 1-1.5-1.5a1.5 1.5 0 0 1 1.5-1.5a1.5 1.5 0 0 1 1.5 1.5a1.5 1.5 0 0 1-1.5 1.5z",
    outline:
      "M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 0 1-1.5-1.5a1.5 1.5 0 0 1 1.5-1.5a1.5 1.5 0 0 1 1.5 1.5a1.5 1.5 0 0 1-1.5 1.5z",
    duotone:
      "M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 0 1-1.5-1.5a1.5 1.5 0 0 1 1.5-1.5a1.5 1.5 0 0 1 1.5 1.5a1.5 1.5 0 0 1-1.5 1.5z",
    light:
      "M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 0 1-1.5-1.5a1.5 1.5 0 0 1 1.5-1.5a1.5 1.5 0 0 1 1.5 1.5a1.5 1.5 0 0 1-1.5 1.5z",
  },
  receipt: {
    solid:
      "M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2L7.5 3.5L6 2l-1.5 1.5L3 2v18l1.5-1.5L6 20l1.5-1.5L9 20l1.5-1.5L12 20l1.5-1.5L15 20l1.5-1.5L18 20l1.5-1.5L21 20V2l-1.5 1.5M19 17H5V7h14v14z",
    outline:
      "M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2L7.5 3.5L6 2l-1.5 1.5L3 2v18l1.5-1.5L6 20l1.5-1.5L9 20l1.5-1.5L12 20l1.5-1.5L15 20l1.5-1.5L18 20l1.5-1.5L21 20V2l-1.5 1.5M19 17H5V7h14v14z",
    duotone:
      "M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2L7.5 3.5L6 2l-1.5 1.5L3 2v18l1.5-1.5L6 20l1.5-1.5L9 20l1.5-1.5L12 20l1.5-1.5L15 20l1.5-1.5L18 20l1.5-1.5L21 20V2l-1.5 1.5M19 17H5V7h14v14z",
    light:
      "M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2L7.5 3.5L6 2l-1.5 1.5L3 2v18l1.5-1.5L6 20l1.5-1.5L9 20l1.5-1.5L12 20l1.5-1.5L15 20l1.5-1.5L18 20l1.5-1.5L21 20V2l-1.5 1.5M19 17H5V7h14v14z",
  },

  // Status Icons
  "check-circle": {
    solid:
      "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m-2 15l-5-5l1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    outline:
      "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m-2 15l-5-5l1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    duotone:
      "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m-2 15l-5-5l1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    light:
      "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m-2 15l-5-5l1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  },
  "alert-circle": {
    solid:
      "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m1 15h-2v-2h2v2m0-4h-2V7h2v6z",
    outline:
      "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m1 15h-2v-2h2v2m0-4h-2V7h2v6z",
    duotone:
      "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m1 15h-2v-2h2v2m0-4h-2V7h2v6z",
    light:
      "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m1 15h-2v-2h2v2m0-4h-2V7h2v6z",
  },
  "info-circle": {
    solid:
      "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m1 15h-2v-6h2v6m0-8h-2V7h2v2z",
    outline:
      "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m1 15h-2v-6h2v6m0-8h-2V7h2v2z",
    duotone:
      "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m1 15h-2v-6h2v6m0-8h-2V7h2v2z",
    light:
      "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m1 15h-2v-6h2v6m0-8h-2V7h2v2z",
  },

  // Action Icons
  plus: {
    solid: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    outline: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    duotone: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    light: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  },
  minus: {
    solid: "M19 13H5v-2h14v2z",
    outline: "M19 13H5v-2h14v2z",
    duotone: "M19 13H5v-2h14v2z",
    light: "M19 13H5v-2h14v2z",
  },
  edit: {
    solid:
      "M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83l3.75 3.75l3.75-3.75zM3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z",
    outline:
      "M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83l3.75 3.75l3.75-3.75zM3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z",
    duotone:
      "M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83l3.75 3.75l3.75-3.75zM3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z",
    light:
      "M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83l3.75 3.75l3.75-3.75zM3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z",
  },
  trash: {
    solid:
      "M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z",
    outline:
      "M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z",
    duotone:
      "M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z",
    light:
      "M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z",
  },

  // Communication Icons
  bell: {
    solid:
      "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
    outline:
      "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
    duotone:
      "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
    light:
      "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
  },
  mail: {
    solid:
      "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 4l-8 5l-8-5V6l8 5l8-5v2z",
    outline:
      "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 4l-8 5l-8-5V6l8 5l8-5v2z",
    duotone:
      "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 4l-8 5l-8-5V6l8 5l8-5v2z",
    light:
      "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 4l-8 5l-8-5V6l8 5l8-5v2z",
  },

  // Security Icons
  shield: {
    solid: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5l-9-4z",
    outline: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5l-9-4z",
    duotone: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5l-9-4z",
    light: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5l-9-4z",
  },
  lock: {
    solid:
      "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2s2 .9 2 2s-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1c1.71 0 3.1 1.39 3.1 3.1v2z",
    outline:
      "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2s2 .9 2 2s-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1c1.71 0 3.1 1.39 3.1 3.1v2z",
    duotone:
      "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2s2 .9 2 2s-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1c1.71 0 3.1 1.39 3.1 3.1v2z",
    light:
      "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2s2 .9 2 2s-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1c1.71 0 3.1 1.39 3.1 3.1v2z",
  },

  // Loading Icons
  loading: {
    solid: "M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z",
    outline: "M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z",
    duotone: "M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z",
    light: "M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z",
  },
  spinner: {
    solid: "M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z",
    outline: "M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z",
    duotone: "M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z",
    light: "M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z",
  },
};

const Icon = memo<IconProps>(
  ({
    name,
    size = 24,
    color = "currentColor",
    variant = "solid",
    className = "",
    ariaLabel,
    title,
    spin = false,
    pulse = false,
    bounce = false,
    rotate = 0,
    flip,
    badge,
    gradient,
  }) => {
    const iconPath = useMemo(() => {
      const icon = iconDefinitions[name];
      if (!icon) {
        console.warn(`Icon "${name}" not found`);
        return "";
      }
      return icon[variant] || icon.solid || "";
    }, [name, variant]);

    const animationClass = useMemo(() => {
      const classes = [];
      if (spin) classes.push("icon-spin");
      if (pulse) classes.push("icon-pulse");
      if (bounce) classes.push("icon-bounce");
      return classes.join(" ");
    }, [spin, pulse, bounce]);

    const transformStyle = useMemo(() => {
      const transforms = [];
      if (rotate) transforms.push(`rotate(${rotate}deg)`);
      if (flip === "horizontal") transforms.push("scaleX(-1)");
      if (flip === "vertical") transforms.push("scaleY(-1)");
      if (flip === "both") transforms.push("scale(-1)");
      return transforms.join(" ");
    }, [rotate, flip]);

    const fillStyle = useMemo(() => {
      if (gradient) {
        return `url(#gradient-${name})`;
      }
      return variant === "outline" ? "none" : color;
    }, [gradient, variant, color, name]);

    if (!iconPath) {
      return (
        <span
          className={`icon-missing ${className}`}
          style={{ width: size, height: size }}
          aria-label={ariaLabel || `Missing icon: ${name}`}
        >
          ?
        </span>
      );
    }

    return (
      <span
        className={`icon ${animationClass} ${className}`}
        style={{
          width: size,
          height: size,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transform: transformStyle,
        }}
        aria-label={ariaLabel}
        title={title}
        role={ariaLabel ? "img" : undefined}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={fillStyle}
          stroke={variant === "outline" ? color : "none"}
          strokeWidth={variant === "outline" ? 2 : 0}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          {gradient && (
            <defs>
              <linearGradient
                id={`gradient-${name}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={gradient.split(",")[0]} />
                <stop
                  offset="100%"
                  stopColor={gradient.split(",")[1] || gradient}
                />
              </linearGradient>
            </defs>
          )}
          <path d={iconPath} />
        </svg>

        {badge && (
          <span
            className="icon-badge"
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#ef4444",
              color: "white",
              borderRadius: "50%",
              width: Math.min(16, size / 2),
              height: Math.min(16, size / 2),
              fontSize: Math.min(10, size / 4),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              border: "2px solid white",
            }}
          >
            {badge}
          </span>
        )}
      </span>
    );
  },
);

Icon.displayName = "Icon";

// Icon presets for common use cases
export const IconPresets = {
  // Navigation
  Home: (props?: Partial<IconProps>) => <Icon name="home" {...props} />,
  Dashboard: (props?: Partial<IconProps>) => (
    <Icon name="dashboard" {...props} />
  ),
  Settings: (props?: Partial<IconProps>) => <Icon name="settings" {...props} />,

  // Business
  ChartBar: (props?: Partial<IconProps>) => (
    <Icon name="chart-bar" {...props} />
  ),
  Wallet: (props?: Partial<IconProps>) => <Icon name="wallet" {...props} />,
  Receipt: (props?: Partial<IconProps>) => <Icon name="receipt" {...props} />,

  // Status
  CheckCircle: (props?: Partial<IconProps>) => (
    <Icon name="check-circle" {...props} />
  ),
  AlertCircle: (props?: Partial<IconProps>) => (
    <Icon name="alert-circle" {...props} />
  ),
  InfoCircle: (props?: Partial<IconProps>) => (
    <Icon name="info-circle" {...props} />
  ),

  // Actions
  Plus: (props?: Partial<IconProps>) => <Icon name="plus" {...props} />,
  Minus: (props?: Partial<IconProps>) => <Icon name="minus" {...props} />,
  Edit: (props?: Partial<IconProps>) => <Icon name="edit" {...props} />,
  Trash: (props?: Partial<IconProps>) => <Icon name="trash" {...props} />,

  // Communication
  Bell: (props?: Partial<IconProps>) => <Icon name="bell" {...props} />,
  Mail: (props?: Partial<IconProps>) => <Icon name="mail" {...props} />,

  // Security
  Shield: (props?: Partial<IconProps>) => <Icon name="shield" {...props} />,
  Lock: (props?: Partial<IconProps>) => <Icon name="lock" {...props} />,

  // Loading
  Loading: (props?: Partial<IconProps>) => (
    <Icon name="loading" spin {...props} />
  ),
  Spinner: (props?: Partial<IconProps>) => (
    <Icon name="spinner" spin {...props} />
  ),
};

// Icon registry for dynamic icon loading
export class IconRegistry {
  private static instance: IconRegistry;
  private customIcons: Map<string, Record<string, string>> = new Map();

  static getInstance(): IconRegistry {
    if (!IconRegistry.instance) {
      IconRegistry.instance = new IconRegistry();
    }
    return IconRegistry.instance;
  }

  registerIcon(name: string, variants: Record<string, string>): void {
    this.customIcons.set(name, variants);
  }

  getIcon(name: string, variant: string = "solid"): string {
    const customIcon = this.customIcons.get(name);
    if (customIcon && customIcon[variant]) {
      return customIcon[variant];
    }

    const defaultIcon = iconDefinitions[name];
    if (defaultIcon && defaultIcon[variant]) {
      return defaultIcon[variant];
    }

    return defaultIcon?.solid || "";
  }

  getAllIcons(): string[] {
    return Array.from(
      new Set([...Object.keys(iconDefinitions), ...this.customIcons.keys()]),
    );
  }

  clearCustomIcons(): void {
    this.customIcons.clear();
  }
}

// Icon utilities
export const IconUtils = {
  // Get icon size based on context
  getSize: (context: "small" | "medium" | "large" | "hero"): number => {
    switch (context) {
      case "small":
        return 16;
      case "medium":
        return 24;
      case "large":
        return 32;
      case "hero":
        return 48;
      default:
        return 24;
    }
  },

  // Get icon variant based on theme
  getVariant: (
    theme: "light" | "dark",
    style: "regular" | "bold",
  ): "solid" | "outline" | "duotone" | "light" => {
    if (style === "bold") return "solid";
    if (theme === "light") return "outline";
    return "solid";
  },

  // Generate icon colors for different states
  getColor: (
    state: "default" | "hover" | "active" | "disabled",
    baseColor?: string,
  ): string => {
    if (baseColor) return baseColor;

    switch (state) {
      case "hover":
        return "#3b82f6";
      case "active":
        return "#2563eb";
      case "disabled":
        return "#9ca3af";
      default:
        return "#6b7280";
    }
  },
};

export default Icon;
