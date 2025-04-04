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

# LearnFinity HR Dashboard

LearnFinity is a comprehensive HR dashboard designed for employee training, management, and analytics. It provides a unified interface for HR professionals to track employee progress, manage training resources, and make data-driven decisions.

## Features

- **User Authentication**: Secure login with role-based access control
- **Training Management**: Create, assign, and track training modules
- **Employee Profiles**: Comprehensive employee data management
- **Analytics Dashboard**: Visualize key HR metrics and training outcomes
- **Notification System**: Real-time notifications for users with customizable preferences
- **LLM Integration**: AI-powered features for content generation and analysis

## Technologies

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase for authentication, database, and storage
- **State Management**: React Context API and custom hooks
- **Analytics**: Chart.js for data visualization
- **AI Integration**: OpenAI API for LLM features

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- OpenAI API key (for LLM features)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/learnfinity.git
cd learnfinity
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Configure environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase and OpenAI credentials
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Set up the database
```bash
# Run the SQL scripts in the src/db directory to set up your database schema
```

## Project Structure

- `/src/components` - Reusable UI components
  - `/ui` - Base UI components
  - `/dashboard` - Dashboard-specific components
  - `/notifications` - Notification system components
- `/src/pages` - Next.js pages and routing
- `/src/services` - Service classes for data handling
- `/src/hooks` - Custom React hooks
- `/src/types` - TypeScript type definitions
- `/src/lib` - Utility functions and shared code
- `/src/db` - Database schema and migration scripts

## Notification System

LearnFinity includes a comprehensive notification system for keeping users informed about important events:

- Real-time in-app notifications
- Various notification types (system, alerts, assignments, etc.)
- Notification preferences for personalization
- Priority-based notification display
- Mark as read/unread functionality

See `/src/components/notifications/README.md` for detailed documentation.

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Submit a pull request
4. Ensure all tests pass

## License

This project is licensed under the MIT License - see the LICENSE file for details.

<!-- Latest deployment trigger: 2025-04-04 -->
