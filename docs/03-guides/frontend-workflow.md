# Frontend Workflow

This guide details the Next.js 14 specific development flow for the frontend.

## Development Workflow
1. **Branch Creation**: Create a feature branch.
2. **Storybook Prototyping**: Prototype UI in Storybook (component-first approach).
3. **App Router**: Build pages using App Router / Server Components rules:
   * Server components for data-fetching.
   * Client components for interactive UI logic.
4. **React Query**: Use React Query (TanStack) for client data fetching and caching.
5. **MSW API Mocking**: Mock APIs with MSW for offline development and unit tests.
6. **Visual Regression**: Add visual regression tests (Chromatic or Playwright snapshot).
7. **Testing**: Write unit tests (Vitest or Jest) + E2E tests in Playwright for critical flows.
8. **PR Checks**: Run automated PR checks.

## CI/CD for Frontend
* **PR Pipeline**: Lint, typecheck, unit tests, storybook build, visual test.
* **Merge to Main**: Build, prerender pages, test, publish artifact, deploy to Vercel or Kubernetes.
* **Preview Apps**: Auto deploy preview environments on PRs (Vercel or ephemeral instances). Ensure environment variables are used and secrets are masked.

## Performance Gating
* Lighthouse checks on key pages in CI.
* P95 Largest Contentful Paint (LCP) target <= 2.5s (checked on staging).
