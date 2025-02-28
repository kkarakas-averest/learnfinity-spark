"""
Simple test for the agent infrastructure without depending on CrewAI.
This is a basic mock of what the system will do once properly set up.
"""

import json
import os
import sys
from datetime import datetime
import uuid

# Create data directory if it doesn't exist
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

def save_to_json(data, filename):
    """Save data to a JSON file"""
    file_path = os.path.join(DATA_DIR, f"{filename}.json")
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2, default=str)
    return file_path

def load_from_json(filename):
    """Load data from a JSON file"""
    file_path = os.path.join(DATA_DIR, f"{filename}.json")
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return None

def mock_personalization_agent(employee_data):
    """
    Simulate what the personalization agent would do
    
    Args:
        employee_data: Basic employee information
        
    Returns:
        A dictionary containing a simulated profile and learning path
    """
    # Create a mock employee profile
    profile = {
        "employee_id": employee_data.get("employee_id", str(uuid.uuid4())),
        "name": employee_data.get("name", "Unknown"),
        "professional_background": "Software developer with 3 years of experience in Python and JavaScript.",
        "skill_assessment": "Mid-level developer with solid programming fundamentals. Could benefit from advanced frameworks and DevOps practices.",
        "recommended_learning_areas": ["Cloud Computing", "DevOps", "Advanced JavaScript Frameworks"],
        "learning_preferences": "Hands-on learning with practical exercises",
        "time_availability": "5-7 hours per week",
        "metadata": {
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    }
    
    # Save the profile
    save_to_json(profile, f"employee_profile_{profile['employee_id']}")
    
    # Create a mock learning path
    learning_path = {
        "employee_id": profile["employee_id"],
        "recommended_courses": [
            {
                "course_id": str(uuid.uuid4()),
                "title": "Cloud Computing Fundamentals",
                "description": "Introduction to cloud computing concepts, services, and providers.",
                "learning_objectives": [
                    "Understand cloud service models",
                    "Compare major cloud providers",
                    "Deploy basic applications to the cloud"
                ],
                "estimated_duration": "10 hours",
                "relevance": "Essential for modern software development",
                "content_type": ["video", "interactive"]
            },
            {
                "course_id": str(uuid.uuid4()),
                "title": "DevOps Practices",
                "description": "Learn essential DevOps tools and methodologies.",
                "learning_objectives": [
                    "Understand CI/CD pipelines",
                    "Use Docker for containerization",
                    "Implement automated testing"
                ],
                "estimated_duration": "15 hours",
                "relevance": "Critical for efficient development workflows",
                "content_type": ["hands-on", "case studies"]
            },
            {
                "course_id": str(uuid.uuid4()),
                "title": "Advanced JavaScript Frameworks",
                "description": "Deep dive into modern JavaScript frameworks.",
                "learning_objectives": [
                    "Master React hooks and patterns",
                    "Build scalable frontend applications",
                    "Implement state management"
                ],
                "estimated_duration": "20 hours",
                "relevance": "Enhances frontend development capabilities",
                "content_type": ["projects", "tutorials"]
            }
        ],
        "sequence": ["Cloud Computing Fundamentals", "DevOps Practices", "Advanced JavaScript Frameworks"],
        "total_duration": "45 hours",
        "metadata": {
            "path_id": str(uuid.uuid4()),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    }
    
    # Save the learning path
    save_to_json(learning_path, f"learning_path_{profile['employee_id']}")
    
    return {
        "profile": profile,
        "learning_path": learning_path
    }

def main():
    """Run a simple test with mocked functionality"""
    print("Running simple test of agent infrastructure...")
    
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
    
    # Run the mock agent
    print("\nCreating employee profile and learning path...")
    result = mock_personalization_agent(test_employee)
    
    # Display results
    print("\nEmployee Profile:")
    print(json.dumps(result["profile"], indent=2))
    
    print("\nLearning Path:")
    print(json.dumps(result["learning_path"], indent=2))
    
    # Show file paths
    profile_path = os.path.join(DATA_DIR, f"employee_profile_{test_employee['employee_id']}.json")
    learning_path = os.path.join(DATA_DIR, f"learning_path_{test_employee['employee_id']}.json")
    
    print(f"\nProfile saved to: {profile_path}")
    print(f"Learning path saved to: {learning_path}")
    
    print("\nTest complete!")

if __name__ == "__main__":
    main() 