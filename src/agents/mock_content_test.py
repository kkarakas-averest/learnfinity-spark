"""
Mock test script for content creation.
This creates mock course content without needing the full agent infrastructure.
"""

import json
import os
import uuid
from datetime import datetime

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

def create_mock_course_content(employee_id, course_id, course_info):
    """
    Create mock content for a course
    
    Args:
        employee_id: Employee ID
        course_id: Course ID
        course_info: Basic course information
        
    Returns:
        The generated course content
    """
    title = course_info.get("title", "Untitled Course")
    print(f"Generating content for '{title}'...")
    
    # Generate a course overview
    course_overview = {
        "summary": f"This course covers {title} with a focus on practical applications.",
        "key_concepts": [
            "Understanding core principles",
            "Practical application techniques",
            f"Advanced topics in {title}"
        ],
        "prerequisites": [],
        "target_audience": ["Software Developers"],
        "difficulty_level": "Intermediate",
        "estimated_completion_time": course_info.get("estimated_duration", "10 hours")
    }
    
    # Generate modules (3-5 modules)
    module_count = min(5, max(3, int(course_info.get("estimated_duration", "10").split()[0]) // 3))
    modules = []
    
    for i in range(module_count):
        module_title = f"Module {i+1}: "
        if i == 0:
            module_title += f"Introduction to {title}"
        elif i == 1:
            module_title += f"Core Concepts of {title}"
        elif i == module_count - 1:
            module_title += "Advanced Topics and Case Studies"
        else:
            module_title += f"Working with {title} - Part {i}"
        
        # Create sections (3-5 per module)
        sections = []
        section_count = 3 + (i % 3)
        
        for j in range(section_count):
            section_title = f"Section {j+1}: "
            if j == 0:
                section_title += "Key Concepts"
            elif j == 1:
                section_title += "Practical Examples"
            elif j == 2:
                section_title += "Hands-on Exercise"
            else:
                section_title += "Advanced Techniques"
                
            section = {
                "title": section_title,
                "content": [
                    {"type": "text", "value": f"This section explains important concepts related to {module_title}."},
                    {"type": "image", "value": "Diagram illustrating the concept"},
                    {"type": "text", "value": "After studying this section, you'll be able to apply these concepts in real-world scenarios."}
                ]
            }
            sections.append(section)
        
        # Create quiz questions
        quiz_questions = []
        for k in range(5):  # 5 questions per quiz
            question = {
                "id": f"q_{str(uuid.uuid4())[:8]}",
                "text": f"Question {k+1} about {module_title}",
                "type": "multiple_choice",
                "options": [
                    {"id": "a", "text": "First potential answer"},
                    {"id": "b", "text": "Second potential answer"},
                    {"id": "c", "text": "Third potential answer"},
                    {"id": "d", "text": "Fourth potential answer"}
                ],
                "correct_answer": "a",
                "explanation": "Explanation for the correct answer"
            }
            quiz_questions.append(question)
        
        module = {
            "id": f"module_{str(uuid.uuid4())[:8]}",
            "title": module_title,
            "sequence_order": i + 1,
            "content": {
                "introduction": f"In this module, you'll learn about {module_title.lower()}.",
                "sections": sections,
                "summary": f"You've completed Module {i+1}! You should now understand the key concepts of {module_title.lower()}."
            },
            "estimated_duration": f"{30 + i * 15} minutes",
            "quiz": {
                "title": f"Quiz: {module_title}",
                "description": f"Test your understanding of {module_title.lower()}",
                "questions": quiz_questions,
                "passing_score": 80
            }
        }
        modules.append(module)
    
    # Assemble the complete course content
    course_content = {
        "id": course_id,
        "title": title,
        "description": course_info.get("description", ""),
        "overview": course_overview,
        "modules": modules,
        "employee_id": employee_id,
        "learning_objectives": course_info.get("learning_objectives", []),
        "metadata": {
            "course_id": course_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "generated_for": employee_id
        }
    }
    
    # Save the course content
    save_path = save_to_json(course_content, f"course_content_{course_id}")
    print(f"Course content saved to: {save_path}")
    
    return course_content

def create_courses_for_learning_path(employee_id):
    """
    Create all courses for a learning path
    
    Args:
        employee_id: Employee ID
        
    Returns:
        List of created course information
    """
    # Load the learning path
    learning_path = load_from_json(f"learning_path_{employee_id}")
    if not learning_path:
        print(f"No learning path found for employee {employee_id}")
        return []
    
    # Extract courses from the learning path
    courses = learning_path.get("recommended_courses", [])
    if not courses:
        print(f"No courses found in learning path for employee {employee_id}")
        return []
    
    # Create content for each course
    created_courses = []
    
    for course in courses:
        course_id = course.get("course_id", str(uuid.uuid4()))
        print(f"Creating content for course: {course.get('title', 'Untitled Course')}")
        
        try:
            course_content = create_mock_course_content(employee_id, course_id, course)
            created_courses.append({
                "course_id": course_id,
                "title": course.get("title", "Untitled Course"),
                "success": True
            })
        except Exception as e:
            print(f"Error creating content for course {course_id}: {e}")
            created_courses.append({
                "course_id": course_id,
                "title": course.get("title", "Untitled Course"),
                "success": False,
                "error": str(e)
            })
    
    return created_courses

def main():
    """Test mock content creation"""
    print("Running mock content creation test...")
    
    # Test with existing employee
    employee_id = "emp001"
    
    # Create courses for the learning path
    print(f"\nCreating courses for employee {employee_id}...")
    created_courses = create_courses_for_learning_path(employee_id)
    
    # Print results
    print(f"\nCreated {len(created_courses)} courses:")
    for course in created_courses:
        status = "✅ Success" if course.get("success", False) else "❌ Failed"
        print(f"- {course.get('title', 'Untitled')}: {status}")
    
    # Display all data files
    print("\nAll data files:")
    for filename in sorted(os.listdir(DATA_DIR)):
        print(f"- {filename}")
    
    print("\nTest complete!")

if __name__ == "__main__":
    main() 