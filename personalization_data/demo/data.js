// Sample data for the demo
// In a production environment, this would be loaded from the backend

// Course structure data
const courseData = {
    title: "Financial Analyst Training Program",
    description: "A personalized 4-week course designed for transitioning to a Financial Analyst role.",
    student: "Kubilaycan Karakas",
    duration: "4 Weeks",
    modules: 40,
    weeks: [
        {
            number: 1,
            theme: "Financial Fundamentals & Analysis",
            modules: [
                { number: 1, title: "Introduction to Financial Analysis" },
                { number: 2, title: "Financial Statements Overview" },
                { number: 3, title: "Income Statement Analysis" },
                { number: 4, title: "Balance Sheet Analysis" },
                { number: 5, title: "Cash Flow Statement Analysis" },
                { number: 6, title: "Ratio Analysis Fundamentals" },
                { number: 7, title: "Profitability Ratios" },
                { number: 8, title: "Liquidity & Solvency Ratios" },
                { number: 9, title: "Market Value Ratios" },
                { number: 10, title: "Financial Analysis Reports" }
            ]
        },
        {
            number: 2,
            theme: "Valuation & Investment Analysis",
            modules: [
                { number: 11, title: "Time Value of Money" },
                { number: 12, title: "Discounted Cash Flow Models" },
                { number: 13, title: "Equity Valuation Techniques" },
                { number: 14, title: "Company Valuation Methods" },
                { number: 15, title: "Investment Decision Frameworks" },
                { number: 16, title: "Capital Budgeting" },
                { number: 17, title: "Risk Assessment in Investments" },
                { number: 18, title: "Portfolio Theory Basics" },
                { number: 19, title: "CAPM & Beta Analysis" },
                { number: 20, title: "Investment Performance Metrics" }
            ]
        },
        {
            number: 3,
            theme: "Financial Modeling & Forecasting",
            modules: [
                { number: 21, title: "Financial Modeling Fundamentals" },
                { number: 22, title: "Excel for Financial Analysis" },
                { number: 23, title: "Building Financial Models" },
                { number: 24, title: "Revenue & Expense Forecasting" },
                { number: 25, title: "Balance Sheet Forecasting" },
                { number: 26, title: "Cash Flow Forecasting" },
                { number: 27, title: "Sensitivity Analysis" },
                { number: 28, title: "Scenario Analysis" },
                { number: 29, title: "Monte Carlo Simulations" },
                { number: 30, title: "Financial Dashboard Creation" }
            ]
        },
        {
            number: 4,
            theme: "Advanced Topics & Practical Application",
            modules: [
                { number: 31, title: "Industry-Specific Analysis" },
                { number: 32, title: "Mergers & Acquisitions Analysis" },
                { number: 33, title: "Leveraged Buyout Analysis" },
                { number: 34, title: "Financial Analysis for Startups" },
                { number: 35, title: "ESG Financial Analysis" },
                { number: 36, title: "Financial Analysis Presentations" },
                { number: 37, title: "Communicating Financial Insights" },
                { number: 38, title: "Financial Analyst Case Studies" },
                { number: 39, title: "Financial Analysis Career Paths" },
                { number: 40, title: "Capstone Project: Complete Financial Analysis" }
            ]
        }
    ]
};

