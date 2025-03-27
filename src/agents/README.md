# Learning Platform Multi-Agent System

This directory contains a multi-agent system built with CrewAI and Groq to power a personalized learning platform.

## Setup

1. Install dependencies:
```
python -m pip install crewai groq python-dotenv requests
```

2. Set up your Groq API key in the `.env` file:
```
GROQ_API_KEY="your-api-key-here"
```

## Directory Structure

- `agent_config.py`: Base configuration for all agents
- `db_utils.py`: Simple file-based storage utilities
- `personalization_agent.py`: Implementation of the Personalization Agent
- `content_creation_agent.py`: Implementation of the Content Creation Agent
- `test_personalization.py`: Test script for the Personalization Agent
- `test_integrated_workflow.py`: Test script for integrated workflow

## Groq API Integration

This system uses the Groq API for natural language processing. The implementation includes:

- Automatic model validation and fallback mechanisms
- Support for multiple LLM models (llama3-8b-8192, llama3-70b-8192, gemma-7b-it)
- Graceful degradation to mock data when API is unavailable
- Robust error handling

### Testing Available Models

You can test which Groq API models are currently available:

**TypeScript:**
```
ts-node src/lib/llm/test-available-models.ts
```

**Python:**
```
python -m src.agents.test_integrated_workflow
```

## Running the Personalization Agent

You can test the Personalization Agent with the test script:

```
python src/agents/test_personalization.py
```

This will create a sample employee profile and learning path.

## Running the Integrated Workflow

Test the full personalization and content creation workflow:

```
python src/agents/test_integrated_workflow.py
```

This demonstrates:
1. Creating an employee profile
2. Generating a learning path
3. Creating content for the learning path

## Incremental Implementation Plan

We're implementing this system incrementally:

1. **Phase 1** (Complete): Personalization Agent
   - Basic employee profile creation
   - Learning path generation

2. **Phase 2** (Complete): Content Creation Agent
   - Dynamic content generation for courses
   - Adaptation to learner's preferences
   - Fallback to mock data when API is unavailable

3. **Phase 3**: RAG System Agent
   - Progress tracking
   - Red-Amber-Green status assignment

4. **Phase 4**: Additional Agents
   - Feedback collection and analysis
   - Reporting
   - Quality assurance

## Folder Structure for Data

The system stores data in a `data` folder at the project root:
- `employee_profile_{employee_id}.json`: Employee profiles
- `learning_path_{employee_id}.json`: Personalized learning paths
- `course_content_{course_id}.json`: Course content 