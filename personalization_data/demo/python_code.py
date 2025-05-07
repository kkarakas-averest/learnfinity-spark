"""
Course and Content Generation Code for the LearnFinity AI Personalized Learning Demo

This file contains the actual Python code that powers the demo. It's provided
as a separate file to avoid linting issues when showing Python code in JavaScript.
"""

# ---------------------------------------
# generate_course.py
# ---------------------------------------

import json
import os
from groq import Groq
import time

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def load_json(file_path):
    """Load JSON data from a file."""
    with open(file_path, 'r') as file:
        return json.load(file)

def analyze_skills_gap(employee_data, position_requirements):
    """Identify skill gaps between current skills and target position requirements."""
    # Extract employee skills
    employee_skills = []
    for category in employee_data["skills"]:
        for skill in category["skills"]:
            employee_skills.append({
                "name": skill["name"],
                "proficiency": skill["proficiency"],
                "category": category["category"]
            })
    
    # Identify gaps and transferable skills
    skill_gaps = []
    transferable_skills = []
    
    for req_category in position_requirements["required_skills"]:
        category_gaps = []
        for skill in req_category["skills"]:
            # Check if skill exists in employee skills
            found = False
            for emp_skill in employee_skills:
                if emp_skill["name"].lower() == skill.lower():
                    if emp_skill["proficiency"] >= 3:
                        transferable_skills.append(emp_skill["name"])
                    else:
                        category_gaps.append(skill)
                    found = True
                    break
            
            if not found:
                category_gaps.append(skill)
        
        if category_gaps:
            skill_gaps.append({
                "category": req_category["category"],
                "skills": category_gaps,
                "priority": req_category.get("priority", "Medium")
            })
    
    # Add transferable skills from taxonomy that match employee high-proficiency skills
    for emp_skill in employee_skills:
        if emp_skill["proficiency"] >= 4 and emp_skill["name"] not in transferable_skills:
            transferable_skills.append(emp_skill["name"])
    
    return {
        "transferable_skills": transferable_skills,
        "skill_gaps": skill_gaps,
        "learning_priorities": identify_learning_priorities(skill_gaps)
    }

def identify_learning_priorities(skill_gaps):
    """Identify top priority skills to focus on."""
    priorities = []
    
    # Add high priority skills first
    for gap in skill_gaps:
        if gap["priority"] == "High":
            for skill in gap["skills"][:3]:  # Limit to top 3 per category
                priorities.append(skill)
    
    # Add medium priority skills if we have space
    if len(priorities) < 5:
        for gap in skill_gaps:
            if gap["priority"] == "Medium" and len(priorities) < 5:
                priorities.append(gap["skills"][0])  # Add top skill from medium priority
    
    return priorities[:5]  # Return top 5 priorities

