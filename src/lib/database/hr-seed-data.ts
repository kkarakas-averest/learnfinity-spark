/**
 * HR Module Seed Data
 * 
 * This file contains initial data for seeding the HR database tables.
 * Used by the hrService.seedDatabase function.
 */

// Initial departments
export const departments = [
  { name: 'Executive Leadership' },
  { name: 'Human Resources' },
  { name: 'Information Technology' },
  { name: 'Finance' },
  { name: 'Marketing' },
  { name: 'Sales' },
  { name: 'Customer Support' },
  { name: 'Operations' },
  { name: 'Research & Development' },
  { name: 'Product Management' },
];

// Initial positions with their respective departments
export const positions = [
  // Executive Leadership
  { title: 'Chief Executive Officer', department: 'Executive Leadership' },
  { title: 'Chief Operating Officer', department: 'Executive Leadership' },
  { title: 'Chief Financial Officer', department: 'Executive Leadership' },
  { title: 'Chief Technology Officer', department: 'Executive Leadership' },
  { title: 'Chief Marketing Officer', department: 'Executive Leadership' },
  
  // Human Resources
  { title: 'HR Director', department: 'Human Resources' },
  { title: 'HR Manager', department: 'Human Resources' },
  { title: 'Recruiter', department: 'Human Resources' },
  { title: 'Talent Development Specialist', department: 'Human Resources' },
  { title: 'HR Assistant', department: 'Human Resources' },
  
  // Information Technology
  { title: 'IT Director', department: 'Information Technology' },
  { title: 'Software Engineer', department: 'Information Technology' },
  { title: 'Systems Administrator', department: 'Information Technology' },
  { title: 'Network Engineer', department: 'Information Technology' },
  { title: 'Data Scientist', department: 'Information Technology' },
  { title: 'IT Support Specialist', department: 'Information Technology' },
  
  // Finance
  { title: 'Finance Director', department: 'Finance' },
  { title: 'Financial Analyst', department: 'Finance' },
  { title: 'Accountant', department: 'Finance' },
  { title: 'Payroll Specialist', department: 'Finance' },
  
  // Marketing
  { title: 'Marketing Director', department: 'Marketing' },
  { title: 'Marketing Manager', department: 'Marketing' },
  { title: 'Content Specialist', department: 'Marketing' },
  { title: 'Social Media Specialist', department: 'Marketing' },
  { title: 'Graphic Designer', department: 'Marketing' },
  
  // Sales
  { title: 'Sales Director', department: 'Sales' },
  { title: 'Sales Manager', department: 'Sales' },
  { title: 'Account Executive', department: 'Sales' },
  { title: 'Sales Representative', department: 'Sales' },
  
  // Customer Support
  { title: 'Customer Support Director', department: 'Customer Support' },
  { title: 'Customer Support Manager', department: 'Customer Support' },
  { title: 'Customer Support Specialist', department: 'Customer Support' },
  
  // Operations
  { title: 'Operations Director', department: 'Operations' },
  { title: 'Operations Manager', department: 'Operations' },
  { title: 'Project Manager', department: 'Operations' },
  { title: 'Quality Assurance Specialist', department: 'Operations' },
  
  // Research & Development
  { title: 'R&D Director', department: 'Research & Development' },
  { title: 'Product Researcher', department: 'Research & Development' },
  { title: 'Innovation Specialist', department: 'Research & Development' },
  
  // Product Management
  { title: 'Product Director', department: 'Product Management' },
  { title: 'Product Manager', department: 'Product Management' },
  { title: 'Product Owner', department: 'Product Management' },
  { title: 'Product Analyst', department: 'Product Management' },
];

// Initial courses
export const courses = [
  {
    title: 'New Employee Orientation',
    description: 'Introduction to company policies, culture, and procedures for new employees',
    department: 'Human Resources',
    skill_level: 'beginner',
    duration: 60,
    status: 'active'
  },
  {
    title: 'Leadership Fundamentals',
    description: 'Core principles and practices for effective leadership',
    department: 'Human Resources',
    skill_level: 'intermediate',
    duration: 120,
    status: 'active'
  },
  {
    title: 'Cybersecurity Basics',
    description: 'Essential security practices for all employees',
    department: 'Information Technology',
    skill_level: 'beginner',
    duration: 45,
    status: 'active'
  },
  {
    title: 'Data Privacy and GDPR',
    description: 'Understanding data protection regulations and company compliance',
    department: 'Information Technology',
    skill_level: 'intermediate',
    duration: 90,
    status: 'active'
  },
  {
    title: 'Effective Communication',
    description: 'Improving verbal and written communication skills',
    department: 'Human Resources',
    skill_level: 'beginner',
    duration: 75,
    status: 'active'
  },
  {
    title: 'Project Management Essentials',
    description: 'Introduction to project management methodologies and best practices',
    department: 'Operations',
    skill_level: 'intermediate',
    duration: 180,
    status: 'active'
  },
  {
    title: 'Financial Literacy for Non-Finance Professionals',
    description: 'Understanding financial statements and budgeting basics',
    department: 'Finance',
    skill_level: 'beginner',
    duration: 90,
    status: 'active'
  },
  {
    title: 'Sales Techniques',
    description: 'Effective strategies for engaging prospects and closing deals',
    department: 'Sales',
    skill_level: 'intermediate',
    duration: 120,
    status: 'active'
  },
  {
    title: 'Customer Service Excellence',
    description: 'Best practices for delivering exceptional customer experiences',
    department: 'Customer Support',
    skill_level: 'beginner',
    duration: 60,
    status: 'active'
  },
  {
    title: 'Product Knowledge Foundations',
    description: 'Comprehensive overview of company products and services',
    department: 'Product Management',
    skill_level: 'beginner',
    duration: 120,
    status: 'active'
  }
];

// Initial learning paths
export const learningPaths = [
  {
    title: 'New Manager Onboarding',
    description: 'Essential training for employees transitioning into management roles',
    skill_level: 'intermediate',
    courses: [
      'Leadership Fundamentals',
      'Effective Communication',
      'Project Management Essentials',
      'Financial Literacy for Non-Finance Professionals'
    ]
  },
  {
    title: 'New Employee Onboarding',
    description: 'Essential training for all new hires',
    skill_level: 'beginner',
    courses: [
      'New Employee Orientation',
      'Cybersecurity Basics',
      'Effective Communication'
    ]
  },
  {
    title: 'Sales Professional Path',
    description: 'Comprehensive training for sales team members',
    skill_level: 'intermediate',
    courses: [
      'Sales Techniques',
      'Effective Communication',
      'Product Knowledge Foundations',
      'Customer Service Excellence'
    ]
  }
]; 