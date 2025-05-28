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

    function fillTextfield(id, value) {
        if (!value) return false;
        
        const input = document.getElementById(id);
        if (input) {
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
        return false;
    }
    
    function fillButtonDropdown(id, value) {
        if (!value) return false;
        
        const button = document.getElementById(id);
        if (!button) return false;

        button.click();

        setTimeout(() => {
            const options = document.querySelectorAll('[role="option"]');
            for (const option of options) {
                if (option.textContent.trim() === value) {
                    option.click();
                    return true;
                }
            }
            
            console.log(`Could not find option: ${value}`);
            document.body.click();
            return false;
        }, 100);

        return true;
    }

    // Helper function to handle dropdowns by ID
    function fillDropdownById(id, value) {
        if (!value) return false;

        const select = document.getElementById(id);
        if (select) {
            for (const option of select.options) {
                if (option.text.toLowerCase().includes(value.toLowerCase())) {
                    select.value = option.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                }
            }
        }
        return false;
    }

    // Function to fill radio buttons by name
    function fillRadioButtons(name, value) {
        if (!value) return false;

        const radioButtons = Array.from(document.getElementsByName(name)).filter(el => el instanceof HTMLInputElement);
        
        // click it! // don't do anything yet, i;ll come back to this
        for (const radio of radioButtons) {
            if (radio.value.toLowerCase() === value.toLowerCase()) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }
        return false;
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
        fillTextfield('experience--years', PROFILE.yearsOfExperience);
        fillTextfield('currentCompany', PROFILE.currentCompany);
        fillTextfield('currentRole', PROFILE.currentRole);

        // Education
        fillDropdownById('education--degree', PROFILE.highestDegree);
        fillTextfield('education--major', PROFILE.fieldOfStudy);
        fillTextfield('education--school', PROFILE.university);
        fillTextfield('education--graduationYear', PROFILE.graduationYear);

        // Common Questions
        fillRadioButtons('willing-to-relocate', PROFILE.willingToRelocate);
        fillRadioButtons('require-visa', PROFILE.requireVisa);
        fillRadioButtons('legally-authorized', PROFILE.legallyAuthorized);
        fillRadioButtons('remote-work', PROFILE.remoteWork);

        // Workday Default Questions
        fillButtonDropdown('source--source', 'Company Website');
        fillRadioButtons('candidateIsPreviousWorker', "Yes");
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