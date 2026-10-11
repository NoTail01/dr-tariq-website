# Source ledger — factual doctor information

Every published fact about Dr Tariq Abu Hweij must appear here before it is
shown on the website. Fields without a verified source stay `null` in
`src/content/doctor.ts` and render as clearly marked development placeholders.

Sources used:

- **[S1] Hospital profile (primary):** https://www.specialty-hospital.com/ar/doctors/151/Dr.-Tariq-Abu-Hweij — verified online 2026-10-11.
- **[S2] Doctor Facebook page:** https://www.facebook.com/DrTariqAbuHweij/ — supplied as reference; access not required for implementation.
- **[S3] Secondary directory:** https://www.bizmideast.com/JO/عيادة-الدكتور-طارق-أبو-حويج-06-568-5354 — recorded for conflict tracking only.
- **[S4] Supplied brand reference image:** `public/images/dr-tariq-brand-reference.png` (client-supplied, 2026-10-11).
- **[S5] Supplied portrait photograph:** `public/images/dr-tariq-portrait.png` (client-supplied, 2026-10-11).
- **[S6] Client brief for this website** (2026-10-11): name spelling, professional title translation, Maps embed URL.

## Verified facts and their sources

| Field | Value | Source | Notes |
| --- | --- | --- | --- |
| Full name (AR) | الدكتور طارق أبو حويج | S4, S1 | Hospital page writes it without the definite article |
| Full name (EN) | Dr Tariq Abu Hweij | S6 | Latin spelling per client brief |
| Professional title (AR) | استشاري أمراض الباطنية والكلى وزراعة الكلى وضغط الدم | S4 | Printed on the supplied branding |
| Professional title (EN) | Consultant in Internal Medicine, Nephrology, Kidney Transplantation and Hypertension | S6 | Client-supplied translation |
| Hospital title (AR) | استشاري أمراض الكلى | S1 | Shorter title on the hospital page — both statements kept, neither overwritten |
| Qualification 1 | البورد الأردني في الأمراض الباطنية / Jordanian Board in Internal Medicine | S1 | |
| Qualification 2 | البورد الأردني في أمراض الكلى / Jordanian Board in Nephrology | S1 | |
| Qualification 3 | البورد الألماني / German Board | S1 | Exact specialty and issuing organization NOT stated on S1 — must not be invented |
| Conditions treated | امراض الباطني والكلى / internal medicine and kidney cases | S1 | |
| Membership A | عضو الجمعية الألمانية لأمراض الباطنية والقلب / Member of the German Association for Internal Medicine and Cardiology | S4 | Branding statement — kept DISTINCT from Membership B |
| Membership B | عضو نقابة الأطباء الألمانية ونقابة الأطباء الأردنية / German and Jordanian medical associations | S1 | Hospital page statement — kept DISTINCT from Membership A |
| Languages | العربية، الإنجليزية، الألمانية، الإيطالية، الرومانية | S1 | |
| Portrait photo | `public/images/dr-tariq-portrait.png` | S5 | Original preserved; no retouching |
| Brand color | #0097F3 | S4 | Sampled dominant background blue |
| Logo emblem | `public/images/logo-emblem.png` (+ transparent variant) | S4 | Faithful crop of the kidney emblem; original reference preserved |
| Clinic address (AR) | خلف المستشفى التخصصي، مجمع الرياض الطبي، الطابق الأول | S4 | Supplied wording, published as-is |
| Clinic address (EN) | Behind the Specialty Hospital, Al-Riyad Medical Complex, First Floor | S6 | Translation of the supplied wording |
| Mobile | 0799101101 / +962799101101 | S4 | tel:+962799101101 |
| Clinic landline | 065685354 / +96265685354 | S4 | tel:+96265685354 |
| WhatsApp | +962799101101 (prepared, NOT activated) | S4 | Availability NOT confirmed — channel stays disabled until the clinic confirms |
| Maps embed | Exact URL stored in settings | S6 | Never replaced with a search URL |
| Maps place link | Same feature id as embed (0x151ca194f8b5c4f5:0x590913a16577b185) | S6 | Validated to resolve to the same feature |

## Recorded conflicts and exclusions

| Item | Detail | Handling |
| --- | --- | --- |
| Directory address conflict | S3 lists مجمع بركة بلازا، الطابق B1، مقابل المستشفى التخصصي (Burka Plaza, floor B1) — different building and floor than S4 | Recorded in `docs/MISSING-INFO.md`; NOT published; the two addresses are never combined |
| Hospital switchboard | S1 shows +962 (6) 200 1111 | Hospital-wide switchboard — never used as the clinic's number |
| Hospital testimonials | S1 contains hospital-wide praise quotes | Not used as reviews of this doctor; no ratings published |
| Opening hours | Not found in any source | Left unpublished (directory hours unconfirmed) |
| Geo coordinates | Embed center coordinates are not verified entrance data | Kept out of structured data |

## Rules

1. **Never invent or infer medical facts.** No qualifications, experience,
   services, affiliations, reviews, patient stories, or treatment outcomes may
   be written without a source listed in this table.
2. The kidney transplantation specialty is described as a field of expertise
   only — never as a promise of surgery performed at the clinic.
3. Contact details are published exactly as supplied; the WhatsApp channel
   stays inactive until the clinic confirms it in writing.
