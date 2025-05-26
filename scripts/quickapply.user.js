// ==UserScript==
// @name         QuickApply for Workday
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Auto-fill your Workday job applications
// @author       Athrey Gonella
// @match        https://*.myworkdayjobs.com/*
// @grant        GM_log
// @updateURL    https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/QuickApply/main/scripts/quickapply.user.js
// @downloadURL  https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/QuickApply/main/scripts/quickapply.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Load profile data from local storage
    let RESPONSES = JSON.parse(localStorage.getItem('quickapply_profile'));

    // Function to load profile from file and update localStorage
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
                    RESPONSES = profileData;
                    console.log('Profile loaded successfully from file');
                    alert('Profile loaded successfully! You can now use QuickApply.');
                } catch (error) {
                    console.error('Error parsing profile:', error);
                    alert('Error loading profile. Please check if the file is valid JSON.');
                }
            };
            reader.readAsText(file);
        };

        fileInput.click();
    }

    // Helper function to find and fill input fields
    function fillInputField(labelText, value) {
        if (!value) return false;
        
        const labels = Array.from(document.querySelectorAll('label, span, div'));
        for (const label of labels) {
            if (label.textContent.toLowerCase().includes(labelText.toLowerCase())) {
                const input = label.querySelector('input') || 
                            label.parentElement.querySelector('input') ||
                            label.parentElement.parentElement.querySelector('input');
                
                if (input) {
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`Filled ${labelText} with ${value}`);
                    return true;
                }
            }
        }
        return false;
    }

    // Helper function to handle dropdowns
    function fillDropdown(labelText, value) {
        if (!value) return false;

        const labels = Array.from(document.querySelectorAll('label, span, div'));
        for (const label of labels) {
            if (label.textContent.toLowerCase().includes(labelText.toLowerCase())) {
                const select = label.querySelector('select') || 
                             label.parentElement.querySelector('select') ||
                             label.parentElement.parentElement.querySelector('select');
                
                if (select) {
                    for (const option of select.options) {
                        if (option.text.toLowerCase().includes(value.toLowerCase())) {
                            select.value = option.value;
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                            console.log(`Selected ${value} for ${labelText}`);
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    // Function to fill radio buttons
    function fillRadioButton(labelText, value) {
        if (!value) return false;

        const labels = Array.from(document.querySelectorAll('label, span, div'));
        for (const label of labels) {
            if (label.textContent.toLowerCase().includes(labelText.toLowerCase())) {
                const radioButtons = label.parentElement.querySelectorAll('input[type="radio"]');
                for (const radio of radioButtons) {
                    if (radio.value.toLowerCase() === value.toLowerCase() ||
                        radio.parentElement.textContent.toLowerCase().includes(value.toLowerCase())) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log(`Selected radio option ${value} for ${labelText}`);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Main function to fill the form
    function fillForm() {
        if (!RESPONSES) {
            alert('Please load your profile.json file first using the "Load Profile" button');
            return;
        }

        // Personal Information
        fillInputField('first name', RESPONSES.firstName);
        fillInputField('last name', RESPONSES.lastName);
        fillInputField('email', RESPONSES.email);
        fillInputField('phone', RESPONSES.phone);
        fillInputField('address', RESPONSES.address);
        fillInputField('city', RESPONSES.city);
        fillInputField('state', RESPONSES.state);
        fillInputField('zip', RESPONSES.zipCode);

        // Work Experience
        fillInputField('years of experience', RESPONSES.yearsOfExperience);
        fillInputField('current company', RESPONSES.currentCompany);
        fillInputField('current role', RESPONSES.currentRole);

        // Education
        fillDropdown('highest degree', RESPONSES.highestDegree);
        fillInputField('field of study', RESPONSES.fieldOfStudy);
        fillInputField('university', RESPONSES.university);
        fillInputField('graduation year', RESPONSES.graduationYear);

        // Common Questions
        fillRadioButton('willing to relocate', RESPONSES.willingToRelocate);
        fillRadioButton('require visa', RESPONSES.requireVisa);
        fillRadioButton('legally authorized', RESPONSES.legallyAuthorized);
        fillRadioButton('remote work', RESPONSES.remoteWork);

        // Custom Questions
        fillInputField('diversity', RESPONSES.diversityCommitment);
        fillInputField('why interested', RESPONSES.whyInterested);
        fillInputField('strengths', RESPONSES.strengthsWeaknesses);
    }

    // Add buttons to trigger the autofill and profile loading
    function addButtons() {
        // Create container for centering
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.left = '0';
        container.style.right = '0';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.gap = '10px';
        container.style.zIndex = '9999';

        // Create the QuickApply button
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
        
        // Add hover effect
        applyButton.addEventListener('mouseover', () => {
            applyButton.style.backgroundColor = '#45a049';
        });
        applyButton.addEventListener('mouseout', () => {
            applyButton.style.backgroundColor = '#4CAF50';
        });
        
        applyButton.addEventListener('click', fillForm);

        // Create the Load Profile button
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
        
        // Add hover effect
        loadButton.addEventListener('mouseover', () => {
            loadButton.style.backgroundColor = '#1976D2';
        });
        loadButton.addEventListener('mouseout', () => {
            loadButton.style.backgroundColor = '#2196F3';
        });
        
        loadButton.addEventListener('click', loadProfileFromFile);
        
        // Add buttons to container and container to page
        container.appendChild(loadButton);
        container.appendChild(applyButton);
        document.body.appendChild(container);
    }

    // Initialize
    window.addEventListener('load', function() {
        addButtons();
        console.log('QuickApply script loaded successfully');
    });
})(); 