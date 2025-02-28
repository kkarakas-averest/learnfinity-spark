import * as React from 'react';

export interface BadgeProps {
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps>; 