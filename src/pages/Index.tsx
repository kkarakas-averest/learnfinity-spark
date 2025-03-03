import { cn } from "@/lib/utils";
import { ArrowRight, Bookmark, Layers, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";

const Index = () => {
  const features = [
    {
      icon: <Layers className="h-6 w-6 text-primary" />,
      title: "AI-Curated Learning Paths",
      description:
        "Personalized learning journeys based on your goals, experience, and learning style.",
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "Adaptive Content Delivery",
      description:
        "Content that adjusts to your progress and understanding, ensuring efficient learning.",
    },
    {
      icon: <Bookmark className="h-6 w-6 text-primary" />,
      title: "Multi-format Resources",
      description:
        "Access courses in various formats including video, text, interactive exercises, and more.",
    },
  ];

  const testimonials = [
    {
      quote:
        "The personalized learning paths have completely transformed my approach to professional development.",
      author: "Alex Johnson",
      role: "Software Developer",
    },
    {
      quote:
        "I've tried many learning platforms, but none adapted to my pace and style like this one does.",
      author: "Sarah Chen",
      role: "Product Manager",
    },
    {
      quote:
        "The AI recommendations helped me discover skills I didn't know I needed, but have been invaluable.",
      author: "Miguel Rodriguez",
      role: "UX Designer",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <Hero />

        {/* Features Section */}
        <section className="py-20 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className={cn(
              "text-center max-w-[800px] mx-auto mb-12 md:mb-16",
              "animate-fade-in"
            )}>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Revolutionize Your Learning Experience
              </h2>
              <p className="mt-4 text-xl text-muted-foreground">
                Our AI-powered platform delivers a tailored learning experience designed specifically for you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-white rounded-xl p-8 shadow-sm transition-all duration-200 hover:shadow-md"
                  )}
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20">
          <div className="container px-4 md:px-6">
            <div className={cn(
              "text-center max-w-[800px] mx-auto mb-12 md:mb-16",
              "animate-fade-in"
            )}>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                What Our Learners Say
              </h2>
              <p className="mt-4 text-xl text-muted-foreground">
                Discover how our platform is transforming learning experiences
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              {testimonials.map((testimonial, i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-secondary/30 rounded-xl p-8 border border-secondary relative"
                  )}
                >
                  <div className="absolute -top-3 -left-3 text-4xl text-primary opacity-50">"</div>
                  <p className="mb-6 relative z-10 text-muted-foreground">
                    {testimonial.quote}
                  </p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-white">
          <div className="container px-4 md:px-6">
            <div className={cn(
              "max-w-[800px] mx-auto text-center",
              "animate-fade-in"
            )}>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6">
                Start Your Personalized Learning Journey Today
              </h2>
              <p className="text-xl mb-8 text-primary-foreground/80">
                Join thousands of learners already benefiting from AI-powered education
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/register" className="text-primary">
                  Get Started for Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container px-4 md:px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl font-semibold mb-4">Learnfinity</div>
              <p className="text-sm text-muted-foreground">
                AI-powered personalized learning platform that adapts to your unique needs and goals.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Platform</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/courses" className="text-sm text-muted-foreground hover:text-primary">
                    Courses
                  </Link>
                </li>
                <li>
                  <Link to="/learning-paths" className="text-sm text-muted-foreground hover:text-primary">
                    Learning Paths
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-sm text-muted-foreground hover:text-primary">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/hr-login" className="text-sm text-muted-foreground hover:text-primary">
                    HR Admin
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="text-sm text-muted-foreground hover:text-primary">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Learnfinity. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
