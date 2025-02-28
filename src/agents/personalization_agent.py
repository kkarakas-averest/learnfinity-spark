"""
Personalization Agent for the learning platform.
This agent creates personalized learning paths for employees.
"""

from crewai import Agent, Task
from typing import Dict, List, Optional
import os

from .agent_config import create_agent
from .db_utils import (
    save_employee_profile,
    load_employee_profile,
    save_learning_path,
    load_learning_path
)

class PersonalizationAgent:
    """
    Agent responsible for creating personalized learning paths
    for employees based on their roles, preferences, and needs.
    """
    
    def __init__(self):
        """Initialize the Personalization Agent"""
        self.agent = create_agent("personalization")
    
    def create_employee_profile_task(self, employee_data: Dict) -> Task:
        """
        Create a task for generating an employee profile
        
        Args:
            employee_data: Basic employee information
            
        Returns:
            A Task object for the agent to execute
        """
        return Task(
            description=f"""
            Create a comprehensive employee profile based on the following information:
            
            Employee ID: {employee_data.get('employee_id', 'unknown')}
            Name: {employee_data.get('name', 'unknown')}
            Role: {employee_data.get('role', 'unknown')}
            Department: {employee_data.get('department', 'unknown')}
            Experience Level: {employee_data.get('experience', 'unknown')}
            
            Additional information (if available):
            {employee_data.get('additional_info', '')}
            
            The profile should include:
            1. A summary of the employee's professional background
            2. An assessment of their likely skill level based on their role and experience
            3. Recommended learning areas based on their role and department
            4. Preferred learning styles (if information is available)
            5. Estimated time availability for learning (if information is available)
            
            The profile should be detailed and insightful, going beyond the provided information
            to build a comprehensive understanding of the employee's learning needs.
            """,
            expected_output="A comprehensive employee profile in JSON format with professional background, skill assessment, learning recommendations, learning styles, and time availability.",
            agent=self.agent
        )
    
    def create_learning_path_task(self, profile: Dict) -> Task:
        """
        Create a task for generating a learning path
        
        Args:
            profile: The employee profile
            
        Returns:
            A Task object for the agent to execute
        """
        return Task(
            description=f"""
            Create a personalized learning path for an employee with the following profile:
            
            {profile}
            
            The learning path should include:
            1. 3-5 recommended courses with a brief description of each
            2. The sequence in which they should be taken
            3. Estimated time commitment for each course
            4. Learning objectives for each course
            5. How each course contributes to their career development
            
            For each course, provide:
            - Course title
            - Brief description
            - Learning objectives
            - Estimated duration
            - Relevance to role and career
            - Type of content (video, reading, interactive, etc.)
            
            The learning path should be tailored to the employee's role, experience level,
            and career trajectory. It should also consider their learning preferences
            and time availability if specified in the profile.
            """,
            expected_output="A detailed personalized learning path in JSON format with recommended courses, sequence, time commitments, learning objectives, and career development insights.",
            agent=self.agent
        )
    
    def create_employee_profile(self, employee_data: Dict) -> Dict:
        """
        Create a comprehensive employee profile
        
        Args:
            employee_data: Basic employee information
            
        Returns:
            A detailed employee profile
        """
        # Check if profile already exists
        if "employee_id" in employee_data:
            existing_profile = load_employee_profile(employee_data["employee_id"])
            if existing_profile:
                return existing_profile
        
        # Create the profile task
        task = self.create_employee_profile_task(employee_data)
        
        # Execute the task
        profile_result = task.execute()
        
        # Try to parse the result as JSON
        try:
            import json
            profile = json.loads(profile_result)
        except json.JSONDecodeError:
            # If parsing fails, wrap the result in a simple dictionary
            profile = {
                "raw_profile": profile_result,
                "employee_data": employee_data
            }
        
        # Save the profile
        if "employee_id" in employee_data:
            profile["employee_id"] = employee_data["employee_id"]
            save_employee_profile(employee_data["employee_id"], profile)
        
        return profile
    
    def create_learning_path(self, employee_id: str, profile: Optional[Dict] = None) -> Dict:
        """
        Create a personalized learning path for an employee
        
        Args:
            employee_id: The ID of the employee
            profile: The employee profile (optional, will be loaded if not provided)
            
        Returns:
            A personalized learning path
        """
        # Check if learning path already exists
        existing_path = load_learning_path(employee_id)
        if existing_path:
            return existing_path
        
        # Load profile if not provided
        if not profile:
            profile = load_employee_profile(employee_id)
            if not profile:
                raise ValueError(f"No profile found for employee {employee_id}")
        
        # Create the learning path task
        task = self.create_learning_path_task(profile)
        
        # Execute the task
        path_result = task.execute()
        
        # Try to parse the result as JSON
        try:
            import json
            learning_path = json.loads(path_result)
        except json.JSONDecodeError:
            # If parsing fails, wrap the result in a simple dictionary
            learning_path = {
                "raw_path": path_result,
                "employee_id": employee_id
            }
        
        # Save the learning path
        save_learning_path(employee_id, learning_path)
        
        return learning_path 