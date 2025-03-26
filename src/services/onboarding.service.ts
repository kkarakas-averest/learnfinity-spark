import { PersonalizationAgent } from '@/agents/roles/PersonalizationAgent';
import { ContentCreationAgent } from '@/agents/roles/ContentCreationAgent';
import { hrEmployeeService } from './hrEmployeeService';
import { emailService } from './emailService';
import type { EmployeeOnboardingData, EmployeeProfile, LearningPath } from '@/types/hr.types';

export class OnboardingService {
  private static instance: OnboardingService;
  private personalizationAgent: PersonalizationAgent;
  private contentCreationAgent: ContentCreationAgent;

  private constructor() {
    this.personalizationAgent = new PersonalizationAgent();
    this.contentCreationAgent = new ContentCreationAgent();
  }

  public static getInstance(): OnboardingService {
    if (!OnboardingService.instance) {
      OnboardingService.instance = new OnboardingService();
    }
    return OnboardingService.instance;
  }

  public async handleEmployeeOnboarding(data: EmployeeOnboardingData): Promise<{
    success: boolean;
    employeeId?: string;
    error?: string;
  }> {
    try {
      // 1. Create employee in HR system
      const createResult = await hrEmployeeService.createEmployee({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        department_id: data.department,
        position_id: undefined,
        status: 'onboarding',
        company_id: '1', // Default company ID
      });
      
      const employeeId = createResult.id;
      
      if (!employeeId || createResult.error) {
        throw new Error(createResult.error?.message || 'Failed to create employee in HR system');
      }

      // 2. Generate employee profile using AI
      const profile: EmployeeProfile = {
        id: employeeId,
        name: `${data.firstName} ${data.lastName}`,
        role: data.role,
        department: data.department,
        skills: data.skills || [],
        experience: data.experience || {
          years: 0,
          level: 'junior',
          previousRoles: []
        },
        learningPreferences: data.learningPreferences || {
          preferredLearningStyle: 'visual',
          preferredContentTypes: ['video', 'interactive'],
          learningGoals: []
        }
      };
      
      const generatedProfile = await this.personalizationAgent.createEmployeeProfile(profile);

      // 3. Generate personalized learning path
      const learningPath = await this.personalizationAgent.generateLearningPath(generatedProfile);

      // 4. Create initial content based on learning path
      await this.contentCreationAgent.createInitialContent(generatedProfile, learningPath);

      // 5. Send welcome email with credentials and learning path
      await emailService.sendWelcomeEmail(data.email, {
        firstName: data.firstName,
        credentials: {
          email: data.email,
          temporaryPassword: data.temporaryPassword
        },
        learningPath: {
          title: learningPath.title,
          description: learningPath.description,
          estimatedDuration: learningPath.duration
        }
      });

      return {
        success: true,
        employeeId
      };
    } catch (error) {
      console.error('Error during employee onboarding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during onboarding'
      };
    }
  }

  public async processBulkOnboarding(employees: EmployeeOnboardingData[]): Promise<{
    success: boolean;
    results: Array<{
      email: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const results = await Promise.all(
      employees.map(async (employee) => {
        try {
          const result = await this.handleEmployeeOnboarding(employee);
          return {
            email: employee.email,
            success: result.success,
            error: result.error
          };
        } catch (error) {
          return {
            email: employee.email,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return {
      success: results.every(r => r.success),
      results
    };
  }
} 