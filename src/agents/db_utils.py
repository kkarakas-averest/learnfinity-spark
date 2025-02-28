"""
Database utilities for the learning platform.
This module provides simple file-based storage for initial development.
"""

import json
import os
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional

# Directory for storing data files
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

def save_to_json(data: Any, filename: str) -> str:
    """
    Save data to a JSON file and return the path
    
    Args:
        data: The data to save
        filename: The name of the file (without extension)
        
    Returns:
        The path to the saved file
    """
    file_path = os.path.join(DATA_DIR, f"{filename}.json")
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2, default=str)
    return file_path

def load_from_json(filename: str) -> Optional[Any]:
    """
    Load data from a JSON file
    
    Args:
        filename: The name of the file (without extension)
        
    Returns:
        The loaded data or None if file doesn't exist
    """
    file_path = os.path.join(DATA_DIR, f"{filename}.json")
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return None

def save_learning_path(employee_id: str, learning_path: Dict) -> str:
    """
    Save a learning path for an employee
    
    Args:
        employee_id: The ID of the employee
        learning_path: The learning path data
        
    Returns:
        The path to the saved file
    """
    # Add metadata
    if "metadata" not in learning_path:
        learning_path["metadata"] = {}
    
    learning_path["metadata"].update({
        "employee_id": employee_id,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "path_id": str(uuid.uuid4())
    })
    
    return save_to_json(learning_path, f"learning_path_{employee_id}")

def load_learning_path(employee_id: str) -> Optional[Dict]:
    """
    Load a learning path for an employee
    
    Args:
        employee_id: The ID of the employee
        
    Returns:
        The learning path data or None if not found
    """
    return load_from_json(f"learning_path_{employee_id}")

def save_course_content(course_id: str, content: Dict) -> str:
    """
    Save content for a course
    
    Args:
        course_id: The ID of the course
        content: The course content data
        
    Returns:
        The path to the saved file
    """
    # Add metadata
    if "metadata" not in content:
        content["metadata"] = {}
    
    content["metadata"].update({
        "course_id": course_id,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    })
    
    return save_to_json(content, f"course_content_{course_id}")

def load_course_content(course_id: str) -> Optional[Dict]:
    """
    Load content for a course
    
    Args:
        course_id: The ID of the course
        
    Returns:
        The course content data or None if not found
    """
    return load_from_json(f"course_content_{course_id}")

def save_employee_profile(employee_id: str, profile: Dict) -> str:
    """
    Save an employee profile
    
    Args:
        employee_id: The ID of the employee
        profile: The employee profile data
        
    Returns:
        The path to the saved file
    """
    # Add metadata
    if "metadata" not in profile:
        profile["metadata"] = {}
    
    profile["metadata"].update({
        "employee_id": employee_id,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    })
    
    return save_to_json(profile, f"employee_profile_{employee_id}")

def load_employee_profile(employee_id: str) -> Optional[Dict]:
    """
    Load an employee profile
    
    Args:
        employee_id: The ID of the employee
        
    Returns:
        The employee profile data or None if not found
    """
    return load_from_json(f"employee_profile_{employee_id}")

def list_employees() -> List[str]:
    """
    List all employee IDs
    
    Returns:
        A list of employee IDs
    """
    employees = []
    prefix = "employee_profile_"
    suffix = ".json"
    
    for filename in os.listdir(DATA_DIR):
        if filename.startswith(prefix) and filename.endswith(suffix):
            employee_id = filename[len(prefix):-len(suffix)]
            employees.append(employee_id)
    
    return employees 