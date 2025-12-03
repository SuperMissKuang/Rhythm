# Rhythm - SMS Opt-In Documentation

This documentation is required for Twilio A2P 10DLC campaign registration.

## Setup Instructions

### Step 1: Take Screenshots

Take the following screenshots from your app and save them in `docs/screenshots/`:

1. **contact-picker.png** - Native contact picker when selecting a contact
2. **opt-in-dialog.png** - The opt-in confirmation dialog with message preview
3. **contact-list-status.png** - Contact list showing status badges (Pending/Confirmed)
4. **sms-received.png** - Screenshot of the opt-in SMS received on a phone

### Step 2: Add Screenshots

Place all screenshots in the `docs/screenshots/` folder with the exact names listed above.

### Step 3: Publish to GitHub Pages

#### Option A: Using GitHub Settings (Recommended)

1. Commit and push the `docs` folder to your repository:
   ```bash
   git add docs/
   git commit -m "Add SMS opt-in documentation for Twilio registration"
   git push origin main
   ```

2. Go to your GitHub repository settings
3. Navigate to "Pages" in the left sidebar
4. Under "Source", select "Deploy from a branch"
5. Select branch: `main` and folder: `/docs`
6. Click "Save"
7. GitHub will provide a URL like: `https://yourusername.github.io/repository-name/`

#### Option B: Manual Publishing

If you don't have a GitHub repository yet:

1. Create a new repository on GitHub
2. Push your code including the `docs` folder
3. Follow the steps in Option A

### Step 4: Update Twilio Registration

Once your documentation is published:

1. Go to your Twilio Console
2. Navigate to your A2P 10DLC registration
3. Update the "Opt-In Workflow" field with your GitHub Pages URL
4. Resubmit for review

Example URL: `https://cckuang.github.io/Rhythm/opt-in-documentation.html`

## Documentation URL

After publishing, your documentation will be available at:
```
https://[your-github-username].github.io/[repository-name]/opt-in-documentation.html
```

Use this URL when filling out the Twilio A2P 10DLC registration form.
