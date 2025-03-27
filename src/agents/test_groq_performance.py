"""
Performance testing script for Groq API integration

This script runs performance tests on the Groq API for personalization and
content creation tasks, measuring response times, token usage, and success rates.
"""

import os
import sys
import time
import json
from datetime import datetime
import uuid

# Add the parent directory to the path to import correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Ensure environment variables are set up properly
from agents.ensure_env import ensure_env
env_info = ensure_env()

# Import our agents
from agents.personalization_agent import PersonalizationAgent
from agents.content_creation_agent import ContentCreationAgent

# Test employees with different roles
TEST_EMPLOYEES = [
    {
        "employee_id": f"perf_data_{str(uuid.uuid4())[:8]}",
        "name": "Alex Johnson",
        "role": "Data Scientist",
        "department": "Analytics",
        "experience": "Mid-level",
        "additional_info": """
        Alex has been working as a data scientist for 2 years.
        They have experience with Python, SQL, and basic machine learning models.
        They're interested in advanced ML techniques and MLOps.
        """
    },
    {
        "employee_id": f"perf_eng_{str(uuid.uuid4())[:8]}",
        "name": "Morgan Lee",
        "role": "Software Engineer",
        "department": "Engineering",
        "experience": "Senior",
        "additional_info": """
        Morgan is a senior software engineer with 7 years of experience.
        They are proficient in JavaScript, TypeScript, and React.
        They're interested in system architecture and scalability.
        """
    },
    {
        "employee_id": f"perf_mgr_{str(uuid.uuid4())[:8]}",
        "name": "Jamie Taylor",
        "role": "Product Manager",
        "department": "Product",
        "experience": "Junior",
        "additional_info": """
        Jamie is a new product manager with 1 year of experience.
        They're looking to improve their skills in market research and user interviews.
        They need to learn more about prioritization and roadmap planning.
        """
    }
]

