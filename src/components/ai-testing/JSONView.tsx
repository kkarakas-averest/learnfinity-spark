"use client";

import React from "react";

export function JSONView({ data }: { data: any }) {
  // Function to format the JSON as a pretty-printed string with syntax highlighting
  const formatJSON = (json: any): string => {
    return JSON.stringify(json, null, 2);
  };

  return (
    <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md overflow-auto text-sm">
      <code>{formatJSON(data)}</code>
    </pre>
  );
} 