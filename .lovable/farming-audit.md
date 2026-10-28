# Existing application audit and Phase 1 verification

## Evidence and limitations
- Existing TanStack routes, imported screen adapter, authentication context, language provider, finance logic and livestock screens are retained.
- Checked-in migrations define farm_expenses, farm_income and livestock_listings. Finance calculations have tests and stored sale totals are computed by the database.
- Browser service configuration is present. Placeholder fallbacks in client source are not evidence that the deployed backend is disconnected. Deployed tables, provider configuration, RLS behaviour and account recovery settings are unverified.
- Weather, market and AI screens reference Supabase functions whose implementations are absent from the checkout. Their availability and source quality require direct inspection in later phases.
- Legacy market history contains generated values; schemes include index-based eligibility; alerts contain mock entries. These are outstanding data-integrity issues, not verified services.
- Livestock contact/location fields are readable by authenticated users under checked-in policies; explicit contact consent and moderation require later privacy work.
- Digital Farm Book, crop cycles, durable reminders, produce/trader listings and insurance case records are not yet implemented.

## Proposed sequence
Follow the approved phase order: foundation/dashboard; farms/crop cycles; accounting/planning/reminders; verified weather/markets; safe AI/voice/soil; consent-based trader/scheme/insurance features; comprehensive security/workflow testing. Inspect deployed schema before migrations and preserve existing rows.

## Phase 1 changes
Searchable two-column dashboard, grouped official services, farm photograph, expense shortcut, Marathi default, validated preferences, formatting helpers, translated shared navigation and install states, accessible notification action without a fake count, reduced motion and app-specific leaf metadata. Home fixed weather, spray-safety and scheme-deadline claims were removed.

## Verification
11 tests passed across localization, finance and routing. Browser checked default Marathi, three-language selection, persistence across reload, feature filtering/empty state, official service controls, install guidance, image rendering, desktop/360px layout and finance/livestock navigation. No browser page errors observed; preview build log reports build OK.

Authenticated data mutations, installed-device behaviour, full legacy-screen translations and external services remain unverified. Phase 1 is a foundation, not a production-readiness claim.