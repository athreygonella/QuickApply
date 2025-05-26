# QuickApply for Workday

Automatically fill out Workday job applications.

## Setup Instructions

1. Install the Tampermonkey browser extension:
   - [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)

2. Install the script:
   - Click on the Tampermonkey extension icon
   - Select "Create a new script"
   - Copy and paste the contents of `scripts/quickapply.user.js` into the editor
   - Save the script (Ctrl+S or File > Save)

3. Create your profile:
   - Create a file named `profile.json` in the root directory `QuickApply`
   - Fill it with your information using this structure:
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

## Usage

1. Navigate to any Workday job application page
2. Click the blue "Load Profile" button at the top center of the page
3. Select your `profile.json` file when prompted
4. Once your profile is loaded, click the green "QuickApply" button to fill out the form
5. Review all answers before submitting the application

## Features

- Load your profile from a JSON file
- Store profile data in browser's localStorage
- Handles different types of form fields:
  - Text inputs
  - Dropdowns
  - Radio buttons
- Visual feedback with convenient buttons
- Console logging for debugging

## Updating Your Profile

To update your information:
1. Edit your `profile.json` file with the new information
2. On any Workday application page, click "Load Profile" and select the updated file
3. Your new information will be saved and used for future applications

## Privacy and Security

Your profile data is:
- Stored in a local JSON file you control
- Loaded into your browser's localStorage when needed
- Only accessible on Workday job application pages
- Never transmitted to external servers
- Persists in localStorage until you clear your browser data or load a new profile

## Contributing

Feel free to submit issues and enhancement requests!
