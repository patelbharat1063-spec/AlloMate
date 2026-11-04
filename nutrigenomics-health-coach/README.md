# Nutrigenomics Health Coach — Private Business Workspace

A standalone non-commercial wellness-service administration workspace inside the AlloMate repository. It is separate from AlloMate's animal-breeding records and does not modify the AlloMate root application.

## Open
https://patelbharat1063-spec.github.io/AlloMate/nutrigenomics-health-coach/

## Authentication
- Firebase Authentication with email/password
- Account registration, sign-in, password reset and sign-out
- Firebase connection and sync status indicator
- User data is stored under `users/{Firebase-UID}/private/state` and business workspace records under `users/{Firebase-UID}/private/workspace`
- Each signed-in account has a separate private data path

## Firestore security — required before real client data
The repository now includes `firestore.rules`, `firebase.json` and `.firebaserc`. The rules allow a signed-in user to read/write only their own `state` and `workspace` documents. All other client access is denied.

**The rules file is committed to GitHub but is not automatically published to Firebase by GitHub Pages.** Publish it once using either method:

### Firebase Console
1. Open https://console.firebase.google.com/project/nutrigenomics-health-coach/firestore/rules
2. Replace the rules editor contents with the complete contents of `firestore.rules` in this folder.
3. Click **Publish**.
4. Open https://console.firebase.google.com/project/nutrigenomics-health-coach/authentication/providers
5. Enable **Email/Password** under Sign-in providers.
6. In Authentication → Settings → Authorized domains, ensure `patelbharat1063-spec.github.io` is listed.

### Firebase CLI (optional)
From the `nutrigenomics-health-coach` directory, run:
```bash
firebase login
firebase deploy --only firestore:rules --project nutrigenomics-health-coach
```

Do not use real client data until Email/Password sign-in is enabled and the Firestore rules are published and tested with two different accounts.

## Workspace modules
- Private client register with search, edit and delete
- Nutrition consultation records and general action notes
- Follow-up tracker with due dates and status
- Business activity overview and upcoming follow-ups
- Personal profile, meal journal, check-ins and DNA report metadata register
- JSON backup/restore and client CSV export
- Offline-first local copy and responsive installable PWA

## Non-commercial use
For internal business/service administration and educational wellness support. No paid subscriptions, advertising, payment collection or in-app sales.

## Privacy and safety
Records are stored under the signed-in Firebase user's private Firestore path and locally on the device. The app does not upload or interpret raw DNA files and does not provide diagnosis, clinical genetic interpretation, prescriptions or treatment recommendations. Collect only necessary information with informed consent. Firebase web configuration is public client configuration, not a service-account key. Exported JSON/CSV backups are not encrypted.

## Deployment
The app remains in its existing subfolder. Keep the repository's current GitHub Pages publishing workflow and AlloMate root page unchanged.
