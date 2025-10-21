# Feature Specification: Drawable Canvas Datepicker Slider

**Feature Branch**: `001-drawable-datepicker-slider`  
**Created**: 2025-10-21  
**Status**: Draft  
**Input**: User description: "Create a simple react project with a canvas. This canvas should have a slider. This slider is a datepicker. When you slide it 1px to the left, the date decreases with one day, when you slide it to the right it increases with one day. The slider should by default be 200px wide. The slider should initialize itself in the middle, at a date of 1 januari 1900. The most left and most right part of the slider are button-like elements. When you click and hold you start drawing from this point. Drawing extends the slider, so after drawing one can extend the slider to their own liking in any direction. Drawing is completely limitless for the slider, however the main draggable sliding object that determines the date should move alongside the newly drawn path."

## Clarifications

### Session 2025-10-21

- Q: What happens when the user draws a path that intersects itself or creates loops? → A: Allow drawing to continue but marker ignores loops and follows the earliest path segment at intersections
- Q: What happens if the user tries to draw beyond the canvas boundaries? → A: Allow drawing to canvas edges; paths are clipped at viewport boundaries
- Q: What happens if the user releases the draw button outside the canvas area? → A: Complete the drawing; path ends at the last point inside the canvas
- Q: Where should the currently selected date be displayed on the fullscreen canvas? → A: Display date near the marker (follows marker as it moves)
- Q: How long must the user hold before drawing mode activates? → A: Instant activation (no hold delay; any click immediately enters drawing mode)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Date Selection via Sliding (Priority: P1)

A user opens the datepicker interface and sees a horizontal slider on a canvas. They can drag a marker left or right to select a date. Moving the marker 1 pixel left decreases the date by one day, while moving it 1 pixel right increases it by one day.

**Why this priority**: This is the core functionality - date selection through sliding. Without this, the feature delivers no value.

**Independent Test**: Can be fully tested by dragging the slider marker and verifying the displayed date changes accordingly. Delivers immediate value as a functioning datepicker.

**Acceptance Scenarios**:

1. **Given** the datepicker loads, **When** the user views the canvas, **Then** the slider is 200px wide, centered on the screen, and the marker is positioned in the center of the slider displaying "January 1, 1900"
2. **Given** the marker is at January 1, 1900, **When** the user drags it 1px to the right, **Then** the date increases to January 2, 1900
3. **Given** the marker is at January 1, 1900, **When** the user drags it 1px to the left, **Then** the date decreases to December 31, 1899
4. **Given** the marker is at any position, **When** the user drags it continuously, **Then** the date updates smoothly with each pixel of movement

---

### User Story 2 - Extending Slider Through Drawing (Priority: P2)

A user wants to extend the date range beyond the initial 200px slider. They click and hold on either end button of the slider and drag to draw an extension path. This allows them to create a longer timeline in either direction.

**Why this priority**: This enables customization of the date range but the basic datepicker is functional without it.

**Independent Test**: Can be tested by clicking the left or right end button and dragging to create an extended path. The slider should grow in that direction.

**Acceptance Scenarios**:

1. **Given** the slider is at its default 200px, **When** the user clicks and holds the left end button, **Then** drawing mode activates for leftward extension
2. **Given** drawing mode is active on the left, **When** the user drags their cursor, **Then** a path is drawn extending the slider to the left
3. **Given** drawing mode is active on the right, **When** the user drags their cursor, **Then** a path is drawn extending the slider to the right
4. **Given** the user is drawing, **When** they release the mouse button, **Then** drawing mode ends and the extended path becomes part of the slider
5. **Given** the slider has been extended, **When** the total slider length increases, **Then** the date range expands proportionally (each pixel still represents one day)

---

### User Story 3 - Marker Movement Along Extended Path (Priority: P3)

After extending the slider through drawing, the user can drag the date marker along the newly drawn path. The marker follows the custom path shape, maintaining the 1px = 1 day relationship along the path's length.

**Why this priority**: This completes the drawing feature but depends on P2. The system is functional without custom paths.

**Independent Test**: Can be tested by first drawing an extended path (P2), then dragging the marker along it. The marker should follow the path and update dates correctly.

**Acceptance Scenarios**:

