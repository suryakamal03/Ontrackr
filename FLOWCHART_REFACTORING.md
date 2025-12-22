# Flowchart Feature Refactoring - Summary

## Changes Completed ✅

### 1. Removed Global AI Flowchart Navigation
- **Removed** "AI Flowchart Gen." from main sidebar navigation ([Sidebar.tsx](components/layout/Sidebar.tsx))
- Users can no longer access flowchart generation globally

### 2. Removed Risks Tab from Project Dashboard
- **Removed** "Risks" tab from project detail tabs ([ProjectDetail.tsx](components/projects/ProjectDetail.tsx))
- Simplified project navigation to: Tasks, GitHub Activity, Team, Flowchart, Webhook Setup

### 3. Project-Scoped Flowchart Feature
- **Created** new [ProjectFlowchart.tsx](components/projects/ProjectFlowchart.tsx) component
- Flowcharts are now project-specific (scoped by `projectId`)
- Each project maintains its own saved flowcharts

### 4. Gemini AI Integration
- **Created** [geminiService.ts](backend/integrations/geminiService.ts)
- Uses **Gemini Flash 1.5** model for fast flowchart generation
- API Key: Stored in `.env.local` file
- Generates Mermaid diagram syntax from natural language prompts

### 5. Firestore Backend
- **Created** [flowchartService.ts](backend/projects/flowchartService.ts)
- CRUD operations for project flowcharts
- Flowcharts stored in `flowcharts` collection with fields:
  - `projectId` - Links flowchart to specific project
  - `name` - Auto-generated from prompt
  - `description` - User's original prompt
  - `diagramData` - Generated Mermaid code
  - `createdBy` - User who created it
  - `createdAt` / `updatedAt` - Timestamps

### 6. Updated Firestore Rules
- Added security rules for `flowcharts` collection ([firestore.rules](firestore.rules))
- Users can read all flowcharts, create new ones, and only update/delete their own

### 7. Type Definitions
- Updated [types/index.ts](types/index.ts) with new `Flowchart` interface
- Added `projectId` field to ensure project scoping

## Features

### Flowchart Tab UI
Located in Project Dashboard → Flowchart tab:

1. **Prompt Input Section**
   - Large textarea for workflow description
   - Helpful placeholder text
   - "Generate Flowchart" button with loading state
   - Clear button to reset

2. **Generated Flowchart Display**
   - Shows raw Mermaid code (ready to copy)
   - **Copy Code** button to clipboard
   - **Save** button to persist to Firestore
   - Link to Mermaid Live Editor for visualization

3. **Saved Flowcharts Sidebar**
   - Lists all flowcharts for current project
   - View and Delete actions
   - Highlights selected flowchart

## How to Use

1. Navigate to any project
2. Click the **Flowchart** tab
3. Describe your workflow (e.g., "User login flow with email verification")
4. Click **Generate Flowchart**
5. Copy the generated Mermaid code
6. Paste into [Mermaid Live Editor](https://mermaid.live) to visualize
7. Click **Save** to store for later reference

## Technical Stack

- **AI Model**: Google Gemini Flash 1.5
- **Diagram Format**: Mermaid syntax
- **Storage**: Firebase Firestore
- **Authentication**: Firebase Auth (user context)
- **UI**: Next.js App Router, TypeScript, Tailwind CSS

## Dependencies Installed

```bash
npm install @google/generative-ai mermaid
```

## Environment Variable

Add to your `.env.local` file:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

## Notes

- Mermaid diagrams are generated as code, not rendered in-app
- Users can copy code and visualize on external tools
- Each project maintains separate flowchart history
- AI generation uses smart prompting for quality Mermaid syntax
