# Gynaecology & Obstetrics Clinic App

This application is maintained in its own `gynaecology/` folder and uses the existing Supabase project with isolated `gyn_*` tables.

## Status
- Supabase clinic schema created.
- Owner membership configured.
- Row-level security policies applied to the Gynaecology tables.
- Frontend implementation and connection testing are pending.

## Safety
- Do not place a Supabase service-role key in browser code.
- The browser app must use only the project URL and anon/publishable key.
- Patient health information must only be entered after authentication, role checks, and privacy/security testing.
- AlloMate files and tables are separate and must not be overwritten.

## Planned entry point
`index.html`
