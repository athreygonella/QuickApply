# Workday Application Autofill Script

This Tampermonkey script helps automate the process of filling out job applications on Workday websites. It automatically fills in common fields and provides preset responses to frequently asked questions.

## Setup Instructions

1. Install the Tampermonkey browser extension:
   - [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)

2. Create your profile:
   - Create a `profile.json` file in the root directory `QuickApply`
   - Fill it with your personal information using this structure:
   ```json
   {
       "firstName": "Your First Name",
       "lastName": "Your Last Name",
       "email": "your.email@example.com",
       "phone": "123-456-7890",
       "address": "123 Main St",
       "city": "Your City",
       "state": "Your State",
       "zipCode": "12345",
       "yearsOfExperience": "5",
       "currentCompany": "Current Company Name",
       "currentRole": "Current Job Title",
       "highestDegree": "Bachelor's Degree",
       "fieldOfStudy": "Your Major",
       "university": "Your University",
       "graduationYear": "2023",
       "willingToRelocate": "Yes",
       "requireVisa": "No",
       "legallyAuthorized": "Yes",
       "remoteWork": "Yes",
       "diversityCommitment": "Your diversity statement",
       "whyInterested": "Your interest statement",
       "strengthsWeaknesses": "Your strengths statement"
   }
   ```
   - Note: This file is in `.gitignore` to keep your personal information private

3. Install the script:
   - Click on the Tampermonkey extension icon
   - Select "Create a new script"
   - Copy and paste the contents of `scripts/workday-autofill.js` into the editor
   - Save the script (Ctrl+S or File > Save)

4. Configure the profile path:
   - Go to the Tampermonkey dashboard
   - Click on the Workday Autofill script
   - Go to Settings
   - Click on the Storage tab
   - Add a new value:
     - Name: `profile_path`
     - Value: The full path to your `profile.json` file (e.g., `/Users/username/workplace/QuickApply/data/profile.json`)

## Usage

1. Navigate to any Workday job application page
2. Look for the green "Autofill Form" button in the top-right corner of the page
3. Click the button to automatically fill out the form
4. Review all answers before submitting the application

## Features

- Automatically fills in personal information from your profile.json
- Handles different types of form fields:
  - Text inputs
  - Dropdowns
  - Radio buttons
- Customizable responses for common questions
- Visual feedback with a convenient autofill button
- Console logging for debugging
- Secure storage of personal information

## Privacy and Security

- Your personal information is stored in `profile.json` which is:
  - Kept locally on your machine
  - Listed in `.gitignore` to prevent accidental commits
  - Never transmitted to external servers
  - Only loaded when you're on a Workday application page

## Customization

You can customize the script by:
1. Modifying your responses in `profile.json`
2. Adding new field mappings in the script
3. Adjusting the autofill button appearance
4. Adding more custom responses for frequently encountered questions

## Contributing

Feel free to submit issues and enhancement requests!
