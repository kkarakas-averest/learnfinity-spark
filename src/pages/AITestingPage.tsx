import React from "@/lib/react-helpers";
import AITestingInterface from "@/components/ai-testing/AITestingInterface";
import NavbarMigrated from "@/components/NavbarMigrated";

export default function AITestingPage() {
  // Set document title using plain JavaScript
  React.useEffect(() => {
    document.title = "AI Content Generation Testing | Learnfinity";
  }, []);
  
  return (
    <>
      <NavbarMigrated />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">AI Content Generation Testing</h1>
        <p className="text-muted-foreground mb-8">
          This page allows you to test the AI content generation capabilities with real-time data inputs.
          Configure the parameters below and generate content to see how our AI agents perform.
        </p>
        <AITestingInterface />
      </div>
    </>
  );
} 