// Sample module content
const moduleContent = {
    1: `
        <h3>Introduction to Financial Analysis</h3>
        <p>Welcome to your personalized Financial Analysis training program! This first module will introduce you to the fundamentals of financial analysis and set the foundation for your journey toward becoming a financial analyst.</p>
        
        <h3>What is Financial Analysis?</h3>
        <p>Financial analysis is the process of evaluating businesses, projects, budgets, and other finance-related transactions to determine their performance and suitability. It helps stakeholders make informed decisions about resource allocation, investments, and strategic planning.</p>
        
        <h3>Key Objectives of Financial Analysis</h3>
        <ul>
            <li>Assessing the financial health and stability of a company</li>
            <li>Evaluating past performance and forecasting future results</li>
            <li>Identifying trends, strengths, weaknesses, and anomalies in financial data</li>
            <li>Providing insights for decision-making and strategic planning</li>
            <li>Comparing performance against competitors or industry benchmarks</li>
        </ul>

        <h3>The Financial Analyst Role</h3>
        <p>Financial analysts play a crucial role in organizations by analyzing financial information and producing forecasts, recommendations, and reports that inform business decisions. They typically:</p>
        <ul>
            <li>Analyze financial statements and reports</li>
            <li>Evaluate investment opportunities</li>
            <li>Create financial models and projections</li>
            <li>Monitor financial performance against targets</li>
            <li>Present findings to stakeholders and management</li>
        </ul>

        <h3>Transitioning from Your Current Role</h3>
        <p>Given your background in data analysis, you already possess several transferable skills that will benefit you as a financial analyst:</p>
        <ul>
            <li>Data interpretation and pattern recognition</li>
            <li>Analytical thinking and problem-solving</li>
            <li>Attention to detail and accuracy</li>
            <li>Proficiency with spreadsheets and data visualization</li>
        </ul>
        
        <h3>Key Skills to Develop</h3>
        <p>Based on your skills gap analysis, we've identified these key areas to focus on throughout this course:</p>
        <ul>
            <li>Financial statement analysis techniques</li>
            <li>Valuation methodologies</li>
            <li>Financial modeling and forecasting</li>
            <li>Industry-specific analysis frameworks</li>
            <li>Financial communication and reporting</li>
        </ul>

        <h3>Building Your Financial Analyst Toolkit</h3>
        <p>Throughout this course, you'll build a comprehensive toolkit of financial analysis skills, starting with the fundamentals and progressing to advanced techniques. Each module is designed to address specific competencies required for success in your target role.</p>
        
        <h3>Your Learning Path</h3>
        <p>This personalized course is structured to progressively build your financial analysis capabilities:</p>
        <ol>
            <li>Week 1: Master the fundamentals of financial statements and ratio analysis</li>
            <li>Week 2: Develop valuation and investment analysis skills</li>
            <li>Week 3: Build financial modeling and forecasting capabilities</li>
            <li>Week 4: Apply advanced techniques and prepare for practical application</li>
        </ol>
        
        <h3>Next Steps</h3>
        <p>In the next module, we'll dive into financial statements, the fundamental documents that form the foundation of financial analysis. You'll learn how to read and interpret these statements to extract meaningful insights about a company's performance and position.</p>
    `,
    
    2: `
        <h3>Financial Statements Overview</h3>
        <p>This module introduces the three primary financial statements that form the foundation of financial analysis. Understanding these statements is essential for any financial analyst.</p>
        
        <h3>The Three Core Financial Statements</h3>
        <p>Financial analysis begins with a thorough understanding of these three interconnected statements:</p>
        <ol>
            <li><strong>Income Statement</strong>: Shows revenues, expenses, and profits over a specific period</li>
            <li><strong>Balance Sheet</strong>: Provides a snapshot of assets, liabilities, and equity at a specific point in time</li>
            <li><strong>Cash Flow Statement</strong>: Tracks the flow of cash in and out of the business over a period</li>
        </ol>
        
        <h3>The Income Statement</h3>
        <p>Also called the Profit & Loss Statement (P&L), this document summarizes the revenues, costs, and expenses incurred during a specific period. Key components include:</p>
        <ul>
            <li>Revenue (or Sales)</li>
            <li>Cost of Goods Sold (COGS)</li>
            <li>Gross Profit</li>
            <li>Operating Expenses</li>
            <li>Operating Income</li>
            <li>Other Income/Expenses</li>
            <li>Income Before Taxes</li>
            <li>Net Income</li>
        </ul>
        
        <h3>The Balance Sheet</h3>
        <p>The balance sheet follows the fundamental accounting equation: Assets = Liabilities + Equity. It includes:</p>
        <ul>
            <li><strong>Assets</strong>: What the company owns (cash, inventory, property, equipment, etc.)</li>
            <li><strong>Liabilities</strong>: What the company owes (loans, accounts payable, etc.)</li>
            <li><strong>Shareholders' Equity</strong>: The residual interest in assets after deducting liabilities</li>
        </ul>
        
        <h3>The Cash Flow Statement</h3>
        <p>This statement tracks how cash moves in and out of the business, categorized into:</p>
        <ul>
            <li><strong>Operating Activities</strong>: Cash flows from core business operations</li>
            <li><strong>Investing Activities</strong>: Cash flows from buying/selling assets and investments</li>
            <li><strong>Financing Activities</strong>: Cash flows from debt and equity transactions</li>
        </ul>
        
        <h3>Interconnection Between Statements</h3>
        <p>Understanding how these statements connect is crucial for comprehensive analysis:</p>
        <ul>
            <li>Net income from the Income Statement flows to the Equity section of the Balance Sheet</li>
            <li>The Cash Flow Statement reconciles beginning and ending cash on the Balance Sheet</li>
            <li>Changes in Balance Sheet accounts help explain cash flows</li>
        </ul>
        
        <h3>Financial Statement Analysis Approach</h3>
        <p>When analyzing financial statements, consider these approaches:</p>
        <ol>
            <li><strong>Horizontal Analysis</strong>: Comparing line items over time to identify trends</li>
            <li><strong>Vertical Analysis</strong>: Expressing line items as percentages of a base figure</li>
            <li><strong>Ratio Analysis</strong>: Calculating ratios to assess performance and position</li>
        </ol>
        
        <h3>Red Flags to Watch For</h3>
        <p>As you analyze financial statements, be alert to potential warning signs:</p>
        <ul>
            <li>Growing revenue but declining cash flow</li>
            <li>Accounts receivable growing faster than revenue</li>
            <li>Inventory growing faster than sales</li>
            <li>Significant discrepancies between net income and operating cash flow</li>
            <li>Unusual or unexpected changes in any major account</li>
        </ul>
        
        <h3>Financial Statement Limitations</h3>
        <p>While financial statements are invaluable, be aware of their limitations:</p>
        <ul>
            <li>Historical focus rather than future outlook</li>
            <li>Potential for accounting manipulation</li>
            <li>Exclusion of non-financial performance factors</li>
            <li>Limited disclosure of off-balance-sheet items</li>
        </ul>
        
        <h3>Next Steps</h3>
        <p>In the next module, we'll dive deeper into the Income Statement, exploring how to analyze each component to evaluate a company's operational performance and profitability.</p>
    `
};

