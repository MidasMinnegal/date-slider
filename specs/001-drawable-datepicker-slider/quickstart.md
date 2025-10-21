# Quickstart Guide: Drawable Canvas Datepicker Slider

**Feature**: 001-drawable-datepicker-slider  
**Branch**: `001-drawable-datepicker-slider`  
**Date**: 2025-10-21

## Overview

This guide helps you set up the development environment and start implementing the drawable canvas datepicker feature.

---

## Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher (or yarn/pnpm equivalent)
- **Git**: 2.x or higher
- **Browser**: Modern browser with HTML5 Canvas support (Chrome, Firefox, Safari, Edge)

---

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

This installs:
- React 18+
- TypeScript
- Vite (build tool)
- Vitest (testing framework)
- React Testing Library
- jest-canvas-mock (canvas mocking for tests)

### 2. Verify Installation

```bash
npm run dev
```

Expected output:
```
VITE v5.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

Open `http://localhost:5173/` in your browser.

---

## Project Structure

```
worst-datepicker/
├── src/
│   ├── components/
│   │   ├── DatepickerCanvas.tsx    # Main container component
│   │   ├── Canvas.tsx               # Layered canvas rendering
│   │   └── DateDisplay.tsx          # Date text overlay
│   ├── core/
│   │   ├── geometry/
│   │   │   └── PathGeometry.ts      # Path manipulation utilities
│   │   ├── state/
│   │   │   └── DateCalculations.ts  # Date arithmetic
│   │   └── interactions/
│   │       └── HitDetection.ts      # Pointer collision detection
│   ├── types/
│   │   └── index.ts                 # Shared TypeScript types
│   ├── App.tsx                      # Root application component
│   └── main.tsx                     # Entry point
├── tests/
│   ├── unit/                        # Unit tests (Vitest)
│   ├── integration/                 # Integration tests (RTL)
│   └── e2e/                         # End-to-end tests (Playwright)
├── specs/
│   └── 001-drawable-datepicker-slider/
│       ├── spec.md                  # Feature specification
│       ├── plan.md                  # Implementation plan
│       ├── research.md              # Technical decisions
│       ├── data-model.md            # Entity definitions
│       ├── contracts/               # Component contracts
│       └── quickstart.md            # This file
├── package.json
├── vite.config.ts
├── vitest.config.ts
└── tsconfig.json
```

---

## Development Workflow

### Start Development Server

```bash
npm run dev
```

- Hot module replacement (HMR) enabled
- Changes reflect immediately in browser
- TypeScript errors shown in terminal

### Run Tests

```bash
npm run test
```

Runs Vitest in watch mode:
- Automatically re-runs tests on file changes
- Shows coverage reports

### Run Tests Once (CI Mode)

```bash
npm run test:ci
```

### Type Check

```bash
npm run typecheck
```

Runs TypeScript compiler in check mode (no emit).

### Build for Production

```bash
npm run build
```

Output in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## Implementation Order

Follow these phases from the implementation plan:

### Phase 0: Research ✅ (Complete)
All technical decisions documented in `research.md`.

### Phase 1: Design & Contracts ✅ (Complete)
- Data model defined in `data-model.md`
- Component contracts in `contracts/`

### Phase 2: Tasks ⏳ (Next Step)
Run `/speckit.tasks` command to generate task breakdown in `tasks.md`.

### Phase 3-5: Implementation
Execute tasks from `tasks.md` in order:
1. Core geometry utilities
2. Date calculations
3. Canvas rendering
4. User interactions
5. Testing

---

## Key Files to Start With

### 1. Types (`src/types/index.ts`)

Define shared TypeScript interfaces from `data-model.md`:

```typescript
export interface PathData {
  segments: Float32Array;
  lut: PathLUTEntry[];
  totalLength: number;
  bounds: PathBounds;
  spatialGrid: Map<string, number[]>;
  intersections: PathIntersection[];
}

export interface MarkerState {
  position: Point;
  pathDistance: number;
  isDragging: boolean;
}

export type Point = { x: number; y: number };
```

### 2. Path Geometry (`src/core/geometry/PathGeometry.ts`)

Start with basic functions:
- `createInitialPath()`
- `addPathSegment()`
- `computeLUT()`

### 3. Date Calculations (`src/core/state/DateCalculations.ts`)

Implement core date logic:
- `distanceToDate()`
- `dateToDistance()`
- `formatDate()`

### 4. Canvas Component (`src/components/Canvas.tsx`)

Set up layered canvas architecture with RAF loop.

### 5. Main Container (`src/components/DatepickerCanvas.tsx`)

Wire up components and state management.

---

## Testing Strategy

