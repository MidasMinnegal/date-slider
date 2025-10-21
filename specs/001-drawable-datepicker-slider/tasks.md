# Tasks: Drawable Canvas Datepicker Slider

**Input**: Design documents from `/specs/001-drawable-datepicker-slider/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the specification. Task list focuses on implementation. Tests can be added later if needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- Paths follow React/TypeScript conventions from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize React + TypeScript + Vite project with package.json and vite.config.ts
- [ ] T002 [P] Create project directory structure: src/components/, src/core/geometry/, src/core/state/, src/core/interactions/, src/utils/, src/types/
- [ ] T003 [P] Configure TypeScript in tsconfig.json with path aliases (@/* → ./src/*)
- [ ] T004 [P] Install dependencies: React 18+, TypeScript, Vite
- [ ] T005 [P] Configure Vitest in vitest.config.ts with jest-canvas-mock setup
- [ ] T006 [P] Create tests/setup.ts with jest-canvas-mock and React Testing Library configuration
- [ ] T007 Create src/types/index.ts with shared type definitions (Point, PathData, MarkerState, EndButton, InteractionMode, PathLUTEntry, PathBounds, PathIntersection)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and types that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 [P] Implement date arithmetic functions in src/core/state/DateCalculations.ts (distanceToDate, dateToDistance, formatDate, addDays, daysBetween, isValidDate)
- [ ] T009 [P] Implement path geometry utilities in src/core/geometry/PathGeometry.ts (createInitialPath, addPathSegment, computeLUT, calculatePathBounds)
- [ ] T010 [P] Implement arc-length calculations in src/core/geometry/PathGeometry.ts (positionFromDistance, distanceFromPosition)
- [ ] T011 [P] Create canvas rendering utilities in src/utils/canvas.ts (integer coordinate helpers, DPR scaling, clear layer functions)
- [ ] T012 [P] Create viewport utilities in src/utils/viewport.ts (clipSegmentToViewport using Cohen-Sutherland algorithm)
- [ ] T013 Create src/App.tsx as root application component
- [ ] T014 Create src/main.tsx as entry point

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic Date Selection via Sliding (Priority: P1) 🎯 MVP

**Goal**: Users can drag a marker on a horizontal 200px slider to select dates, with 1px = 1 day relationship

**Independent Test**: Open the datepicker, drag the marker left/right, and verify the date display updates correctly. Delivers a functioning datepicker.

### Implementation for User Story 1

- [ ] T015 [P] [US1] Create DateDisplay component in src/components/DateDisplay.tsx with props (date, position, visible) and formatting logic
- [ ] T016 [P] [US1] Implement marker rendering functions in src/utils/canvas.ts (drawMarker, drawFocusIndicator)
- [ ] T017 [P] [US1] Implement path rendering functions in src/utils/canvas.ts (drawPath, drawEndButtons)
- [ ] T018 [US1] Create Canvas component in src/components/Canvas.tsx with layered canvas architecture (background, path, marker layers)
- [ ] T019 [US1] Implement RAF rendering loop in src/components/Canvas.tsx with dirty layer tracking
- [ ] T020 [US1] Add DPR scaling and canvas dimension management in src/components/Canvas.tsx
- [ ] T021 [US1] Implement hit detection utilities in src/core/interactions/HitDetection.ts (isPointOnMarker, distanceToSegment)
- [ ] T022 [US1] Create drag handler in src/core/interactions/DragHandler.ts with marker position updates
- [ ] T023 [US1] Create DatepickerCanvas container component in src/components/DatepickerCanvas.tsx with state management
- [ ] T024 [US1] Implement pointer event handlers in src/components/DatepickerCanvas.tsx (handlePointerDown, handlePointerMove, handlePointerUp for dragging mode)
- [ ] T025 [US1] Wire up Canvas and DateDisplay components in DatepickerCanvas with marker position synchronization
- [ ] T026 [US1] Implement keyboard navigation in src/components/DatepickerCanvas.tsx (arrow keys for ±1 day, Shift+Arrow for ±10 days)
- [ ] T027 [US1] Add window resize handler to update canvas dimensions
- [ ] T028 [US1] Integrate DatepickerCanvas into src/App.tsx with fullscreen canvas styling

**Checkpoint**: At this point, User Story 1 should be fully functional - a draggable datepicker slider with date display

---

## Phase 4: User Story 2 - Extending Slider Through Drawing (Priority: P2)

**Goal**: Users can click and hold end buttons to draw custom path extensions in any direction

**Independent Test**: Click the left or right end button, drag to draw an extension, release, and verify the slider path extends in that direction

### Implementation for User Story 2

- [ ] T029 [P] [US2] Implement hit detection for end buttons in src/core/interactions/HitDetection.ts (isPointOnEndButton)
- [ ] T030 [P] [US2] Create draw handler in src/core/interactions/DrawHandler.ts with path extension logic
- [ ] T031 [US2] Add drawing mode pointer event handlers in src/components/DatepickerCanvas.tsx (detect end button clicks, transition to drawing mode)
- [ ] T032 [US2] Implement real-time path segment addition during drawing in src/components/DatepickerCanvas.tsx
- [ ] T033 [US2] Implement finalizePath function in src/core/geometry/PathGeometry.ts (calls computeLUT, buildSpatialGrid, detectIntersections)
- [ ] T034 [US2] Add drawing mode visual feedback in src/utils/canvas.ts (highlight active end button during drawing)
- [ ] T035 [US2] Implement path finalization on pointer release in src/components/DatepickerCanvas.tsx
- [ ] T036 [US2] Update end button positions after path extension
- [ ] T037 [US2] Add viewport clipping for drawn paths in src/components/DatepickerCanvas.tsx (prevent drawing beyond canvas edges)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - users can drag the slider AND extend it through drawing

---

## Phase 5: User Story 3 - Marker Movement Along Extended Path (Priority: P3)

**Goal**: Marker follows custom drawn path shapes while maintaining 1px = 1 day relationship along path length

**Independent Test**: First draw an extended path (US2), then drag the marker along it. Verify the marker follows the path curvature and dates update correctly based on arc-length.

### Implementation for User Story 3

- [ ] T038 [P] [US3] Implement spatial grid generation in src/core/geometry/PathGeometry.ts (buildSpatialGrid with configurable cell size)
- [ ] T039 [P] [US3] Implement self-intersection detection in src/core/geometry/PathGeometry.ts (detectIntersections using spatial hashing and lineLineIntersection)
- [ ] T040 [P] [US3] Implement line-line intersection algorithm in src/core/geometry/PathGeometry.ts (lineLineIntersection with parametric equations)
- [ ] T041 [US3] Update drag handler in src/core/interactions/DragHandler.ts to use distanceFromPosition for marker snapping to path
- [ ] T042 [US3] Implement marker path constraint logic in src/core/interactions/DragHandler.ts (marker follows path shape, not straight-line movement)
- [ ] T043 [US3] Add intersection handling logic: at intersections, marker follows earliest segment (lowest segmentIndex)
- [ ] T044 [US3] Update marker rendering to handle non-horizontal paths smoothly
- [ ] T045 [US3] Verify date calculations remain accurate for non-linear paths (distance along path = arc-length)

**Checkpoint**: All user stories should now be independently functional - complete drawable datepicker with path-following marker

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Optimizations and improvements that affect multiple user stories

- [ ] T046 [P] Implement path simplification using Ramer-Douglas-Peucker algorithm in src/core/geometry/PathGeometry.ts (simplifyPath function)
- [ ] T047 [P] Add requestIdleCallback for path simplification on very long paths
- [ ] T048 [P] Implement performance optimizations: use integer coordinates (Math.floor) in canvas rendering
- [ ] T049 [P] Add accessibility features: canvas focusable (tabIndex={0}), ARIA labels, screen reader announcements
- [ ] T050 [P] Create ScreenReaderAnnouncer component in src/components/ScreenReaderAnnouncer.tsx with aria-live region
- [ ] T051 Add date display positioning logic to avoid viewport boundaries (position above/below/left/right of marker as needed)
- [ ] T052 Add focus indicator rendering when canvas has keyboard focus
- [ ] T053 Implement error boundaries and error handling for canvas initialization failures
- [ ] T054 Add performance monitoring: track frame times, warn if exceeding 16.67ms budget
- [ ] T055 [P] Add CSS styling in src/App.css for fullscreen canvas, date display, and focus states
- [ ] T056 Verify quickstart.md setup instructions work: npm install, npm run dev, npm run test

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed sequentially in priority order (P1 → P2 → P3)
  - Each story builds on the previous (US2 extends US1, US3 enhances US2)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Builds on User Story 1 components (DatepickerCanvas, Canvas) - requires US1 complete
- **User Story 3 (P3)**: Enhances User Story 2 functionality - requires US2 complete for extended paths to exist

### Within Each User Story

**User Story 1**:
- T015, T016, T017 can run in parallel (different rendering functions)
- T018 depends on T016, T017 (needs rendering functions)
- T021 can start in parallel with canvas work
- T022 depends on T021 (needs hit detection)
- T023 can start once T018, T022 are ready
- T024, T025, T026, T027 implement features in DatepickerCanvas (sequential)
- T028 integrates everything into App (last)

**User Story 2**:
- T029, T030 can run in parallel (different interaction handlers)
- T031, T032 add drawing mode to DatepickerCanvas (sequential)
- T033 adds path finalization (depends on T032)
- T034, T035, T036, T037 enhance drawing experience (sequential refinements)

**User Story 3**:
- T038, T039, T040 can run in parallel (geometry utilities)
- T041, T042 update drag handler (sequential, depend on T038-T040)
- T043, T044, T045 refine path following behavior (sequential)

### Parallel Opportunities

**Phase 1 (Setup)**: T002, T003, T004, T005, T006 can run in parallel

**Phase 2 (Foundational)**: T008, T009, T010, T011, T012 can all run in parallel (different modules)

**User Story 1**: T015, T016, T017, T021 can start in parallel

**User Story 3**: T038, T039, T040 can run in parallel

**Phase 6 (Polish)**: T046, T047, T048, T049, T050, T055 can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational utilities together (Phase 2):
# Developer A:
Task: "Implement date arithmetic functions in src/core/state/DateCalculations.ts"

# Developer B:
Task: "Implement path geometry utilities in src/core/geometry/PathGeometry.ts"

# Developer C:
Task: "Create canvas rendering utilities in src/utils/canvas.ts"

# Developer D:
Task: "Create viewport utilities in src/utils/viewport.ts"
```

