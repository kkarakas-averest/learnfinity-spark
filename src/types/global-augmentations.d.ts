
declare module "react" {
  export = React;
  export as namespace React;
}

declare module "react-dom" {
  export = ReactDOM;
  export as namespace ReactDOM;
}

// Augment zod's infer type for better TypeScript support
declare module "zod" {
  interface ZodType<Output = any, Def extends ZodTypeDef = ZodTypeDef, Input = Output> {
    readonly _output: Output;
    readonly _input: Input;
    readonly _def: Def;
  }
}
