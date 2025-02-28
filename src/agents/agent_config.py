"""
Agent configuration for the learning platform multi-agent system.
This module defines the base configuration and tools used by all agents.
"""

import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process, LLM

# Load environment variables
load_dotenv()

# Configure the LLM
llm = LLM(model="groq/llama-3.1-70b-versatile")

# Agent descriptions
AGENT_DESCRIPTIONS = {
    "manager": {
        "role": "Manager Agent",
        "goal": "Coordinate all learning platform agents and ensure smooth operation",
        "backstory": "I am an expert coordinator who ensures all aspects of the learning platform work together efficiently."
    },
    "personalization": {
        "role": "Personalization Agent",
        "goal": "Create personalized learning paths based on employee roles and preferences",
        "backstory": "I analyze employee data to create optimal learning journeys tailored to individual needs and career goals."
    },
    "content_creation": {
        "role": "Content Creation Agent",
        "goal": "Generate engaging, relevant learning content for employees",
        "backstory": "I am an expert content creator who produces high-quality educational materials adapted to individual learning styles."
    },
    "feedback": {
        "role": "Feedback and Adaptation Agent",
        "goal": "Collect and analyze learner feedback to improve learning experiences",
        "backstory": "I gather insights from learners and use this information to continuously improve course content and delivery."
    },
    "rag_system": {
        "role": "RAG System Agent",
        "goal": "Monitor learner progress and flag courses that need attention",
        "backstory": "I track learner engagement and performance to identify when intervention is needed."
    },
    "reporting": {
        "role": "Reporting Agent",
        "goal": "Generate comprehensive reports on learner progress and platform usage",
        "backstory": "I create insightful reports that help HR and management understand learning outcomes and platform effectiveness."
    },
    "quality_assurance": {
        "role": "Quality Assurance Agent",
        "goal": "Ensure all learning content meets quality standards",
        "backstory": "I verify that all educational materials are accurate, engaging, and aligned with learning objectives."
    }
}

def create_agent(agent_type, tools=None):
    """Create an agent with the specified configuration"""
    if agent_type not in AGENT_DESCRIPTIONS:
        raise ValueError(f"Unknown agent type: {agent_type}")
    
    config = AGENT_DESCRIPTIONS[agent_type]
    
    return Agent(
        role=config["role"],
        goal=config["goal"],
        backstory=config["backstory"],
        llm=llm,
        verbose=True,
        tools=tools or []
    ) 