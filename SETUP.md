# Pixal Pioneers Website — Setup Guide

## What's included
- `index.html` — public marketing website (services, founder, terms overview, contact)
- `style.css` — responsive orange/black visual theme
- `app.js` — mobile navigation and public Firestore content read
- `admin.html` — separate admin login and content editor
- `admin.js` — Firebase Authentication sign-in, admin role check and Firestore writes
- `firebase-config.js` — paste your Firebase Web App configuration here
- `firestore.rules` — restrictive starter security rules
- `logo.png` — logo asset, if copied into this folder

## Important before publishing
This is a starter implementation, not a fully audited production system. Do not enter real client data until you have tested the security rules. The admin panel is not protected just because the URL is hard to guess: Firebase Authentication and Firestore Rules must both be configured. Never put a Firebase service-account private key in browser files. The Firebase web config is expected to be public; database rules provide access control.

## Step 1 — Create Firebase project
1. Open https://console.firebase.google.com/ and create a project, for example `pixal-pioneers`.
2. In Project settings → General → Your apps, add a Web app.
3. Copy the web app config values into `firebase-config.js` (apiKey, authDomain, projectId, appId).
4. Build → Authentication → Get started → Sign-in method: enable **Email/Password**.
5. Authentication → Users: create your own admin user with an email and a strong unique password.
6. Build → Firestore Database → Create database. Start in production mode.
7. Firestore → Rules: paste the contents of `firestore.rules` and publish.

## Step 2 — Authorise your own account as admin
1. In Firebase Authentication → Users, copy your admin user's **UID**.
2. In Firestore Data, create collection `admins`.
3. Create a document whose document ID is exactly that UID.
4. Add field `active` with type **boolean** and value `true`.
5. Do not give the public website a way to create or edit admin documents. The rules deliberately deny all client writes to `admins`.

## Step 3 — Run locally
Firebase browser modules require a local web server; opening the HTML file with `file://` may fail.
- If Python is installed, open a terminal in this folder and run:
  `python -m http.server 8000`
- Then visit `http://localhost:8000` for the public website and `http://localhost:8000/admin.html` for admin.
- Test sign-in, denied non-admin sign-in, and saving content. Check the browser console for errors.

## Step 4 — Publish
You can deploy to Firebase Hosting:
1. Install Node.js LTS from https://nodejs.org/.
2. In a terminal, install Firebase CLI: `npm install -g firebase-tools`
3. Run `firebase login`
4. Run `firebase init hosting` in this folder. Select your existing Firebase project and use `.` as the public directory. Do not overwrite existing files if prompted.
5. Run `firebase deploy --only hosting`
6. Add your own domain in Firebase Hosting if desired, then enable HTTPS (Firebase Hosting provisions SSL).
7. Set Authentication → Settings → Authorized domains to include your deployed domain if needed.

## Step 5 — Update content
- The admin editor saves `founderName`, `contactEmail`, and `announcement` to `siteContent/public`.
- The public site currently reads `founderName` and `contactEmail`. Other fields are stored but not yet rendered on the public page.
- Replace the placeholder email in `index.html` (`hello@example.com`) with your real official email before going live.
- Add a real privacy policy and complete Terms of Use tailored to your business and applicable law. The terms shown on the homepage are only a summary, not a lawyer-reviewed contract.
- Replace the logo with your actual logo file named `logo.png` (transparent PNG recommended).

## Security and limitations
- Keep Firestore in production mode; never use `allow read, write: if true`.
- Admin privileges are based on the `admins/{uid}` document and `active == true`; rules enforce the same check server-side.
- The admin panel does not yet manage service cards, full terms, project enquiries, customer accounts, or client-specific applications. It currently edits a small set of site-wide fields.
- Add App Check, rate limiting/abuse monitoring, backups, and a privacy/data-retention plan before production use.
- Firebase costs and quotas depend on usage; review the Firebase pricing page before launch.
- Get legal review for contracts and privacy wording. A website disclaimer cannot guarantee legal safety.
