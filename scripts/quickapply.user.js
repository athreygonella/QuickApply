// ==UserScript==
// @name         QuickApply for Workday
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Auto-fill your Workday job applications
// @author       Athrey Gonella
// @match        https://*.myworkdayjobs.com/*
// @updateURL    https://raw.githubusercontent.com/athreygonella/QuickApply/main/scripts/quickapply.user.js
// @downloadURL  https://raw.githubusercontent.com/athreygonella/QuickApply/main/scripts/quickapply.user.js
// ==/UserScript==

(function() {
    'use strict';

    let PROFILE = JSON.parse(localStorage.getItem('quickapply_profile'));

    function loadProfileFromFile() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        
        fileInput.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const profileData = JSON.parse(e.target.result);
                    localStorage.setItem('quickapply_profile', JSON.stringify(profileData));
                    PROFILE = profileData;
                    alert('Profile loaded successfully! You can now use QuickApply.');
                } catch (error) {
                    alert('Error loading profile. Please check if the file is valid JSON.');
                }
            };
            reader.readAsText(file);
        };

        fileInput.click();
    }

    function haveBeenEmployed() {
        const fieldset = document.querySelector('[data-automation-id="formField-candidateIsPreviousWorker"] fieldset');
        if (!fieldset) return false;

        const prevEmploymentQuestion = fieldset.querySelector('label span')?.textContent;
        if (!prevEmploymentQuestion) return false;

        const match = prevEmploymentQuestion.match(/(?:employed by|worked for)\s+([^?(]+)/i);
        if (!match || !PROFILE?.workExperience) return false;

        const companyNameInQuestion = match[1].trim();

        return PROFILE.workExperience.some(job => {
            const companyName = job.company.toLowerCase();
            return companyNameInQuestion.toLowerCase().includes(companyName);
        });
    }

    function fillTextfield(id, value) {
        if (!value) return;
        
        const input = document.getElementById(id);
        if (input) {
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
    
    function fillButtonDropdown(id, value) {
        if (!value) return;
        
        const button = document.getElementById(id);
        if (!button) return;

        button.click();

        setTimeout(() => {
            const options = document.querySelectorAll('[role="option"]');
            for (const option of options) {
                if (option.textContent.trim() === value) {
                    option.click();
                    return;
                }
            }
            
            console.log(`Could not find option: ${value}`);
            document.body.click();
        }, 100);
    }

    function fillDropdownById(id, value) {
        if (!value) return;

        const select = document.getElementById(id);
        if (select) {
            for (const option of select.options) {
                if (option.text.toLowerCase().includes(value.toLowerCase())) {
                    select.value = option.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }
    }

    function fillRadioButtons(name, value) {
        if (!value) return;

        const radioButtons = Array.from(document.getElementsByName(name)).filter(el => el instanceof HTMLInputElement);
        
        for (const radio of radioButtons) {
            if (radio.value.toLowerCase() === value.toLowerCase()) {
                radio.click();
            }
        }
    }

    function fillCheckbox(input, shouldBeChecked) {
        if (!input) return;
        if (input.checked !== shouldBeChecked) {
            input.click();
        }
    }

    function fillCalendarInput(experiencePanel, from, to, currentlyWorkingHere) {
        let fromMonth = '';
        let fromYear = '';
        if (from) {
            const match = from.match(/^(\d{2})\/(\d{4})$/);
            if (match) {
                fromMonth = match[1];
                fromYear = match[2];
            }
        }

        const startDateDiv = experiencePanel.querySelector('div[data-automation-id="formField-startDate"]');
        if (startDateDiv) {
            const yearInput = startDateDiv.querySelector('input[aria-label="Year"]');
            const yearDisplayDiv = startDateDiv.querySelector('div[data-automation-id="dateSectionYear-display"]');
            if (yearInput) {
                yearInput.value = fromYear;
                yearInput.dispatchEvent(new Event('input', { bubbles: true }));
                yearInput.dispatchEvent(new Event('change', { bubbles: true }));
                if (yearDisplayDiv) yearDisplayDiv.textContent = fromYear;
            }
            const monthInput = startDateDiv.querySelector('input[aria-label="Month"]');
            const monthDisplayDiv = startDateDiv.querySelector('div[data-automation-id="dateSectionMonth-display"]');
            if (monthInput) {
                monthInput.value = fromMonth;
                monthInput.dispatchEvent(new Event('input', { bubbles: true }));
                monthInput.dispatchEvent(new Event('change', { bubbles: true }));
                if (monthDisplayDiv) monthDisplayDiv.textContent = fromMonth;
            }
        }
        // Fill To (End Date) calendar inputs if not currently working here
        if (!currentlyWorkingHere) {
            let toMonth = '';
            let toYear = '';
            if (to) {
                const match = to.match(/^(\d{2})\/(\d{4})$/);
                if (match) {
                    toMonth = match[1];
                    toYear = match[2];
                }
            }
            const endDateDiv = experiencePanel.querySelector('div[data-automation-id="formField-endDate"]');
            if (endDateDiv) {
                const yearInput = endDateDiv.querySelector('input[aria-label="Year"]');
                const yearDisplayDiv = endDateDiv.querySelector('div[data-automation-id="dateSectionYear-display"]');
                if (yearInput) {
                    yearInput.value = toYear;
                    yearInput.dispatchEvent(new Event('input', { bubbles: true }));
                    yearInput.dispatchEvent(new Event('change', { bubbles: true }));
                    if (yearDisplayDiv) yearDisplayDiv.textContent = toYear;
                }
                const monthInput = endDateDiv.querySelector('input[aria-label="Month"]');
                const monthDisplayDiv = endDateDiv.querySelector('div[data-automation-id="dateSectionMonth-display"]');
                if (monthInput) {
                    monthInput.value = toMonth;
                    monthInput.dispatchEvent(new Event('input', { bubbles: true }));
                    monthInput.dispatchEvent(new Event('change', { bubbles: true }));
                    if (monthDisplayDiv) monthDisplayDiv.textContent = toMonth;
                }
            }
        }
    }

    function fillTextarea(textarea, value) {
        if (!textarea || !value) return;
        textarea.value = value;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function fillWorkExperience(workExperience) {
        if (!workExperience?.length) return;

        const workExperienceSection = document.querySelector('[aria-labelledby="Work-Experience-section"]');
        if (!workExperienceSection) return;

        for (let i = 1; i <= workExperience.length; i++) {
            const jobData = workExperience[i - 1];
            let experiencePanel = workExperienceSection.querySelector(`[aria-labelledby="Work-Experience-${i}-panel"]`);

            // If panel doesn't exist, click Add button to create it
            if (!experiencePanel) {
                const addButton = workExperienceSection.querySelector('[data-automation-id="add-button"]');
                if (addButton) {
                    addButton.click();
                }
            }

            // Wait for the panel to appear and then fill it
            setTimeout(() => {
                experiencePanel = workExperienceSection.querySelector(`[aria-labelledby="Work-Experience-${i}-panel"]`);
                if (!experiencePanel) return;

                const jobTitleInput = experiencePanel.querySelector('input[name="jobTitle"]');
                if (jobTitleInput) {
                    fillTextfield(jobTitleInput.id, jobData.jobTitle);
                }

                const companyInput = experiencePanel.querySelector('input[name="companyName"]');
                if (companyInput) {
                    fillTextfield(companyInput.id, jobData.company);
                }

                const locationInput = experiencePanel.querySelector('input[name="location"]');
                if (locationInput) {
                    fillTextfield(locationInput.id, jobData.location);
                }

                const currentlyWorkHereCheckbox = experiencePanel.querySelector('input[type="checkbox"][name="currentlyWorkHere"]');
                fillCheckbox(currentlyWorkHereCheckbox, Boolean(jobData.currentlyWorkingHere));

                fillCalendarInput(experiencePanel, jobData.from, jobData.to, Boolean(jobData.currentlyWorkingHere));

                // Fill role description textarea
                const roleDescriptionDiv = experiencePanel.querySelector('div[data-automation-id="formField-roleDescription"]');
                if (roleDescriptionDiv) {
                    const textarea = roleDescriptionDiv.querySelector('textarea');
                    let roleDesc = jobData.roleDescription;
                    if (Array.isArray(roleDesc)) {
                        roleDesc = roleDesc.join('\n');
                    }
                    fillTextarea(textarea, roleDesc);
                }
            }, 1000); // Stagger timeouts to allow panels to render
        }
    }

    function fillEducation(education) {
        if (!education?.length) return;

        const educationSection = document.querySelector('[aria-labelledby="Education-section"]');
        if (!educationSection) return;

        for (let i = 1; i <= education.length; i++) {
            const eduData = education[i - 1];
            let educationPanel = educationSection.querySelector(`[aria-labelledby="Education-${i}-panel"]`);

            // If panel doesn't exist, click Add button to create it
            if (!educationPanel) {
                const addButton = educationSection.querySelector('[data-automation-id="add-button"]');
                if (addButton) {
                    addButton.click();
                }
            }

            setTimeout(() => {
                educationPanel = educationSection.querySelector(`[aria-labelledby="Education-${i}-panel"]`);
                if (!educationPanel) return;

                const schoolInput = educationPanel.querySelector('input[name="schoolName"]');
                if (schoolInput) {
                    fillTextfield(schoolInput.id, eduData.university);
                }


                const gpaInput = educationPanel.querySelector('input[name="gradeAverage"]');
                if (gpaInput) {
                    fillTextfield(gpaInput.id, eduData.gpa);
                }

            }, 1000);
        }
    }

    // Main function to fill the form
    function fillForm() {
        if (!PROFILE) {
            alert('Please load your profile.json file first using the "Load Profile" button');
            return;
        }

        // Personal Information
        fillTextfield('name--legalName--firstName', PROFILE.personalInfo.firstName);
        fillTextfield('name--legalName--lastName', PROFILE.personalInfo.lastName);
        
        fillTextfield('address--addressLine1', PROFILE.personalInfo.address);
        fillTextfield('address--city', PROFILE.personalInfo.city);
        fillButtonDropdown('address--countryRegion', PROFILE.personalInfo.state);
        fillTextfield('address--postalCode', PROFILE.personalInfo.zipCode);
        
        fillTextfield('phoneNumber--phoneNumber', PROFILE.personalInfo.phone);

        // Work Experience
        fillWorkExperience(PROFILE.workExperience);

        // Education
        fillEducation(PROFILE.education);

        // Common Questions
        fillRadioButtons('willing-to-relocate', PROFILE.willingToRelocate);
        fillRadioButtons('require-visa', PROFILE.requireVisa);
        fillRadioButtons('legally-authorized', PROFILE.legallyAuthorized);
        fillRadioButtons('remote-work', PROFILE.remoteWork);

        // Workday Default Questions
        fillButtonDropdown('source--source', 'Company Website');
        fillRadioButtons('candidateIsPreviousWorker', String(haveBeenEmployed()));
        fillButtonDropdown('phoneNumber--phoneType', "Mobile");
    }

    window.addEventListener('load', function() {
        // Container for centering
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.left = '0';
        container.style.right = '0';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.gap = '10px';
        container.style.zIndex = '9999';

        // QuickApply button
        const applyButton = document.createElement('button');
        applyButton.textContent = 'QuickApply';
        applyButton.style.padding = '10px 20px';
        applyButton.style.backgroundColor = '#4CAF50';
        applyButton.style.color = 'white';
        applyButton.style.border = 'none';
        applyButton.style.borderRadius = '5px';
        applyButton.style.cursor = 'pointer';
        applyButton.style.fontSize = '14px';
        applyButton.style.fontWeight = 'bold';
        applyButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        
        applyButton.addEventListener('mouseover', () => {
            applyButton.style.backgroundColor = '#45a049';
        });
        applyButton.addEventListener('mouseout', () => {
            applyButton.style.backgroundColor = '#4CAF50';
        });
        
        applyButton.addEventListener('click', fillForm);

        // Load Profile button
        const loadButton = document.createElement('button');
        loadButton.textContent = 'Load Profile';
        loadButton.style.padding = '10px 20px';
        loadButton.style.backgroundColor = '#2196F3';
        loadButton.style.color = 'white';
        loadButton.style.border = 'none';
        loadButton.style.borderRadius = '5px';
        loadButton.style.cursor = 'pointer';
        loadButton.style.fontSize = '14px';
        loadButton.style.fontWeight = 'bold';
        loadButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        
        loadButton.addEventListener('mouseover', () => {
            loadButton.style.backgroundColor = '#1976D2';
        });
        loadButton.addEventListener('mouseout', () => {
            loadButton.style.backgroundColor = '#2196F3';
        });
        
        loadButton.addEventListener('click', loadProfileFromFile);
        
        container.appendChild(loadButton);
        container.appendChild(applyButton);
        document.body.appendChild(container);
    });
})();