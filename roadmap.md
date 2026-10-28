# Smart farming upgrade

- [x] Phase 1: Audit existing functionality; improve dashboard and shared navigation; establish Marathi-first language and localization foundations; verify.
- [ ] Phase 2: Farm profiles, Digital Farm Book and crop records.
- [ ] Phase 3: Extend existing accounting, crop planner and reminders.
- [ ] Phase 4: Verified weather and market sources (requires configured authorized services).
- [ ] Phase 5: Crop Doctor, voice and soil recommendations (requires configured AI/speech and reliable agronomic sources).
- [ ] Phase 6: Produce/trader connections, verified schemes and insurance information.
- [ ] Phase 7: Full security, accessibility and authenticated workflow verification.

Deliver in successive phases, preserving existing screens. Completion requires tested workflows, not merely navigation.

Phase 1 verification: 11 tests passed; live browser verified search/empty state, Marathi default, all three language selections, English persistence after reload, official links, install help, images, desktop/mobile layout and navigation to finance/livestock, with no runtime errors. Record mutations and legacy external integrations were not tested or changed.

Next phase prerequisite: inspect the deployed Supabase schema and authorized access before introducing farm/crop-cycle migrations. Later phases remain pending, not complete.