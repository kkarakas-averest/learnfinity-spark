import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from '@/lib/supabase';

// HARDCODED GROQ API KEY (as per requirement)
const HARDCODED_GROQ_API_KEY = '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';

// Configuration for skill similarity matching
const SKILL_MATCHING = {
  // Minimum threshold for considering skills similar (0-1)
  SIMILARITY_THRESHOLD: 0.65,
  // Enable/disable semantic matching via Groq API (more accurate but slower)
  USE_SEMANTIC_MATCHING: true,
  // Maximum semantic API calls per assessment to avoid rate limits
  MAX_SEMANTIC_CALLS: 30,
  // Cache expiration time in milliseconds (1 hour)
  CACHE_EXPIRATION_MS: 60 * 60 * 1000,
};

// Cache for similarity results to avoid redundant API calls
interface SimilarityCache {
  [key: string]: {
    similarity: number;
    timestamp: number;
  };
}

// Initialize similarity cache (persists between assessments)
const similarityCache: SimilarityCache = {};

// Mock data for fallback when APIs fail
const MOCK_EMPLOYEE_SKILLS = [
  "JavaScript", "React", "TypeScript", "Node.js", "HTML/CSS", 
  "UI/UX Design", "Project Management", "Communication", "Problem Solving"
];

const MOCK_COURSE_SKILLS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Redux", 
  "GraphQL", "REST API", "Unit Testing", "Git", "CI/CD"
];

type Employee = {
  id: string;
  name: string;
  email: string;
  resume_url?: string;
  profile_image_url?: string;
  department?: string;
  position?: string;
  [key: string]: any;
};

type Course = {
  id: string;
  title: string;
  skills: string[];
};

type AssessmentResult = {
  employee: Employee;
  course: Course;
  employeeSkills: string[];
  missingSkills: string[];
  extractedCvData?: any;
  employeeSummary?: string;
  suggestedSkills?: string[];
  skillsCoverage?: number;
};

interface BulkSkillsAssessmentProps {
  employees: Employee[];
}

// Skill similarity helpers
// -----------------------

/**
 * Calculate word-based similarity between two skills
 * This is fast but less accurate than semantic similarity
 */
const getWordSimilarity = (skill1: string, skill2: string): number => {
  // Normalize and tokenize skills
  const normalizedSkill1 = skill1.toLowerCase().trim();
  const normalizedSkill2 = skill2.toLowerCase().trim();
  
  // If exact match after normalization, return 1
  if (normalizedSkill1 === normalizedSkill2) return 1;
  
  // Extract words (remove non-word characters)
  const words1 = normalizedSkill1.split(/\W+/).filter(Boolean);
  const words2 = normalizedSkill2.split(/\W+/).filter(Boolean);
  
  // If either has no valid words, return 0
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // Calculate word overlap and importance
  let matches = 0;
  const uniqueWords1 = new Set(words1);
  const uniqueWords2 = new Set(words2);
  
  // Check word equality and similarity
  for (const word1 of uniqueWords1) {
    // Skip very short words (articles, etc.)
    if (word1.length <= 2) continue;
    
    // Check for exact word match
    if (uniqueWords2.has(word1)) {
      matches += 1;
      continue;
    }
    
    // Check for word containment (e.g., 'react' in 'reactjs')
    for (const word2 of uniqueWords2) {
      if (word2.length <= 2) continue;
      if (word1.includes(word2) || word2.includes(word1)) {
        matches += 0.8; // Partial credit for containment
        break;
      }
    }
  }
  
  // Calculate similarity score (0-1)
  return matches / Math.max(uniqueWords1.size, uniqueWords2.size);
};

/**
 * Get semantic similarity between skills using Groq API
 * This is more accurate but requires API call
 */
