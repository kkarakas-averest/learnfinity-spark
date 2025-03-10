import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, BookOpen } from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number | string;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

interface QuizListProps {
  quizzes: Quiz[];
}

export function QuizList({ quizzes }: QuizListProps) {
  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No quizzes available for this course.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {quizzes.map((quiz) => (
        <Card key={quiz.id}>
          <CardHeader>
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-primary" />
              <CardTitle className="text-xl">{quiz.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-2">{quiz.description || "Test your knowledge with this quiz."}</p>
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>{quiz.questions.length} questions</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Start Quiz
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 