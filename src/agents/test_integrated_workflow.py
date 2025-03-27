"""
Integrated workflow test for Personalization and Content Creation agents.
This script demonstrates how to use both agents together with Groq API
to create personalized learning content for an employee.
"""

import json
import os
import sys
import uuid

# Add the parent directory to the path to import correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Ensure environment variables are set up properly
from agents.ensure_env import ensure_env
env_info = ensure_env()

from agents.personalization_agent import PersonalizationAgent
from agents.content_creation_agent import ContentCreationAgent
from agents.db_utils import (
    load_employee_profile, 
    load_learning_path,
    load_course_content,
    list_employees
)

def main():
    """Run an integrated test of Personalization and Content Creation Agents"""
    print("\n===========================================================")
    print("Testing Integrated Workflow: Personalization → Content Creation")
    print("===========================================================")
    
    api_key_info = "✅ Available" if env_info.get('groq_api_key') else '❌ Not available (will use mock data)'
    print(f"\nGroq API: {api_key_info}")
    
    # Show current model info
    from agents.agent_config import DEFAULT_MODEL, AVAILABLE_MODELS
    print(f"Current Model: {DEFAULT_MODEL}")
    print(f"Available Models: {', '.join(AVAILABLE_MODELS)}")
    
    # Create a test employee or use an existing one
    test_employee = {
        "employee_id": f"emp_{str(uuid.uuid4())[:8]}",  # Generate unique ID
        "name": "Alex Johnson",
        "role": "Data Scientist",
        "department": "Analytics",
        "experience": "Mid-level",
        "additional_info": """
        Alex has been working as a data scientist for 2 years.
        They have experience with Python, SQL, and basic machine learning models.
        They're interested in learning advanced ML techniques, deep learning, and MLOps.
        They prefer interactive learning with code examples and practical projects.
        Alex has approximately 3 hours per week available for structured learning.
        """
    }
    
    print(f"\nTest Employee ID: {test_employee['employee_id']}")
    print(f"Name: {test_employee['name']}")
    print(f"Role: {test_employee['role']}")
    
    # Step 1: Initialize agents
    print("\n1. Initializing agents...")
    personalization_agent = PersonalizationAgent()
    content_creation_agent = ContentCreationAgent()
    
    # Step 2: Create employee profile
    print("\n2. Creating employee profile...")
    profile = personalization_agent.create_employee_profile(test_employee)
    print("\nEmployee Profile (Summary):")
    print(f"- Skills: {', '.join(profile.get('skills', ['Not specified']))}")
    print(f"- Learning style: {profile.get('learning_style', 'Not specified')}")
    print(f"- Time availability: {profile.get('time_availability', 'Not specified')}")
    
    # Step 3: Create learning path
    print("\n3. Creating personalized learning path...")
    learning_path = personalization_agent.create_learning_path(test_employee["employee_id"], profile)
    print("\nLearning Path (Summary):")
    courses = learning_path.get("courses", [])
    print(f"- Number of recommended courses: {len(courses)}")
    for i, course in enumerate(courses, 1):
        print(f"  {i}. {course.get('title', 'Untitled Course')} ({course.get('estimated_duration', 'unknown duration')})")
    
    # Step 4: Create course content for each course in the learning path
    print("\n4. Creating course content...")
    created_courses = []
    
    for course in courses:
        course_id = course.get("id", f"course_{str(uuid.uuid4())[:8]}")
        print(f"\nGenerating content for course: {course.get('title', 'Untitled Course')}")
        
        try:
            course_content = content_creation_agent.create_course_content(
                test_employee["employee_id"],
                course_id,
                course
            )
            
            created_courses.append({
                "course_id": course_id,
                "title": course.get("title", "Untitled Course"),
                "success": True
            })
            
            print(f"✅ Successfully created content for: {course.get('title', 'Untitled Course')}")
            
        except Exception as e:
            print(f"❌ Failed to create content: {str(e)}")
            created_courses.append({
                "course_id": course_id,
                "title": course.get("title", "Untitled Course"),
                "success": False,
                "error": str(e)
            })
    
    # Print summary of results
    print("\n=====================")
    print("Workflow Results")
    print("=====================")
    print(f"Employee: {test_employee['name']} ({test_employee['role']})")
    print(f"Employee ID: {test_employee['employee_id']}")
    print(f"Profile Created: {'✅' if profile else '❌'}")
    print(f"Learning Path Created: {'✅' if learning_path else '❌'}")
    print(f"Courses Created: {sum(1 for c in created_courses if c.get('success', False))}/{len(created_courses)}")
    print(f"Data Directory: {env_info.get('data_dir')}")
    
    # Load and display a sample of the first course
    if created_courses and created_courses[0].get("success", False):
        course_id = created_courses[0].get("course_id")
        course_data = load_course_content(course_id)
        
        if course_data:
            print(f"\nSample of course '{course_data.get('title', 'Untitled')}' content:")
            print(f"Overview: {course_data.get('description', 'No description')}")
            print("Course modules:")
            for i, module in enumerate(course_data.get("modules", [])[:2], 1):  # Show only first 2 modules
                print(f"  {i}. {module.get('title')}")
                # Show a few sections from the first module
                if i == 1 and "content" in module and "sections" in module["content"]:
                    print("    Sections:")
                    for j, section in enumerate(module["content"]["sections"][:2], 1):  # Show only first 2 sections
                        print(f"      {j}. {section.get('title')}")
    
    print("\nTest complete!")
    print(f"All generated data is saved in: {env_info.get('data_dir')}")

if __name__ == "__main__":
    main() 