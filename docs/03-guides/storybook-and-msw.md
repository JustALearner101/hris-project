# Storybook + MSW + Visual Regression Starter Guide

**Target repo**: `apps/web` (Next.js 14, TypeScript, Tailwind 3.4, pnpm 9)

**Goal**: Setup Storybook for UI components, integrate MSW (Mock Service Worker) so stories mock API calls, and add automated visual regression tests using Playwright.

## 0. Philosophy
* Components are built **component-first** (Storybook + Story-driven development).
* All network interactions in stories are mocked via MSW so designers, QA, and developers can iterate without a backend.
* Visual regression is run against the Storybook UI for deterministic, environment-controlled snapshots.

## 1. Prerequisites
* Node 20.x active (`.nvmrc` present)
* pnpm 9
* Existing Next app structure under `apps/web` with `src/` and `app/` routes
* Tailwind & shadcn/ui already present

## 2. Package Installation
Run at the monorepo root or in `apps/web` (recommended in package scope `apps/web`):

```bash
cd apps/web
pnpm add -D @storybook/cli@7 @storybook/react-webpack@7 @storybook/addon-essentials@7 @storybook/test-runner @storybook/addon-interactions
pnpm add -D msw@1.2 @storybook/addon-msw
pnpm add -D @playwright/test@1.46 playwright-ct @playwright/test-runner
pnpm add -D jest-image-snapshot # optional
```
*Note: Use `@storybook/react-webpack` builder because it is compatible with Next internals. Pick webpack unless the team explicitly wants Vite.*

## 3. Storybook Init & Config

Initial run (optional interactive):
```bash
pnpm dlx sb@7 init --type react_scripts
```

### Manual minimal config files (placed in `apps/web/.storybook/`):

**`main.ts`**
```typescript
import type { StorybookConfig } from '@storybook/react-webpack'
const config: StorybookConfig = {
  stories: ['../src/README/**/*.stories.@(ts|tsx)'],
  staticDirs: ['../public'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-msw'
  ],
  framework: {
    name: '@storybook/react-webpack',
    options: {}
  },
  features: { storyStoreV7: true }
}
export default config
```

**`preview.tsx`** (Global decorators & MSW setup)
```typescript
import React from 'react'
import { Preview } from '@storybook/react'
import { initialize, mswDecorator } from 'msw-storybook-addon'
import '../src/styles/globals.css' // tailwind

// initialize MSW
initialize()

const preview: Preview = {
  decorators: [mswDecorator],
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { expanded: true }
  }
}
export default preview
```

**`manager.ts`** (Optional theming)
```typescript
import { addons } from '@storybook/addons'
import { themes } from '@storybook/theming'
addons.setConfig({ theme: themes.light })
```

## 4. Tailwind Integration
Make sure Storybook loads Tailwind. In `apps/web/.storybook/preview.tsx`, `globals.css` is already imported. Ensure `globals.css` contains `@tailwind base; @tailwind components; @tailwind utilities;`.

If PostCSS/Tailwind does not work, add a `webpackFinal` override in `main.ts`:
```typescript
// inside main.ts
webpackFinal: async (config) => {
  // ensure css loaders handled similar to project
  return config
}
```

## 5. Example Component + Story

Create folder `apps/web/src/components/ui/Button.tsx`:
```tsx
import React from 'react'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}

export function Button({ variant = 'primary', children, ...rest }: ButtonProps) {
  const base = 'px-4 py-2 rounded-md font-medium'
  const cls = variant === 'primary' ? `${base} bg-blue-600 text-white` : `${base} bg-gray-200 text-gray-900`
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
export default Button
```

Create story `apps/web/src/components/ui/Button.stories.tsx`:
```tsx
import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = { title: 'UI/Button', component: Button }
export default meta

type Story = StoryObj<typeof Button>

export const Primary: Story = { args: { children: 'Primary Button', variant: 'primary' } }
export const Secondary: Story = { args: { children: 'Secondary', variant: 'secondary' } }
```

## 6. MSW Handlers (Mock API)

Create folder `apps/web/.storybook/mocks/` and file `handlers.ts`:
```typescript
import { rest } from 'msw'

export const handlers = [
  rest.get('http://localhost:3001/api/v1/employees', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ total: 1, items: [{ id: 'e-1', employeeNo: 'E-0001', firstName: 'Budi' }] }))
  })
]
```

Then update `preview.tsx` to register default handlers:
```typescript
import { handlers } from './mocks/handlers'
initialize({ onUnhandledRequest: 'bypass' })

// pass default handlers so stories use them
export const parameters = { msw: { handlers } }
```
*Note: stories can override handlers per story via decorators or `parameters.msw`.*

## 7. Storybook Run Scripts
In `apps/web/package.json` add:
```json
"scripts": {
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build",
  "test-storybook": "storybook test"
}
```
Run locally: `pnpm storybook` -> open `http://localhost:6006`.

## 11. Storybook Testing Library Integration (Optional)
Install `@storybook/testing-library` and write interaction tests per story that can be executed as unit tests.
