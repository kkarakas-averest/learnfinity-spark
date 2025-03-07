// Test file to verify TypeScript import configurations
import * as React from 'react';
import { useState, useEffect } from 'react';

// This is just a test component to check if TypeScript correctly processes imports
export function TestComponent() {
  const [count, setCount] = React.useState(0);
  const [text, setText] = useState('Hello');
  
  React.useEffect(() => {
    console.log('Component mounted');
  }, []);
  
  useEffect(() => {
    console.log('Text changed:', text);
  }, [text]);
  
  return (
    <div>
      <h1>TypeScript Import Test</h1>
      <p>Count: {count}</p>
      <p>Text: {text}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setText(text + '!')}>Add !</button>
    </div>
  );
} 