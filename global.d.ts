// Fix React component types for global elements
import 'react';

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
  }
}

// No need to augment React.Component here as we're using @ts-ignore in the components

export { }; 