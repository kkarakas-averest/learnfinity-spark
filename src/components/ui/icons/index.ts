import React from 'react';

// Define types for our icon components
export type IconProps = React.SVGProps<SVGSVGElement>;

/**
 * ThumbsUp Icon
 */
export const ThumbsUp = (props: IconProps): JSX.Element => 
  React.createElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...props
  }, [
    React.createElement('path', { key: 'path1', d: 'M7 10v12' }),
    React.createElement('path', { key: 'path2', d: 'M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z' })
  ]);

/**
 * ThumbsDown Icon
 */
export const ThumbsDown = (props: IconProps): JSX.Element =>
  React.createElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...props
  }, [
    React.createElement('path', { key: 'path1', d: 'M17 14V2' }),
    React.createElement('path', { key: 'path2', d: 'M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z' })
  ]);

/**
 * Plus Icon
 */
export const Plus = (props: IconProps): JSX.Element =>
  React.createElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...props
  }, [
    React.createElement('path', { key: 'path1', d: 'M12 5v14' }),
    React.createElement('path', { key: 'path2', d: 'M5 12h14' })
  ]); 