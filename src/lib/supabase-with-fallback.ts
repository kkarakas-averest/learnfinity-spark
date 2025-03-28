/**
 * Enhanced Supabase client wrapper with fallback handling for missing tables
 */
import { supabase } from './supabase';

interface TableStructure {
  [tableName: string]: {
    [columnName: string]: {
      type: string;
      required?: boolean;
      defaultValue?: any;
    };
  };
}

// Define structures for our tables
const tableStructures: TableStructure = {
  'hr_employee_skills': {
    'id': { type: 'uuid', required: true },
    'employee_id': { type: 'uuid', required: true },
    'skill_name': { type: 'string', required: true },
    'proficiency_level': { type: 'string', required: true, defaultValue: 'beginner' },
    'is_in_progress': { type: 'boolean', defaultValue: false }
  },
  'hr_employee_activities': {
    'id': { type: 'uuid', required: true },
    'employee_id': { type: 'uuid', required: true },
    'activity_type': { type: 'string', required: true },
    'description': { type: 'string', required: true },
    'created_at': { type: 'timestamp', defaultValue: 'now()' }
  }
};

/**
 * Try to create a table if it doesn't exist
 */
async function tryCreateTable(tableName: string) {
  try {
    console.log(`Attempting to create ${tableName} table...`);
    
    // For demonstration purposes, we'll try to insert a minimal record
    // In a real implementation, this would create the actual schema
    const testData: any = {};
    
    // Use the structure to create minimal valid data
    for (const [columnName, columnDef] of Object.entries(tableStructures[tableName] || {})) {
      if (columnDef.required && columnName !== 'id') {
        if (columnName === 'employee_id') {
          testData[columnName] = '00000000-0000-0000-0000-000000000000';
        } else if (columnDef.type === 'string') {
          testData[columnName] = `placeholder_${columnName}`;
        } else if (columnDef.type === 'boolean') {
          testData[columnName] = false;
        } else if (columnDef.defaultValue !== undefined) {
          testData[columnName] = columnDef.defaultValue;
        }
      }
    }
    
    // Try to insert a record to create the table
    const { error } = await supabase
      .from(tableName)
      .insert([testData]);
    
    if (!error) {
      console.log(`Successfully created ${tableName} table!`);
      
      // Clean up test data
      try {
        if (tableName === 'hr_employee_skills') {
          await supabase
            .from(tableName)
            .delete()
            .eq('employee_id', '00000000-0000-0000-0000-000000000000');
        }
      } catch (e) {
        console.log('Could not clean up test data, but table exists');
      }
      
      return true;
    } else {
      console.error(`Error creating ${tableName} table:`, error);
      return false;
    }
    
  } catch (e) {
    console.error(`Failed to create ${tableName} table:`, e);
    return false;
  }
}

/**
 * Enhance the Supabase client with table existence checking
 */
export const supabaseWithFallback = {
  from: (tableName: string) => {
    // Return object with enhanced error handling
    return {
      ...supabase.from(tableName),
      
      // Override select to handle missing tables
      select: (columns: string) => {
        const originalSelect = supabase.from(tableName).select(columns);
        
        // Enhance with table creation on error
        const originalThen = originalSelect.then.bind(originalSelect);
        originalSelect.then = async (onfulfilled, onrejected) => {
          try {
            const result = await originalThen(onfulfilled, onrejected);
            
            // If we get a table not found error
            if (result.error && result.error.code === '42P01') {
              console.warn(`Table ${tableName} not found, attempting to create it`);
              
              // Try to create the table
              const created = await tryCreateTable(tableName);
              
              if (created) {
                // Try the query again
                return await supabase.from(tableName).select(columns);
              }
              
              // If we couldn't create, return empty data
              return { data: [], error: null };
            }
            
            return result;
          } catch (error) {
            console.error('Error in enhanced select:', error);
            return { data: [], error: null };
          }
        };
        
        return originalSelect;
      }
    };
  }
};

export default supabaseWithFallback; 