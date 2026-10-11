# Missing information checklist

Everything the clinic must confirm before it can be published. Until an item
is confirmed, it stays `null` in `src/content/doctor.ts` and renders as a
clearly marked development placeholder — see `src/content/SOURCES.md` for the
rule that no medical fact may appear without a verified source.

| # | Item | Needed for |
| --- | --- | --- |
| 1 | Specialty (AR + EN) | Hero, metadata, SEO |
| 2 | Biography (AR + EN) | About page, blog byline |
| 3 | Qualifications / degrees | About page |
| 4 | Years of experience | About page |
| 5 | Affiliations / memberships | About page |
| 6 | Services offered | Home, about, booking copy |
| 7 | Clinic address (AR + EN) | Contact section, schema.org |
| 8 | Phone number | Booking actions (currently inactive) |
| 9 | WhatsApp number | Booking actions (currently inactive) |
| 10 | Public email address | Contact + booking |
| 11 | Working hours | Contact section |
| 12 | Authentic portrait photo | Hero/about placeholders |
| 13 | Logo / brand assets (colors, fonts) | Header/footer branding |

## How to fill items in

1. Add the value to the table in `src/content/SOURCES.md` with its source and date.
2. Update the corresponding field in `src/content/doctor.ts`.
3. `npm run test` must stay green and `npm run build` must succeed.
4. Placeholder components (`src/components/PlaceholderImage.tsx`) disappear by
   themselves once the underlying field is non-null.

## Current blocked behaviour

- Booking "call" and "WhatsApp" buttons stay inactive until items 8–9 arrive.
- Without item 1 the hero greeting is the only personalized content.
