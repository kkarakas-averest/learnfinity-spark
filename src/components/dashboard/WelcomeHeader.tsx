
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeHeaderProps {
  userName: string;
}

const WelcomeHeader = ({ userName }: WelcomeHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight animate-fade-in">Welcome back, {userName}</h1>
        <p className="text-muted-foreground mt-1 animate-fade-in opacity-0" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
          Your learning journey continues
        </p>
      </div>
      <div className="mt-4 sm:mt-0">
        <Button size="sm" className="gap-1.5 animate-fade-in opacity-0" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
          <Sparkles size={16} />
          AI Recommendations
        </Button>
      </div>
    </div>
  );
};

export default WelcomeHeader;