### Unit Tests

**Location**: `tests/unit/`

**Run**: `npm run test:unit` (or `npm run test` for all)

**Example** (`tests/unit/PathGeometry.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';
import { createInitialPath, computeLUT } from '@/core/geometry/PathGeometry';

describe('PathGeometry', () => {
  it('creates 200px initial path', () => {
    const path = createInitialPath(400, 300);
    expect(path.totalLength).toBe(200);
    expect(path.segments.length).toBe(4);
  });
  
  it('computes LUT with correct distances', () => {
    const path = createInitialPath(400, 300);
    const lut = computeLUT(path.segments);
    expect(lut[0].distance).toBe(0);
    expect(lut[lut.length - 1].distance).toBe(200);
  });
});
```

### Integration Tests

**Location**: `tests/integration/`

**Example** (`tests/integration/DatepickerCanvas.test.tsx`):

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DatepickerCanvas } from '@/components/DatepickerCanvas';

describe('DatepickerCanvas Integration', () => {
  it('renders canvas and date display', () => {
    render(<DatepickerCanvas />);
    expect(screen.getByTestId('datepicker-canvas')).toBeInTheDocument();
    expect(screen.getByText(/January 1, 1900/)).toBeInTheDocument();
  });
  
  it('calls onDateChange when marker dragged', () => {
    const handleChange = vi.fn();
    render(<DatepickerCanvas onDateChange={handleChange} />);
    
    const canvas = screen.getByTestId('canvas');
    fireEvent.pointerDown(canvas, { clientX: 400, clientY: 300 });
    fireEvent.pointerMove(canvas, { clientX: 410, clientY: 300 });
    fireEvent.pointerUp(canvas);
    
    expect(handleChange).toHaveBeenCalled();
  });
});
```

### E2E Tests (Optional)

**Framework**: Playwright

**Setup**:
```bash
npm install -D @playwright/test
npx playwright install
```

**Location**: `tests/e2e/`

---

## Configuration Files

### Vite Config (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### Vitest Config (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### Test Setup (`tests/setup.ts`)

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import 'jest-canvas-mock';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

### TypeScript Config (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "strict": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

---

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests in watch mode |
| `npm run test:ci` | Run tests once (for CI) |
| `npm run test:coverage` | Generate coverage report |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Run ESLint (if configured) |

---

## Debugging

### Browser DevTools

1. Open DevTools (F12)
2. Go to Sources tab
3. Set breakpoints in TypeScript source files (Vite provides source maps)

### VS Code Debugging

Install "JavaScript Debugger" extension, then add `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### Test Debugging

```bash
npm run test -- --inspect-brk
```

Then attach debugger from VS Code or Chrome DevTools.

---

## Performance Profiling

### Chrome DevTools Performance Tab

1. Start recording
2. Interact with datepicker (drag, draw)
3. Stop recording
4. Check frame rate (target: 60fps)
5. Identify long tasks (target: <16.67ms)

### React DevTools Profiler

1. Install React DevTools extension
2. Go to Profiler tab
3. Start profiling
4. Perform interactions
5. Stop profiling
6. Analyze component render times

---

## Troubleshooting

### Canvas Not Rendering

**Symptom**: Blank screen, no canvas visible

**Check**:
1. Browser console for errors
2. Canvas element dimensions (should match viewport)
3. Canvas context initialization (`getContext('2d')` not null)

### Tests Failing with Canvas Errors

**Symptom**: `canvas.getContext is not a function`

**Solution**: Ensure `jest-canvas-mock` imported in `tests/setup.ts`

### TypeScript Errors

**Symptom**: Type mismatches, missing properties

**Solution**:
1. Run `npm run typecheck` to see all errors
2. Check `data-model.md` for correct type definitions
3. Ensure `@/types` aliases resolve correctly

### HMR Not Working

**Symptom**: Changes not reflected in browser

**Solution**:
1. Restart dev server (`Ctrl+C`, then `npm run dev`)
2. Clear browser cache
3. Check Vite config for correct plugin setup

---

## Next Steps

1. **Run `/speckit.tasks`** to generate detailed task breakdown
2. **Implement core utilities** (PathGeometry, DateCalculations)
3. **Build Canvas component** with RAF rendering
4. **Add user interactions** (pointer events, keyboard navigation)
5. **Write tests** as you implement features
6. **Profile performance** to ensure 60fps target met

---

## Resources

- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [Vitest Docs](https://vitest.dev/)
- [Canvas API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Questions?

Refer to:
- `spec.md` for feature requirements
- `research.md` for technical decisions
- `data-model.md` for entity definitions
- `contracts/` for component interfaces