const getSemanticSimilarity = async (
  skill1: string, 
  skill2: string,
  semanticCallsRemaining: { count: number }
): Promise<number> => {
  // Don't make API call if we're over the limit
  if (semanticCallsRemaining.count <= 0) {
    console.log('Skipping semantic similarity check - over API call limit');
    return 0;
  }
  
  // Decrement remaining calls counter
  semanticCallsRemaining.count--;
  
  try {
    const prompt = `
      You are a specialized AI that compares skills for similarity.
      
      SKILL 1: "${skill1}"
      SKILL 2: "${skill2}"
      
      On a scale of 0 to 1, how similar are these skills semantically?
      
      Consider:
      - Same skill with different wording (e.g., "React development" vs "React.js programming")
      - Same domain but different specificity (e.g., "UI Design" vs "User Interface Design")
      - Related skills in the same area (e.g., "Time Management" vs "Task Prioritization")
      
      Rules:
      - Exact matches = 1.0
      - Complete different areas = 0.0
      - Provide only a numeric score between 0 and 1 with up to 2 decimal places
      - RESPOND WITH ONLY A NUMBER, NO OTHER TEXT
    `;
    
    console.log(`Getting semantic similarity for "${skill1}" and "${skill2}"`);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HARDCODED_GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a skill similarity scoring engine. Respond only with a number between 0 and 1.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.0,
        max_tokens: 10
      })
    });
    
    if (!response.ok) {
      console.error(`Groq API similarity error: ${response.status}`);
      return 0;
    }
    
    const result = await response.json();
    const content = result.choices[0]?.message?.content?.trim();
    const similarityScore = parseFloat(content);
    
    // Validate the result is a number between 0 and 1
    if (isNaN(similarityScore) || similarityScore < 0 || similarityScore > 1) {
      console.error(`Invalid similarity score: ${content}`);
      return 0;
    }
    
    console.log(`Semantic similarity for "${skill1}" and "${skill2}": ${similarityScore}`);
    return similarityScore;
  } catch (error) {
    console.error('Error getting semantic similarity:', error);
    return 0;
  }
};

/**
 * Check if two skills are similar enough to be considered a match
 * Uses combination of word-based and semantic similarity with caching
 */
const areSkillsSimilar = async (
  employeeSkill: string,
  courseSkill: string,
  semanticCallsRemaining: { count: number },
  threshold = SKILL_MATCHING.SIMILARITY_THRESHOLD
): Promise<boolean> => {
  // Generate cache key (order doesn't matter)
  const skills = [employeeSkill.toLowerCase(), courseSkill.toLowerCase()].sort();
  const cacheKey = skills.join('|');
  
  // Check cache first
  const now = Date.now();
  const cachedResult = similarityCache[cacheKey];
  if (cachedResult && (now - cachedResult.timestamp) < SKILL_MATCHING.CACHE_EXPIRATION_MS) {
    return cachedResult.similarity >= threshold;
  }
  
  // Calculate word-based similarity (fast)
  const wordSimilarity = getWordSimilarity(employeeSkill, courseSkill);
  
  // If word similarity is conclusive, don't use semantic API
  if (wordSimilarity >= 0.9 || wordSimilarity < 0.3) {
    similarityCache[cacheKey] = { similarity: wordSimilarity, timestamp: now };
    return wordSimilarity >= threshold;
  }
  
  // If enabled and not conclusive, get semantic similarity
  let finalSimilarity = wordSimilarity;
  if (SKILL_MATCHING.USE_SEMANTIC_MATCHING) {
    const semanticSimilarity = await getSemanticSimilarity(
      employeeSkill, 
      courseSkill,
      semanticCallsRemaining
    );
    finalSimilarity = Math.max(wordSimilarity, semanticSimilarity);
  }
  
  // Cache the result
  similarityCache[cacheKey] = { similarity: finalSimilarity, timestamp: now };
  return finalSimilarity >= threshold;
};

