# Decisions and Tradeoffs

## Architecture & Data Flow
**Redux Toolkit & Thunks vs RTK Query:**
I chose Redux Toolkit with `createEntityAdapter` and async thunks instead of RTK Query. The primary reason is the complex real-time requirements. WebSockets and SSE streams need to inject granular, partial updates (like a status change) into existing entities. While RTK Query supports optimistic updates and cache manipulation, `createEntityAdapter` combined with a standard Redux slice makes manual cache updates for WebSocket events much cleaner and more predictable. 

**Normalization Strategy:**
The normalizer strictly enforces the domain boundaries. Instead of crashing on bad data, it gracefully handles mixed cases (e.g. converting `InProgress` to `in_progress`), unifies timestamp formats into epoch integers, and maps unknown types to a clean `unknown` union member while retaining the original string for debugging purposes. Tasks missing an ID entirely are silently dropped, as an ID is fundamental to tracking the entity.

**Real-Time Merge Strategy:**
I created a custom `useTaskFeed` hook that establishes a WebSocket connection and dispatches Redux actions. The Redux slice listens for these actions and performs targeted mutations on the normalized entities. If an update arrives for a task that is not currently loaded in the UI, we silently ignore it; storing incomplete stub tasks would break the strict type constraints of our domain model.

## Rendering Untrusted AI Summaries Safely
The server streams Markdown containing raw, untrusted HTML (like `<img src=x onerror=...>`) and script tags.
To render this safely:
1. I accumulate the raw Markdown chunks in the `useTaskSummary` hook via the SSE stream.
2. The `SafeMarkdown` component parses the raw Markdown into HTML using `marked`.
3. Before rendering, this HTML string is heavily sanitized using `dompurify`.
4. `DOMPurify` is configured to completely strip `<script>`, `<style>`, and `<img>` tags, and inherently blocks risky attributes like `onerror`. This ensures that even if the Markdown parser emits the injected HTML verbatim, DOMPurify removes the XSS vectors before it reaches the DOM via `dangerouslySetInnerHTML`.

## IndexedDB Caching Approach
I used `localforage` for client-side caching.
- **What is cached:** The first page of the normalized task list payload.
- **When it revalidates:** On initial load, a Redux thunk attempts to hydrate the store from IndexedDB immediately, rendering the UI. It then fires the standard fetch request to the backend.
- **Avoiding stale data:** The UI clearly displays a "Updating from server..." indicator when it is showing cached data but waiting for a fresh response. Once the fresh data arrives, it overwrites the Redux state, avoiding long-term stale UI bugs. 

## Messy Data Handled
- **Status:** Standardized via lowercasing and trimming. Unknown statuses fallback to `todo`.
- **Type:** Standardized. Completely unexpected types like "video" are typed as `unknown` but store the original type string.
- **Timestamps:** A helper checks if it's a string, attempts to parse as ISO date, or parses as stringified epoch.
- **Counts:** Forced into safe integers.
- **Null Assignee:** Modeled properly in TS as `User | null`.

## Bug Hunt: `TaskTicker.tsx`
1. **Bug:** Stale closure on `tick` state in `setInterval`.
   **Fix:** Used functional state updates `setTick((t) => t + 1)`.
2. **Bug:** Fetch effect runs on initial mount when `selectedId` is `null`.
   **Fix:** Added an early return `if (!selectedId) return;` to prevent bogus API calls.
3. **Bug:** Direct state mutation `prev.push(t)`.
   **Fix:** Returned a new array `[...prev, t]`.
4. **Bug:** Direct state mutation via `.sort()` which modifies arrays in place.
   **Fix:** Cloned the array before sorting `[...tasks].sort(...)`.
5. **Bug:** Used array index `i` as the React `key` in a reordered list.
   **Fix:** Changed `key={i}` to `key={t.id}` for stable rendering.

## Future Improvements
- **Virtualization:** For lists over a few hundred items, I'd implement `@tanstack/react-virtual` to ensure 60fps scrolling.
- **Optimistic Updates:** Implementing immediate UI feedback for actions like "Assign to me", storing the previous state, and rolling back if the backend returns an error.
