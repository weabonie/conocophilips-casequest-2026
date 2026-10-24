# PR #4 integration

Integrated `update-final-dataset-and-product-guide` with the completed Wave 1 dashboard on `critical-spares-wave1-integration`.

The trial merge had 69 file conflicts, predominantly independently added foundations and feature placeholders. The completed feature/domain/parser implementations were retained. PR #4's role-home model and responsive composition were preserved and wired to the real feature widgets.

Integration fixes:

- Role selection lands on the correct home; home CTA query strings resolve to their intended routes.
- A nested read-only data provider scopes widget data without replacing the full workbook used by global HSE/parts decisions.
- Reorder summary and reading scope use the permitted sites, including flat equipment data.
- Shared context is kept in a distinctly named module, avoiding extension/case resolution conflicts on macOS.
- Preserved receipt-aware warning calculations and source precision; did not reintroduce zero-false-alarm or rounded-lead claims from the alternative foundation.
- Removed duplicate package scripts and excluded tool caches and Office temporary files. Original local presentation files remain untouched outside the PR.
- Refined the incoming language guard to examine product components and distinguish unsupported promises from explicit modeling limitations.

Verification: 108 unit tests, full lint, production build and Cloudflare dry-run. Browser verified all five role homes at 1440 and 375 pixels, correct scoped site lists and no page-width overflow; primary home links and existing workflow routes remain functional.

Approval policy remains the user-selected planner approval → receipt. Copilot remains deterministic and offline; no new runtime dependencies.
