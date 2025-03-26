import { Resend } from 'resend';

// Create and export a singleton instance of Resend
export const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY); 