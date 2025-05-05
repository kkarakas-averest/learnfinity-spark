# Skills Taxonomy System

## Overview

The Skills Taxonomy System provides a standardized classification of skills across the LearnFinity platform. This system enables consistent skill identification, targeted learning recommendations, and precise gap analysis between employee capabilities and role requirements.

## Database Schema

The skills taxonomy is organized in a hierarchical structure with four levels:

### 1. Categories (`skill_taxonomy_categories`)
- **Purpose**: Top-level classification of skill domains
- **Structure**:
  - `id`: UUID (primary key)
  - `name`: String (required)
  - `description`: Text (optional)
  - `created_at`: Timestamp
  - `updated_at`: Timestamp

### 2. Subcategories (`skill_taxonomy_subcategories`)
- **Purpose**: Secondary classification within a category
- **Structure**:
  - `id`: UUID (primary key)
  - `category_id`: UUID (foreign key to categories)
  - `name`: String (required)
  - `description`: Text (optional)
  - `created_at`: Timestamp
  - `updated_at`: Timestamp

### 3. Groups (`skill_taxonomy_groups`)
- **Purpose**: Specific skill area within a subcategory
- **Structure**:
  - `id`: UUID (primary key)
  - `subcategory_id`: UUID (foreign key to subcategories)
  - `name`: String (required)
  - `description`: Text (optional)
  - `created_at`: Timestamp
  - `updated_at`: Timestamp

### 4. Skills (`skill_taxonomy_items`)
- **Purpose**: Individual skills within a group
- **Structure**:
  - `id`: UUID (primary key)
  - `group_id`: UUID (foreign key to groups)
  - `external_id`: String (optional, for integration with external systems)
  - `name`: String (required)
  - `description`: Text (optional)
  - `keywords`: JSONB (optional, for search enhancement)
  - `created_at`: Timestamp
  - `updated_at`: Timestamp

## Relationship with Other Tables

The skills taxonomy integrates with other parts of the platform:

- `skill_records`: Links employee skills to the taxonomy
- `position_skill_requirements`: Maps required skills to positions
- `hr_employee_skills`: Tracks employee skills with proficiency levels
- `hr_skill_assessments`: Stores skill assessment results
- `learner_skills`: Connects learners to skills they're developing

## Taxonomy Import Process

### Import Script

The taxonomy data is imported using a Node.js script (`scripts/taxonomy-import.js`). This script:

1. Connects to Supabase using the service role key
2. Reads a JSON file containing the taxonomy hierarchy
3. Processes each level (category, subcategory, group, skill)
4. Inserts the data into appropriate tables with generated UUIDs
5. Reports progress and statistics during the import

### Running the Import

To import taxonomy data:

```bash
node scripts/taxonomy-import.js /path/to/taxonomy/file.json
```

The script expects a JSON file with a specific nested structure:

```json
{
  "Category Name": {
    "Subcategory Name": {
      "Group Name": {
        "skill1": "Skill Name 1",
        "skill2": "Skill Name 2",
        // More skills...
      },
      // More groups...
    },
    // More subcategories...
  },
  // More categories...
}
```

### Import Performance

- The script processes items sequentially to maintain referential integrity
- Skills are inserted in batches of 50 for better performance
- Progress statistics are logged after each category is processed
- The typical import for a complete taxonomy (~6500 skills) takes approximately 10-15 minutes

## Skills Normalization

Once the taxonomy is imported, raw skills from various sources (CVs, assessments, etc.) are normalized to match the standardized taxonomy. This occurs through:

1. **Direct Matching**: Exact match to taxonomy skill name
2. **Keyword Matching**: Using the keywords JSONB field to match variations
3. **Manual Mapping**: HR verification for uncertain matches

## Integration with Platform Features

### Gap Analysis

The taxonomy enables precise gap analysis by:
1. Identifying required skills for a position
2. Comparing with employee's normalized skills
3. Generating gap reports with specific skills needed

### Course Generation

The taxonomy enhances course generation by:
1. Targeting specific skill gaps
2. Providing structured context for AI content generation
3. Ensuring consistent skill terminology across courses

### Skill Inventory UI

The taxonomy improves the skills inventory by:
1. Organizing skills in a consistent hierarchy
2. Enabling filtering by category, subcategory, or group
3. Providing standardized skill names for comparison

## Maintenance and Updates

The taxonomy should be reviewed regularly:

1. **New Skills**: Add through the admin interface or by script
2. **Taxonomy Restructuring**: Major changes require database migrations
3. **Skill Normalization**: Update mapping logic as terminology evolves

## Future Enhancements

Planned improvements to the taxonomy system:

1. **Enhanced Search**: Improved skill matching with NLP
2. **Skill Relationships**: Adding connections between related skills
3. **Industry Alignment**: Mapping to industry-standard frameworks (SFIA, ESCO)
4. **Proficiency Levels**: Standardized definitions for skill levels 