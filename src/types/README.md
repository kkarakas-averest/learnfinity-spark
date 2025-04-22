# TypeScript JSX Configuration

This directory contains TypeScript declaration files that help resolve React JSX-related errors in the codebase.

## Files

- `react-jsx.d.ts`: Provides direct type declarations for React JSX runtime, fixing "Property does not exist on type JSX.IntrinsicElements" errors
- `jsx-runtime.d.ts`: Ensures consistent JSX runtime support across the application

## Common Issues Fixed

1. **JSX IntrinsicElements errors**:
   - "Property 'div' does not exist on type 'JSX.IntrinsicElements'"
   - "Property 'span' does not exist on type 'JSX.IntrinsicElements'"

2. **JSX Runtime errors**:
   - "This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found."

3. **Missing module declarations**:
   - "Cannot find module 'sonner' or its corresponding type declarations"
   - "Cannot find module 'react-markdown' or its corresponding type declarations"

## Usage

These type declarations work automatically once added to the project. They don't need to be imported directly.

For more consistent React imports, use the React import helper:

```typescript
import React from "@/utils/react-import";
import { useState, useEffect } from "@/utils/react-import";
```

## Troubleshooting

If you encounter similar TypeScript errors in the future:

1. Make sure the component imports React properly (either directly or via the helper)
2. Check that JSX is configured correctly in tsconfig.json (`"jsx": "react-jsx"`)
3. Consider adding specific interface definitions to `global.d.ts` for third-party modules

The TypeScript configuration uses `"jsx": "react-jsx"` which uses the new JSX Transform introduced in React 17, eliminating the need to import React in scope. 