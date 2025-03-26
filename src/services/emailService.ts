import { resend } from '@/lib/resend';
import { WelcomeEmail } from '@/components/emails/WelcomeEmail';
import type { WelcomeEmailProps } from '@/types/email.types';

class EmailService {
  private static instance: EmailService;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async sendWelcomeEmail(
    recipientEmail: string,
    data: WelcomeEmailProps
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await resend.emails.send({
        from: 'onboarding@learnfinity.ai',
        to: recipientEmail,
        subject: 'Welcome to Learnfinity! Get Started with Your Learning Journey',
        react: WelcomeEmail({
          firstName: data.firstName,
          credentials: data.credentials,
          learningPath: data.learningPath
        })
      });

      return {
        success: true
      };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send welcome email'
      };
    }
  }
}

export const emailService = EmailService.getInstance(); 