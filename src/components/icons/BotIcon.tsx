import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

const BotIcon = ({ size = 24, className = '', ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect width="18" height="10" x="3" y="11" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M10 11V9a2 2 0 1 1 4 0v2" />
    <line x1="8" x2="8" y1="15" y2="17" />
    <line x1="16" x2="16" y1="15" y2="17" />
  </svg>
);

export default BotIcon; 