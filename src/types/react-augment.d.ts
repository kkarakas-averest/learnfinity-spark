import 'react';

// Augment the React namespace to ensure class properties are recognized
declare module 'react' {
  // Ensure Component class has required properties for our error boundaries
  interface Component<P = {}, S = {}, SS = any> {
    props: Readonly<P> & Readonly<{ children?: React.ReactNode }>;
    state: Readonly<S>;
    setState<K extends keyof S>(
      state: ((prevState: Readonly<S>, props: Readonly<P>) => (Pick<S, K> | S | null)) | (Pick<S, K> | S | null),
      callback?: () => void
    ): void;
    forceUpdate(callback?: () => void): void;
    context: any;
    refs: {
      [key: string]: React.ReactInstance
    };
  }
}

// This empty export is needed to make this a module
export {}; 