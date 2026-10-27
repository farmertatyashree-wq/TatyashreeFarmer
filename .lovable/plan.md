# Tatyashree Farmer upgrade

## Audit findings
- Existing screens and routes are reusable. Expense/profit and livestock records have checked-in owner-write database policies and calculation tests.
- Home currently presents fixed weather, a spraying-safety claim and an unverified scheme deadline. Some other screens generate market history or eligibility; external services and deployed tables remain unverified.
- Marathi/Hindi/English dictionaries exist, but English is the default, some menu labels show translation keys, and several screens contain inline text.

## Phase 1 — implement now
- Retain every existing destination and install/chat entry point.
- Refresh the home page with a green/white/light-neutral design, farm photograph, accessible two-column cards, feature search, grouped secondary services and a prominent expense/profit action.
- Remove the home page’s fixed live weather and unverified deadline/spraying claims. Link to weather and alerts without inventing current values.
- Establish Marathi as the default, validate saved language values, preserve valid preferences, provide reusable localized date/number/currency formatting, and translate the refreshed dashboard, shared navigation and install states.
- Improve narrow-screen navigation and header, label notification actions without a fabricated count, and respect reduced motion.
- Verify language persistence, search, navigation and desktop/mobile layout; run existing tests plus language-rule tests.

## Subsequent phases
2. User-owned farms and crop cycles/Digital Farm Book.
3. Link accounting, planning and reminders to farms; add missing calculation/unit rules.
4. Replace unverifiable weather/market paths with configured authorized data and provenance.
5. Configure and test Crop Doctor, voice and soil guidance safely.
6. Produce/trader listings with consent/moderation, verified schemes and insurance records.
7. Full authenticated workflow, privacy, security and accessibility testing.

## Technical approach
Reuse TanStack routing, existing design components and Supabase infrastructure. No destructive migrations or provider changes in Phase 1. Keep translations/formatters browser-safe; read saved preferences after hydration. Later backend/integration phases require deployed schema inspection and service availability checks first.

## Completion boundaries
Phase 1 establishes multilingual foundations, not full translation of every legacy screen. Existing data/AI features remain unverified until their phases run against configured services. Each later phase remains open on the roadmap; no simulated workflow will be called complete.
