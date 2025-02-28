# Learning Platform Multi-Agent System

This directory contains a multi-agent system built with CrewAI and Groq to power a personalized learning platform.

## Setup

1. Install dependencies:
```
python -m pip install crewai groq python-dotenv
```

2. Set up your Groq API key in the `.env` file:
```
GROQ_API_KEY="your-api-key-here"
```

## Directory Structure

- `agent_config.py`: Base configuration for all agents
- `db_utils.py`: Simple file-based storage utilities
- `personalization_agent.py`: Implementation of the Personalization Agent
- `test_personalization.py`: Test script for the Personalization Agent

## Running the Personalization Agent

You can test the Personalization Agent with the test script:

```
python src/agents/test_personalization.py
```

This will create a sample employee profile and learning path.

## Incremental Implementation Plan

We're implementing this system incrementally:

1. **Phase 1** (Current): Personalization Agent
   - Basic employee profile creation
   - Learning path generation

2. **Phase 2**: Content Creation Agent
   - Dynamic content generation for courses
   - Adaptation to learner's preferences

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