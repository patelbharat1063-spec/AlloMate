# Connect AlloMate clinical records to ChatGPT directly

This integration uses **ChatGPT itself** as the analyst. It does not call the OpenAI API and does not store an OpenAI API key in AlloMate.

## What this branch adds

- A read-only Model Context Protocol (MCP) endpoint source at `supabase/functions/gyn-clinical-mcp/index.ts`.
- OAuth-protected tools to search patients, retrieve authorised longitudinal clinical history, and obtain short-lived links to original PDFs/images.
- All database reads use a Supabase client scoped to the signed-in OAuth user. Existing RLS policies remain the access boundary.
- Identity-document filenames are excluded from original clinical document retrieval.

## Important: not deployed or connected yet

The Edge Function source is committed for review only. It has **not** been deployed. ChatGPT will not be able to use it until the prerequisites below are completed and tested.

## Required Supabase configuration

In Supabase Dashboard for project `elrmnfxmcznszxowgvth`:

1. Authentication → OAuth Server → enable OAuth 2.1.
2. Set the authorization path to `/oauth/consent/`. The consent page is committed at `gynaecology/oauth/consent/index.html` and is intended to load the existing Supabase browser session from the same origin.
3. Enable Dynamic Client Registration only if needed by the ChatGPT connector flow. Review registered clients and revoke grants when access is no longer needed.
4. Authentication → URL Configuration: set Site URL to `https://patelbharat1063-spec.github.io/AlloMate/gynaecology` (no trailing slash). The consent route is `https://patelbharat1063-spec.github.io/AlloMate/gynaecology/oauth/consent/` and must preserve the `authorization_id` query parameter.
5. Confirm the project uses an asymmetric JWT signing key (ES256 or RS256). Supabase's `withSupabase({ auth: "user" })` middleware rejects legacy HS256 tokens.
6. Build and test the consent UI. It must use the signed-in clinic session and Supabase JS OAuth methods:
   - `supabase.auth.oauth.getAuthorizationDetails(authorization_id)`
   - `supabase.auth.oauth.approveAuthorization(authorization_id)`
   - `supabase.auth.oauth.denyAuthorization(authorization_id)`
   Display the requesting client and requested scopes before approval.
7. Deploy the Edge Function with gateway JWT verification disabled **only because** the function uses Supabase's OAuth protected-resource middleware to handle discovery and authenticate every tool request:
   `verify_jwt = false`.
8. Test with a dummy patient and a least-privileged clinic account before connecting any real patient records.

## ChatGPT connection

After deployment and OAuth setup, use ChatGPT Settings → Connectors (developer mode enabled) → Add custom connector and enter:

`https://elrmnfxmcznszxowgvth.supabase.co/functions/v1/gyn-clinical-mcp`

Complete the Supabase sign-in and consent flow. The connector is then available in ChatGPT conversations where enabled.

## Tools

- `search_clinic_patients`: searches patients visible under the signed-in user's RLS policies.
- `get_patient_clinical_history`: retrieves read-only clinical records for one authorised patient.
- `get_patient_original_documents`: returns temporary signed links to supported original files in the private `gyn-private` bucket.

## Clinical and privacy boundaries

- No writes, edits, prescriptions, diagnoses, or AI field approvals are exposed through MCP.
- No service-role key is used or placed in browser code.
- Do not make `gyn-private` public.
- ChatGPT's analysis is decision support, not a clinician's diagnosis. It must distinguish source records, OCR/transcriptions, missing information, conflicts, and suggestions.
- Signed URLs expire after five minutes. A URL in a tool result is not proof that ChatGPT successfully opened or visually inspected the original file.
- The initial endpoint returns clinical database data and short-lived document URLs. Actual PDF/image content ingestion must be validated with the ChatGPT connector before claiming image interpretation is working.

## References

- https://supabase.com/docs/guides/ai-tools/byo-mcp
- https://supabase.com/docs/guides/auth/oauth-server/getting-started
- https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication
- https://platform.openai.com/docs/mcp
