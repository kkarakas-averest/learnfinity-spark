/**
 * This file ensures consistent JSX runtime support across the application.
 * It helps with TypeScript type checking for JSX elements and React imports.
 */

import 'react/jsx-runtime';

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode;
    }
    interface IntrinsicAttributes extends React.Attributes { }
    interface ElementAttributesProperty {
      props: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

// This empty export makes the file a module
export {}; 