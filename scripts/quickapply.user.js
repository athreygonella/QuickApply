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
    
    async function fillButtonDropdown(element, value) {
        if (!value || !element) return Promise.resolve();

        return new Promise((resolve) => {
            element.click();

            setTimeout(() => {
                const options = document.querySelectorAll('[role="option"]');
                for (const option of options) {
                    const optionText = option.textContent.trim();
                    if (optionText === value || optionText.includes(value)) {
                        option.click();
                        break;
                    }
                }
                document.body.click();
                resolve();
            }, 500); // Delay to allow previous dropdown to close and new one to open
        });
    }

    function fillButtonDropdownsSequentially(buttonValuePairs) {
        let chain = Promise.resolve();

        buttonValuePairs.forEach(({ button, value }) => {
            chain = chain.then(() => fillButtonDropdown(button, value));
        });

        return chain;
    }

    function fillListDropdown(inputElement, value) {
        if (!value || !inputElement) return;
        inputElement.click();
        setTimeout(() => {
            const majorContainer = document.querySelector('div[data-automation-id="activeListContainer"]');
            if (!majorContainer) return;
            let lastScrollTop = -1;
            let attempts = 0;
            const maxAttempts = 50;

            function trySelect() {
                const options = Array.from(majorContainer.querySelectorAll('div[aria-label]'));
                const option = options.find(div => div.getAttribute('aria-label').toLowerCase().includes(value.toLowerCase()));
                if (option) {
                    // Try to find and click the input (radio button) inside the div
                    const radio = option.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.click();
                    }
                    return;
                }
                // If not found, scroll down and try again
                if (majorContainer.scrollTop !== lastScrollTop && attempts < maxAttempts) {
                    lastScrollTop = majorContainer.scrollTop;
                    majorContainer.scrollTop += 500; // Scroll down (empirically determined value)
                    attempts++;
                    setTimeout(trySelect, 400);
                }
            }
            trySelect();
            document.body.click();
        }, 2000);
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

    function fillCalendarInput(rootDateDiv, date) {
        const dateYear = date.getFullYear().toString();
        const dateMonth = (date.getMonth() + 1).toString().padStart(2, '0');
        const dateDay = date.getDate().toString().padStart(2, '0');

        if (rootDateDiv) {
            const helpTextDiv = rootDateDiv.querySelector('div[id^="helpText-workExperience"]');
            if (helpTextDiv) {
                helpTextDiv.textContent = `current value is ${dateMonth.startsWith('0') ? dateMonth.slice(1) : dateMonth}/${dateYear}`;
            }

            const yearInput = rootDateDiv.querySelector('input[aria-label="Year"]');
            const yearDisplayDiv = rootDateDiv.querySelector('div[data-automation-id="dateSectionYear-display"]');
            if (yearInput && dateYear) {
                yearInput.focus(); // only needs to be done once
                yearInput.setAttribute('aria-valuetext', dateYear);
                yearInput.setAttribute('value', dateYear);
                yearInput.setAttribute('aria-valuenow', dateYear);
                yearInput.dispatchEvent(new Event('input', { bubbles: true }));
                yearInput.dispatchEvent(new Event('change', { bubbles: true }));
                if (yearDisplayDiv) yearDisplayDiv.textContent = dateYear;
                yearInput.blur(); 
            }

            const monthInput = rootDateDiv.querySelector('input[aria-label="Month"]');
            const monthDisplayDiv = rootDateDiv.querySelector('div[data-automation-id="dateSectionMonth-display"]');
            if (monthInput && dateMonth) {
                const formattedMonth = dateMonth.startsWith('0') ? dateMonth.slice(1) : dateMonth;
                monthInput.setAttribute('aria-valuetext', formattedMonth);
                monthInput.setAttribute('value', formattedMonth);
                monthInput.setAttribute('aria-valuenow', formattedMonth);
                monthInput.dispatchEvent(new Event('input', { bubbles: true }));
                monthInput.dispatchEvent(new Event('change', { bubbles: true }));
                if (monthDisplayDiv) monthDisplayDiv.textContent = dateMonth;
            }

            const dayInput = rootDateDiv.querySelector('input[aria-label="Day"]');
            const dayDisplayDiv = rootDateDiv.querySelector('div[data-automation-id="dateSectionDay-display"]');
            if (dayInput && dateDay) {
                dayInput.setAttribute('aria-valuetext', dateDay);
                dayInput.setAttribute('value', dateDay);
                dayInput.setAttribute('aria-valuenow', dateDay);
                dayInput.dispatchEvent(new Event('input', { bubbles: true }));
                dayInput.dispatchEvent(new Event('change', { bubbles: true }));
                if (dayDisplayDiv) dayDisplayDiv.textContent = dateDay;
            }
        }
    }

    function fillTextarea(textarea, value) {
        if (!textarea || !value) return;
        textarea.focus();

        textarea.value = value;
        textarea.textContent = value;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));

        textarea.blur();
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

                const startDateDiv = experiencePanel.querySelector('div[data-automation-id="formField-startDate"]');
                const startDate = new Date(jobData.from.year, jobData.from.month - 1); // Month is zero-based
                fillCalendarInput(startDateDiv, startDate);

                if (!Boolean(jobData.currentlyWorkingHere)) {
                    const endDateDiv = experiencePanel.querySelector('div[data-automation-id="formField-endDate"]');
                    const endDate = new Date(jobData.to.year, jobData.to.month - 1); // Month is zero-based
                    fillCalendarInput(endDateDiv, endDate);
                }

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

    function fillYearInput(yearDiv, year) {
        if (!yearDiv || !year) return;

        const yearInput = yearDiv.querySelector('input[data-automation-id="dateSectionYear-input"]');
        const yearDisplayDiv = yearDiv.querySelector('div[data-automation-id="dateSectionYear-display"]');

        if (yearInput) {
            yearInput.focus();
            yearInput.value = year;
            yearInput.setAttribute('aria-valuenow', year);
            yearInput.setAttribute('aria-valuetext', year);
            yearInput.dispatchEvent(new Event('input', { bubbles: true }));
            yearInput.dispatchEvent(new Event('change', { bubbles: true }));
            yearInput.blur();
        }

        if (yearDisplayDiv) {
            yearDisplayDiv.textContent = year;
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

                const degreeInput = educationPanel.querySelector('button[name="degree"]');
                if (degreeInput && eduData.degree) {
                    fillButtonDropdown(degreeInput, eduData.degree);
                }
                
                const fieldOfStudyContainer = educationPanel.querySelector('div[data-automation-id="formField-fieldOfStudy"]');
                if (fieldOfStudyContainer) {
                    const fieldOfStudyInput = fieldOfStudyContainer.querySelector('input[data-uxi-widget-type="selectinput"]');
                    fillListDropdown(fieldOfStudyInput, eduData.major);
                }

                const gpaInput = educationPanel.querySelector('input[name="gradeAverage"]');
                if (gpaInput) {
                    fillTextfield(gpaInput.id, eduData.gpa);
                }

                const startYearDiv = educationPanel.querySelector('div[data-automation-id="formField-firstYearAttended"]');
                fillYearInput(startYearDiv, eduData.from);
                const finalYearDiv = educationPanel.querySelector('div[data-automation-id="formField-lastYearAttended"]');
                fillYearInput(finalYearDiv, eduData.to);
            }, 1000);
        }
    }

    function fillWebsites(websites) {
        if (!websites?.length) return;

        const websitesSection = document.querySelector('[aria-labelledby="Websites-section"]');
        if (!websitesSection) return;

        for (let i = 1; i <= websites.length; i++) {
            const websiteData = websites[i - 1];
            const url = Object.values(websiteData)[0]; // Extract the value of the first field
            let websitePanel = websitesSection.querySelector(`[aria-labelledby="Websites-${i}-panel"]`);

            // If panel doesn't exist, click Add button to create it
            if (!websitePanel) {
                const addButton = websitesSection.querySelector('[data-automation-id="add-button"]');
                if (addButton) {
                    addButton.click();
                }
            }

            setTimeout(() => {
                websitePanel = websitesSection.querySelector(`[aria-labelledby="Websites-${i}-panel"]`);
                if (!websitePanel) return;

                const urlInput = websitePanel.querySelector('input[name="url"]');
                if (urlInput) {
                    fillTextfield(urlInput.id, url);
                }
            }, 1000);
        }
    }

    function uploadResume() {
        const resumeButton = document.getElementById('resumeAttachments--attachments');
        if (resumeButton) {
            resumeButton.click(); // Simulate a click to open the file picker dialog
        } else {
            console.error('Resume upload button not found');
        }
    }

    function answerEligibilityQuestions(sectionLabel) {
        const questionnaireSection = document.querySelector(`[aria-labelledby="${sectionLabel}"]`);
        if (questionnaireSection) {
            const questionDivs = Array.from(questionnaireSection.children).flatMap(child => Array.from(child.children));
            const buttons = [];

            questionDivs.forEach(div => {
                const questionText = div.querySelector('p')?.textContent?.toLowerCase();
                if (questionText) {
                    if (
                        questionText.includes('legally authorized') ||
                        questionText.includes('by selecting yes') ||
                        questionText.includes('eligible to work') ||
                        questionText.includes('at least 18')
                    ) {
                        const button = div.querySelector('button');
                        if (button) {
                            buttons.push({ button, value: 'Yes' });
                        }
                    } else if (
                        questionText.includes('require') && questionText.includes('sponsorship') ||
                        questionText.includes('provides to your employer') ||
                        questionText.includes('reseller') ||
                        questionText.includes('on site') ||
                        questionText.includes('non-compete') ||
                        questionText.includes('has a relationship') ||
                        questionText.includes('are you a foreign national') ||
                        questionText.includes('involuntarily discharged') ||
                        (questionText.includes('employed by') && questionText.includes('government')) ||
                        questionText.includes('competition with') ||
                        questionText.includes('work visa')
                    ) {
                        const button = div.querySelector('button');
                        if (button) {
                            buttons.push({ button, value: 'No' });
                        }
                    } else if (questionText.includes('preferred method of communication')) {
                        const button = div.querySelector('button');
                        if (button) {
                            buttons.push({ button, value: 'Email' });
                        }
                    }
                }
            });

            fillButtonDropdownsSequentially(buttons);
        }
    }

    function fillIdentityPage1(identity) {
        if (!identity) return;

        // 1st page
        const personalDataSection = document.querySelector('[aria-labelledby="Personal-Data-Statement-section"]');
        if (!personalDataSection) return;

        const buttons = [];

        const genderField = personalDataSection.querySelector('div[data-automation-id="formField-gender"]');
        if (genderField) {
            const genderButton = genderField.querySelector('button');
            if (genderButton) {
                buttons.push({ button: genderButton, value: identity.gender });
            }
        }

        const ethnicityField = personalDataSection.querySelector('div[data-automation-id="formField-ethnicity"]');
        if (ethnicityField) {
            const ethnicityButton = ethnicityField.querySelector('button');
            if (ethnicityButton) {
                buttons.push({ button: ethnicityButton, value: identity.ethnicity });
            }
        }

        const veteranStatusField = personalDataSection.querySelector('div[data-automation-id="formField-veteranStatus"]');
        if (veteranStatusField) {
            const veteranStatusButton = veteranStatusField.querySelector('button');
            if (veteranStatusButton) {
                buttons.push({ button: veteranStatusButton, value: identity.isVeteran });
            }
        }

        fillButtonDropdownsSequentially(buttons);
    }

    function fillIdentityPage2() {
        const selfIdentifiedDisabilitySection = document.querySelector('[aria-labelledby="selfIdentifiedDisabilityData-section"]');
        if (!selfIdentifiedDisabilitySection) return;

        const nameField = selfIdentifiedDisabilitySection.querySelector('div[data-automation-id="formField-name"]');
        if (nameField) {
            const nameInput = nameField.querySelector('input[type="text"]');
            if (nameInput) {
                fillTextfield(nameInput.id, `${PROFILE.personalInfo.firstName} ${PROFILE.personalInfo.lastName}`);
            } 
        }

        const dateSignedOnDiv = selfIdentifiedDisabilitySection.querySelector('div[data-automation-id="formField-dateSignedOn"]');
        if (dateSignedOnDiv) {
            fillCalendarInput(dateSignedOnDiv, new Date());
        }

        const disabilityStatusField = selfIdentifiedDisabilitySection.querySelector('div[data-automation-id="formField-disabilityStatus"]');
        if (disabilityStatusField) {
            const rowDivs = disabilityStatusField.querySelectorAll('div[role="row"]');
            rowDivs.forEach(rowDiv => {
                const label = rowDiv.querySelector('label');
                if (label && label.textContent.includes('do not have a disability')) {
                    const checkbox = rowDiv.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        fillCheckbox(checkbox, true);
                    }
                }
            });
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
        fillButtonDropdown(document.getElementById('address--countryRegion'), PROFILE.personalInfo.state);
        fillTextfield('address--postalCode', PROFILE.personalInfo.zipCode);
        
        fillTextfield('phoneNumber--phoneNumber', PROFILE.personalInfo.phone);

        // Work Experience
        fillWorkExperience(PROFILE.workExperience);

        // Education
        fillEducation(PROFILE.education);

        // Websites
        fillWebsites(PROFILE.links);

        // Resume
        const resumeButton = document.getElementById('resumeAttachments--attachments');
        if (resumeButton) {
            // alert('Please click the Upload Resume button to proceed.');
            // temporarily disabled; todo: make it so it triggers right before submitting
        }

        // Eligibility
        answerEligibilityQuestions('primaryQuestionnaire-section');
        answerEligibilityQuestions('secondaryQuestionnaire-section');

        // Identity
        fillIdentityPage1(PROFILE.identity);
        fillIdentityPage2();

        // Workday Default Questions
        fillButtonDropdown(document.getElementById('source--source'), 'Company Website');
        fillRadioButtons('candidateIsPreviousWorker', String(haveBeenEmployed()));
        fillButtonDropdown(document.getElementById('phoneNumber--phoneType'), "Mobile");

        // Terms and Conditions
        const termsCheckbox = document.getElementById('termsAndConditions--acceptTermsAndAgreements');
        if (termsCheckbox) {
            fillCheckbox(termsCheckbox, true);
        }
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

        // Upload Resume button
        const uploadResumeButton = document.createElement('button');
        uploadResumeButton.textContent = 'Upload Resume';
        uploadResumeButton.style.padding = '10px 20px';
        uploadResumeButton.style.backgroundColor = '#FF9800';
        uploadResumeButton.style.color = 'white';
        uploadResumeButton.style.border = 'none';
        uploadResumeButton.style.borderRadius = '5px';
        uploadResumeButton.style.cursor = 'pointer';
        uploadResumeButton.style.fontSize = '14px';
        uploadResumeButton.style.fontWeight = 'bold';
        uploadResumeButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        uploadResumeButton.id = 'uploadResumeButton';

        uploadResumeButton.addEventListener('mouseover', () => {
            uploadResumeButton.style.backgroundColor = '#FB8C00';
        });
        uploadResumeButton.addEventListener('mouseout', () => {
            uploadResumeButton.style.backgroundColor = '#FF9800';
        });

        uploadResumeButton.addEventListener('click', uploadResume);

        container.appendChild(loadButton);
        container.appendChild(applyButton);
        container.appendChild(uploadResumeButton);
        document.body.appendChild(container);
    });
})();