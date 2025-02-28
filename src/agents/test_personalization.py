"""
Test script for the Personalization Agent.
This script demonstrates how to use the Personalization Agent
to create employee profiles and learning paths.
"""

import json
import os
import sys

# Add the parent directory to the path to import correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.personalization_agent import PersonalizationAgent

def main():
    """Run a test of the Personalization Agent"""
    print("Testing Personalization Agent...")
    
    # Create a test employee
    test_employee = {
        "employee_id": "emp001",
        "name": "John Doe",
        "role": "Software Developer",
        "department": "Engineering",
        "experience": "Mid-level",
        "additional_info": """
        John has been working as a software developer for 3 years.
        He has experience with Python and JavaScript.
        He is interested in learning more about cloud computing and DevOps.
        He prefers hands-on learning with practical exercises.
        """
    }
    
    # Initialize the agent
    agent = PersonalizationAgent()
    
    # Create an employee profile
    print("\nCreating employee profile...")
    profile = agent.create_employee_profile(test_employee)
    print("\nEmployee Profile:")
    print(json.dumps(profile, indent=2))
    
    # Create a learning path
    print("\nCreating learning path...")
    learning_path = agent.create_learning_path(test_employee["employee_id"], profile)
    print("\nLearning Path:")
    print(json.dumps(learning_path, indent=2))
    
    print("\nTest complete!")

if __name__ == "__main__":
    main() 