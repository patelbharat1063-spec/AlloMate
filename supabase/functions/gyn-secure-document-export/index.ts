import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ORIGIN = "https://patelbharat1063-spec.github.io";
const cors = {"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"authorization, apikey, x-client-info, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin","Content-Type":"application/json"};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:cors});
const isUuid=(v:unknown)=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return reply({error:"Use POST."},405);
 const url=Deno.env.get("SUPABASE_URL")||"",apiKey=req.headers.get("apikey")||Deno.env.get("SUPABASE_ANON_KEY")||"",authorization=req.headers.get("Authorization")||"";
 if(!url||!apiKey||!authorization.startsWith("Bearer "))return reply({error:"Sign in to the clinic first."},401);
 const headers={Authorization:authorization,apikey:apiKey,"Content-Type":"application/json"};
 const ur=await fetch(url+"/auth/v1/user",{headers});if(!ur.ok)return reply({error:"Your clinic session is invalid or expired."},401);
 const user=await ur.json();if(!isUuid(user?.id))return reply({error:"Authenticated user could not be verified."},401);
 let body:Record<string,unknown>;try{body=await req.json()}catch{return reply({error:"Invalid JSON request."},400)}
 const clinicId=body.clinic_id,patientId=body.patient_id;if(!isUuid(clinicId)||!isUuid(patientId))return reply({error:"Valid clinic_id and patient_id are required."},400);
 const mu=new URL(url+"/rest/v1/gyn_memberships");mu.searchParams.set("select","role");mu.searchParams.set("clinic_id","eq."+clinicId);mu.searchParams.set("user_id","eq."+user.id);mu.searchParams.set("is_active","eq.true");mu.searchParams.set("limit","1");
 const mr=await fetch(mu,{headers}),members=mr.ok?await mr.json():[],role=members?.[0]?.role;
 if(!["owner","doctor","nurse"].includes(role))return reply({error:"Your clinic role cannot export clinical documents."},403);
 const pu=new URL(url+"/rest/v1/gyn_patients");pu.searchParams.set("select","id,patient_code,full_name");pu.searchParams.set("id","eq."+patientId);pu.searchParams.set("clinic_id","eq."+clinicId);pu.searchParams.set("limit","1");
 const pr=await fetch(pu,{headers}),patients=pr.ok?await pr.json():[];if(!patients?.length)return reply({error:"Patient not found in this clinic."},404);
 const au=new URL(url+"/rest/v1/gyn_attachments");au.searchParams.set("select","id,patient_id,storage_bucket,storage_path,original_filename,mime_type,size_bytes,created_at,review_status");au.searchParams.set("patient_id","eq."+patientId);au.searchParams.set("clinic_id","eq."+clinicId);au.searchParams.set("storage_bucket","eq.gyn-private");au.searchParams.set("order","created_at.asc");au.searchParams.set("limit","100");
 const ar=await fetch(au,{headers});if(!ar.ok)return reply({error:"Could not read this patient's attachment register."},502);
 const attachments=await ar.json(),clinical=attachments.filter((a:any)=>{const n=String(a.original_filename||"").toLowerCase(),m=String(a.mime_type||"").toLowerCase();return !/aadhaar|aadhar|identity|passport|pan.?card|voter.?id/.test(n)&&(m.startsWith("image/")||m==="application/pdf"||n.endsWith(".pdf"))&&typeof a.storage_path==="string"&&a.storage_path.length>0});
 const documents=[];
 for(const a of clinical){const path=String(a.storage_path).split("/").map(encodeURIComponent).join("/"),bucket=encodeURIComponent(String(a.storage_bucket));
  const sr=await fetch(url+"/storage/v1/object/sign/"+bucket+"/"+path,{method:"POST",headers,body:JSON.stringify({expiresIn:300})});
  if(!sr.ok){documents.push({id:a.id,filename:a.original_filename,mime_type:a.mime_type,size_bytes:a.size_bytes,error:"Signed access unavailable; storage policy denied or object missing."});continue}
  const signed=await sr.json(),p=signed.signedURL||signed.signedUrl;
  documents.push({id:a.id,filename:a.original_filename,mime_type:a.mime_type,size_bytes:a.size_bytes,created_at:a.created_at,review_status:a.review_status,url:p?.startsWith("http")?p:url+"/storage/v1"+p});
 }
 return reply({patient:patients[0],expires_in_seconds:300,note:"Temporary patient-scoped links. Aadhaar/identity files are excluded. Links expire after five minutes.",documents});
});