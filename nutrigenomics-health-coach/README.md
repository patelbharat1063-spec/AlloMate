# Nutrigenomics AI Health Coach

A standalone, offline-first personal nutrition journal inside the AlloMate repository.

## Open
After GitHub Pages is enabled for the repository, visit:
`https://patelbharat1063-spec.github.io/AlloMate/nutrigenomics-health-coach/`

## Included in v0.1
- Separate profile, health check-ins, meal journal and DNA report register
- Local browser storage using a dedicated key (not AlloMate records)
- JSON backup and restore
- PWA manifest and service worker for offline interface caching
- Responsive mobile layout

## Privacy and safety
This prototype stores entries in browser localStorage, which is **not encrypted**. Do not store raw genetic files or highly sensitive health data. No DNA upload, variant interpretation, diagnosis or treatment recommendations are implemented. Consult qualified healthcare professionals for clinical interpretation.

## Deployment
Enable GitHub Pages for the repository using the existing publishing source/branch. The app lives in a subfolder and does not require changing the existing AlloMate root page.