def generate_course_outline(employee_data, skill_gaps, taxonomy):
    """Generate a structured course outline based on skill gaps and taxonomy."""
    # Get the course prompt ready
    system_prompt = """
    You are an expert curriculum designer for financial analysts. 
    Create a 4-week course outline (40 modules total, 10 per week) for a personalized learning path.
    The course should help a data analyst transition to a financial analyst role.
    Focus on addressing the identified skill gaps while leveraging transferable skills.
    Structure the course progressively, from fundamentals to advanced topics.
    Each week should have a theme, and each module should build upon previous ones.
    """
    
    user_prompt = f"""
    Create a detailed course outline based on this information:
    
    Student Profile:
    - Name: {employee_data['name']}
    - Current Role: {employee_data['current_role']}
    - Target Role: {employee_data['target_role']}
    - Years Experience: {employee_data['years_experience']}
    - Education: {employee_data['education']}
    
    Transferable Skills:
    {json.dumps(skill_gaps['transferable_skills'], indent=2)}
    
    Skill Gaps:
    {json.dumps(skill_gaps['skill_gaps'], indent=2)}
    
    Learning Priorities:
    {json.dumps(skill_gaps['learning_priorities'], indent=2)}
    
    Taxonomy:
    {json.dumps(taxonomy['skills'], indent=2)}
    
    Format the response as a structured JSON object with:
    {
      "course_title": "",
      "course_description": "",
      "student_name": "",
      "duration": "4 Weeks",
      "target_role": "Financial Analyst",
      "weeks": [
        {
          "week_number": 1,
          "theme": "",
          "description": "",
          "modules": [
            {
              "module_number": 1,
              "title": "",
              "focus_area": "",
              "learning_objectives": ["", "", ""]
            }
            // remaining modules for week 1
          ]
        }
        // remaining weeks
      ]
    }
    """
    
    # Generate course outline with Groq API
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7,
        max_tokens=4000,
        top_p=0.9
    )
    
    # Extract and parse JSON from the response
    result = response.choices[0].message.content
    
    # Extract JSON part (assuming it's surrounded by ```)
    json_text = result
    if "```json" in result:
        json_text = result.split("```json")[1].split("```")[0]
    elif "```" in result:
        json_text = result.split("```")[1].split("```")[0]
    
    # Parse and return JSON
    try:
        course_outline = json.loads(json_text)
        return course_outline
    except json.JSONDecodeError as e:
        print("Error parsing JSON:", e)
        print("Raw response:", result)
        # Implement fallback or manual fix
        return None

def main():
    # Load required data
    data_dir = "personalization_data"
    employee_data = load_json(os.path.join(data_dir, "employee_data.json"))
    position_requirements = load_json(os.path.join(data_dir, "position_requirements.json"))
    taxonomy = load_json(os.path.join(data_dir, "finance_taxonomy_skills.json"))
    
    # Analyze skills gap
    skill_gaps = analyze_skills_gap(employee_data, position_requirements)
    print("Skills gap analysis completed.")
    
    # Save skills gap analysis
    with open(os.path.join(data_dir, "skills_gap_analysis.json"), 'w') as file:
        json.dump(skill_gaps, file, indent=2)
    
    # Generate course outline
    start_time = time.time()
    course_outline = generate_course_outline(employee_data, skill_gaps, taxonomy)
    end_time = time.time()
    
    print(f"Course outline generated in {end_time - start_time:.2f} seconds.")
    
    # Save course outline
    if course_outline:
        with open(os.path.join(data_dir, "course_outline.json"), 'w') as file:
            json.dump(course_outline, file, indent=2)
        print("Course outline saved successfully.")
    else:
        print("Failed to generate course outline.")

if __name__ == "__main__":
    main()


# ---------------------------------------
# generate_course_content.py
# ---------------------------------------

import json
import os
import time
from groq import Groq
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def load_json(file_path):
    """Load JSON data from a file."""
    with open(file_path, 'r') as file:
        return json.load(file)

def generate_module_content(module, week_theme, student_info, skill_gaps):
    """Generate content for a single module using AI."""
    # Prepare the prompts
    system_prompt = """
    You're an expert financial educator creating personalized learning content for a data analyst transitioning to a financial analyst role.
    Create a comprehensive module following the outline provided, including clear explanations, examples, and connections to the learner's existing data analysis skills.
    The content should be engaging, practical, and focused on skill development.
    Include sections with clear headings, practical examples, and key takeaways.
    Write approximately 900 words of detailed content.
    """
    
    user_prompt = f"""
    Create a detailed module for:
    
    Module #{module['module_number']}: {module['title']}
    Part of Week {module['week_number']}: {week_theme}
    
    Student Information:
    - Name: {student_info['name']}
    - Current Role: {student_info['current_role']}
    - Background: {student_info.get('education', 'Business degree')}
    
    Transferable Skills:
    {', '.join(skill_gaps['transferable_skills'])}
    
    Skill Gaps to Address:
    {', '.join([skill for gap in skill_gaps['skill_gaps'] for skill in gap['skills']])}
    
    Learning Objectives:
    {', '.join(module['learning_objectives'])}
    
    Focus Area: {module['focus_area']}
    
    Please create HTML-formatted content with appropriate headings (h3 tags) and structured content.
    Begin with an introduction, then cover key concepts, include practical examples or applications,
    and end with a conclusion or connection to the next module.
    """
    
    try:
        # Generate content with Groq API
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=4000,
            top_p=0.9
        )
        
        # Extract content
        content = response.choices[0].message.content
        
        return {
            "module_number": module['module_number'],
            "title": module['title'],
            "content": content
        }
    except Exception as e:
        print(f"Error generating content for module {module['module_number']}: {e}")
        return None

