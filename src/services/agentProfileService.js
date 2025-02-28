import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service to handle employee profile creation and document processing
 */
const agentProfileService = {
  /**
   * Submit employee profile form data to be processed by an agent
   * 
   * @param {FormData} formData - Form data containing employee information and documents
   * @returns {Promise<Object>} The result of the profile creation
   */
  async submitEmployeeProfile(formData) {
    try {
      // Convert FormData to a regular object for the employee data
      const employeeData = {};
      
      // Extract normal form fields (non-file fields)
      for (const [key, value] of formData.entries()) {
        if (!key.startsWith('document_')) {
          employeeData[key] = value;
        }
      }
      
      // 1. Upload documents to storage
      const uploadedDocs = [];
      
      for (let i = 0; formData.has(`document_${i}`); i++) {
        const file = formData.get(`document_${i}`);
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `employee_docs/${employeeData.employee_id}/${fileName}`;
        
        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(filePath, file);
          
        if (error) throw error;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
          
        uploadedDocs.push({
          name: file.name,
          path: filePath,
          url: urlData.publicUrl,
          type: file.type
        });
      }
      
      // 2. Store employee data in database with document references
      const { data: employeeRecord, error: employeeError } = await supabase
        .from('hr_employees')
        .insert({
          ...employeeData,
          documents: uploadedDocs,
          status: 'pending_agent_processing',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (employeeError) throw employeeError;
      
      // 3. Create a task for the AI agent to process this profile
      const { data: agentTask, error: taskError } = await supabase
        .from('agent_tasks')
        .insert({
          type: 'process_employee_profile',
          status: 'pending',
          data: {
            employee_id: employeeData.employee_id,
            profile_id: employeeRecord.id
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (taskError) throw taskError;
      
      return {
        success: true,
        message: 'Employee profile submitted successfully',
        employeeRecord,
        agentTask
      };
    } catch (error) {
      console.error('Error submitting employee profile:', error);
      return {
        success: false,
        message: error.message || 'Failed to submit employee profile',
        error
      };
    }
  },
  
  /**
   * Check the status of an agent processing task
   * 
   * @param {string} taskId - ID of the agent task
   * @returns {Promise<Object>} The current status of the task
   */
  async checkAgentTaskStatus(taskId) {
    try {
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('id', taskId)
        .single();
        
      if (error) throw error;
      
      return {
        success: true,
        task: data
      };
    } catch (error) {
      console.error('Error checking task status:', error);
      return {
        success: false,
        message: error.message || 'Failed to check task status',
        error
      };
    }
  }
};

export default agentProfileService; 