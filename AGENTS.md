<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Imported FarmWise screens keep their react-router-style imports via src/lib/router-compat.tsx (adapter over TanStack Router) so the original pages run unchanged.
- Farm finance math lives in src/lib/finance.ts (pure, tested in src/test/finance.test.ts); sale totals are also computed by the database so stored totals can't drift.
- Shared language validation and Indian formatting live in src/lib/localization.ts; LanguageContext exposes formatting helpers and merges the dashboard dictionary so language rules stay testable without browser or network dependencies.
- Home groups existing destinations into searchable two-column tools and expandable official services; only verified data may supply live summaries, so navigation never needs fabricated weather or deadlines.
