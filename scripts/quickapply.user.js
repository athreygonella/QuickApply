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

    function fillEmployedBeforeQuestion(employedBeforeQuestion, workExperience) {
        if (!employedBeforeQuestion) return;

        const fieldset = employedBeforeQuestion.querySelector('fieldset');
        if (!fieldset) return false;

        const prevEmploymentQuestion = fieldset.querySelector('label span')?.textContent;
        if (!prevEmploymentQuestion) return false;

        const match = prevEmploymentQuestion.match(/(?:employed by|worked for)\s+([^?(]+)/i);
        if (!match || !workExperience) return false;

        const companyNameInQuestion = match[1].trim();

        const employedBefore = workExperience.some(job => {
            const companyName = job.company.toLowerCase();
            return companyNameInQuestion.toLowerCase().includes(companyName);
        });

        fillRadioButtons('candidateIsPreviousWorker', String(employedBefore));
    }

    function fillTextfield(element, value) {
        if (!element || !value) return;

        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    async function fillButtonDropdown(element, value) {
        if (!element || !value) return Promise.resolve();

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

    async function fillListDropdown(inputElement, value) {
        if (!value || !inputElement) return;
        inputElement.click();

        await new Promise((resolve) => {
            setTimeout(() => {
                const majorContainer = document.querySelector('div[data-automation-id="activeListContainer"]');
                if (!majorContainer) return resolve();
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
                        return resolve();
                    }
                    // If not found, scroll down and try again
                    if (majorContainer.scrollTop !== lastScrollTop && attempts < maxAttempts) {
                        lastScrollTop = majorContainer.scrollTop;
                        majorContainer.scrollTop += 500; // Scroll down (empirically determined value)
                        attempts++;
                        setTimeout(trySelect, 400);
                    } else {
                        resolve(); // Resolve if max attempts are reached or no more scrolling is possible
                    }
                }
                trySelect();
            }, 2000);
        });
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

    async function handleIterativeSection(sectionElement, data, itemHandler) {
        if (!sectionElement || !data?.length) return;

        for (let i = 1; i <= data.length; i++) {
            const itemData = data[i - 1];
            const sectionName = sectionElement.getAttribute('aria-labelledby').replace('-section', '');
            let itemPanel = sectionElement.querySelector(`[aria-labelledby="${sectionName}-${i}-panel"]`);

            // If panel doesn't exist, click Add button to create it
            if (!itemPanel) {
                const addButton = sectionElement.querySelector('[data-automation-id="add-button"]');
                if (addButton) {
                    addButton.click();
                }
            }

            // Wait for panel to appear and fill it
            await new Promise(resolve => {
                setTimeout(() => {
                    itemPanel = sectionElement.querySelector(`[aria-labelledby="${sectionName}-${i}-panel"]`);
                    resolve();
                }, 1000);
            });

            if (itemPanel) {
                await itemHandler(itemPanel, itemData);
            }
        }
    }

    async function fillWorkExperience(experiencePanel, jobData) {
        const targets = [
            new Target(experiencePanel, 'input[name="jobTitle"]', jobData.jobTitle, fillTextfield),
            new Target(experiencePanel, 'input[name="companyName"]', jobData.company, fillTextfield),
            new Target(experiencePanel, 'input[name="location"]', jobData.location, fillTextfield),
            new Target(experiencePanel, 'input[type="checkbox"][name="currentlyWorkHere"]', Boolean(jobData.currentlyWorkingHere), fillCheckbox),
            new Target(experiencePanel, 'div[data-automation-id="formField-startDate"]', new Date(jobData.from.year, jobData.from.month - 1), fillCalendarInput),
            new Target(experiencePanel, 'div[data-automation-id="formField-roleDescription"] textarea', jobData.roleDescription.join('\n'), fillTextarea),
        ];

        if (!Boolean(jobData.currentlyWorkingHere)) {
            targets.push(new Target(experiencePanel, 'div[data-automation-id="formField-endDate"]', new Date(jobData.to.year, jobData.to.month - 1), fillCalendarInput));
        }

        for (const target of targets) {
            await target.fill();
        }
    }

    async function fillYearInput(yearDiv, year) {
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

    async function fillEducationSection(educationPanel, eduData) {
        const targets = [
            new Target(educationPanel, 'input[name="schoolName"]', eduData.university, fillTextfield),
            new Target(educationPanel, 'button[name="degree"]', eduData.degree, fillButtonDropdown),
            new Target(educationPanel, 'div[data-automation-id="formField-fieldOfStudy"] input[data-uxi-widget-type="selectinput"]', eduData.major, fillListDropdown),
            new Target(educationPanel, 'input[name="gradeAverage"]', eduData.gpa, fillTextfield),
            new Target(educationPanel, 'div[data-automation-id="formField-firstYearAttended"]', eduData.from, fillYearInput),
            new Target(educationPanel, 'div[data-automation-id="formField-lastYearAttended"]', eduData.to, fillYearInput),
        ];

        for (const target of targets) {
            await target.fill();
        }
    }

    async function fillWebsiteSection(websitePanel, websiteData) {
        const url = Object.values(websiteData)[0];
        const urlTarget = new Target(websitePanel, 'input[name="url"]', url, fillTextfield);
        await urlTarget.fill();
    }

    async function uploadResume() {
        const resumeButton = document.getElementById('resumeAttachments--attachments');
        if (resumeButton) {
            resumeButton.click(); // Open the file picker

            // Wait for resume upload to finish before returning control
            await new Promise((resolve) => {
                const interval = 500; // Check every 500ms

                const checkUploadStatus = setInterval(() => {
                    const fileUploadDiv = document.querySelector('[data-automation-id="file-upload-item"]');
                    if (fileUploadDiv) {
                        clearInterval(checkUploadStatus);
                        resolve();
                    }
                }, interval);
            });
        }
    }

    async function fillEligibilitySection(questionnaireSection, eligibilityQuestionData) {
        if (!questionnaireSection || !eligibilityQuestionData?.length) return;

        const questionDivs = Array.from(questionnaireSection.children).flatMap(child => Array.from(child.children));
        const buttons = [];

        questionDivs.forEach(div => {
            const questionText = div.querySelector('p')?.textContent?.toLowerCase();
            if (questionText) {
                // Find matching question pattern
                const matchingQuestion = eligibilityQuestionData.find(q => {
                    // Check if all question texts are present in the question
                    return q.questionTexts.every(text => questionText.includes(text.toLowerCase()));
                });

                if (matchingQuestion) {
                    const button = div.querySelector('button');
                    if (button) {
                        buttons.push({ button, value: matchingQuestion.answer });
                    }
                }
            }
        });

        await fillButtonDropdownsSequentially(buttons);
    }

    async function fillPersonalIdentity(personalDataSection, identityData) {
        if (!personalDataSection || !identityData) return;

        const buttons = [];

        const genderField = personalDataSection.querySelector('div[data-automation-id="formField-gender"]');
        if (genderField) {
            const genderButton = genderField.querySelector('button');
            if (genderButton) {
                buttons.push({ button: genderButton, value: identityData.gender });
            }
        }

        const ethnicityField = personalDataSection.querySelector('div[data-automation-id="formField-ethnicity"]');
        if (ethnicityField) {
            const ethnicityButton = ethnicityField.querySelector('button');
            if (ethnicityButton) {
                buttons.push({ button: ethnicityButton, value: identityData.ethnicity });
            }
        }

        const veteranStatusField = personalDataSection.querySelector('div[data-automation-id="formField-veteranStatus"]');
        if (veteranStatusField) {
            const veteranStatusButton = veteranStatusField.querySelector('button');
            if (veteranStatusButton) {
                buttons.push({ button: veteranStatusButton, value: identityData.isVeteran });
            }
        }

        await fillButtonDropdownsSequentially(buttons);
    }

    function fillDisabilitySection(disabilitySection, profileData) {
        if (!disabilitySection || !profileData) return;

        const targets = [
            new Target(disabilitySection, 'div[data-automation-id="formField-name"] input[type="text"]', `${profileData.personalInfo.firstName} ${profileData.personalInfo.lastName}`, fillTextfield),
            new Target(disabilitySection, 'div[data-automation-id="formField-dateSignedOn"]', new Date(), fillCalendarInput),
        ];

        // Fill all targets
        for (const target of targets) {
            target.fill();
        }

        const disabilityStatusField = disabilitySection.querySelector('div[data-automation-id="formField-disabilityStatus"]');
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
    

    class Target {
        constructor(parentContext, selector, value, handler) {
            this.parentContext = parentContext;
            this.selector = selector;
            this.value = value;
            this.handler = handler;
        }

        async fill() {
            if (!this.parentContext || !this.selector || !this.value || !this.handler) return;

            const element = this.parentContext.querySelector(this.selector);
            if (!element) return;

            return await this.handler(element, this.value);
        }
    }

    async function fillCurrentPage() {
        // Trigger the manual resume upload immediately to ensure it happens within the user activation context
        await uploadResume();

        const targets = [
            new Target(document, '#name--legalName--firstName', PROFILE.personalInfo.firstName, fillTextfield),
            new Target(document, '#name--legalName--lastName', PROFILE.personalInfo.lastName, fillTextfield),
            new Target(document, '#address--addressLine1', PROFILE.personalInfo.address, fillTextfield),
            new Target(document, '#address--city', PROFILE.personalInfo.city, fillTextfield),
            new Target(document, '#address--countryRegion', PROFILE.personalInfo.state, fillButtonDropdown),
            new Target(document, '#address--postalCode', PROFILE.personalInfo.zipCode, fillTextfield),
            new Target(document, '[data-automation-id="formField-candidateIsPreviousWorker"]', PROFILE.workExperience, fillEmployedBeforeQuestion),
            new Target(document, '#phoneNumber--phoneNumber', PROFILE.personalInfo.phone, fillTextfield),
            new Target(document, '#source--source', 'Company Website', fillButtonDropdown),
            new Target(document, '#phoneNumber--phoneType', 'Mobile', fillButtonDropdown),
            new Target(document, '[aria-labelledby="Work-Experience-section"]', PROFILE.workExperience, 
                (section, data) => handleIterativeSection(section, data, fillWorkExperience)),
            new Target(document, '[aria-labelledby="Education-section"]', PROFILE.education, 
                (section, data) => handleIterativeSection(section, data, fillEducationSection)),
            new Target(document, '[aria-labelledby="Websites-section"]', PROFILE.links, 
                (section, data) => handleIterativeSection(section, data, fillWebsiteSection)),
            new Target(document, '[aria-labelledby="primaryQuestionnaire-section"]', PROFILE.eligibilityQuestions, fillEligibilitySection),
            new Target(document, '[aria-labelledby="secondaryQuestionnaire-section"]', PROFILE.eligibilityQuestions, fillEligibilitySection),
            new Target(document, '[aria-labelledby="Personal-Data-Statement-section"]', PROFILE.identity, fillPersonalIdentity),
            new Target(document, '[aria-labelledby="selfIdentifiedDisabilityData-section"]', PROFILE, fillDisabilitySection),
            new Target(document, '#termsAndConditions--acceptTermsAndAgreements', true, fillCheckbox),
        ];

        for (const target of targets) {
            await target.fill();
        }
    }

    async function fillApplication() { 
        if (!PROFILE) {
            alert('Please load your profile.json file first using the "Load Profile" button');
            return;
        }

        let continueProcessing = true;
        
        while (continueProcessing) {
            await fillCurrentPage();
            
            const nextPageButton = document.querySelector('[data-automation-id="pageFooterNextButton"]');
            if (nextPageButton) {
                const buttonText = nextPageButton.textContent.trim().toLowerCase();
                
                if (buttonText === 'submit') {
                    continueProcessing = false;
                    alert('Form filling complete! Please review the information and click Submit when ready.');
                } else {
                    nextPageButton.click();

                    // Wait 3 seconds for the next page to load
                    await new Promise(resolve => {
                        setTimeout(() => {
                            resolve();
                        }, 3000);
                    });
                }
            } else {
                continueProcessing = false;
            }
        }
    }

    window.addEventListener('load', function() {
        function createButton(text, backgroundColor, hoverBackgroundColor, clickHandler) {
            const button = document.createElement('button');
            const style = {
                padding: '10px 20px',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                backgroundColor: backgroundColor,
            };

            button.textContent = text;
            Object.assign(button.style, style);

            button.addEventListener('mouseover', () => {
                button.style.backgroundColor = hoverBackgroundColor;
            });
            button.addEventListener('mouseout', () => {
                button.style.backgroundColor = backgroundColor;
            });
            button.addEventListener('click', clickHandler);

            return button;
        }

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
        const applyButton = createButton(
            'QuickApply',
            '#4CAF50',
            '#45a049',
            fillApplication
        );

        // Load Profile button
        const loadButton = createButton(
            'Load Profile',
            '#2196F3',
            '#1976D2',
            loadProfileFromFile
        );

        container.appendChild(loadButton);
        container.appendChild(applyButton);
        document.body.appendChild(container);
    });
})();