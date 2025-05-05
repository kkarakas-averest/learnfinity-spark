# Skills Taxonomy Integration – README

## Overview

This update transitions the platform from a course-centric to a skills-centric model, enabling:
- **Consistent skill classification** using a standardized taxonomy
- **Skills-first gap analysis** for employees vs. role requirements
- **Targeted course/learning path generation** for skill gaps
- **Improved analytics** for workforce capability

---

## 1. Database & Backend

### Taxonomy Schema

The taxonomy is hierarchical and consists of:
- `skill_taxonomy_categories` (top-level domains)
- `skill_taxonomy_subcategories` (within categories)
- `skill_taxonomy_groups` (within subcategories)
- `skill_taxonomy_items` (individual skills, within groups)

**Related tables:**
- `hr_employee_skills`: Employee skills, linked to taxonomy
- `position_skill_requirements`: Role requirements, linked to taxonomy
- `skill_records`, `hr_skill_assessments`, `learner_skills`: All reference taxonomy IDs

### Taxonomy Import

- Use `scripts/taxonomy-import.js` to import a taxonomy JSON file.
- The script processes categories → subcategories → groups → skills, maintaining referential integrity.
- Example usage:
  ```bash
  node scripts/taxonomy-import.js /path/to/taxonomy.json
  ```
- The JSON structure must be nested by category, subcategory, group, then skills.

### Skills Normalization

- Implemented in `src/lib/skills/normalizer.ts`
- Uses Levenshtein distance and semantic similarity to map raw skills to taxonomy items.
- Supports batch normalization and returns confidence scores and hierarchy info.

### Gap Analysis

- Implemented in `src/lib/skills/gap-analysis.ts`
- Compares employee skills (taxonomy-linked) to position requirements (taxonomy-linked).
- Returns detailed gap reports, including proficiency, importance, and category breakdowns.

### Course Generation

- Implemented in `src/lib/skills/course-generation.ts`
- Accepts taxonomy skill IDs and gap data to generate targeted course content using LLMs (Groq API).
- Supports context-aware prompts and fallback logic.

---

## 2. API Endpoints

All endpoints are in `src/api/skills/` and are Vercel serverless functions.

### `/api/skills/normalize`
- **POST**: Normalize a skill or array of skills to taxonomy.
- **Request**:
  ```json
  { "skill": "ReactJS" }
  // or
  { "skills": ["ReactJS", "Node.js"] }
  ```
- **Response**: Normalized taxonomy IDs, names, confidence, and matches.

### `/api/skills/gap-analysis`
- **GET**: Get gap analysis for an employee and position.
  - Query: `?employeeId=...&positionId=...`
- **POST**: Update or add an employee skill (taxonomy-linked).
- **DELETE**: Remove an employee skill by ID.

### `/api/skills/course-generation`
- **POST**: Generate a course/learning path for a set of taxonomy skill IDs (optionally for a specific employee/position).
- **Request**:
  ```json
  {
    "title": "Learning Path for John Doe",
    "employeeId": "...",
    "positionId": "...",
    "targetSkills": ["taxonomy-skill-id-1", "taxonomy-skill-id-2"]
  }
  ```
- **Response**: Generated course content, modules, and objectives.

### `/api/skills/position-requirements`
- **GET**: Fetch required skills for a position (taxonomy-linked).
- **POST**: Add/update requirements.

---

## 3. Frontend Integration

### Skills Inventory & Employee Profile

- **Component:** `src/components/hr/profile/SkillsInventory.tsx`
- **Page:** `src/pages/hr/EmployeeProfilePage.tsx`
- **Features:**
  - Visualizes employee skills grouped by taxonomy category.
  - Shows required and missing skills for the current role.
  - "Generate Learning Path" button triggers course generation for missing skills (calls `/api/skills/course-generation`).
  - All skills and gaps are taxonomy-linked.

### Bulk Skills Assessment

- **Component:** `src/components/hr/BulkSkillsAssessment.tsx`
- **Features:**
  - Bulk gap analysis for multiple employees.
  - Bulk learning path generation for all employees with skill gaps.
  - Uses both word-based and semantic (Groq API) matching for normalization.

### UI/UX

- All skill displays, gap visualizations, and learning path actions are taxonomy-driven.
- Badges and progress bars indicate coverage of required skills.
- Toasts and modals provide user feedback for actions.

---

## 4. Maintenance & Updates

- **Adding Skills:** Use the import script or admin UI (if available).
- **Updating Taxonomy:** Major changes may require DB migrations.
- **Skill Normalization:** Update logic in `normalizer.ts` as terminology evolves.
- **Regular Review:** Schedule periodic taxonomy reviews for accuracy and completeness.

---

## 5. Best Practices & Notes

- All skill operations (normalization, gap analysis, course generation) must use taxonomy IDs for consistency.
- TypeScript types are enforced throughout backend and frontend for safety.
- All new features are additive and DRY; legacy logic is deprecated.
- LLM (Groq) integration is used for semantic skill matching and course content generation.

---

## 6. Example Workflow

1. **Import Taxonomy:**  
   `node scripts/taxonomy-import.js taxonomy.json`
2. **Normalize Skills:**  
   Call `/api/skills/normalize` with raw skills from CVs or user input.
3. **Gap Analysis:**  
   Call `/api/skills/gap-analysis?employeeId=...&positionId=...`
4. **Generate Learning Path:**  
   Call `/api/skills/course-generation` with missing taxonomy skill IDs.
5. **Visualize in UI:**  
   Employee profile and skills inventory show taxonomy-linked skills, gaps, and learning path actions.

---

## 7. References

- See `docs/skills-taxonomy.md` for schema and process details.
- See `skills-taxonomy-update.md` for the project roadmap and rationale.
- See `LEARNFINITY-FEATURE-ARCHITECTURE.md` and `LEARNFINITY-TECHNICAL-BLUEPRINT.md` for platform-wide context.

---

**For further questions or onboarding, review the referenced docs and code comments. All logic is type-safe and follows modern best practices.** 