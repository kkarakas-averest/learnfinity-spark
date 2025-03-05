
/**
 * Global type augmentations
 */

// Allow React to be imported without default
declare module 'react' {
  import * as React from 'react';
  export = React;
  export as namespace React;
}

// For any other modules that might be missing default exports
declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.json' {
  const value: any;
  export default value;
}
