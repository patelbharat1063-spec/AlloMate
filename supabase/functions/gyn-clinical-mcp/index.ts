import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { pipeline } from "npm:@supabase/middleware@1";
import { withOAuthProtectedResource, withSupabase } from "npm:@supabase/server@^1.6.0";
import { createMcpHandler, McpServer } from "npm:@modelcontextprotocol/server@^2.0.0";
import { z } from "npm:zod@^4.3.6";

const MAX_ROWS = 100;
const IDENTITY_NAME = /aadhaar|aadhar|identity|passport|pan.?card|voter.?id/i;

function asText(value: unknown) {
  return JSON.stringify(value, null, 2);
}

Deno.serve(
  pipeline(
    [withOAuthProtectedResource(), withSupabase({ auth: "user" })],
    async (req, { supabase }) => {
      const handler = createMcpHandler(() => {
        const server = new McpServer({
          name: "allomate-clinical-records",
          version: "1.0.0",
        });

        server.registerTool(
          "search_clinic_patients",
          {
            title: "Search authorised clinic patients",
            description:
              "Search patients visible to the signed-in clinic user by patient code or name. Read-only; results are limited to 10.",
            inputSchema: z.object({
              query: z.string().trim().min(2).max(80),
            }),
            annotations: { readOnlyHint: true, destructiveHint: false },
          },
          async ({ query }) => {
            const term = query.replace(/[%,()]/g, " ").trim();
            const [byCode, byName] = await Promise.all([
              supabase.from("gyn_patients")
                .select("id, clinic_id, patient_code, full_name, date_of_birth, archived_at")
                .ilike("patient_code", `%${term}%`)
                .is("archived_at", null)
                .limit(10),
              supabase.from("gyn_patients")
                .select("id, clinic_id, patient_code, full_name, date_of_birth, archived_at")
                .ilike("full_name", `%${term}%`)
                .is("archived_at", null)
                .limit(10),
            ]);
            if (byCode.error) throw new Error(byCode.error.message);
            if (byName.error) throw new Error(byName.error.message);
            const unique = new Map<string, unknown>();
            for (const p of [...(byCode.data || []), ...(byName.data || [])]) {
              unique.set(p.id, p);
            }
            return {
              content: [{ type: "text", text: asText([...unique.values()].slice(0, 10)) }],
            };
          },
        );

        server.registerTool(
          "get_patient_clinical_history",
          {
            title: "Read patient clinical history",
            description:
              "Retrieve the signed-in user's authorised, read-only clinical history for one patient, including pregnancy/ANC, prescriptions, investigations, ultrasound reports, delivery, postnatal, fertility, reproductive health and clinician reviews. Does not make diagnoses or modify records.",
            inputSchema: z.object({
              patient_id: z.string().uuid(),
            }),
            annotations: { readOnlyHint: true, destructiveHint: false },
          },
          async ({ patient_id }) => {
            const patientResult = await supabase.from("gyn_patients")
              .select("id, clinic_id, patient_code, full_name, date_of_birth, blood_group, allergies, medical_history, notes, created_at, updated_at")
              .eq("id", patient_id)
              .is("archived_at", null)
              .maybeSingle();
            if (patientResult.error) throw new Error(patientResult.error.message);
            if (!patientResult.data) {
              return { content: [{ type: "text", text: "Patient not found or access is not authorised." }] };
            }

            const p = patientResult.data;
            const clinic = p.clinic_id;
            const [pregnancies, prescriptions, investigations, ultrasounds, deliveries,
              labour, postnatal, reproductive, fertility, reviews, attachments] = await Promise.all([
              supabase.from("gyn_pregnancies").select("*").eq("clinic_id", clinic).eq("patient_id", patient_id).order("created_at", { ascending: true }).limit(MAX_ROWS),
              supabase.from("gyn_prescriptions").select("*").eq("clinic_id", clinic).eq("patient_id", patient_id).order("prescribed_at", { ascending: true }).limit(MAX_ROWS),
              supabase.from("gyn_investigations").select("*").eq("clinic_id", clinic).eq("patient_id", patient_id).order("ordered_at", { ascending: true }).limit(MAX_ROWS),
              supabase.from("gyn_ultrasounds").select("*").eq("clinic_id", clinic).eq("patient_id", patient_id).order("scan_date", { ascending: true }).limit(MAX_ROWS),
              supabase.from("gyn_deliveries").select("*").eq("clinic_id", clinic).eq("patient_id", patient_id).order("delivery_datetime", { ascending: true }).limit(MAX_ROWS),
              supabase.from("gyn_labour_records").select("*").eq("clinic_id", clinic).eq("patient_id", patient_id).order("admitted_at", { ascending: true }).limit(MAX_ROWS),
              supabase.from("gyn_postnatal_visits").select("*").eq("clinic_id", clinic).eq("patient_id", patient_id).order("visit_at", { ascending: true }).limit(MAX_ROWS),
              supabase.from("gyn_reproductive_health").select("*").eq("clinic_id", clinic).eq("patient_id", patient_id).order("event_date", { ascending: true }).limit(MAX_ROWS),
              supabase.from("gyn_fertility_cases").select("*").eq("clinic_id", clinic).eq("patient_id", patient_id).order("started_on", { ascending: true }).limit(MAX_ROWS),
              supabase.from("gyn_high_risk_reviews").select("*").eq("clinic_id", clinic).eq("patient_id", patient_id).order("review_date", { ascending: true }).limit(MAX_ROWS),
              supabase.from("gyn_attachments").select("id, patient_id, entity_type, entity_id, storage_bucket, storage_path, original_filename, mime_type, size_bytes, review_status, created_at").eq("clinic_id", clinic).eq("patient_id", patient_id).order("created_at", { ascending: true }).limit(MAX_ROWS),
            ]);
            const results = [pregnancies, prescriptions, investigations, ultrasounds, deliveries, labour, postnatal, reproductive, fertility, reviews, attachments];
            const failed = results.find((r) => r.error);
            if (failed?.error) throw new Error(failed.error.message);

            const pregnancyIds = (pregnancies.data || []).map((x) => x.id);
            let ancVisits: unknown[] = [];
            if (pregnancyIds.length) {
              const anc = await supabase.from("gyn_anc_visits").select("*")
                .eq("clinic_id", clinic).in("pregnancy_id", pregnancyIds)
                .order("visit_date", { ascending: true }).limit(MAX_ROWS);
              if (anc.error) throw new Error(anc.error.message);
              ancVisits = anc.data || [];
            }

            return {
              content: [{
                type: "text",
                text: asText({
                  source: "AlloMate Supabase clinical database; records returned under the signed-in user's RLS permissions.",
                  patient: p,
                  pregnancies: pregnancies.data || [],
                  antenatal_visits: ancVisits,
                  prescriptions: prescriptions.data || [],
                  investigations: investigations.data || [],
                  ultrasounds: ultrasounds.data || [],
                  deliveries: deliveries.data || [],
                  labour_records: labour.data || [],
                  postnatal_visits: postnatal.data || [],
                  reproductive_health: reproductive.data || [],
                  fertility_cases: fertility.data || [],
                  clinician_risk_reviews: reviews.data || [],
                  attachment_register: (attachments.data || []).map((a) => ({
                    id: a.id, filename: a.original_filename, mime_type: a.mime_type,
                    size_bytes: a.size_bytes, review_status: a.review_status,
                    created_at: a.created_at,
                  })),
                  note: "Database fields are source records, not independent clinical verification. Missing fields must remain missing; do not infer values.",
                }),
              }],
            };
          },
        );

        server.registerTool(
          "get_patient_original_documents",
          {
            title: "Retrieve authorised original clinical documents",
            description:
              "Create short-lived signed links for a patient's original PDF and image attachments in the private gyn-private bucket. Identity documents are excluded. Links expire after five minutes. Read-only.",
            inputSchema: z.object({
              patient_id: z.string().uuid(),
            }),
            annotations: { readOnlyHint: true, destructiveHint: false },
          },
          async ({ patient_id }) => {
            const patient = await supabase.from("gyn_patients")
              .select("id, clinic_id, patient_code, full_name")
              .eq("id", patient_id)
              .is("archived_at", null)
              .maybeSingle();
            if (patient.error) throw new Error(patient.error.message);
            if (!patient.data) {
              return { content: [{ type: "text", text: "Patient not found or access is not authorised." }] };
            }

            const rows = await supabase.from("gyn_attachments")
              .select("id, storage_bucket, storage_path, original_filename, mime_type, size_bytes, review_status, created_at")
              .eq("clinic_id", patient.data.clinic_id)
              .eq("patient_id", patient_id)
              .eq("storage_bucket", "gyn-private")
              .order("created_at", { ascending: true })
              .limit(MAX_ROWS);
            if (rows.error) throw new Error(rows.error.message);

            const docs = [];
            for (const a of rows.data || []) {
              const filename = String(a.original_filename || "");
              const mime = String(a.mime_type || "").toLowerCase();
              if (IDENTITY_NAME.test(filename)) continue;
              if (!(mime.startsWith("image/") || mime === "application/pdf" || filename.toLowerCase().endsWith(".pdf"))) continue;
              if (!a.storage_path) continue;
              const signed = await supabase.storage.from("gyn-private")
                .createSignedUrl(a.storage_path, 300);
              docs.push({
                id: a.id, filename, mime_type: a.mime_type, size_bytes: a.size_bytes,
                review_status: a.review_status, created_at: a.created_at,
                signed_url: signed.error ? null : signed.data?.signedUrl,
                access_error: signed.error ? "Private storage denied access or the object is unavailable." : undefined,
              });
            }
            return {
              content: [{
                type: "text",
                text: asText({
                  patient: { patient_code: patient.data.patient_code, full_name: patient.data.full_name },
                  expires_in_seconds: 300,
                  documents: docs,
                  note: "These are original private files. A signed link is temporary. Do not claim to have visually inspected an image or read a PDF unless its content was actually opened and processed.",
                }),
              }],
            };
          },
        );

        return server;
      });
      return handler.fetch(req);
    },
  ),
);
