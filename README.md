# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/1d3682c2-443a-4929-bb2a-9849233efba8

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1d3682c2-443a-4929-bb2a-9849233efba8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/1d3682c2-443a-4929-bb2a-9849233efba8) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

## HR Module Updates

### New Features

#### Employee Profile Management
- **Resume Upload**: Employees can now upload their resumes in PDF or DOCX format for HR to review
- **Mock Departments**: Added a comprehensive list of mock departments for demo and testing purposes
- **Course Assignments**: HR can assign specific courses to employees during onboarding
  - New "Cybersecurity for Fintech" course now available
  - Course enrollments are automatically created and assigned to employees

#### Automated Account Creation
- When a new employee is added to the HR system, a user account is automatically created
- Secure random passwords are generated for new user accounts
- Employee profile is linked with course assignments and their resume

### Future AI Integration
- The system is being prepared to use the uploaded resume data and employee profile information
- AI agent will curate personalized learning content based on:
  - Assigned courses
  - Employee's skills gap identified from their resume
  - Their background and experience

## Getting Started
