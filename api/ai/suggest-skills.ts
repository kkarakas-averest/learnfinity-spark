// @vercel/node
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../src/lib/supabase';
import { createGroqClient } from '../lib/groq-client.js';

// Define interfaces
interface ApiError {
  error: string;
}

interface SkillSuggestion {
  skillName: string;
  category: string;
  level: string;
  description: string;
}

type ResponseData = {
  suggestedSkills: SkillSuggestion[];
} | ApiError;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { positionTitle, positionDescription } = req.body;

    if (!positionTitle) {
      return res.status(400).json({ error: 'Position title is required' });
    }

    // Create Groq client
    const groqClient = createGroqClient();

    // Generate structured output using Groq
    const result = await groqClient.generateWithStructuredOutput({
      prompt: `Given the position title "${positionTitle}" ${positionDescription ? `and description "${positionDescription}"` : ''}, 
      suggest relevant skills that would be required for this position. 
      Provide 5-10 relevant skills with appropriate categories and proficiency levels.
      Focus on technical skills, soft skills, and domain knowledge that would be important for this role.`,
      outputSchema: {
        type: "object",
        properties: {
          suggestedSkills: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skillName: { type: "string" },
                category: { type: "string" },
                level: { type: "string", enum: ["Beginner", "Intermediate", "Advanced", "Expert"] },
                description: { type: "string" }
              },
              required: ["skillName", "category", "level", "description"]
            }
          }
        },
        required: ["suggestedSkills"]
      }
    });

    console.log("Received skill suggestions:", result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in suggest-skills API:', error);
    return res.status(500).json({ error: 'Failed to generate skill suggestions' });
  }
} 