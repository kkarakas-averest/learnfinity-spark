"""
Environment setup utility for agent tests.
Ensures that necessary environment variables are available.
"""

import os
import sys
from dotenv import load_dotenv

def ensure_env():
    """
    Ensure that the necessary environment variables are set.
    """
    load_dotenv()
    
    # Check for Groq API key
    groq_api_key = os.getenv('VITE_GROQ_API_KEY')
    if not groq_api_key:
        groq_api_key = os.getenv('GROQ_API_KEY')
        if not groq_api_key:
            print("WARNING: No Groq API key found in environment variables.")
            print("To enable Groq API integration, set VITE_GROQ_API_KEY or GROQ_API_KEY.")
            print("Mock content generation will be used as a fallback.")
        else:
            # If found in GROQ_API_KEY, set it to VITE_GROQ_API_KEY for consistency
            os.environ['VITE_GROQ_API_KEY'] = groq_api_key
    else:
        # If found in VITE_GROQ_API_KEY, set it to GROQ_API_KEY for backward compatibility
        os.environ['GROQ_API_KEY'] = groq_api_key
    
    # Set necessary environment variables for CrewAI if not already set
    if not os.getenv('GROQ_API_KEY'):
        os.environ['GROQ_API_KEY'] = groq_api_key or 'dummy_key'
    
    # Ensure data directory exists
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
    os.makedirs(data_dir, exist_ok=True)
    
    return {
        'groq_api_key': groq_api_key,
        'data_dir': data_dir
    }

if __name__ == "__main__":
    env_info = ensure_env()
    print("Environment setup complete:")
    print(f"Groq API Key: {'✅ Set' if env_info['groq_api_key'] else '❌ Not set'}")
    print(f"Data directory: {env_info['data_dir']}") 