export const BulkSkillsAssessment: React.FC<BulkSkillsAssessmentProps> = ({ employees }: BulkSkillsAssessmentProps) => {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<string[]>([]);
  const [assessmentResults, setAssessmentResults] = React.useState<AssessmentResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [processingStep, setProcessingStep] = React.useState<string>('');
  const [expandedEmployees, setExpandedEmployees] = React.useState<Record<string, boolean>>({});
  const [useFallbackData, setUseFallbackData] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);

  // Replace useSession with Supabase user fetch
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id || null);
    });
  }, []);

  const handleSelectAll = (checked: boolean) => {
    setSelectedEmployeeIds(checked ? employees.map((e: Employee) => e.id) : []);
  };

  const handleSelectEmployee = (id: string, checked: boolean) => {
    setSelectedEmployeeIds((prev: string[]) =>
      checked ? [...prev, id] : prev.filter((eid: string) => eid !== id)
    );
  };

  const clearSelection = () => {
    setSelectedEmployeeIds([]);
  };

  const toggleEmployeeExpand = (employeeId: string) => {
    setExpandedEmployees((prev: Record<string, boolean>) => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  const toggleFallbackMode = () => {
    setUseFallbackData((prev: boolean) => !prev);
    toast({
      title: useFallbackData ? "Using real API data" : "Using fallback mock data",
      description: useFallbackData 
        ? "The assessment will attempt to use actual API data" 
        : "The assessment will use mock data for demonstration purposes",
      variant: "default"
    });
  };

  // Function to extract CV data using GROQ API
  const extractCvData = async (employee: Employee) => {
    setProcessingStep(`Extracting CV data for ${employee.name}...`);
    
    // DIAGNOSTIC LOGGING
    console.group(`📋 CV Extraction Diagnostics for ${employee.name} (${employee.id})`);
    console.log('Employee Full Data:', JSON.stringify(employee, null, 2));
    console.log('Has cv_extracted_data:', Boolean(employee.cv_extracted_data));
    console.log('cv_extracted_data type:', employee.cv_extracted_data ? typeof employee.cv_extracted_data : 'N/A');
    console.log('Has resume_url:', Boolean(employee.resume_url));
    console.log('Resume URL:', employee.resume_url || 'Not available');
    
    // Check if we have existing CV data in the employee record
    if (employee.cv_extracted_data) {
      try {
        console.log('Attempting to parse existing cv_extracted_data...');
        let parsedData = employee.cv_extracted_data;
        
        // If it's stored as a string, parse it
        if (typeof employee.cv_extracted_data === 'string') {
          console.log('cv_extracted_data is a string, parsing as JSON...');
          try {
            parsedData = JSON.parse(employee.cv_extracted_data);
            console.log('Successfully parsed cv_extracted_data as JSON');
          } catch (e) {
            console.error('Failed to parse cv_extracted_data string as JSON:', e);
          }
        }
        
        // Check if we have a valid skills array
        if (parsedData.skills && Array.isArray(parsedData.skills) && parsedData.skills.length > 0) {
          console.log('Found valid skills array in cv_extracted_data:', parsedData.skills);
          console.log('Using existing extracted CV data instead of calling Groq API');
          console.groupEnd();
          
          return {
            success: true,
            skills: parsedData.skills,
            summary: parsedData.summary || `${employee.name} is a ${employee.position || 'professional'} in the ${employee.department || 'industry'} department.`,
            suggestedSkills: parsedData.suggestedSkills || []
          };
        } else {
          console.log('No valid skills array found in cv_extracted_data');
        }
      } catch (e) {
        console.error('Error processing existing cv_extracted_data:', e);
      }
    }
    
    // Use fallback mock data if enabled or if employee has no resume URL
    if (useFallbackData || !employee.resume_url) {
      if (!employee.resume_url) {
        console.warn(`No resume URL found for employee ${employee.name}`);
      }
      
      console.log('Using fallback mock data generation');
      
      // Generate some fake skills based on employee name as seed
      const nameHash = employee.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const randomSkillsCount = 5 + (nameHash % 4); // 5-8 skills
      
      // Select random skills from mock data
      const shuffledSkills = [...MOCK_EMPLOYEE_SKILLS].sort(() => 0.5 - Math.random());
      const selectedSkills = shuffledSkills.slice(0, randomSkillsCount);
      
      const result = {
        success: true,
        skills: selectedSkills,
        summary: `This is a generated placeholder profile for ${employee.name}, a ${employee.position || 'professional'} in the ${employee.department || 'industry'} department, as no real CV content was available.`,
        suggestedSkills: shuffledSkills.slice(randomSkillsCount, randomSkillsCount + 3)
      };
      
      console.log('Generated fallback result:', result);
      console.groupEnd();
      return result;
    }

    console.log('Proceeding with Groq API call...');
    // Prepare prompt with employee info (simulate CV content)
    const pdfContent = `No CV available. Please analyze based on the following details:\nEmployee Name: ${employee.name}\nDepartment: ${employee.department || 'Unknown'}\nPosition: ${employee.position || 'Unknown'}`;

    const structuredPrompt = `
      You are an expert HR recruiter and resume analyzer with years of experience extracting meaningful information from CVs and resumes.
      
      CV CONTENT:
      ${pdfContent}
      
      EMPLOYEE: ${employee.name}
      POSITION: ${employee.position || 'Unknown'}
      DEPARTMENT: ${employee.department || 'Unknown'}
      
      TASK:
      Your task is to create a detailed professional profile based on the CV content provided.
      If the CV content appears to be missing, corrupted, or contains extraction errors, create a realistic
      placeholder profile for someone with this name, position, and department, but clearly indicate it's a placeholder.
      
      EXTRACTION INSTRUCTIONS:
      1. If the CV content is readable:
         - Extract REAL information from the CV - never make assumptions
         - Focus on specific company names, job titles, time periods, skills, and accomplishments
         - If a section truly has no information, use empty arrays [] rather than "Not specified"
      
      2. If the CV content is NOT readable (contains errors or is missing):
         - Create a realistic placeholder profile for someone in this position and department
         - Generate reasonable skills, experience, education based on the position
         - CLEARLY indicate in the summary that this is a generated placeholder profile
         - Try to incorporate any readable fragments from the CV content if available
      
      Format your response as this JSON structure:
      {
        "summary": "Detailed professional profile summarizing career and expertise. If this is a placeholder, clearly state this fact.",
        "skills": ["Skill 1", "Skill 2"],
        "experience": [{"title": "Job title", "company": "Company name", "duration": "Time period", "highlights": ["Achievement"]}],
        "education": [{"degree": "Degree", "institution": "Institution", "year": "Year"}],
        "certifications": ["Certification"],
        "languages": ["Language"],
        "keyAchievements": ["Achievement"],
        "personalInsights": {
          "yearsOfExperience": "Years",
          "industries": ["Industry"],
          "toolsAndTechnologies": ["Tool/technology"],
          "softSkills": ["Soft skill"]
        },
        "isPlaceholder": true/false
      }
      
      IMPORTANT:
      - If using real CV data, be as accurate and specific as possible
      - If creating a placeholder, make it realistic but clearly labeled
      - Respond ONLY with the JSON object, no explanatory text
    `;

    const systemMessage = `You are an expert CV analyzer that extracts or generates structured profile information.\nWhen provided with CV text, extract real information accurately.\nIf the CV text appears corrupted, missing, or contains extraction errors, generate a realistic placeholder profile for the person's position and department.\nAlways indicate clearly when generating placeholder information.\nReturn ONLY a properly formatted JSON object with no additional text.`;

    // Retry logic for Groq API
    let retries = 2;
    let response;
    while (retries >= 0) {
      try {
        console.log(`Making Groq API request (attempts remaining: ${retries})...`);
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${HARDCODED_GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: structuredPrompt }
            ],
            temperature: 0.0,
            max_tokens: 2000
          })
        });
        
        console.log(`Groq API response status: ${response.status}`);
        if (response.ok) break;
        if (![429, 500, 503].includes(response.status)) break;
        retries--;
        if (retries >= 0) await new Promise(res => setTimeout(res, (2 - retries) * 1000));
      } catch (fetchError) {
        console.error('Fetch error during Groq API call:', fetchError);
        retries--;
        if (retries < 0) throw fetchError;
        await new Promise(res => setTimeout(res, 1000));
      }
    }
    if (!response || !response.ok) {
      const errorData = response ? await response.json().catch(() => ({})) : {};
      console.error('Groq API error:', errorData);
      console.groupEnd();
      throw new Error(`Groq API error (${response?.status}): ${errorData.error?.message || 'Unknown error'}`);
    }
    
    console.log('Successfully received Groq API response');
    const result = await response.json();
    console.log('Groq API full response:', result);
    
    const content = result.choices[0]?.message?.content;
    if (!content) {
      console.error('No content returned from Groq API');
      console.groupEnd();
      throw new Error('No content returned from Groq API');
    }
    
    // Robust JSON extraction
    try {
      const parsedResult = JSON.parse(content);
      console.log('Successfully parsed Groq response as JSON:', parsedResult);
      console.groupEnd();
      return parsedResult;
    } catch (e) {
      console.error('Failed to parse Groq response as JSON:', e);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsedResult = JSON.parse(jsonMatch[0]);
          console.log('Successfully parsed extracted JSON from Groq response:', parsedResult);
          console.groupEnd();
          return parsedResult;
        } catch (e2) {
          console.error('Failed to parse extracted JSON from Groq response:', e2);
        }
      }
      console.groupEnd();
      throw new Error('Failed to parse Groq response as JSON');
    }
  };

  // Function to fetch employee courses
  const fetchEmployeeCourses = async (employeeId: string): Promise<Course[]> => {
    if (useFallbackData) {
      // Generate 1-2 mock courses with skills
      const mockCourseCount = Math.floor(Math.random() * 2) + 1;
      const mockCourses: Course[] = [];
      
      for (let i = 0; i < mockCourseCount; i++) {
        // Generate random skill count and select random skills
        const skillCount = 5 + Math.floor(Math.random() * 5); // 5-9 skills
        const shuffledSkills = [...MOCK_COURSE_SKILLS].sort(() => 0.5 - Math.random());
        
        mockCourses.push({
          id: `mock-course-${i}-${employeeId.substring(0, 5)}`,
          title: [`Frontend Development`, `React Advanced`, `Full Stack JavaScript`, `Leadership Skills`][i % 4],
          skills: shuffledSkills.slice(0, skillCount)
        });
      }
      
      return mockCourses;
    }
    
    try {
      // First try the relative API endpoint
      let coursesRes = await fetch(`/api/hr/employee-courses?employeeId=${employeeId}`);
      
      // If that fails, try the absolute URL (for production)
      if (!coursesRes.ok) {
        const baseUrl = window.location.origin;
        coursesRes = await fetch(`${baseUrl}/api/hr/employee-courses?employeeId=${employeeId}`);
      }
      
      if (!coursesRes.ok) {
        throw new Error(`Failed to fetch courses: ${coursesRes.statusText}`);
      }
      
      const coursesData = await coursesRes.json();
      return coursesData.courses || [];
    } catch (err) {
      console.error(`Error fetching courses for employee ${employeeId}:`, err);
      
      // Return mock data as fallback
      return [{
        id: `fallback-course-${employeeId.substring(0, 5)}`,
        title: 'Core Skills Development',
        skills: MOCK_COURSE_SKILLS.slice(0, 6)
      }];
    }
  };

  // Function to fetch course skills
  const fetchCourseSkills = async (courseId: string): Promise<string[]> => {
    if (useFallbackData) {
      // Return random selection of mock skills
      const skillCount = 5 + Math.floor(Math.random() * 5); // 5-9 skills
      const shuffledSkills = [...MOCK_COURSE_SKILLS].sort(() => 0.5 - Math.random());
      return shuffledSkills.slice(0, skillCount);
    }
    
    try {
      // First try the relative API endpoint
      let courseRes = await fetch(`/api/hr/courses/${courseId}`);
      
      // If that fails, try the absolute URL (for production)
      if (!courseRes.ok) {
        const baseUrl = window.location.origin;
        courseRes = await fetch(`${baseUrl}/api/hr/courses/${courseId}`);
      }
      
      if (!courseRes.ok) {
        return []; // Return empty if course not found
      }
      
      const courseData = await courseRes.json();
      return courseData.skills || [];
    } catch (err) {
      console.error(`Error fetching skills for course ${courseId}:`, err);
      return [];
    }
  };

  const handleAssessSkills = async () => {
    setLoading(true);
    setShowModal(true);
    setAssessmentResults([]);
    setError(null);
    setProcessingStep('Initializing assessment...');
    setExpandedEmployees({});

    try {
      const results: AssessmentResult[] = [];
      // Track number of semantic API calls remaining for this assessment
      const semanticCallsRemaining = { count: SKILL_MATCHING.MAX_SEMANTIC_CALLS };
      
      for (const employeeId of selectedEmployeeIds) {
        try {
          const employee = employees.find((e: Employee) => e.id === employeeId);
          if (!employee) continue;
          
          setProcessingStep(`Processing ${employee.name}...`);
          
          // Step 1: Extract CV data using GROQ API to identify skills
          const cvData = await extractCvData(employee);
          const employeeSkills = cvData.success ? cvData.skills : [];
          
          // Step 2: Fetch assigned courses for this employee
          setProcessingStep(`Fetching courses for ${employee.name}...`);
          const courses = await fetchEmployeeCourses(employeeId);

          // Skip employees with no assigned courses
          if (courses.length === 0) {
            continue;
          }

          // Step 3: For each course, identify the required skills and compute gaps
          for (const course of courses) {
            setProcessingStep(`Analyzing skills gap for ${employee.name} - ${course.title}...`);
            
            // Get course skills
            const courseSkills = course.skills || [];
            console.group(`🔍 Skills Assessment: ${employee.name} - ${course.title}`);
            console.log('Employee Skills:', employeeSkills);
            console.log('Course Required Skills:', courseSkills);
            
            // Calculate missing skills with semantic similarity matching
            const missingSkills: string[] = [];
            
            for (const courseSkill of courseSkills) {
              let hasMatchingSkill = false;
              
              // Check if any employee skill is similar to this course skill
              for (const employeeSkill of employeeSkills) {
                if (await areSkillsSimilar(
                  employeeSkill, 
                  courseSkill, 
                  semanticCallsRemaining,
                  SKILL_MATCHING.SIMILARITY_THRESHOLD
                )) {
                  hasMatchingSkill = true;
                  console.log(`✅ Matched "${courseSkill}" with "${employeeSkill}"`);
                  break;
                }
              }
              
              if (!hasMatchingSkill) {
                missingSkills.push(courseSkill);
                console.log(`❌ Missing skill: "${courseSkill}"`);
              }
            }
            
            // Calculate skills coverage percentage
            const skillsCoverage = courseSkills.length > 0 
              ? Math.round(((courseSkills.length - missingSkills.length) / courseSkills.length) * 100) 
              : 100;
            
            console.log('Missing Skills:', missingSkills);
            console.log('Skills Coverage:', `${skillsCoverage}%`);
            console.log('CV Data:', cvData);
            console.log('Semantic API Calls Remaining:', semanticCallsRemaining.count);
            console.groupEnd();

            // Add result to our assessment results array
            results.push({
              employee,
              course,
              employeeSkills,
              missingSkills,
              extractedCvData: cvData,
              employeeSummary: cvData.summary || `No summary available for ${employee.name}`,
              suggestedSkills: cvData.suggestedSkills || [],
              skillsCoverage
            });
          }
        } catch (employeeError) {
          console.error(`Error processing employee ${employeeId}:`, employeeError);
          // Continue with next employee
        }
      }

      if (results.length === 0) {
        toast({
          title: "No assessment results",
          description: "No skills gaps were found, or the selected employees have no assigned courses with skills.",
          variant: "default"
        });
      }

      setAssessmentResults(results);
      
      // Initialize expanded state for each employee
      const initialExpandState: Record<string, boolean> = {};
      results.forEach(result => {
        initialExpandState[result.employee.id] = false;
      });
      setExpandedEmployees(initialExpandState);
      
    } catch (err) {
      console.error('Failed to perform skills assessment:', err);
      setError('Failed to perform skills assessment');
      toast({
        title: "Assessment failed",
        description: "There was an error performing the skills assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingStep('');
      setLoading(false);
    }
  };

  // Add save function
  const saveAssessmentResults = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // For each employee in assessmentResults
      console.log("Assessment Results:", JSON.stringify(assessmentResults, null, 2));

      if (!assessmentResults || !Array.isArray(assessmentResults) || assessmentResults.length === 0) {
        throw new Error("No assessment results to save");
      }

      const savedIds = await Promise.all(
        assessmentResults.map(async (result: AssessmentResult, index: number) => {
          try {
            if (!result || !result.employee || !result.employee.id || !result.course || !result.course.id) {
              console.error(`Invalid result at index ${index}:`, result);
              return null;
            }

            console.log("Processing result:", result.employee.name, "Missing skills:", result.missingSkills);
            
            // 1. Create assessment record
            const { data: assessment, error: assessmentError } = await supabase
              .from('hr_skill_assessments')
              .insert({
                employee_id: result.employee.id,
                assessed_at: new Date().toISOString(),
                assessed_by: userId,
                notes: `Skills assessment from CV analysis`
              })
              .select('id')
              .single();
              
            if (assessmentError) {
              console.error(`Error creating assessment for ${result.employee.name}:`, assessmentError);
              throw assessmentError;
            }
            
            if (!assessment || !assessment.id) {
              console.error(`No assessment ID returned for ${result.employee.name}`);
              return null;
            }
            
            // 2. Create detail records for each missing skill
            let detailRecords: any[] = [];
            
            // Safe handling of missingSkills regardless of structure
            if (result.missingSkills) {
              if (typeof result.missingSkills === 'string') {
                // Handle if it's just a single string
                detailRecords = [{
                  assessment_id: assessment.id,
                  skill_name: result.missingSkills,
                  proficiency_level: 0,
                  gap_level: 3,
                  course_id: result.course.id,
                  is_missing: true
                }];
              } else if (Array.isArray(result.missingSkills)) {
                // If it's a simple array of strings
                if (result.missingSkills.length > 0 && typeof result.missingSkills[0] === 'string') {
                  detailRecords = result.missingSkills.map((skill: string) => ({
                    assessment_id: assessment.id,
                    skill_name: skill,
                    proficiency_level: 0,
                    gap_level: 3,
                    course_id: result.course.id,
                    is_missing: true
                  }));
                }
                // If it has nested structure (complex object with missingSkills property)
                else if (result.missingSkills.length > 0 && typeof result.missingSkills[0] === 'object') {
                  detailRecords = result.missingSkills.flatMap((item: any) => {
                    if (item && item.missingSkills && Array.isArray(item.missingSkills)) {
                      return item.missingSkills.map((skill: string) => ({
                        assessment_id: assessment.id,
                        skill_name: skill,
                        proficiency_level: 0,
                        gap_level: 3,
                        course_id: item.id || result.course.id,
                        is_missing: true
                      }));
                    }
                    return [];
                  });
                }
              }
            }
            
            // Add records for matched skills too
            if (Array.isArray(result.employeeSkills) && Array.isArray(result.missingSkills)) {
              const matchedSkills = result.employeeSkills.filter((skill: string) => 
                typeof skill === 'string' && !result.missingSkills.includes(skill)
              );
              
              matchedSkills.forEach((skill: string) => {
                if (typeof skill === 'string') {
                  detailRecords.push({
                    assessment_id: assessment.id,
                    skill_name: skill,
                    proficiency_level: 3, // Matched skills default to high proficiency
                    gap_level: 0, // No gap for matched skills
                    course_id: result.course.id,
                    is_missing: false
                  });
                }
              });
            } else {
              console.warn(`Invalid employeeSkills or missingSkills for ${result.employee.name}`);
            }
            
            // Only attempt to insert if we have records
            if (detailRecords.length > 0) {
              const { error: detailsError } = await supabase
                .from('hr_skill_assessment_details')
                .insert(detailRecords);
                
              if (detailsError) {
                console.error(`Error inserting skill details for ${result.employee.name}:`, detailsError);
                throw detailsError;
              }
            } else {
              console.warn(`No skill details to save for employee ${result.employee.name}`);
            }
            
            return assessment.id;
          } catch (resultError) {
            console.error(`Error processing result for employee ${result?.employee?.name || 'unknown'}:`, resultError);
            return null;
          }
        })
      );
      
      // Filter out nulls from failed operations
      const successIds = savedIds.filter(id => id !== null);
      
      if (successIds.length > 0) {
        setSaveSuccess(true);
        
        toast({
          title: "Success",
          description: `Saved skills assessment for ${successIds.length} of ${assessmentResults.length} employees`,
        });
        
        // Switch to the Skills Matrix tab after saving
        const skillMatrixTab = document.querySelector('button[value="skill-matrix"]');
        if (skillMatrixTab) {
          (skillMatrixTab as HTMLElement).click();
        }
        
        return successIds;
      } else {
        throw new Error("Failed to save any assessment results");
      }
    } catch (error: any) {
      console.error('Error saving assessment:', error);
      toast({
        title: "Error",
        description: `Failed to save assessment results: ${error.message}`,
        variant: "destructive"
      });
      return [];
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Skills Gap Assessment</h2>
        <div className="flex justify-between mb-4">
          <p className="text-gray-600">
            Select employees to identify skills gaps between assigned courses and current skills.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleFallbackMode} 
            className="text-xs"
          >
            {useFallbackData ? "Use Real API Data" : "Use Mock Data"}
          </Button>
        </div>
        
        {/* Employee Selection Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedEmployeeIds.length === employees.length && employees.length > 0}
                  onCheckedChange={(checked: boolean | 'indeterminate') => handleSelectAll(!!checked)}
                  data-select-all="true"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>CV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp: Employee) => (
              <TableRow key={emp.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedEmployeeIds.includes(emp.id)}
                    onCheckedChange={(checked: boolean | 'indeterminate') => handleSelectEmployee(emp.id, !!checked)}
                  />
                </TableCell>
                <TableCell>{emp.name}</TableCell>
                <TableCell>{emp.email}</TableCell>
                <TableCell>{emp.department || 'Not assigned'}</TableCell>
                <TableCell>{emp.position || 'Not assigned'}</TableCell>
                <TableCell>{emp.resume_url ? '✓' : '✗'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Bulk Actions Bar */}
        {selectedEmployeeIds.length > 0 && (
          <div className="flex items-center gap-4 mt-4">
            <Button 
              onClick={handleAssessSkills}
              data-assess-skills="true"
            >
              Assess Skills Gaps
            </Button>
            <Button 
              variant="outline" 
              onClick={clearSelection}
              data-clear-selection="true"
            >
              Clear Selection
            </Button>
          </div>
        )}
      </div>

      {/* Assessment Results Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Skills Gap Assessment Results</DialogTitle>
          </DialogHeader>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3">{processingStep || 'Assessing skills...'}</span>
            </div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : assessmentResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No assessment results found. Employees may not have assigned courses with skills, or their skills already cover course requirements.</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Skills Gap</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessmentResults.map((result: AssessmentResult) => (
                    <React.Fragment key={`${result.employee.id}-${result.course.id}`}>
                      <TableRow 
                        className={
                          result.missingSkills.length > 0 
                            ? "border-l-4 border-l-amber-400" 
                            : "border-l-4 border-l-green-400"
                        }
                      >
                        <TableCell>
                          <div className="font-medium">{result.employee.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {result.employee.position || 'No position'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{result.course.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {result.course.skills.length} required skills
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={result.skillsCoverage} className="h-2" />
                            <div className="text-xs mt-1 text-center">
                              {result.skillsCoverage}% covered
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {result.missingSkills.length > 0 ? (
                              <>
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                <span>{result.missingSkills.length} missing skills</span>
                              </>
                            ) : (
                              <span className="text-green-600">No skill gaps</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEmployeeExpand(result.employee.id)}
                            className="p-0 h-8 w-8"
                          >
                            {expandedEmployees[result.employee.id] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Details Row */}
                      {expandedEmployees[result.employee.id] && (
                        <TableRow>
                          <TableCell colSpan={5} className="p-0 border-t-0">
                            <div className="bg-gray-50 p-4 rounded-b-md">
                              <div className="text-sm font-medium mb-3">Employee Summary</div>
                              <p className="text-sm mb-4">{result.employeeSummary}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <Card className="bg-blue-50 border-blue-200">
                                  <CardContent className="pt-4">
                                    <h4 className="font-medium text-sm mb-2 text-blue-700">Course Required Skills</h4>
                                    <div className="max-h-40 overflow-y-auto">
                                      {result.course.skills.length > 0 ? (
                                        <ul className="text-sm space-y-1">
                                          {result.course.skills.map((skill, i) => (
                                            <li key={i} className="flex items-start">
                                              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 mt-1.5"></span>
                                              <span>{skill}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-sm text-gray-500">No required skills defined</p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                <Card className="bg-green-50 border-green-200">
                                  <CardContent className="pt-4">
                                    <h4 className="font-medium text-sm mb-2 text-green-700">Employee Skills</h4>
                                    <div className="max-h-40 overflow-y-auto">
                                      {result.employeeSkills.length > 0 ? (
                                        <ul className="text-sm space-y-1">
                                          {result.employeeSkills.map((skill, i) => (
                                            <li key={i} className="flex items-start">
                                              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 mt-1.5"></span>
                                              <span>{skill}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-sm text-gray-500">No skills found</p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                <Card className="bg-amber-50 border-amber-200">
                                  <CardContent className="pt-4">
                                    <h4 className="font-medium text-sm mb-2 text-amber-700">Training Needs</h4>
                                    <div className="max-h-40 overflow-y-auto">
                                      {result.missingSkills.length > 0 ? (
                                        <>
                                          <h5 className="text-xs font-medium mb-1">Missing Skills</h5>
                                          <ul className="text-sm space-y-1 mb-3">
                                            {result.missingSkills.map((skill, i) => (
                                              <li key={i} className="flex items-start">
                                                <AlertCircle className="h-3 w-3 text-amber-500 mr-2 mt-0.5" />
                                                <span>{skill}</span>
                                              </li>
                                            ))}
                                          </ul>
                                          
                                          {result.suggestedSkills && result.suggestedSkills.length > 0 && (
                                            <>
                                              <h5 className="text-xs font-medium mb-1">Suggested Skills</h5>
                                              <ul className="text-sm space-y-1">
                                                {result.suggestedSkills.map((skill, i) => (
                                                  <li key={i} className="flex items-start">
                                                    <span className="w-2 h-2 rounded-full bg-purple-500 mr-2 mt-1.5"></span>
                                                    <span>{skill}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </>
                                          )}
                                        </>
                                      ) : (
                                        <p className="text-sm text-green-600">No skill gaps found</p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Save button in the modal footer */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowModal(false)}
            >
              Close
            </Button>
            
            <Button
              onClick={saveAssessmentResults}
              disabled={isSaving || assessmentResults.length === 0}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                saveSuccess ? "Saved ✓" : "Save to Skills Matrix"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 