# Nutrigenomics Health Coach — Private Business Workspace

A standalone non-commercial wellness-service administration workspace inside the AlloMate repository. It is separate from AlloMate's animal-breeding records and does not modify the AlloMate root application.

## Open
https://patelbharat1063-spec.github.io/AlloMate/nutrigenomics-health-coach/

## Workspace modules
- Firebase email sign-in, account registration, password reset and sign-out
- Firebase connection and sync status indicator
- Private client register with search, edit and delete
- Nutrition consultation records and general action notes
- Follow-up tracker with due dates and status
- Business activity overview and upcoming follow-ups
- Existing personal profile, meal journal, check-ins and DNA report metadata register
- JSON backup/restore and client CSV export
- Offline-first local copy and responsive installable PWA

## Non-commercial use
For internal business/service administration and educational wellness support. No paid subscriptions, advertising, payment collection or in-app sales.

## Privacy and safety
Records are stored under the signed-in Firebase user's private Firestore path and locally on the device. The app does not upload or interpret raw DNA files and does not provide diagnosis, clinical genetic interpretation, prescriptions or treatment recommendations. Collect only necessary information with informed consent. Firebase web configuration is public client configuration, not a service-account key. Deploy Firestore security rules before using cloud storage with real records. Exported JSON/CSV backups are not encrypted.

## Deployment
The app remains in its existing subfolder. Keep the repository's current GitHub Pages publishing workflow and AlloMate root page unchanged.
