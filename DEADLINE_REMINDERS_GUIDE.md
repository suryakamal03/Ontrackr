# Task and Project Deadline Reminders

This document explains the deadline and reminder system implemented in Ontrackr.

## Overview

Ontrackr now supports project-level and task-level deadlines with automated email reminders sent one day before task deadlines.

## Features

### 1. Project Deadlines

When creating a new project, you can optionally set a project deadline:

- Input field accepts deadline in days (e.g., 30 days)
- The deadline is converted to an absolute date and stored in Firestore
- The deadline date is calculated from the project creation date

### 2. Task Deadlines

When creating a task, you can set a task-specific deadline:

- Input field accepts deadline in days (e.g., 7 days)
- The deadline is converted to an absolute date and stored in Firestore
- Each task can have its own deadline independent of the project deadline

### 3. Task Details View

Click on any task to view its details including:

- Task title
- Assigned member
- Task status
- Task deadline date
- Remind Me toggle

### 4. Reminder System

The reminder system has the following features:

- **Remind Me Toggle**: Enabled by default for all tasks with deadlines
- Users can turn off reminders if they don't want email notifications
- Reminders are sent exactly one day before the task deadline
- Only tasks that are not marked as "Done" receive reminders
- Each reminder is sent only once to avoid spam

### 5. Email Reminders

Email reminders are sent via Resend and include:

- Task title
- Project name
- Task deadline date
- Branded Ontrackr template
- Clear call-to-action to view the task

## Technical Implementation

### Data Schema

**Project Schema:**
```typescript
{
  id: string
  name: string
  description?: string
  deadlineAt?: Timestamp
  createdAt: Timestamp
  // ... other fields
}
```

**Task Schema:**
```typescript
{
  id: string
  title: string
  projectId: string
  assignedTo: string
  assignedToName: string
  status: 'To Do' | 'In Review' | 'Done'
  deadlineAt?: Date
  reminderEnabled: boolean
  reminderSent: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  // ... other fields
}
```

### Backend Components

1. **Project Service** (`backend/projects/projectService.ts`)
   - Handles project creation with deadline calculation
   - Converts deadline days to absolute dates

2. **Task Service** (`backend/tasks/taskService.ts`)
   - Handles task creation with deadline calculation
   - Sets default reminder preferences

3. **Reminder API** (`app/api/reminders/send/route.ts`)
   - Protected endpoint for sending reminders
   - Queries tasks due tomorrow
   - Sends emails via Resend
   - Marks reminders as sent

### Frontend Components

1. **CreateProjectModal** (`components/projects/CreateProjectModal.tsx`)
   - Added deadline input field
   - Passes deadline to project service

2. **AddTaskModal** (`components/projects/AddTaskModal.tsx`)
   - Added deadline input field
   - Passes deadline to task service

3. **TaskDetailsModal** (`components/projects/TaskDetailsModal.tsx`)
   - Displays task information
   - Includes Remind Me toggle
   - Updates reminder preferences in Firestore

4. **ProjectTasks** (`components/projects/ProjectTasks.tsx`)
   - Makes tasks clickable
   - Opens TaskDetailsModal on click

### Email Template

The email template (`lib/emailTemplates.tsx`) provides:
- Branded HTML email with Ontrackr styling
- Clear task information
- Responsive design
- Professional appearance

## Setup Instructions

### 1. Install Dependencies

Run the following command to install the Resend package:

```bash
npm install resend
```

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```env
RESEND_API_KEY=your_resend_api_key_here
CRON_SECRET=your_secure_random_string_here
```

- Get your Resend API key from https://resend.com
- Generate a secure random string for CRON_SECRET

### 3. Set Up Cron Job

You have several options for running the daily reminder check:

#### Option A: Vercel Cron Jobs

If deploying on Vercel, update the `vercel.json` file with your actual domain and cron secret, then deploy.

#### Option B: External Cron Service

Use a service like:
- Cron-job.org
- EasyCron
- GitHub Actions

Configure it to send a POST request to:
```
https://your-domain.com/api/reminders/send
```

With headers:
```
Authorization: Bearer YOUR_CRON_SECRET
Content-Type: application/json
```

Schedule: Daily at 9:00 AM UTC (or your preferred time)

#### Option C: Manual Testing

For testing, you can manually trigger the reminder check:

```bash
curl -X POST https://your-domain.com/api/reminders/send \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### 4. Configure Resend Email Domain

1. Go to https://resend.com and set up your domain
2. Update the "from" address in `app/api/reminders/send/route.ts` to match your verified domain:

```typescript
from: 'Ontrackr <noreply@your-domain.com>'
```

## Usage

### Creating a Project with Deadline

1. Click "Create Project"
2. Fill in project details
3. Enter deadline in days (optional)
4. Click "Create Project"

### Creating a Task with Deadline

1. Open a project
2. Click "Add Task"
3. Fill in task title
4. Select assigned member
5. Enter deadline in days (optional)
6. Click "Create Task"

### Managing Reminders

1. Click on any task in the project view
2. View the task details including deadline
3. Use the "Remind Me" toggle to enable/disable email reminders
4. Toggle is ON by default

### Updating Task Deadlines

If you update a task's deadline, the `reminderSent` flag is automatically reset to `false`, ensuring the member receives a new reminder for the updated deadline.

## Important Notes

- Reminders are sent exactly one day before the deadline
- Only tasks with status other than "Done" receive reminders
- Each task receives only one reminder per deadline (unless deadline is updated)
- Users must have valid email addresses in Firestore
- The Resend API key must be kept secure and never exposed to the frontend
- The CRON_SECRET protects the reminder endpoint from unauthorized access

## Troubleshooting

### Reminders Not Sending

1. Check that RESEND_API_KEY is correctly set in environment variables
2. Verify the cron job is running and hitting the correct endpoint
3. Check the API response for error details
4. Ensure user emails are valid in Firestore
5. Verify tasks have `reminderEnabled: true` and `reminderSent: false`

### Email Deliverability

1. Ensure your domain is verified in Resend
2. Check spam folders
3. Verify the "from" address matches your verified domain
4. Test with a single email first

### Security

1. Never commit RESEND_API_KEY or CRON_SECRET to version control
2. Use environment variables for all secrets
3. Ensure the cron endpoint validates the authorization header
4. Regularly rotate the CRON_SECRET
