# VibeForm

Use public vibe.js APIs and TanStack Form Core 1.33 APIs only. Keep the adapter headless.
English only. Strict TypeScript. Relative TypeScript imports end in `.ts`.
Run `pnpm check` and build examples before completion. Runtime source has 100% per-file coverage.
Releases go through changesets and `.github/workflows/release.yml`. Add a changeset for every user-visible change.
Never publish, push, deploy or create remote resources without an explicit release request.
Never add AI attribution, Co-Authored-By, Signed-off-by or Generated-by trailers to commits.
Do not import `@usevibejs/ui/internal`. Do not depend on Vibecn, VibeQuery or `@usevibejs/contract` from the runtime package.
Tests and examples take Vibecn source from the `@usevibejs/vibecn` dev dependency, never from a sibling checkout.
