
import * as React from 'react';
import { useState, useEffect } from '@/lib/react-helpers';

// This is just a test file to confirm React imports are working correctly
const TestImports = () => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log("Effect ran");
  }, []);
  
  return (
    <div>
      <h1>Test Imports</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};

export default TestImports;
