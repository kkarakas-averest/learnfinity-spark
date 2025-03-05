import React, { useEffect } from '@/lib/react-helpers';
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  React.useEffect(() => {
    console.log("[Hero] Component mounted");
    return () => {
      console.log("[Hero] Component unmounting");
    };
  }, []);

  console.log("[Hero] Component rendering");

  // Safe wrapper for using cn function
  const safeClassNames = (...args: any[]) => {
    try {
      console.log("[Hero] Calling cn with args:", JSON.stringify(args));
      return cn(...args);
    } catch (err) {
      console.error("[Hero] Error applying class names:", err);
      // Return a sensible default if cn fails
      if (args.length > 0 && typeof args[0] === 'string') {
        return args[0];
      }
      return "";
    }
  };

  try {
    return (
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-24">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/5 blur-[100px]"></div>
        
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_400px] lg:gap-16 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className={safeClassNames("text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none", {
                  "animate-fade-in": true
                })}>
                  <span className="inline-block">Personalized Learning</span>{" "}
                  <span className="inline-block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Powered by AI
                  </span>
                </h1>
                <p className={safeClassNames("max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed", {
                  "animate-fade-in opacity-0": true
                })} style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
                  Discover a new way to learn with our AI-powered platform that adapts to your unique learning style and goals.
                </p>
              </div>
              <div className={safeClassNames("flex flex-col gap-2 min-[400px]:flex-row", {
                "animate-fade-in opacity-0": true
              })} style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
                <Button size="lg" asChild>
                  <Link to="/register">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/courses">Explore Courses</Link>
                </Button>
              </div>
              <div className={safeClassNames(
                "flex items-center gap-4 text-sm mt-8",
                "animate-fade-in opacity-0"
              )} style={{ animationDelay: "600ms", animationFillMode: "forwards" }}>
                {[
                  "Personalized Paths",
                  "Adaptive Learning",
                  "Multi-Format Content"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={safeClassNames(
              "mx-auto aspect-video w-full max-w-[600px] overflow-hidden rounded-xl border bg-white p-2 shadow-xl lg:order-last",
              "animate-fade-in opacity-0"
            )} style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
              <div className="glass rounded-lg overflow-hidden h-full w-full flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="w-24 h-24 bg-primary/5 rounded-full mx-auto flex items-center justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-12 w-12 text-primary"
                    >
                      <path d="M18 2H8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
                      <path d="M5 15H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-1" />
                      <path d="M22 18h-4v4" />
                      <path d="M18 18v-7" />
                      <path d="M22 11v7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Interactive Learning Experience</h3>
                  <p className="text-muted-foreground mb-6">Our AI analyses your progress and preferences to create the perfect learning journey.</p>
                  <div className="flex justify-center">
                    <div className="h-3 w-24 bg-secondary rounded-full relative overflow-hidden">
                      <div className="absolute left-0 top-0 h-full w-2/3 bg-primary rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error("[Hero] Error rendering component:", error);
    // Fallback UI in case of render error
    return (
      <section className="py-20">
        <div className="container px-4 text-center">
          <h2 className="text-2xl font-bold">Welcome to Learnfinity</h2>
          <p className="mt-4">Discover personalized learning powered by AI</p>
          <div className="mt-6">
            <Button asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }
};

export default Hero;
