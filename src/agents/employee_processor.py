"""
Employee Processor Agent
This script polls the database for pending employee profiles and processes them.
"""

import os
import sys
import json
import time
import requests
from datetime import datetime
import uuid

# Add parent directory to path to import correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import from the personalization agent module
from agents.personalization_agent import PersonalizationAgent
from agents.db_utils import save_employee_profile, save_learning_path

# Import dotenv for environment variables
from dotenv import load_dotenv
load_dotenv()

# Configure Supabase client (using REST API for simplicity)
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://ujlqzkkkfatehxeqtbdl.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

if not SUPABASE_KEY:
    print("Error: SUPABASE_KEY environment variable not set")
    sys.exit(1)

if not GROQ_API_KEY:
    print("Error: GROQ_API_KEY environment variable not set")
    sys.exit(1)

# Headers for Supabase API requests
HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

def fetch_pending_tasks():
    """Fetch pending employee processing tasks from Supabase"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/agent_tasks"
        params = {
            'select': '*',
            'type': 'eq.process_employee_profile',
            'status': 'eq.pending'
        }
        
        response = requests.get(url, headers=HEADERS, params=params)
        response.raise_for_status()
        
        return response.json()
    except Exception as e:
        print(f"Error fetching pending tasks: {e}")
        return []

def fetch_employee_data(employee_id, profile_id):
    """Fetch employee data from Supabase"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/hr_employees"
        params = {
            'select': '*',
            'id': f'eq.{profile_id}'
        }
        
        response = requests.get(url, headers=HEADERS, params=params)
        response.raise_for_status()
        
        employees = response.json()
        if not employees:
            raise Exception(f"No employee found with ID {profile_id}")
            
        return employees[0]
    except Exception as e:
        print(f"Error fetching employee data: {e}")
        return None

def extract_document_texts(documents):
    """
    Extract text from employee documents
    In a real implementation, this would use OCR or document parsing services
    """
    # Simplified implementation - in a real system, you would:
    # 1. Download the documents from the URLs
    # 2. Parse them based on file type
    # 3. Extract text content
    # 4. Return the text
    
    document_texts = []
    
    for doc in documents:
        # Mock document text extraction - in a real system this would actually download and parse
        text = f"Extracted content from {doc['name']}. This is a placeholder for actual document text extraction."
        document_texts.append({
            'name': doc['name'],
            'content': text
        })
    
    return document_texts

def update_task_status(task_id, status, result=None):
    """Update the status of a task in Supabase"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/agent_tasks"
        params = {'id': f'eq.{task_id}'}
        
        data = {
            'status': status,
            'updated_at': datetime.now().isoformat(),
        }
        
        if result:
            data['result'] = result
            
        response = requests.patch(url, headers=HEADERS, params=params, json=data)
        response.raise_for_status()
        
        return True
    except Exception as e:
        print(f"Error updating task status: {e}")
        return False

def process_employee_profile(task):
    """Process an employee profile with the personalization agent"""
    try:
        task_id = task['id']
        employee_id = task['data']['employee_id']
        profile_id = task['data']['profile_id']
        
        # 1. Update task to in_progress
        update_task_status(task_id, 'in_progress')
        
        # 2. Fetch employee data from Supabase
        employee_data = fetch_employee_data(employee_id, profile_id)
        if not employee_data:
            raise Exception(f"Failed to fetch employee data for ID {employee_id}")
        
        # 3. Process any uploaded documents
        document_texts = []
        if employee_data.get('documents'):
            document_texts = extract_document_texts(employee_data['documents'])
            
        # 4. Format data for the personalization agent
        agent_employee_data = {
            'employee_id': employee_id,
            'name': employee_data['name'],
            'role': employee_data['role'],
            'department': employee_data['department'],
            'experience': employee_data['experience'],
            'additional_info': employee_data['additional_info'] or ''
        }
        
        # Add document information if available
        if document_texts:
            document_info = "\n\nDocument Extracts:\n"
            for doc in document_texts:
                document_info += f"\n--- {doc['name']} ---\n{doc['content']}\n"
            agent_employee_data['additional_info'] += document_info
        
        # 5. Initialize personalization agent
        personalization_agent = PersonalizationAgent()
        
        # 6. Create employee profile using the agent
        print(f"Creating profile for employee {employee_id}: {employee_data['name']}")
        profile = personalization_agent.create_employee_profile(agent_employee_data)
        
        # 7. Create learning path based on the profile
        print(f"Creating learning path for employee {employee_id}")
        learning_path = personalization_agent.create_learning_path(employee_id, profile)
        
        # 8. Update the task with the results
        result = {
            'profile_id': profile.get('id', str(uuid.uuid4())),
            'learning_path_id': learning_path.get('id', str(uuid.uuid4())),
            'profile_created': True,
            'learning_path_created': True,
            'timestamp': datetime.now().isoformat()
        }
        
        update_task_status(task_id, 'completed', result)
        
        # 9. Update employee record in Supabase to show processing is complete
        url = f"{SUPABASE_URL}/rest/v1/hr_employees"
        params = {'id': f'eq.{profile_id}'}
        data = {
            'status': 'processed',
            'agent_processed_at': datetime.now().isoformat(),
            'learning_path_id': result['learning_path_id'],
            'profile_id': result['profile_id']
        }
        
        response = requests.patch(url, headers=HEADERS, params=params, json=data)
        response.raise_for_status()
        
        print(f"Successfully processed employee {employee_id}")
        return True
        
    except Exception as e:
        print(f"Error processing employee profile: {e}")
        # Update task as failed
        update_task_status(
            task['id'], 
            'failed', 
            {'error': str(e), 'timestamp': datetime.now().isoformat()}
        )
        return False

def main():
    """Main function to continuously process pending tasks"""
    print("Starting Employee Profile Processor Agent")
    
    # Process any pending tasks
    while True:
        try:
            print("Checking for pending tasks...")
            tasks = fetch_pending_tasks()
            
            if not tasks:
                print("No pending tasks found. Waiting...")
            else:
                print(f"Found {len(tasks)} pending tasks")
                
                for task in tasks:
                    print(f"Processing task {task['id']}")
                    process_employee_profile(task)
            
            # Wait before checking again
            time.sleep(30)  # Check every 30 seconds
            
        except KeyboardInterrupt:
            print("Shutting down agent...")
            break
        except Exception as e:
            print(f"Unexpected error: {e}")
            time.sleep(60)  # Wait longer after an error
    
    print("Employee Profile Processor Agent stopped")

if __name__ == "__main__":
    main() 