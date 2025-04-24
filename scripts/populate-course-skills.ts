import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// --- HARDCODED KEYS/URLS ---
// These are from your codebase, for dev/test use only!
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';
const GROQ_API_KEY = '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';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function getAllCourses() {
  const { data, error } = await supabase
    .from('hr_courses')
    .select('id, title, description, skills');
  if (error) throw error;
  return data;
}

async function updateCourseSkills(courseId: string, skills: string[]) {
  const { error } = await supabase
    .from('hr_courses')
    .update({ skills })
    .eq('id', courseId);
  if (error) throw error;
}

function buildGroqPrompt(title: string, description: string) {
  return `
You are an expert in curriculum design. Given the following course title and description, list the core skills a learner should have or acquire to successfully complete this course. Output only a JSON array of skill names.

Course Title: ${title}
Course Description: ${description || ''}
`;
}

async function getSkillsFromGroq(title: string, description: string): Promise<string[]> {
  const systemPrompt = "You are a helpful assistant.";
  const userPrompt = buildGroqPrompt(title, description);

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 512,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  // Triple-verify: Parse and validate JSON array of strings
  let skills: string[] = [];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.skills) && parsed.skills.every(s => typeof s === 'string' && s.trim().length > 0)) {
      skills = parsed.skills;
    } else if (Array.isArray(parsed) && parsed.every(s => typeof s === 'string' && s.trim().length > 0)) {
      skills = parsed;
    } else {
      throw new Error('Groq output is not a valid array of non-empty strings');
    }
  } catch (err) {
    // Try to extract JSON array from text
    const match = content.match(/\[.*?\]/s);
    if (match) {
      try {
        const arr = JSON.parse(match[0]);
        if (Array.isArray(arr) && arr.every(s => typeof s === 'string' && s.trim().length > 0)) {
          skills = arr;
        }
      } catch {}
    }
    if (skills.length === 0) {
      throw new Error(`Failed to parse skills from Groq output: ${content}`);
    }
  }
  return skills;
}

async function main() {
  console.log('Starting course skills population script...');
  const courses = await getAllCourses();
  console.log(`Found ${courses.length} courses.`);
  
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const course of courses) {
    try {
      // Skip courses that already have skills
      if (course.skills && Array.isArray(course.skills) && course.skills.length > 0) {
        console.log(`Skipping "${course.title}" - already has ${course.skills.length} skills`);
        skipped++;
        continue;
      }
      
      console.log(`Processing: "${course.title}"`);
      const skills = await getSkillsFromGroq(course.title, course.description);
      console.log(`  Generated ${skills.length} skills: ${JSON.stringify(skills)}`);
      await updateCourseSkills(course.id, skills);
      console.log(`  ✅ Updated course ${course.id}`);
      updated++;
    } catch (err) {
      console.error(`❌ Error processing course "${course.title}":`, err);
      failed++;
    }
  }
  
  console.log('\nBulk skills extraction complete:');
  console.log(`- ${updated} courses updated`);
  console.log(`- ${skipped} courses skipped (already had skills)`);
  console.log(`- ${failed} courses failed`);
}

main().catch(console.error); 