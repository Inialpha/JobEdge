# ResumeBuilder Refactoring Documentation

## Overview
The ResumeBuilder component has been refactored to improve maintainability, follow better React patterns, and support passing resume data from other pages.

## Key Changes

### 1. **Unified State Management**
- **Before**: Multiple separate states for each section (name, email, skills, experiences, etc.)
- **After**: Single `resume` state object of type `ResumeData` containing all resume information
- **Benefit**: Easier to manage, pass, and update resume data as a single unit

### 2. **Location State Support**
- ResumeBuilder now accepts a `resume` object via `location.state`
- If no resume is passed, initializes with empty fields
- Uses `getEditableResume()` utility function to convert incoming data to the correct format

### 3. **Template Extraction**
Templates have been extracted into separate, reusable components:
- `ClassicTemplate.tsx` - Traditional resume layout
- `ModernTemplate.tsx` - Two-column sidebar layout
- `MinimalTemplate.tsx` - Clean, minimalist design
- `CreativeTemplate.tsx` - Colorful header design

Each template receives the `resume` data and renders it consistently.

### 4. **Date Fields**
- **Before**: `duration` field as a string (e.g., "Jun 2020 - Present")
- **After**: Separate `startDate` and `endDate` fields
- **Applies to**: Professional Experience and Education sections

### 5. **Skills Format**
- **Before**: Array of strings `['Python', 'JavaScript', 'React']`
- **After**: Single string with bullet separator `"Python • JavaScript • React"`
- **Benefit**: Easier to display and edit as text

### 6. **Type Definitions**
New shared types in `src/types/resume.ts`:
- `PersonalInformation` (renamed from Contact)
- `ProfessionalExperience` (renamed from WorkExperience)
- `Education` (with startDate/endDate)
- `Project`
- `Certification`
- `Award`
- `ResumeData` (complete resume structure)
- `Template` (template selection type)

### 7. **Utility Functions**

#### `src/utils/resumeUtils.ts`
- `getEditableResume(resume)` - Converts external resume format to internal `ResumeData` format
- Handles missing fields gracefully
- Converts array skills to bullet-separated string
- Maps field names from API format to UI format

#### `src/utils/resumeDownload.ts`
- `downloadPDF(elementId)` - Exports resume as PDF
- `downloadDocx(resume)` - Exports resume as DOCX file

### 8. **useCallback Hooks**
All handler functions now use `useCallback` for performance optimization:
- `updateResume()` - Updates top-level resume fields
- `updatePersonalInfo()` - Updates personal information fields
- `selectTemplate()` - Changes active template
- `addSkill()`, `removeSkill()` - Skill management
- `add/update/remove` functions for Experience, Education, Projects, etc.

### 9. **Separate States for New Items**
Forms for adding new items use separate state variables:
- `newExperience` - Form for adding professional experience
- `newEducation` - Form for adding education
- `newProject` - Form for adding project
- `newCertification` - Form for adding certification
- `newAward` - Form for adding award

This keeps the main resume data clean until items are confirmed and added.

## Usage

### Basic Usage
```tsx
// Navigate to ResumeBuilder without data (starts empty)
<Route path="/resume-builder" element={<ResumeBuilder />} />
```

### With Existing Resume Data
```tsx
// Pass resume data from another page
navigate('/resume-builder', {
  state: {
    resume: {
      name: "John Doe",
      email: "john@example.com",
      professional_experiences: [...],
      // ... other fields
    }
  }
});
```

### Template Selection
Users can choose from 4 templates:
1. **Classic** - Traditional single-column layout
2. **Modern** - Two-column with sidebar
3. **Minimal** - Clean, simple design
4. **Creative** - Gradient header design

## File Structure

```
frontend/src/
├── pages/
│   └── ResumeBuilder.tsx (main component)
├── components/
│   ├── ResumePreview.tsx (preview wrapper)
│   └── resume-templates/
│       ├── ClassicTemplate.tsx
│       ├── ModernTemplate.tsx
│       ├── MinimalTemplate.tsx
│       ├── CreativeTemplate.tsx
│       └── index.ts
├── types/
│   └── resume.ts (TypeScript types)
└── utils/
    ├── resumeUtils.ts (data conversion)
    └── resumeDownload.ts (export functions)
```

## Benefits

1. **Maintainability**: Code is organized into smaller, focused files
2. **Reusability**: Templates can be used in other components
3. **Type Safety**: Comprehensive TypeScript types prevent errors
4. **Consistency**: Single source of truth for resume data structure
5. **Flexibility**: Easy to add new templates or sections
6. **Performance**: useCallback hooks prevent unnecessary re-renders

## Migration Notes

If integrating with existing code that uses the old structure:
1. Use `getEditableResume()` to convert old resume format to new format
2. Skills arrays should be joined with " • " separator
3. Update duration fields to use startDate and endDate
4. Rename Contact to PersonalInformation
5. Rename WorkExperience to ProfessionalExperience
