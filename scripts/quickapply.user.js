// ==UserScript==
// @name         QuickApply for Workday
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Auto-fill your Workday job applications
// @author       Athrey Gonella
// @match        https://*.myworkdayjobs.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_log
// @grant        GM_xmlhttpRequest
// @updateURL    https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/QuickApply/main/scripts/quickapply.user.js
// @downloadURL  https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/QuickApply/main/scripts/quickapply.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Load profile data from local storage or fetch from file
    let RESPONSES = GM_getValue('profile_data', null);

    // Function to load profile data
    function loadProfileData() {
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'file://' + GM_getValue('profile_path', ''),
            onload: function(response) {
                if (response.status === 200) {
                    try {
                        RESPONSES = JSON.parse(response.responseText);
                        GM_setValue('profile_data', RESPONSES);
                        GM_log('Profile data loaded successfully');
                    } catch (e) {
                        GM_log('Error parsing profile data:', e);
                    }
                } else {
                    GM_log('Error loading profile data:', response.status);
                }
            },
            onerror: function(error) {
                GM_log('Error loading profile data:', error);
            }
        });
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
                    GM_log(`Filled ${labelText} with ${value}`);
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
                            GM_log(`Selected ${value} for ${labelText}`);
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
                        GM_log(`Selected radio option ${value} for ${labelText}`);
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
            alert('Please set up your profile.json path in the Tampermonkey dashboard settings.');
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

    // Add a button to trigger the autofill
    function addAutofillButton() {
        // Create container for centering
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.left = '0';
        container.style.right = '0';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.zIndex = '9999';

        // Create the button
        const button = document.createElement('button');
        button.textContent = 'QuickApply';
        button.style.padding = '10px 20px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '14px';
        button.style.fontWeight = 'bold';
        button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        
        // Add hover effect
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#45a049';
        });
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#4CAF50';
        });
        
        button.addEventListener('click', fillForm);
        
        container.appendChild(button);
        document.body.appendChild(container);
    }

    // Initialize
    window.addEventListener('load', function() {
        // Try to load profile data if not already loaded
        if (!RESPONSES) {
            loadProfileData();
        }
        addAutofillButton();
        GM_log('Workday Autofill script loaded successfully');
    });
})(); 