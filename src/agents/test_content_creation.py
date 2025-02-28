"""
Test script for the Content Creation Agent.
This script demonstrates how to use the Content Creation Agent
to create course content based on learning paths.
"""

import json
import os
import sys

# Add the parent directory to the path to import correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.content_creation_agent import ContentCreationAgent
from agents.db_utils import load_learning_path, load_course_content

def main():
    """Run a test of the Content Creation Agent"""
    print("Testing Content Creation Agent...")
    
    # Test employee ID - using existing mock data
    employee_id = "emp001"
    
    # Initialize the agent
    agent = ContentCreationAgent()
    
    # Create courses for the employee's learning path
    print(f"\nCreating courses for employee {employee_id}...")
    created_courses = agent.create_courses_for_learning_path(employee_id)
    
    # Print results
    print(f"\nCreated {len(created_courses)} courses:")
    for course in created_courses:
        status = "✅ Success" if course.get("success", False) else "❌ Failed"
        print(f"- {course.get('title', 'Untitled')}: {status}")
    
    # List all the generated files
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
    print("\nGenerated data files:")
    for filename in sorted(os.listdir(data_dir)):
        if filename.startswith("course_content_"):
            print(f"- {filename}")
    
    # Load and display a sample of the first course
    if created_courses and created_courses[0].get("success", False):
        course_id = created_courses[0].get("course_id")
        course_data = load_course_content(course_id)
        
        if course_data:
            print(f"\nSample of course '{course_data.get('title', 'Untitled')}' content:")
            print("Course modules:")
            for i, module in enumerate(course_data.get("modules", [])[:2], 1):  # Show only first 2 modules
                print(f"  {i}. {module.get('title')}")
                # Show a few sections from the first module
                if i == 1 and "content" in module and "sections" in module["content"]:
                    print("    Sections:")
                    for j, section in enumerate(module["content"]["sections"][:2], 1):  # Show only first 2 sections
                        print(f"      {j}. {section.get('title')}")
    
    print("\nTest complete!")

if __name__ == "__main__":
    main() 