def process_module(module, course_outline, student_info, skill_gaps):
    """Process a single module with information about its week."""
    # Find the week this module belongs to
    week = next((w for w in course_outline['weeks'] if any(m['module_number'] == module['module_number'] for m in w['modules'])), None)
    
    if not week:
        print(f"Could not find week for module {module['module_number']}")
        return None
    
    # Add week info to the module
    module['week_number'] = week['week_number']
    week_theme = week['theme']
    
    # Generate content
    print(f"Generating content for Module {module['module_number']}: {module['title']}...")
    start_time = time.time()
    result = generate_module_content(module, week_theme, student_info, skill_gaps)
    end_time = time.time()
    
    print(f"Module {module['module_number']} completed in {end_time - start_time:.2f} seconds")
    return result

def save_module_content(module_data, output_dir):
    """Save module content to a file."""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    filename = f"module_{module_data['module_number']:02d}.json"
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w') as file:
        json.dump(module_data, file, indent=2)
    
    print(f"Saved module {module_data['module_number']} to {filepath}")

def main():
    parser = argparse.ArgumentParser(description='Generate course content from outline')
    parser.add_argument('--modules', type=str, help='Comma-separated list of module numbers to generate')
    parser.add_argument('--week', type=int, help='Generate all modules for a specific week')
    args = parser.parse_args()

    # Load required data
    data_dir = "personalization_data"
    course_outline = load_json(os.path.join(data_dir, "course_outline.json"))
    employee_data = load_json(os.path.join(data_dir, "employee_data.json"))
    skill_gaps = load_json(os.path.join(data_dir, "skills_gap_analysis.json"))
    
    # Create output directory
    output_dir = os.path.join(data_dir, "course_content")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Flatten modules list for easier processing
    all_modules = []
    for week in course_outline['weeks']:
        for module in week['modules']:
            all_modules.append(module)
    
    # Filter modules based on command line arguments
    modules_to_generate = all_modules
    if args.modules:
        module_numbers = [int(m.strip()) for m in args.modules.split(',')]
        modules_to_generate = [m for m in all_modules if m['module_number'] in module_numbers]
    elif args.week:
        modules_to_generate = [m for m in all_modules if m['module_number'] in range((args.week-1)*10+1, args.week*10+1)]
    
    print(f"Preparing to generate content for {len(modules_to_generate)} modules")
    
    # Track timing
    overall_start = time.time()
    
    # Process modules in parallel
    results = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_module = {
            executor.submit(process_module, module, course_outline, employee_data, skill_gaps): module
            for module in modules_to_generate
        }
        
        for future in as_completed(future_to_module):
            module = future_to_module[future]
            try:
                result = future.result()
                if result:
                    results.append(result)
                    save_module_content(result, output_dir)
            except Exception as e:
                print(f"Error processing module {module['module_number']}: {e}")
    
    overall_end = time.time()
    
    # Print summary
    print(f"\nGeneration Summary:")
    print(f"Generated {len(results)} modules out of {len(modules_to_generate)} requested")
    print(f"Total time: {overall_end - overall_start:.2f} seconds")
    print(f"Average time per module: {(overall_end - overall_start) / len(results):.2f} seconds")

if __name__ == "__main__":
    main() 