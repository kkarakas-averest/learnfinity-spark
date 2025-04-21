
import { Request, Response } from 'express';

/**
 * API endpoint to get employee information including CV data
 * Gets employee details and CV data for a specific employee ID
 */
export default async function handler(req: Request, res: Response) {
  // Set CORS and content type headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  try {
    // Extract employeeId from URL params or query params
    const employeeId = req.params.employeeId || req.query.employeeId;
    
    if (!employeeId) {
      return res.status(400).json({
        error: 'Missing required parameter: employeeId',
        success: false
      });
    }
    
    console.log(`[employee] Getting employee data for ${employeeId}`);
    
    // In a production app, this is where you'd query the database
    // For this Express implementation, we'll return mock data
    
    // Create mock employee data with CV extracted data
    const mockEmployee = {
      id: employeeId,
      name: "John Doe",
      email: "john.doe@example.com",
      position: {
        id: "pos-123",
        title: "Senior Developer"
      },
      department: {
        id: "dept-456",
        name: "Engineering"
      },
      cv_extraction_date: new Date().toISOString(),
      cv_file_url: "https://example.com/cv.pdf",
      cv_extracted_data: {
        summary: "Experienced software developer with 10+ years in full-stack development. Specializes in React, TypeScript, and Node.js.",
        skills: ["JavaScript", "TypeScript", "React", "Node.js", "Express", "REST API", "GraphQL"],
        experience: [
          {
            title: "Senior Developer",
            company: "Tech Solutions Inc.",
            years: "2018-Present"
          },
          {
            title: "Frontend Developer",
            company: "Web Innovators",
            years: "2015-2018"
          }
        ],
        education: [
          {
            degree: "BSc Computer Science",
            institution: "University of Technology"
          }
        ],
        certifications: ["AWS Certified Developer", "React Professional"],
        personalInsights: {
          yearsOfExperience: 10,
          toolsAndTechnologies: ["VS Code", "GitHub", "Docker", "AWS"],
          preferredLearningStyle: "Visual"
        }
      }
    };
    
    // Return the employee data
    return res.status(200).json(mockEmployee);
  } catch (error: any) {
    console.error('Error in employee endpoint:', error);
    return res.status(500).json({
      error: 'Failed to get employee data',
      message: error?.message || 'Unknown error',
      success: false
    });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
