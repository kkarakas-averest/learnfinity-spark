# CV Upload and AI Profile Summary Generation

## Feature Overview

This feature allows HR administrators to upload employee CVs/resumes and automatically generate a professional profile summary using AI. The summary is then visible on the employee's profile page and is also used to enhance the personalization of course content.

## Implementation Details

### Database Changes

We added the following columns to the `hr_employees` table:
```sql
ALTER TABLE hr_employees 
ADD COLUMN IF NOT EXISTS cv_file_url TEXT,
ADD COLUMN IF NOT EXISTS cv_extracted_data JSONB,
ADD COLUMN IF NOT EXISTS cv_extraction_date TIMESTAMP WITH TIME ZONE;
```

And created a new table to track CV extractions:
```sql
CREATE TABLE IF NOT EXISTS hr_employee_cv_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  original_file_url TEXT,
  extracted_data JSONB,
  extraction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  extraction_status VARCHAR(20) DEFAULT 'pending'
);
```

### Frontend Components

1. **CV Upload Component**
   - Added to the Edit Profile modal
   - Allows uploading PDF, DOC, or DOCX files
   - Shows the current file name if one already exists

2. **Profile Summary Display**
   - Added to the Employee Profile page below the "Joined:" field
   - Displays the 250-word profile summary generated from the CV
   - Formats the text for better readability

3. **CV View Button**
   - Added a "View CV" button next to the "Edit Profile" button
   - Only shows when a CV has been uploaded
   - Opens the document in a new tab when clicked

### Backend APIs

1. **CV Processing API**
   - New endpoint: `POST /api/hr/employees/process-cv`
   - Takes employee ID and CV URL
   - Uses AI to analyze the CV and generate a 250-word professional profile summary
   - Stores the summary in the employee record

2. **Enhanced Content Generation API**
   - Updated endpoint: `POST /api/hr/courses/generate-content`
   - Now incorporates the CV-based profile summary for deeper personalization
   - Creates course content specifically tailored to the employee's background

## How It Works

1. HR admin uploads an employee's CV in the Edit Profile dialog
2. The CV is stored in Supabase storage and the URL is saved in the employee record
3. The API processes the CV and generates a professional profile summary
4. The summary is displayed on the employee's profile page
5. When generating course content, the system uses the profile summary to create more relevant and personalized learning materials

## Key Files Changed

- `src/pages/hr/EmployeeProfilePage.tsx`: Added CV upload and display functionality
- `src/app/api/hr/employees/process-cv/route.ts`: New API endpoint for CV processing
- `src/app/api/hr/courses/generate-content/route.ts`: Enhanced to use CV data for course personalization

## Testing the Feature

1. Go to an employee's profile page
2. Click "Edit Profile"
3. Upload a CV/resume file (PDF, DOC, or DOCX)
4. Save the changes
5. Wait a few moments for the AI to process the CV
6. Refresh the page to see the generated profile summary
7. Assign a course to the employee
8. The course content will now be personalized based on the employee's CV 