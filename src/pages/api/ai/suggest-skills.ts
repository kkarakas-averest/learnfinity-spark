import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { positionTitle } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!positionTitle) {
    return res.status(400).json({ error: 'Missing positionTitle' });
  }

  const systemPrompt = `You are an HR and learning expert.\nFor the position \"${positionTitle}\", list the top 5 most important skills required, using the following taxonomy structure:\n- category_name\n- subcategory_name\n- group_name\n- skill_name\n\nOutput a JSON array, with each skill as an object with these fields.\nDo not include any explanation or extra text—just the JSON array.\nUse industry-standard terminology and focus on the core responsibilities of the position.\n\nExample:\n[\n  {\n    \"category_name\": \"Software Development\",\n    \"subcategory_name\": \"Frontend Development\",\n    \"group_name\": \"Web Frameworks\",\n    \"skill_name\": \"React\"\n  }\n]`;

  try {
    const response = await axios({
      method: 'post',
      url: GROQ_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      data: {
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Suggest skills for the position: ${positionTitle}` }
        ],
        temperature: 0.3,
        max_tokens: 512
      }
    });

    // Extract and parse the JSON array from the response
    const content = response.data.choices[0].message.content.trim();
    let skills: any[] = [];
    try {
      // Find the first [ ... ] block in the response
      const match = content.match(/\[.*\]/s);
      if (match) {
        skills = JSON.parse(match[0]);
      } else {
        skills = JSON.parse(content);
      }
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse skills JSON from Groq response', raw: content });
    }

    return res.status(200).json({ success: true, skills });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Groq API error' });
  }
} 