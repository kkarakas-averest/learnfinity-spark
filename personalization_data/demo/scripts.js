document.addEventListener('DOMContentLoaded', function() {
    // Initialize the demo
    initializeDemo();

    // Set up view toggle
    document.getElementById('view-toggle').addEventListener('click', function() {
        toggleView();
    });

    // Close modal when clicking the close button or outside the modal
    const modalCloseButtons = document.querySelectorAll('.close-modal');
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeModals();
        });
    });

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModals();
        }
    });

    // Set up data view buttons
    const dataButtons = document.querySelectorAll('.view-data-btn');
    dataButtons.forEach(button => {
        button.addEventListener('click', function() {
            const dataSource = this.getAttribute('data-source');
            
            // Check if this is a Python code view
            if (dataSource === 'course_generation' || dataSource === 'content_generation') {
                showCodeModal(dataSource);
            } else {
                showDataModal(dataSource);
            }
        });
    });

    // Set up week tabs
    const weekTabs = document.querySelectorAll('.week-tab');
    weekTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const weekNumber = parseInt(this.getAttribute('data-week'));
            changeWeek(weekNumber);
        });
    });
});

// Initialize the demo with course data
function initializeDemo() {
    populateModuleList(1); // Start with Week 1
    loadModuleContent(1);  // Start with Module 1
}

// Toggle between student view and process view
function toggleView() {
    const studentView = document.getElementById('student-view');
    const processView = document.getElementById('process-view');
    const toggle = document.getElementById('view-toggle');
    
    const studentViewLabel = toggle.querySelector('.student-view');
    const processViewLabel = toggle.querySelector('.process-view');
    
    if (studentView.classList.contains('active')) {
        studentView.classList.remove('active');
        processView.classList.add('active');
        studentViewLabel.classList.remove('active');
        processViewLabel.classList.add('active');
    } else {
        processView.classList.remove('active');
        studentView.classList.add('active');
        processViewLabel.classList.remove('active');
        studentViewLabel.classList.add('active');
    }
}

// Change the current week
function changeWeek(weekNumber) {
    // Update active tab
    const weekTabs = document.querySelectorAll('.week-tab');
    weekTabs.forEach(tab => {
        const tabWeek = parseInt(tab.getAttribute('data-week'));
        if (tabWeek === weekNumber) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update week theme
    const weekData = courseData.weeks.find(week => week.number === weekNumber);
    document.getElementById('current-week-theme').textContent = weekData.theme;
    
    // Update module list
    populateModuleList(weekNumber);
    
    // Load first module of the week
    const firstModuleNumber = (weekNumber - 1) * 10 + 1;
    loadModuleContent(firstModuleNumber);
}

// Populate the module list for a given week
function populateModuleList(weekNumber) {
    const moduleList = document.querySelector('.module-list');
    moduleList.innerHTML = '';
    
    const weekData = courseData.weeks.find(week => week.number === weekNumber);
    if (!weekData) return;
    
    weekData.modules.forEach(module => {
        const moduleItem = document.createElement('div');
        moduleItem.className = 'module-item';
        moduleItem.setAttribute('data-module', module.number);
        
        moduleItem.innerHTML = `
            <span class="module-number">Module ${module.number}</span>
            <span class="module-title">${module.title}</span>
        `;
        
        moduleItem.addEventListener('click', function() {
            // Remove active class from all modules
            document.querySelectorAll('.module-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to clicked module
            this.classList.add('active');
            
            // Load module content
            loadModuleContent(module.number);
        });
        
        // Set first module as active by default
        if (module.number === (weekNumber - 1) * 10 + 1) {
            moduleItem.classList.add('active');
        }
        
        moduleList.appendChild(moduleItem);
    });
}

// Load content for a specific module
function loadModuleContent(moduleNumber) {
    const moduleData = courseData.weeks
        .flatMap(week => week.modules)
        .find(module => module.number === moduleNumber);
    
    if (!moduleData) return;
    
    // Update module title
    document.getElementById('module-title').textContent = `Module ${moduleNumber}: ${moduleData.title}`;
    
    // Check if we have content for this module
    const content = moduleContent[moduleNumber];
    const contentArea = document.getElementById('module-content');
    
    if (content) {
        contentArea.innerHTML = content;
    } else {
        contentArea.innerHTML = `
            <div class="placeholder-content">
                <h3>Module Under Development</h3>
                <p>This module is currently being developed. Please check back later.</p>
                <p>In the meantime, you can explore Modules 1 and 2 which are fully implemented.</p>
            </div>
        `;
    }
    
    // Scroll to top of content
    contentArea.scrollTop = 0;
}

// Show data modal with JSON data
function showDataModal(dataSource) {
    const modal = document.getElementById('data-modal');
    const modalTitle = document.getElementById('modal-title');
    const jsonDisplay = document.getElementById('json-display');
    
    // Set modal title based on data source
    const titleMap = {
        'employee_data': 'Employee Data',
        'taxonomy': 'Skills Taxonomy',
        'gap_analysis': 'Skills Gap Analysis',
        'course_outline': 'Course Structure',
        'api_details': 'AI API Configuration'
    };
    
    modalTitle.textContent = titleMap[dataSource] || 'Data View';
    
    // Format and display JSON data
    const data = processData[dataSource];
    if (data) {
        jsonDisplay.innerHTML = formatJSON(data);
    } else {
        jsonDisplay.textContent = 'No data available';
    }
    
    modal.style.display = 'block';
}

// Show code modal with Python code
function showCodeModal(codeSource) {
    const modal = document.getElementById('code-modal');
    const modalTitle = document.getElementById('code-modal-title');
    const codeDisplay = document.getElementById('code-display');
    
    // Set modal title based on code source
    const titleMap = {
        'course_generation': 'Course Generation Python Code',
        'content_generation': 'Content Generation Python Code'
    };
    
    modalTitle.textContent = titleMap[codeSource] || 'Code View';
    
    // Get code from pythonCode object
    let code = '';
    if (codeSource === 'course_generation') {
        code = pythonCode.generate_course;
    } else if (codeSource === 'content_generation') {
        code = pythonCode.generate_content;
    }
    
    // Format and display code
    if (code) {
        codeDisplay.innerHTML = highlightPythonSyntax(code);
        
        // Add note about the full code being available
        const noteElement = document.createElement('div');
        noteElement.className = 'code-note';
        noteElement.innerHTML = `
            <p><strong>Note:</strong> This is a simplified version of the code. 
            The full implementation is available in the <a href="python_code.py" target="_blank">python_code.py</a> file.</p>
        `;
        codeDisplay.parentNode.appendChild(noteElement);
    } else {
        codeDisplay.textContent = 'No code available';
    }
    
    modal.style.display = 'block';
}

// Close all modals
function closeModals() {
    document.getElementById('data-modal').style.display = 'none';
    document.getElementById('code-modal').style.display = 'none';
    
    // Remove any code notes that might have been added
    const codeNotes = document.querySelectorAll('.code-note');
    codeNotes.forEach(note => note.remove());
}

// Format JSON for display
function formatJSON(obj) {
    const jsonString = JSON.stringify(obj, null, 2);
    return jsonString
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
} 