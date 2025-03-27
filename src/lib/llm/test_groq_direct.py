"""
Direct test for Groq API integration
"""
import os
import sys
import json
import requests

# Set the API key
GROQ_API_KEY = "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"

def check_available_models():
    """Check which models are available from Groq API"""
    print("\nChecking available Groq models...")
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    try:
        response = requests.get("https://api.groq.com/openai/v1/models", headers=headers)
        
        if response.status_code != 200:
            print(f"Error: Failed to get models list. Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return []
            
        data = response.json()
        models = [model["id"] for model in data.get("data", [])]
        
        print(f"Available models: {', '.join(models)}")
        return models
    except Exception as e:
        print(f"Error checking models: {str(e)}")
        return []

def test_groq_completion(model):
    """Test a simple completion with Groq API"""
    print(f"\nTesting completion with model: {model}")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is personalized learning in 1-2 sentences?"}
        ],
        "temperature": 0.7,
        "max_tokens": 150
    }
    
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions", 
            headers=headers,
            json=data
        )
        
        if response.status_code != 200:
            print(f"Error: API request failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        result = response.json()
        completion_text = result["choices"][0]["message"]["content"]
        
        print(f"Response: {completion_text}")
        
        # Print token usage
        if "usage" in result:
            usage = result["usage"]
            print(f"Token usage: {usage['total_tokens']} total tokens")
            print(f"  - Prompt tokens: {usage['prompt_tokens']}")
            print(f"  - Completion tokens: {usage['completion_tokens']}")
        
        return True
    except Exception as e:
        print(f"Error during API call: {str(e)}")
        return False

def test_personalization_prompt(model="llama3-8b-8192"):
    """Test a personalization prompt with Groq API"""
    print(f"\nTesting personalization prompt with model: {model}")
    
    # Employee data for personalization
    employee_data = {
        "name": "Alex Johnson",
        "role": "Data Scientist",
        "department": "Analytics",
        "skills": ["Python", "SQL", "Machine Learning basics"],
        "experience": "mid-level",
        "interests": ["Deep Learning", "MLOps", "Data Visualization"],
        "learning_style": "hands-on",
        "time_available": "3 hours per week"
    }
    
    prompt = f"""
    Create a personalized learning path for the following employee:
    
    {json.dumps(employee_data, indent=2)}
    
    The learning path should include:
    1. 3-5 recommended courses with a brief description of each
    2. The sequence in which they should be taken
    3. Estimated time commitment for each course
    4. Learning objectives for each course
    
    Return the learning path as a JSON object.
    """
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are an expert learning and development specialist. Always respond with valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.5,
        "max_tokens": 1000
    }
    
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions", 
            headers=headers,
            json=data
        )
        
        if response.status_code != 200:
            print(f"Error: API request failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        result = response.json()
        completion_text = result["choices"][0]["message"]["content"]
        
        # Try to parse as JSON to verify it's valid
        try:
            json_result = json.loads(completion_text)
            print(f"Valid JSON response received with {len(json_result.get('courses', []))} courses")
            print(json.dumps(json_result, indent=2))
        except json.JSONDecodeError:
            print("Warning: Response is not valid JSON")
            print(f"Raw response: {completion_text[:500]}...")
        
        # Print token usage
        if "usage" in result:
            usage = result["usage"]
            print(f"Token usage: {usage['total_tokens']} total tokens")
            print(f"  - Prompt tokens: {usage['prompt_tokens']}")
            print(f"  - Completion tokens: {usage['completion_tokens']}")
        
        return True
    except Exception as e:
        print(f"Error during API call: {str(e)}")
        return False

def main():
    """Run the direct Groq API test"""
    print("=== Direct Groq API Test ===")
    
    if not GROQ_API_KEY:
        print("Error: No Groq API key provided")
        return
    
    # Check for available models
    models = check_available_models()
    
    if not models:
        print("No models available. Test failed.")
        return
    
    # Test with preferred model directly
    if "llama3-8b-8192" in models:
        test_model = "llama3-8b-8192"
    else:
        test_model = models[0]
    
    # Run simple test
    success1 = test_groq_completion(test_model)
    
    # Run personalization test
    success2 = test_personalization_prompt(test_model)
    
    print("\n=== Test Complete ===")
    print(f"Basic test: {'Success' if success1 else 'Failed'}")
    print(f"Personalization test: {'Success' if success2 else 'Failed'}")

if __name__ == "__main__":
    main() 