## Parallel Example: User Story 1 Setup

```bash
# Launch rendering utilities together:
# Developer A:
Task: "Create DateDisplay component in src/components/DateDisplay.tsx"

# Developer B:
Task: "Implement marker rendering functions in src/utils/canvas.ts"

# Developer C:
Task: "Implement path rendering functions in src/utils/canvas.ts"

# Developer D:
Task: "Implement hit detection utilities in src/core/interactions/HitDetection.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently - you now have a working datepicker!
5. Demo/validate with users if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - basic datepicker!)
3. Add User Story 2 → Test independently → Deploy/Demo (now with drawable extensions!)
4. Add User Story 3 → Test independently → Deploy/Demo (complete feature with path-following!)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (parallel tasks within each phase)
2. Once Foundational is done:
   - User Story 1: Full team focus (highest priority MVP)
   - User Story 2: Can start once US1 complete
   - User Story 3: Can start once US2 complete
3. Within each story, developers can parallelize tasks marked [P]

---

## Notes

- **No tests included**: Spec did not explicitly request TDD approach. Tests can be added later if needed.
- [P] tasks = different files, no dependencies, safe to parallelize
- [Story] label maps task to specific user story for traceability
- Each user story builds incrementally: US1 is standalone, US2 extends US1, US3 enhances US2
- Verify each story independently before moving to next priority
- Run `npm run dev` after each task group to verify browser rendering
- Run `npm run typecheck` frequently to catch type errors early
- Commit after each task or logical group
- Performance target: 60fps (16.67ms per frame) - monitor during US1 implementation
- Path lengths up to 100,000px should perform smoothly (test during US3)
- Avoid: modifying same files in parallel, breaking existing user stories when adding new ones
