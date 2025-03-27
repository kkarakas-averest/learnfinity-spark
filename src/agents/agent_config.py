"""
Agent configuration for the learning platform multi-agent system.
This module defines the base configuration and tools used by all agents.
"""

import os
import sys
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process, LLM

# Add parent directory to path to import correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Available Groq models
AVAILABLE_MODELS = [
    'llama3-8b-8192',
    'llama3-70b-8192',
    'gemma-7b-it'
]
DEFAULT_MODEL = 'llama3-8b-8192'

# Import our Groq API integration - dynamically to avoid import errors
try:
    from lib.llm.llm_service import LLMService
    from lib.llm.groq_api import GroqAPI
    groq_api_available = True
except ImportError:
    print("WARNING: Custom Groq API integration not available")
    groq_api_available = False

# Load environment variables
load_dotenv()

# Get Groq API key from environment
GROQ_API_KEY = os.getenv('VITE_GROQ_API_KEY')
if not GROQ_API_KEY:
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    if not GROQ_API_KEY:
        print("WARNING: No Groq API key found in environment variables")

# Configure the LLM with our Groq API integration
groq_llm = None
if GROQ_API_KEY and groq_api_available:
    try:
        # Initialize our custom Groq LLM implementation
        groq_service = LLMService.getInstance({
            'provider': 'groq',
            'apiKey': GROQ_API_KEY,
            'model': DEFAULT_MODEL,
            'debugMode': True
        })
        print("Successfully initialized custom Groq API integration")
    except Exception as e:
        print(f"Error initializing custom Groq API: {str(e)}")

# Fallback to default CrewAI Groq integration
groq_llm = LLM(model=f"groq/{DEFAULT_MODEL}")

# Check if default CrewAI model is available
def validate_model():
    """Validate that the model is available in Groq API"""
    if not GROQ_API_KEY:
        print("No Groq API key found, skipping model validation")
        return
        
    try:
        import requests
        
        # Check which models are available
        response = requests.get(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"}
        )
        
        if response.status_code != 200:
            print(f"Warning: Could not validate models (status {response.status_code})")
            return
            
        data = response.json()
        available_models = [model["id"] for model in data.get("data", [])]
        
        # Check if our default model is available
        global DEFAULT_MODEL, groq_llm
        if DEFAULT_MODEL not in available_models:
            print(f"Warning: Default model '{DEFAULT_MODEL}' is not available in Groq API")
            
            # Try to find an available model from our preference list
            for model in AVAILABLE_MODELS:
                if model in available_models:
                    print(f"Switching to available model: {model}")
                    DEFAULT_MODEL = model
                    groq_llm = LLM(model=f"groq/{model}")
                    return
                    
            print("Warning: No preferred models are available")
    except Exception as e:
        print(f"Error validating model: {e}")

# Run model validation
validate_model()

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
        llm=groq_llm,
        verbose=True,
        tools=tools or []
    ) 