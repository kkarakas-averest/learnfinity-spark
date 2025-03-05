
import { useState, useEffect } from '@/lib/react-helpers';
import { Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { useCoursesData } from '@/hooks/useCoursesData';
import CourseCard from '@/components/CourseCard';

const categories = [
  "All",
  "Programming",
  "Data Science",
  "Design",
  "Business",
  "Marketing",
  "AI & Machine Learning"
];

// Mock data for categories that don't exist in the database
const courseCategoryMap = {
  "Programming": ["Programming", "Development", "Coding"],
  "Data Science": ["Data Science", "Analytics", "Statistics"],
  "Design": ["Design", "UI/UX", "Graphic Design"],
  "Business": ["Business", "Management", "Entrepreneurship"],
  "Marketing": ["Marketing", "Digital Marketing", "SEO"],
  "AI & Machine Learning": ["AI", "Machine Learning", "Deep Learning"]
};

const CoursesPage = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { courses, coursesLoading: isLoading, coursesError: error } = useCoursesData();

  // Add mock categories to courses since they don't have categories in the database
  const enhancedCourses = courses.map(course => ({
    ...course,
    category: courseCategoryMap[Object.keys(courseCategoryMap)[Math.floor(Math.random() * Object.keys(courseCategoryMap).length)]][0],
    level: ["Beginner", "Intermediate", "Advanced"][Math.floor(Math.random() * 3)],
    duration: `${Math.floor(Math.random() * 10) + 1} hours`,
    enrolled: Math.floor(Math.random() * 1000),
    image: `https://source.unsplash.com/random/800x600?${course.title.split(' ')[0].toLowerCase()}`
  }));

  // Filter courses based on search query and selected category
  const filteredCourses = enhancedCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  // Show error toast if data fetching fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading courses",
        description: "There was a problem loading the course catalog. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <div className="container py-10 px-4 mx-auto max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Browse our extensive collection of courses to enhance your skills
          </p>
        </div>
        
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative w-full md:w-[300px]">
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-0 top-0 h-full"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <ScrollArea className="w-full whitespace-nowrap pb-4 mb-8">
        <div className="flex space-x-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategorySelect(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-[180px] w-full rounded-t-lg" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Link 
              key={course.id} 
              to={`/courses/${course.id}`}
              className="no-underline"
            >
              <CourseCard 
                id={course.id}
                title={course.title}
                description={course.description || ''}
                category={course.category}
                duration={course.duration}
                level={course.level}
                enrolled={course.enrolled}
                image={course.image}
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <h3 className="text-2xl font-semibold mb-2">No courses found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter to find what you're looking for
          </p>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