class PerformanceMetrics:
    """Class to track performance metrics"""
    
    def __init__(self):
        """Initialize performance metrics"""
        self.start_time = datetime.now()
        self.metrics = {
            "overall": {
                "start_time": self.start_time.isoformat(),
                "end_time": None,
                "duration_seconds": None,
                "success": False
            },
            "tasks": []
        }
    
    def start_task(self, task_name, employee_id=None):
        """Start timing a task"""
        task = {
            "task_name": task_name,
            "employee_id": employee_id,
            "start_time": datetime.now().isoformat(),
            "end_time": None,
            "duration_seconds": None,
            "success": False,
            "error": None
        }
        self.metrics["tasks"].append(task)
        return len(self.metrics["tasks"]) - 1  # Return task index
    
    def end_task(self, task_idx, success=True, error=None, metadata=None):
        """End timing a task"""
        task = self.metrics["tasks"][task_idx]
        end_time = datetime.now()
        start_time = datetime.fromisoformat(task["start_time"])
        duration = (end_time - start_time).total_seconds()
        
        task["end_time"] = end_time.isoformat()
        task["duration_seconds"] = duration
        task["success"] = success
        if error:
            task["error"] = str(error)
        if metadata:
            task["metadata"] = metadata
    
    def finish(self, success=True):
        """Finish overall metrics collection"""
        end_time = datetime.now()
        self.metrics["overall"]["end_time"] = end_time.isoformat()
        self.metrics["overall"]["duration_seconds"] = (end_time - self.start_time).total_seconds()
        self.metrics["overall"]["success"] = success
        
        # Calculate success rate
        total_tasks = len(self.metrics["tasks"])
        successful_tasks = sum(1 for task in self.metrics["tasks"] if task["success"])
        self.metrics["overall"]["task_success_rate"] = (successful_tasks / total_tasks) if total_tasks > 0 else 0
        
        return self.metrics
    
    def save_to_file(self, filename=None):
        """Save metrics to a file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"groq_performance_{timestamp}.json"
        
        file_path = os.path.join(env_info.get("data_dir"), filename)
        with open(file_path, "w") as f:
            json.dump(self.metrics, f, indent=2)
        
        return file_path

def run_performance_test():
    """Run a performance test on Groq API integration"""
    print("\n===========================================================")
    print("Performance Testing: Groq API for Personalization System")
    print("===========================================================")
    
    print(f"\nGroq API: {'✅ Available' if env_info.get('groq_api_key') else '❌ Not available'}")
    
    # Initialize metrics
    metrics = PerformanceMetrics()
    
    # Initialize agents
    print("\nInitializing agents...")
    task_idx = metrics.start_task("agent_initialization")
    try:
        personalization_agent = PersonalizationAgent()
        content_creation_agent = ContentCreationAgent()
        metrics.end_task(task_idx, success=True)
    except Exception as e:
        print(f"Error initializing agents: {str(e)}")
        metrics.end_task(task_idx, success=False, error=e)
        metrics.finish(success=False)
        return metrics
    
    # Test with each employee
    for employee in TEST_EMPLOYEES:
        print(f"\nTesting with employee: {employee['name']} ({employee['role']})")
        
        # Create profile
        print(f"  Creating profile...")
        task_idx = metrics.start_task("create_profile", employee["employee_id"])
        try:
            profile = personalization_agent.create_employee_profile(employee)
            profile_stats = {
                "skills_count": len(profile.get("skills", [])),
                "profile_size_bytes": len(json.dumps(profile))
            }
            metrics.end_task(task_idx, success=True, metadata=profile_stats)
            print(f"  ✅ Profile created with {profile_stats['skills_count']} skills")
        except Exception as e:
            print(f"  ❌ Error creating profile: {str(e)}")
            metrics.end_task(task_idx, success=False, error=e)
            continue
        
        # Create learning path
        print(f"  Creating learning path...")
        task_idx = metrics.start_task("create_learning_path", employee["employee_id"])
        try:
            learning_path = personalization_agent.create_learning_path(employee["employee_id"], profile)
            courses = learning_path.get("courses", [])
            path_stats = {
                "courses_count": len(courses),
                "path_size_bytes": len(json.dumps(learning_path))
            }
            metrics.end_task(task_idx, success=True, metadata=path_stats)
            print(f"  ✅ Learning path created with {path_stats['courses_count']} courses")
        except Exception as e:
            print(f"  ❌ Error creating learning path: {str(e)}")
            metrics.end_task(task_idx, success=False, error=e)
            continue
        
        # Create content for first course only (to save time)
        if courses:
            first_course = courses[0]
            course_id = first_course.get("id", f"course_{str(uuid.uuid4())[:8]}")
            print(f"  Creating content for course: {first_course.get('title', 'Untitled Course')}")
            
            task_idx = metrics.start_task("create_course_content", employee["employee_id"])
            try:
                course_content = content_creation_agent.create_course_content(
                    employee["employee_id"],
                    course_id,
                    first_course
                )
                
                modules = course_content.get("modules", [])
                content_stats = {
                    "modules_count": len(modules),
                    "content_size_bytes": len(json.dumps(course_content))
                }
                metrics.end_task(task_idx, success=True, metadata=content_stats)
                print(f"  ✅ Course content created with {content_stats['modules_count']} modules")
            except Exception as e:
                print(f"  ❌ Error creating course content: {str(e)}")
                metrics.end_task(task_idx, success=False, error=e)
    
    # Finish metrics
    metrics.finish()
    
    # Save metrics
    metrics_file = metrics.save_to_file()
    
    # Print summary
    print("\n===========================================================")
    print("Performance Test Results")
    print("===========================================================")
    print(f"Total duration: {metrics.metrics['overall']['duration_seconds']:.2f} seconds")
    print(f"Task success rate: {metrics.metrics['overall']['task_success_rate']*100:.1f}%")
    print(f"Metrics saved to: {metrics_file}")
    
    return metrics

if __name__ == "__main__":
    run_performance_test() 