"""
Personalization System Test using Groq API

This script tests the personalization capabilities of the system using
direct calls to the Groq API, simulating the personalization agent.
"""

import os
import sys
import json
import uuid
import requests
from datetime import datetime
import re

# Set the API key
GROQ_API_KEY = "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"

# Define the preferred model to use
PREFERRED_MODEL = "llama3-8b-8192"

# Directory for storing generated data
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

def save_json_to_file(data, filename):
    """Save data to a JSON file in the data directory"""
    file_path = os.path.join(DATA_DIR, filename)
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)
    return file_path

def get_available_model():
    """Get an available model from Groq API"""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    try:
        response = requests.get("https://api.groq.com/openai/v1/models", headers=headers)
        
        if response.status_code != 200:
            print(f"Warning: Failed to get available models (status {response.status_code})")
            return PREFERRED_MODEL
            
        data = response.json()
        models = [model["id"] for model in data.get("data", [])]
        
        if PREFERRED_MODEL in models:
            return PREFERRED_MODEL
        elif "llama3-70b-8192" in models:
            return "llama3-70b-8192"
        elif len(models) > 0:
            return models[0]
        else:
            return PREFERRED_MODEL
    except Exception as e:
        print(f"Error checking available models: {str(e)}")
        return PREFERRED_MODEL

def extract_json_from_markdown(text):
    """Extract JSON from markdown-formatted text."""
    # Try to find json between triple backticks
    json_pattern = r'```(?:json)?(.*?)```'
    matches = re.findall(json_pattern, text, re.DOTALL)
    
    if matches:
        # Try each match until we find valid JSON
        for match in matches:
            try:
                cleaned = match.strip()
                return json.loads(cleaned)
            except json.JSONDecodeError:
                continue
    
    # If no JSON found between backticks, try to extract from the text directly
    try:
        # Try to find the first { and the last }
        start_idx = text.find('{')
        end_idx = text.rfind('}')
        
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_str = text[start_idx:end_idx+1]
            return json.loads(json_str)
    except json.JSONDecodeError:
        pass
    
    return None

