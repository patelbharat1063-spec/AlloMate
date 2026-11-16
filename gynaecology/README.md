# Gynaecology & Obstetrics Clinic App

This application is maintained in its own `gynaecology/` folder and uses the existing Supabase project `elrmnfxmcznszxowgvth`. Clinic data uses isolated `gyn_*` tables. The AlloMate animal-breeding application and its data are separate.

## Live app

`https://patelbharat1063-spec.github.io/AlloMate/gynaecology/`

## Implemented

- Supabase email/password staff login and clinic membership check.
- Dashboard, patient register, appointments, pregnancy registration, LMP-based EDD estimate and ANC visits.
- Clinical records: prescriptions, investigations, ultrasound report entry and delivery records.
- English / Gujarati language toggle.
- Owner-only JSON clinic backup export and append-only restore. Existing record IDs are skipped; existing rows are not overwritten. Clinic identity, staff memberships, audit history and attachment file bytes are not restored.
- Women's health history, menstrual cycle / PCOS documentation and fertility / infertility cases.
- Fertility treatment cycles for IUI / IVF workflows; records only, not treatment recommendations.
- Labour admission, newborn register and postnatal follow-up.
- Consent register.
- Invoice payment collection through a transaction-safe database function.
- Expenses, reminders queue, appointment waiting list, medicine catalogue and stock register.
- Stock movements through a database function that blocks negative stock.
- Private patient document upload (PDF, JPG, PNG, WEBP; 10 MB limit) with short-lived signed links.
- Patient summary print (browser print / Save as PDF) and CSV exports.
- Audit entries for selected create, upload, backup and restore actions.

## Supabase additions

New clinic tables are prefixed `gyn_`; row-level security is enabled on all 32 current `gyn_*` tables. New tables include reproductive health, fertility cases/cycles, labour, newborns, postnatal visits, consents, attachments, medicine catalogue, payments, expenses, reminders, waitlist and inventory.

Private file bucket: `gyn-private`. It is not public; storage policies scope file access to the clinic and authorised owner / doctor / nurse roles.

Database workflows:
- `gyn_record_payment` — records a payment and updates the matching invoice balance in one transaction.
- `gyn_record_inventory_movement` — posts stock movements and prevents negative stock.
- `gyn_restore_backup_append_only` — owner-only append-only restore, with clinic ID validation.

All three functions are SECURITY INVOKER and executable by authenticated users only; RLS policies still apply.

## Verification status

- GitHub source updated and JavaScript syntax checked.
- Public GitHub Pages HTML checked for the main feature modules.
- Supabase schema verified: 32 `gyn_*` tables, all with RLS enabled.
- Private storage bucket and four object policies verified.
- Cross-clinic composite foreign-key constraints verified for new linked records.
- RPC function grants verified: authenticated allowed, anon denied.
- Actual sign-in, role-by-role CRUD, file upload/download, restore, payment and stock workflows still require browser testing with explicitly approved dummy data. Do not enter real patient data until that testing and clinic privacy/security review are complete.

## Safety and limitations

- Never place a Supabase service-role or secret key in browser code. The frontend uses only the publishable key.
- Clinical records are documentation tools, not automated diagnosis, treatment, prescription or risk assessment.
- Reminder records are created as internal tasks / message drafts; no WhatsApp, SMS or email is sent automatically.
- Medicine catalogue entries do not validate drug safety, interactions, dosage or prescribing appropriateness.
- Patient portal / patient self-booking and automated message delivery are not yet enabled.
- Backup exports contain confidential patient data. Store them only on encrypted, access-controlled devices.
- AlloMate files and tables must not be overwritten or repurposed.

## Entry point

`index.html`