// Backend process data
const processData = {
    employee_data: {
        "name": "Kubilaycan Karakas",
        "current_role": "Data Analyst",
        "target_role": "Financial Analyst",
        "years_experience": 3,
        "skills": [
            {
                "category": "Technical Skills",
                "skills": [
                    {"name": "Data Analysis", "proficiency": 4},
                    {"name": "SQL", "proficiency": 4},
                    {"name": "Python", "proficiency": 3},
                    {"name": "Data Visualization", "proficiency": 4},
                    {"name": "Excel", "proficiency": 3},
                    {"name": "Statistical Analysis", "proficiency": 3},
                    {"name": "Financial Statement Reading", "proficiency": 1},
                    {"name": "Financial Modeling", "proficiency": 1}
                ]
            },
            {
                "category": "Soft Skills",
                "skills": [
                    {"name": "Communication", "proficiency": 3},
                    {"name": "Problem Solving", "proficiency": 4},
                    {"name": "Attention to Detail", "proficiency": 4},
                    {"name": "Time Management", "proficiency": 3},
                    {"name": "Teamwork", "proficiency": 3}
                ]
            },
            {
                "category": "Domain Knowledge",
                "skills": [
                    {"name": "Business Intelligence", "proficiency": 3},
                    {"name": "Finance Fundamentals", "proficiency": 2},
                    {"name": "Accounting Principles", "proficiency": 1}
                ]
            }
        ],
        "education": "Bachelor's in Business Administration with minor in Information Systems",
        "certifications": ["Certified Data Analyst", "SQL Advanced Certification"]
    },
    
    taxonomy: {
        "domain": "Finance",
        "skills": [
            {
                "category": "Financial Analysis",
                "skills": [
                    "Financial Statement Analysis",
                    "Ratio Analysis",
                    "Variance Analysis",
                    "Profitability Analysis",
                    "Trend Analysis",
                    "Industry Analysis",
                    "Peer Comparison"
                ]
            },
            {
                "category": "Financial Modeling",
                "skills": [
                    "Excel Financial Modeling",
                    "Forecasting",
                    "Sensitivity Analysis",
                    "Scenario Analysis",
                    "Discounted Cash Flow",
                    "Working Capital Modeling",
                    "Three-Statement Modeling"
                ]
            },
            {
                "category": "Valuation",
                "skills": [
                    "DCF Valuation",
                    "Comparable Company Analysis",
                    "Precedent Transaction Analysis",
                    "LBO Valuation",
                    "Asset-Based Valuation",
                    "Real Options Valuation"
                ]
            },
            {
                "category": "Financial Reporting",
                "skills": [
                    "Income Statement Analysis",
                    "Balance Sheet Analysis",
                    "Cash Flow Analysis",
                    "Financial Report Preparation",
                    "MD&A Interpretation",
                    "Footnote Analysis",
                    "GAAP/IFRS Understanding"
                ]
            },
            {
                "category": "Investment Analysis",
                "skills": [
                    "Portfolio Analysis",
                    "Risk Assessment",
                    "Return Analysis",
                    "Asset Allocation",
                    "Investment Performance Evaluation",
                    "Capital Markets Understanding"
                ]
            }
        ]
    },
    
    gap_analysis: {
        "transferable_skills": [
            "Data Analysis",
            "Excel",
            "Statistical Analysis",
            "Problem Solving",
            "Attention to Detail",
            "Data Visualization"
        ],
        "skill_gaps": [
            {
                "category": "Financial Analysis",
                "skills": [
                    "Financial Statement Analysis",
                    "Ratio Analysis",
                    "Variance Analysis",
                    "Industry Analysis",
                    "Peer Comparison"
                ],
                "priority": "High"
            },
            {
                "category": "Financial Modeling",
                "skills": [
                    "Excel Financial Modeling",
                    "Forecasting",
                    "Sensitivity Analysis",
                    "Discounted Cash Flow",
                    "Three-Statement Modeling"
                ],
                "priority": "High"
            },
            {
                "category": "Valuation",
                "skills": [
                    "DCF Valuation",
                    "Comparable Company Analysis",
                    "LBO Valuation"
                ],
                "priority": "Medium"
            },
            {
                "category": "Financial Reporting",
                "skills": [
                    "Income Statement Analysis",
                    "Balance Sheet Analysis",
                    "Cash Flow Analysis",
                    "GAAP/IFRS Understanding"
                ],
                "priority": "High"
            }
        ],
        "learning_priorities": [
            "Financial Statement Analysis",
            "Excel Financial Modeling",
            "Ratio Analysis",
            "DCF Valuation",
            "Industry Analysis"
        ]
    },
    
    course_outline: {
        "course_title": "Financial Analyst Training Program",
        "course_description": "A personalized 4-week course designed for transitioning to a Financial Analyst role.",
        "student_name": "Kubilaycan Karakas",
        "duration": "4 Weeks",
        "target_role": "Financial Analyst",
        "weeks": [
            {
                "week_number": 1,
                "theme": "Financial Fundamentals & Analysis",
                "description": "Master the building blocks of financial statements and learn essential analysis techniques.",
                "modules": [
                    {
                        "module_number": 1,
                        "title": "Introduction to Financial Analysis",
                        "focus_area": "Financial Analysis Foundations",
                        "learning_objectives": [
                            "Understand the role and responsibilities of a financial analyst",
                            "Recognize how your data analysis background transfers to financial analysis",
                            "Identify key financial analysis frameworks and methodologies"
                        ]
                    }
                ]
            }
        ]
    },
    
    api_details: {
        "model": "llama-3.3-70b-versatile",
        "provider": "Groq",
        "parameters": {
            "temperature": 0.7,
            "max_tokens": 4000,
            "top_p": 0.9
        },
        "system_prompt": "You're an expert financial educator creating personalized learning content for a data analyst transitioning to a financial analyst role. Create a comprehensive module following the outline provided, including clear explanations, examples, and connections to the learner's existing data analysis skills.",
        "estimated_cost_per_module": "$0.003",
        "estimated_generation_time_per_module": "20-25 seconds",
        "total_content_generated": "~36,000 words (40 modules × 900 words)"
    }
};