1. **Given** the slider has been extended with a custom drawn path, **When** the user drags the marker, **Then** it follows the path shape (not just horizontal)
2. **Given** the marker is on an extended path, **When** moved 1px along the path length, **Then** the date changes by one day
3. **Given** the slider has extensions in both directions, **When** the user drags the marker from one end to the other, **Then** the marker seamlessly transitions across the entire path including drawn extensions
4. **Given** a curved or non-linear drawn path, **When** the marker moves along it, **Then** distance along the path (not straight-line distance) determines date change

---

### Edge Cases

- Self-intersecting paths are allowed; marker follows the chronologically earliest path segment at intersections, ignoring loops to prevent date ambiguity
- How does the system handle very long drawn paths (thousands of pixels)?
- Drawing is clipped at viewport boundaries; paths cannot extend beyond canvas edges
- If user releases draw button outside canvas, the drawing completes with path ending at the last point inside canvas
- How does the date display handle very distant dates (e.g., year 10000 or year -5000 BCE)?
- What happens when the user draws extremely fast or erratically?
- How does the marker behave at the exact transition point between the original slider and drawn extensions?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a canvas with a horizontal slider that is 200px wide by default, centered on the screen
- **FR-002**: System MUST initialize the date marker at the center of the slider displaying January 1, 1900
- **FR-003**: System MUST decrease the displayed date by one day for every 1 pixel the marker moves to the left
- **FR-004**: System MUST increase the displayed date by one day for every 1 pixel the marker moves to the right
- **FR-005**: System MUST provide clickable button-like elements at the left and right ends of the slider
- **FR-006**: System MUST activate drawing mode instantly when user clicks an end button (no hold delay required)
- **FR-007**: System MUST allow drawing unlimited path extensions in both directions from the slider endpoints
- **FR-008**: System MUST deactivate drawing mode when user releases the mouse button
- **FR-009**: System MUST incorporate drawn paths as part of the slider, extending the date range
- **FR-010**: System MUST move the date marker along the drawn path shape (not just horizontally)
- **FR-011**: System MUST maintain the 1px-per-day relationship along the path length regardless of path shape
- **FR-012**: System MUST visually distinguish between the draggable marker and the end buttons
- **FR-013**: System MUST display the currently selected date in spelled out format (e.g., "January 1, 1900") positioned near the date marker so it follows the marker as it moves
- **FR-014**: System MUST allow the marker to be dragged smoothly without jumping or stuttering
- **FR-015**: System MUST allow users to draw paths that intersect themselves, but the marker MUST follow the chronologically earliest path segment at intersection points, ignoring loops
- **FR-016**: System MUST clip drawn paths at viewport boundaries; drawing cannot extend beyond the canvas edges
- **FR-017**: System MUST complete the drawing if the user releases the mouse button outside the canvas, with the path ending at the last point inside the canvas boundaries

### Key Entities

- **Date Marker**: The draggable element that represents the currently selected date; positioned along the slider path
- **Slider Path**: The selectable area consisting of the initial 200px line plus any user-drawn extensions; defines the date range
- **End Buttons**: Interactive elements at the termini of the current slider path that activate drawing mode
- **Canvas**: The drawing surface containing all interactive elements; fills the entire viewport (fullscreen)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can select any date by dragging the marker, with visual feedback updating within 100ms of movement
- **SC-002**: Users can extend the slider by drawing paths without limit in physical length
- **SC-003**: Date calculations remain accurate (1px = 1 day) for path lengths up to 100,000 pixels
- **SC-004**: Drawing mode activates instantly (within one frame render cycle) when clicking an end button
- **SC-005**: Users can complete a date selection task (choose target date, extend if needed) in under 30 seconds for dates within 1000 days of January 1, 1900
- **SC-006**: The marker follows drawn paths smoothly with no visible lag or jumping during dragging

## Assumptions

- Users interact with the datepicker via mouse or touch input (not keyboard)
- The canvas is displayed in a modern web browser with support for HTML5 Canvas API
- Dates follow the Gregorian calendar including leap years
- Date range is unlimited in both past and future directions
- Drawing creates straight line segments following the cursor path (not freehand curves requiring smoothing)
- Visual styling (colors, fonts, sizes) will be determined during implementation
- The canvas fills the entire viewport (fullscreen) providing ample space for drawing extensions
- The slider initializes centered horizontally and vertically on the screen
- The date format uses spelled out month names for maximum readability
