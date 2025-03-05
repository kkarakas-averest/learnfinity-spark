
import * as React from "react";
import { Search, Filter, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import CourseCard from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Mock data
const mockCourses = [
  {
    id: "1",
    title: "Introduction to Machine Learning",
    description: "Learn the fundamentals of machine learning algorithms and applications.",
    category: "Data Science",
    duration: "8 hours",
    level: "Beginner" as const,
    enrolled: 4500,
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Advanced React Development",
    description: "Master advanced concepts in React including hooks, context, and Redux.",
    category: "Web Development",
    duration: "12 hours",
    level: "Intermediate" as const,
    enrolled: 3200,
    image: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "UX/UI Design Essentials",
    description: "Learn the core principles of user experience and interface design.",
    category: "Design",
    duration: "10 hours",
    level: "Beginner" as const,
    enrolled: 2800,
    image: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "4",
    title: "Python for Data Analysis",
    description: "Master Python libraries for data manipulation and visualization.",
    category: "Data Science",
    duration: "15 hours",
    level: "Intermediate" as const,
    enrolled: 5200,
    image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "5",
    title: "Cloud Architecture with AWS",
    description: "Design scalable and resilient applications using AWS services.",
    category: "Cloud Computing",
    duration: "18 hours",
    level: "Advanced" as const,
    enrolled: 1800,
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "6",
    title: "JavaScript: From Novice to Ninja",
    description: "Comprehensive JavaScript course covering basics to advanced patterns.",
    category: "Web Development",
    duration: "20 hours",
    level: "Beginner" as const,
    enrolled: 7500,
    image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?q=80&w=1600&auto=format&fit=crop",
  },
];

const categories = [
  "Web Development",
  "Data Science",
  "Design",
  "Cloud Computing",
  "Mobile Development",
  "DevOps",
  "Cybersecurity",
];

const levels = ["Beginner", "Intermediate", "Advanced"];

const Courses = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCourses, setFilteredCourses] = useState(mockCourses);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("popular");
  
  // For mobile filter sheet state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  useEffect(() => {
    let result = mockCourses;
    
    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by categories
    if (selectedCategories.length > 0) {
      result = result.filter((course) =>
        selectedCategories.includes(course.category)
      );
    }
    
    // Filter by levels
    if (selectedLevels.length > 0) {
      result = result.filter((course) =>
        selectedLevels.includes(course.level)
      );
    }
    
    // Sort courses
    switch (sortBy) {
      case "popular":
        result = [...result].sort((a, b) => b.enrolled - a.enrolled);
        break;
      case "newest":
        // In a real app, would sort by date
        result = [...result];
        break;
      case "title-asc":
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        result = [...result].sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }
    
    setFilteredCourses(result);
  }, [searchTerm, selectedCategories, selectedLevels, sortBy]);
  
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };
  
  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level)
        ? prev.filter((l) => l !== level)
        : [...prev, level]
    );
  };
  
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedLevels([]);
    setSearchTerm("");
  };
  
  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
              />
              <Label htmlFor={`category-${category}`} className="text-sm">
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-sm font-medium mb-3">Level</h3>
        <div className="space-y-2">
          {levels.map((level) => (
            <div key={level} className="flex items-center space-x-2">
              <Checkbox
                id={`level-${level}`}
                checked={selectedLevels.includes(level)}
                onCheckedChange={() => toggleLevel(level)}
              />
              <Label htmlFor={`level-${level}`} className="text-sm">
                {level}
              </Label>
            </div>
          ))}
        </div>
      </div>
      
      <Separator />
      
      <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-secondary/20">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight mb-2 animate-fade-in">Explore Courses</h1>
            <p className="text-muted-foreground mb-8 animate-fade-in opacity-0" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
              Discover our library of courses tailored to your learning goals
            </p>
            
            <div className="flex flex-col lg:flex-row gap-8 mb-10">
              {/* Desktop Filters */}
              <div className="hidden lg:block w-64 flex-shrink-0 animate-fade-in opacity-0" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                  <h2 className="font-semibold mb-4">Filters</h2>
                  <FilterContent />
                </div>
              </div>
              
              <div className="flex-1 space-y-6 animate-fade-in opacity-0" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
                {/* Search and Sort Bar */}
                <div className="flex flex-col md:flex-row gap-4 animate-fade-in opacity-0" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                      <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Mobile Filter Button */}
                  <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden gap-2">
                        <Filter size={16} />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                        <SheetDescription>
                          Narrow down courses to find exactly what you need.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterContent />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
                
                {/* Active Filters */}
                {(selectedCategories.length > 0 || selectedLevels.length > 0) && (
                  <div className="flex flex-wrap gap-2 animate-fade-in">
                    {selectedCategories.map((category) => (
                      <Badge
                        key={category}
                        variant="secondary"
                        className="px-3 py-1 flex items-center gap-1"
                      >
                        {category}
                        <button onClick={() => toggleCategory(category)}>
                          <X size={14} />
                        </button>
                      </Badge>
                    ))}
                    {selectedLevels.map((level) => (
                      <Badge
                        key={level}
                        variant="secondary"
                        className="px-3 py-1 flex items-center gap-1"
                      >
                        {level}
                        <button onClick={() => toggleLevel(level)}>
                          <X size={14} />
                        </button>
                      </Badge>
                    ))}
                    {(selectedCategories.length > 0 || selectedLevels.length > 0) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-muted-foreground text-xs h-8"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>
                )}
                
                {/* Courses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => (
                      <CourseCard key={course.id} {...course} />
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center">
                      <h3 className="text-xl font-medium mb-2">No courses found</h3>
                      <p className="text-muted-foreground mb-4">
                        Try adjusting your search or filter criteria
                      </p>
                      <Button onClick={clearFilters}>Clear Filters</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Courses;
