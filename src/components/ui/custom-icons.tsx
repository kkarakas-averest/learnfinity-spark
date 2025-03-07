import React from 'react';

/**
 * Custom Icon Components
 * 
 * This file contains custom SVG icons for use throughout the application.
 * Each icon is a React component that accepts standard SVG props.
 */

type IconProps = React.SVGProps<SVGSVGElement>;

/**
 * TrendUp Icon
 */
export const TrendUpIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

/**
 * TrendDown Icon
 */
export const TrendDownIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

/**
 * MinusIcon
 */
export const MinusIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/**
 * SortAscending
 */
export const SortAscendingIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 8V5h18v3" />
    <path d="M19 21v-3H1v3" />
    <path d="M11 13.1H6.9a2.1 2.1 0 0 0 0 4.2H11" />
    <path d="M11 17.3v-8.5c0-1.1 .9-2.1 2.1-2.1H18" />
    <path d="M11 12.8H19" />
  </svg>
);

/**
 * SortDescending
 */
export const SortDescendingIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 16v3h18v-3" />
    <path d="M19 3v3H1V3" />
    <path d="M11 10.9h4.1a2.1 2.1 0 0 1 0 4.2H11" />
    <path d="M11 6.7v8.5c0 1.1 .9 2.1 2.1 2.1H18" />
    <path d="M11 11.2h8" />
  </svg>
); 