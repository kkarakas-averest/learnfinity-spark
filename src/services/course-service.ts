import { eq, sql, count } from "drizzle-orm";
import { db } from "@/db";
import {
  courses,
  courseModules,
  courseQuizzes,
  quizQuestions,
  courseAssignments,
  courseResources
} from "@/db/schema/courses";
import { GeneratedCourse } from "./agent-service";

/**
 * Service for course-related database operations
 */
export class CourseService {
  private static instance: CourseService;

  private constructor() {}

  /**
   * Get the singleton instance of CourseService
   */
  public static getInstance(): CourseService {
    if (!CourseService.instance) {
      CourseService.instance = new CourseService();
    }
    return CourseService.instance;
  }

  /**
   * Save a generated course to the database
   */
  public async saveCourse(generatedCourse: GeneratedCourse, userId: string): Promise<string> {
    try {
      // Begin a transaction
      return await db.transaction(async (tx) => {
        // 1. Insert the course
        const [course] = await tx
          .insert(courses)
          .values({
            title: generatedCourse.title,
            description: generatedCourse.description,
            targetAudience: generatedCourse.targetAudience,
            estimatedDuration: generatedCourse.estimatedDuration,
            learningObjectives: generatedCourse.learningObjectives,
            createdBy: userId,
            // Optional metadata fields
            generationPrompt: "",
            generatedBy: "EducatorAgent",
            generationModel: "gpt-4",
            generationConfig: {}
          })
          .returning({ id: courses.id });

        // 2. Insert modules
        if (generatedCourse.modules && generatedCourse.modules.length > 0) {
          for (let i = 0; i < generatedCourse.modules.length; i++) {
            const module = generatedCourse.modules[i];
            await tx.insert(courseModules).values({
              courseId: course.id,
              title: module.title,
              description: module.description,
              orderIndex: i,
              topics: module.topics,
              content: module.content
            });
          }
        }

        // 3. Insert quizzes if any
        if (generatedCourse.quizzes && generatedCourse.quizzes.length > 0) {
          for (const quiz of generatedCourse.quizzes) {
            const [quizRecord] = await tx
              .insert(courseQuizzes)
              .values({
                courseId: course.id,
                title: quiz.title,
                description: "Auto-generated quiz"
              })
              .returning({ id: courseQuizzes.id });

            // Insert quiz questions
            if (quiz.questions && quiz.questions.length > 0) {
              for (let i = 0; i < quiz.questions.length; i++) {
                const question = quiz.questions[i];
                await tx.insert(quizQuestions).values({
                  quizId: quizRecord.id,
                  questionText: question.question,
                  questionType: "multiple-choice", // Assuming multiple-choice for now
                  options: question.options,
                  correctAnswer: question.correctAnswer,
                  orderIndex: i,
                  difficulty: generatedCourse.targetAudience || "beginner" // Using targetAudience as difficulty
                });
              }
            }
          }
        }

        // 4. Insert assignments if any
        if (generatedCourse.assignments && generatedCourse.assignments.length > 0) {
          for (const assignment of generatedCourse.assignments) {
            await tx.insert(courseAssignments).values({
              courseId: course.id,
              title: assignment.title,
              description: assignment.description,
              tasks: assignment.tasks,
              submission: assignment.submission
            });
          }
        }

        // 5. Insert resources if any
        if (generatedCourse.resources && generatedCourse.resources.length > 0) {
          for (const resource of generatedCourse.resources) {
            await tx.insert(courseResources).values({
              courseId: course.id,
              title: resource.title,
              type: resource.type,
              url: resource.url,
              description: resource.description
            });
          }
        }

        // Return the course ID
        return course.id;
      });
    } catch (error) {
      console.error("Error saving course:", error);
      throw new Error("Failed to save course to database");
    }
  }

  /**
   * Get a course by ID with all related content
   */
  public async getCourseById(courseId: string): Promise<any> {
    try {
      // 1. Get the course
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId)
      });

      if (!course) {
        throw new Error(`Course with ID ${courseId} not found`);
      }

      // 2. Get modules
      const modules = await db.query.courseModules.findMany({
        where: eq(courseModules.courseId, courseId),
        orderBy: courseModules.orderIndex
      });

      // 3. Get quizzes
      const quizzes = await db.query.courseQuizzes.findMany({
        where: eq(courseQuizzes.courseId, courseId)
      });

      // 4. Get quiz questions for each quiz
      const quizzesWithQuestions = await Promise.all(
        quizzes.map(async (quiz) => {
          const questions = await db.query.quizQuestions.findMany({
            where: eq(quizQuestions.quizId, quiz.id),
            orderBy: quizQuestions.orderIndex
          });
          return { ...quiz, questions };
        })
      );

      // 5. Get assignments
      const assignments = await db.query.courseAssignments.findMany({
        where: eq(courseAssignments.courseId, courseId)
      });

      // 6. Get resources
      const resources = await db.query.courseResources.findMany({
        where: eq(courseResources.courseId, courseId)
      });

      // 7. Return the full course with all related content
      return {
        ...course,
        modules,
        quizzes: quizzesWithQuestions,
        assignments,
        resources
      };
    } catch (error) {
      console.error("Error getting course:", error);
      throw new Error(`Failed to retrieve course with ID ${courseId}`);
    }
  }

  /**
   * Get all courses with pagination
   */
  public async getCourses(
    options: {
      page?: number;
      limit?: number;
      published?: boolean;
      userId?: string;
    } = {}
  ): Promise<{ courses: any[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    try {
      // Build query for courses
      let query = db.select().from(courses);

      // Filter by published status if specified
      if (options.published !== undefined) {
        query = query.where(eq(courses.isPublished, options.published));
      }

      // Filter by user ID if specified
      if (options.userId) {
        query = query.where(eq(courses.createdBy, options.userId));
      }

      // Get total count for pagination
      const totalCountResult = await db.select({ 
        value: sql<number>`count(*)`
      }).from(courses);
      
      const total = totalCountResult[0]?.value || 0;

      // Execute the paginated query
      const coursesResult = await query.limit(limit).offset(offset).execute();

      return {
        courses: coursesResult,
        total
      };
    } catch (error) {
      console.error("Error getting courses:", error);
      throw new Error("Failed to retrieve courses");
    }
  }

  /**
   * Update a course's published status
   */
  public async publishCourse(courseId: string, published: boolean): Promise<void> {
    try {
      await db
        .update(courses)
        .set({
          isPublished: published,
          status: published ? "published" : "draft",
          updatedAt: new Date()
        })
        .where(eq(courses.id, courseId))
        .execute();
    } catch (error) {
      console.error("Error updating course published status:", error);
      throw new Error(`Failed to ${published ? "publish" : "unpublish"} course`);
    }
  }

  /**
   * Delete a course and all its related content
   */
  public async deleteCourse(courseId: string): Promise<void> {
    try {
      // Due to cascade delete set up in the schema, deleting the course
      // will delete all related content
      await db.delete(courses).where(eq(courses.id, courseId)).execute();
    } catch (error) {
      console.error("Error deleting course:", error);
      throw new Error("Failed to delete course");
    }
  }
} 