// Function to highlight Python code syntax for the modals
function highlightPythonSyntax(code) {
    // Simple highlighting for demonstration
    return code
        .replace(/def\s+(\w+)/g, 'def <span style="color:#4361ee;font-weight:bold">$1</span>')
        .replace(/import\s+(\w+)/g, '<span style="color:#3f37c9">import</span> <span style="color:#2a9d8f">$1</span>')
        .replace(/from\s+(\w+)/g, '<span style="color:#3f37c9">from</span> <span style="color:#2a9d8f">$1</span>')
        .replace(/"([^"]*)"/g, '<span style="color:#e76f51">"$1"</span>')
        .replace(/'([^']*)'/g, '<span style="color:#e76f51">\'$1\'</span>')
        .replace(/(\w+)\(/g, '<span style="color:#4895ef">$1</span>(')
        .replace(/#(.*)/g, '<span style="color:gray">#$1</span>');
}

// Python code samples for the demo - shortened versions that won't cause linter errors
const pythonCode = {
    generate_course: `
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
    # Extract and analyze skills
    # ...implementation details...
    
    return {
        "transferable_skills": transferable_skills,
        "skill_gaps": skill_gaps,
        "learning_priorities": identify_learning_priorities(skill_gaps)
    }

def generate_course_outline(employee_data, skill_gaps, taxonomy):
    """Generate a structured course outline based on skill gaps and taxonomy."""
    # Use AI to create personalized course
    # ...implementation details...
    
    return course_outline

def main():
    # Load data, analyze gaps, generate course
    # ...implementation details...
    print("Course outline generated successfully.")

if __name__ == "__main__":
    main()
    `,
    
    generate_content: `
import json
import os
import time
from groq import Groq
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def generate_module_content(module, week_theme, student_info, skill_gaps):
    """Generate content for a single module using AI."""
    # Implementation details for AI-based content generation
    # ...

def process_module(module, course_outline, student_info, skill_gaps):
    """Process a single module with information about its week."""
    # Find week, generate content
    # ...
    
def main():
    # Process all modules and generate content
    # ...
    print("Generated all course content successfully")

if __name__ == "__main__":
    main()
    `
}; 