def generate_employee_profile(employee_data, model=None):
    """Generate an employee profile using Groq API"""
    if model is None:
        model = get_available_model()
    
    print(f"Generating employee profile using {model}...")
    
    # Prepare the prompt
    prompt = f"""
    Create a comprehensive employee profile based on the following information:
    
    {json.dumps(employee_data, indent=2)}
    
    The profile should include:
    1. A summary of the employee's professional background
    2. An assessment of their likely skill level based on their role and experience
    3. Recommended learning areas based on their role and department
    4. Preferred learning styles (if information is available)
    5. Estimated time availability for learning (if information is available)
    
    Return ONLY a valid JSON object with no markdown formatting or additional text. 
    Do not include code blocks or backticks in your response.
    """
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are an expert HR professional who creates detailed employee profiles. Always respond with valid JSON and nothing else."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 1500
    }
    
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions", 
            headers=headers, 
            json=data
        )
        
        if response.status_code != 200:
            print(f"Error: API request failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return None
        
        result = response.json()
        completion_text = result["choices"][0]["message"]["content"]
        
        # Try to parse as JSON
        try:
            profile = json.loads(completion_text)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown
            extracted_json = extract_json_from_markdown(completion_text)
            if extracted_json:
                profile = extracted_json
            else:
                print("Warning: Could not parse JSON from response")
                print(f"Raw response: {completion_text[:500]}...")
                profile = {"raw_profile": completion_text}
            
        # Add metadata
        if not isinstance(profile, dict):
            profile = {"raw_profile": profile}
            
        profile["metadata"] = {
            "generated_at": datetime.now().isoformat(),
            "model": model,
            "prompt_tokens": result["usage"]["prompt_tokens"],
            "completion_tokens": result["usage"]["completion_tokens"],
            "total_tokens": result["usage"]["total_tokens"]
        }
        
        # Save to file
        profile_id = f"employee_profile_{employee_data.get('id', 'test')}.json"
        save_path = save_json_to_file(profile, profile_id)
        print(f"Profile saved to {save_path}")
        
        return profile
    except Exception as e:
        print(f"Error generating employee profile: {str(e)}")
        return None

def generate_learning_path(employee_id, profile, model=None):
    """Generate a learning path using Groq API"""
    if model is None:
        model = get_available_model()
    
    print(f"Generating learning path using {model}...")
    
    # Prepare the prompt
    prompt = f"""
    Create a personalized learning path for an employee with the following profile:
    
    {json.dumps(profile, indent=2)}
    
    The learning path should include:
    1. 3-5 recommended courses with a brief description of each
    2. The sequence in which they should be taken
    3. Estimated time commitment for each course (in hours)
    4. Learning objectives for each course
    5. How each course contributes to their career development
    
    For each course, include:
    - Course title
    - Brief description
    - Learning objectives
    - Estimated duration
    - Relevance to role and career
    - Type of content (video, reading, interactive, etc.)
    
    Return ONLY a valid JSON object with no markdown formatting or additional text.
    Do not include code blocks or backticks in your response.
    """
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are an expert learning and development specialist. Always respond with valid JSON and nothing else."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 2000
    }
    
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions", 
            headers=headers, 
            json=data
        )
        
        if response.status_code != 200:
            print(f"Error: API request failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return None
        
        result = response.json()
        completion_text = result["choices"][0]["message"]["content"]
        
        # Try to parse as JSON
        try:
            learning_path = json.loads(completion_text)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown
            extracted_json = extract_json_from_markdown(completion_text)
            if extracted_json:
                learning_path = extracted_json
            else:
                print("Warning: Could not parse JSON from response")
                print(f"Raw response: {completion_text[:500]}...")
                learning_path = {"raw_path": completion_text}
            
        # Add metadata
        if not isinstance(learning_path, dict):
            learning_path = {"raw_path": learning_path}
            
        learning_path["metadata"] = {
            "employee_id": employee_id,
            "generated_at": datetime.now().isoformat(),
            "model": model,
            "prompt_tokens": result["usage"]["prompt_tokens"],
            "completion_tokens": result["usage"]["completion_tokens"],
            "total_tokens": result["usage"]["total_tokens"]
        }
        
        # Save to file
        path_id = f"learning_path_{employee_id}.json"
        save_path = save_json_to_file(learning_path, path_id)
        print(f"Learning path saved to {save_path}")
        
        return learning_path
    except Exception as e:
        print(f"Error generating learning path: {str(e)}")
        return None

def generate_course_content(employee_id, course, profile, model=None):
    """Generate content for a course using Groq API"""
    if model is None:
        model = get_available_model()
    
    course_id = course.get("id", f"course_{str(uuid.uuid4())[:8]}")
    print(f"Generating content for course: {course.get('title', 'Untitled')} using {model}...")
    
    # Prepare the prompt
    prompt = f"""
    Create comprehensive course content for the following course:
    
    Course Information:
    {json.dumps(course, indent=2)}
    
    Employee Profile:
    {json.dumps(profile, indent=2)}
    
    The course content should include:
    1. A detailed course overview
    2. 3-5 modules with module titles, descriptions, and learning objectives
    3. For each module, include 3-4 sections with detailed content
    4. Add a quiz for each module with 5 questions
    
    Return ONLY a valid JSON object with no markdown formatting or additional text.
    Do not include code blocks or backticks in your response.
    """
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are an expert educational content creator. Always respond with valid JSON and nothing else."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 4000
    }
    
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions", 
            headers=headers, 
            json=data
        )
        
        if response.status_code != 200:
            print(f"Error: API request failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return None
        
        result = response.json()
        completion_text = result["choices"][0]["message"]["content"]
        
        # Try to parse as JSON
        try:
            course_content = json.loads(completion_text)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown
            extracted_json = extract_json_from_markdown(completion_text)
            if extracted_json:
                course_content = extracted_json
            else:
                print("Warning: Could not parse JSON from response")
                print(f"Raw response: {completion_text[:500]}...")
                course_content = {"raw_content": completion_text}
            
        # Add metadata
        if not isinstance(course_content, dict):
            course_content = {"raw_content": course_content}
            
        course_content["id"] = course_id
        course_content["metadata"] = {
            "course_id": course_id,
            "employee_id": employee_id,
            "generated_at": datetime.now().isoformat(),
            "model": model,
            "prompt_tokens": result["usage"]["prompt_tokens"],
            "completion_tokens": result["usage"]["completion_tokens"],
            "total_tokens": result["usage"]["total_tokens"]
        }
        
        # Save to file
        content_id = f"course_content_{course_id}.json"
        save_path = save_json_to_file(course_content, content_id)
        print(f"Course content saved to {save_path}")
        
        return course_content
    except Exception as e:
        print(f"Error generating course content: {str(e)}")
        return None

def main():
    """Run a complete test of the personalization system"""
    print("=== Personalization System Test ===")
    
    # Create test employee data
    employee_id = f"test_{str(uuid.uuid4())[:8]}"
    employee_data = {
        "id": employee_id,
        "name": "Alex Johnson",
        "role": "Data Scientist",
        "department": "Analytics",
        "skills": ["Python", "SQL", "Machine Learning basics"],
        "experience": "mid-level",
        "learning_preferences": {
            "format": "interactive",
            "timeAvailable": "3 hours per week",
            "interests": ["Deep Learning", "MLOps", "Data Visualization"]
        }
    }
    
    print(f"Test Employee ID: {employee_id}")
    print(f"Name: {employee_data['name']}")
    print(f"Role: {employee_data['role']}")
    
    # Get the available model to use
    model = get_available_model()
    print(f"Using model: {model}")
    
    # Step 1: Generate employee profile
    print("\n1. Generating employee profile...")
    profile = generate_employee_profile(employee_data, model)
    
    if not profile:
        print("Failed to generate employee profile. Exiting.")
        return
    
    print("\nEmployee Profile (Summary):")
    for key, value in profile.items():
        if key != "metadata" and not isinstance(value, dict) and not isinstance(value, list):
            print(f"- {key}: {value}")
    
    # Step 2: Generate learning path
    print("\n2. Generating learning path...")
    learning_path = generate_learning_path(employee_id, profile, model)
    
    if not learning_path:
        print("Failed to generate learning path. Exiting.")
        return
    
    # Get courses from the learning path
    courses = []
    if "courses" in learning_path:
        courses = learning_path["courses"]
    elif isinstance(learning_path, dict):
        # Try to find courses in a nested structure
        for key, value in learning_path.items():
            if isinstance(value, dict) and "courses" in value:
                courses = value["courses"]
                break
            elif isinstance(value, list) and len(value) > 0 and isinstance(value[0], dict):
                courses = value
                break
    
    print("\nLearning Path (Summary):")
    print(f"- Number of courses: {len(courses)}")
    for i, course in enumerate(courses[:3], 1):  # Show only first 3 courses
        if isinstance(course, dict):
            print(f"  {i}. {course.get('title', 'Untitled Course')}")
    
    # Step 3: Generate content for the first course
    if courses and len(courses) > 0 and isinstance(courses[0], dict):
        print("\n3. Generating course content...")
        course = courses[0]
        course_content = generate_course_content(employee_id, course, profile, model)
        
        if course_content:
            print("\nCourse Content (Summary):")
            if isinstance(course_content, dict):
                print(f"- Title: {course_content.get('title', 'Untitled')}")
                print(f"- Description: {course_content.get('description', 'No description')[:100]}...")
                
                modules = course_content.get("modules", [])
                print(f"- Number of modules: {len(modules)}")
                for i, module in enumerate(modules[:2], 1):  # Show only first 2 modules
                    if isinstance(module, dict):
                        print(f"  {i}. {module.get('title', 'Untitled Module')}")
    
    print("\n=== Test Complete ===")
    print(f"Results saved to: {DATA_DIR}")

if __name__ == "__main__":
    main() 