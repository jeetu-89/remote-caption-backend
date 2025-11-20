
You have to create whole frontend
Overview
- Goal: Build a complete React + TypeScript frontend (Vite) that integrates with the provided backend to upload videos, trigger server-side caption generation (AssemblyAI + FFmpeg pipeline), download caption files (SRT/VTT/JSON), and render live subtitles over video using Remotion (YouTube-like caption rendering).
- Notes about the backend:
  - The backend accepts a video upload and returns a `videoId` and stored path.
  - It extracts audio via FFmpeg, sends the audio to AssemblyAI for transcription, converts the transcript to SRT/VTT/JSON caption formats, and saves those files in `uploads/` for download.
  - The frontend is responsible for playback of the original File object (use a client-side object URL) because the backend does not host video streaming for playback (it only stores files and provides downloads).
  - Backend quick references (for integration): `POST /api/upload`, `POST /api/captions`, `GET /api/download/:file`.

1) Full Backend Overview (explain to the frontend Copilot)
- Purpose of the backend (clear summary for developer use):
  - Accept video uploads from the frontend.
  - Extract audio from the uploaded video using FFmpeg.
  - Send the extracted audio to AssemblyAI for automatic speech recognition (ASR).
  - Receive the transcript and convert it to three caption formats: SRT, VTT, and a JSON captions file that contains a full transcript plus an array of timestamped segments.
  - Persist caption files under `uploads/` and expose them via `GET /api/download/:file`.
  - Return structured caption segments so the frontend can overlay timed subtitles during playback or use them in Remotion compositions.

- Typical backend processing flow (for frontend UX expectations):
  1. Upload video with `POST /api/upload` (form-data, field `video`). Backend responds with `videoId` and stored path.
  2. Call `POST /api/captions` with `{ videoId }`. This triggers the extract/transcribe/convert pipeline on the backend. This may take time (tens of seconds to a few minutes depending on length). The POST will return after captions are generated (in this backend implementation it returns the download links).
  3. Use `GET /api/download/xxx` to download `.srt`, `.vtt`, `.captions.json` files.
  4. Use the `segments` array from the `.captions.json` (or the JSON response) to render subtitles in the video player.

- Storage & file notes:
  - Files are saved under `uploads/` on the server. Example stored files: `uploads/abcd1234.mp4`, `uploads/abcd1234.srt`, `uploads/abcd1234.vtt`, `uploads/abcd1234.captions.json`.
  - The backend responses (below) return either the `videoId` or links pointing to `GET /api/download/...`.

2) Backend Endpoints (full details for frontend Copilot)

- Endpoint #1 — Upload video
  - POST /api/upload
  - Purpose: Accept a video File via multipart/form-data and store it on the server.
  - Body: Form-data → field name: `video` (type: file)
  - Headers: `Content-Type: multipart/form-data`
  - Success response (HTTP 200):
    {
      "message": "Video uploaded",
      "videoId": "abcd1234",
      "path": "uploads/abcd1234.mp4"
    }
  - Errors: 400 for missing file, 500 for server error. Frontend should show readable messages.
  - UX hints: return and store the File object locally or in state so the frontend can play the uploaded video via a local object URL (since backend does not serve playback streaming for the same file by default).

- Endpoint #2 — Generate captions
  - POST /api/captions
  - Purpose: Trigger the backend to extract audio, transcribe via AssemblyAI, and create SRT/VTT/JSON caption files.
  - Body (JSON):
    { "videoId": "<id returned from upload>" }
  - Headers: `Content-Type: application/json`
  - Behavior & timing:
    - This call may be long-running (depending on video length and AssemblyAI latency). Expect 10–300+ seconds in worst cases.
    - The backend implementation returns after generation completes (synchronous). Frontend must show a loader and a helpful progress message.
    - If the backend supports it later, you can add polling or a status endpoint; for now show loader while waiting for the POST to return.
  - Success response (HTTP 200) example:
    {
      "message": "Captions generated",
      "files": {
        "srt": "/api/download/abcd1234.srt",
        "vtt": "/api/download/abcd1234.vtt",
        "json": "/api/download/abcd1234.captions.json"
      },
      "segmentsCount": 17
    }
  - Error handling: 400 for invalid id, 404 if video not found, 500 for transcription/generation errors. Show helpful UX errors and a retry option.

  - JSON captions file shape (exact format the frontend must consume):
    {
      "text": "full transcript",
      "segments": [
        { "start": 0.0, "end": 3.1, "text": "Hello world" },
        { "start": 3.5, "end": 7.2, "text": "This is an example caption." },
        ...
      ]
    }
  - Important: The frontend MUST use the `segments` array for subtitle overlays and timing. Do not rely on SRT/VTT parsing at runtime for overlay; prefer the already structured JSON segments for accuracy and easier rendering.

- Endpoint #3 — Download caption files
  - GET /api/download/:file
  - Purpose: Download generated caption files (SRT, VTT, JSON).
  - Example:
    GET http://localhost:4000/api/download/abcd1234.vtt
  - Behavior:
    - Returns the file as `Content-Disposition: attachment` (or as file body). The response is a downloadable file stream.
    - The returned link format from `POST /api/captions` is relative; prefix with backend base URL for clipboard or direct fetch usage.
  - Error handling: 404 when file not found. Show a download error UI.

3) What the Frontend Must Do (explicit instructions)

Build a React + TypeScript single-page app (Vite) with the following pages/components and behaviors.

A) Video Upload Page (`UploadVideo.tsx`)
- UI:
  - Drag-and-drop zone + file picker that accepts video MIME types (mp4, mov, mkv, webm — but restrict to commonly supported formats).
  - Show file metadata (name, size, duration when possible).
  - Upload button triggers `POST /api/upload` using `FormData` with field name `video`.
  - Show upload progress (percentage) using the XHR/axios progress callback.
- On success:
  - Save returned `videoId` in client state (React context or local storage).
  - Persist the selected `File` object in memory for immediate playback (use `URL.createObjectURL(file)`).
  - Navigate to the Caption Generation page.
- Error behavior:
  - If upload fails, show retry and show raw server message when available.
- UX tips:
  - Disable upload button while upload in-progress.
  - Prevent multiple simultaneous uploads in same session.

B) Caption Generation Page (`GenerateCaptions.tsx`)
- UI:
  - Show selected video preview (use the local object URL).
  - Display a prominent "Generate captions" button (calls `POST /api/captions` with `{ videoId }`).
  - Show a full-screen modal spinner / loader and a progress message while backend processes. Provide an approximate ETA or just say "This can take a minute for longer videos."
  - When `POST /api/captions` returns:
    - Display returned `files` links as clickable download links (SRT, VTT, JSON).
    - Fetch and display the JSON captions file content in a readable format (pretty-printed).
    - Show the full transcript text (`text` field in JSON).
    - Display `segmentsCount` and optionally a small table/list of segments (start/end/text).
- Implementation details:
  - Use Axios for HTTP calls; consider `onUploadProgress` for upload.
  - Use React Query (recommended) to manage the `POST /api/captions` mutation and caching of the captions JSON.
- Example UX flow:
  1. Load page with stored `videoId` and in-memory file for playback.
  2. User clicks "Generate captions".
  3. Show loader while awaiting `POST /api/captions`.
  4. After success, show downloads and segments.
- Error handling:
  - If the captions call fails, display the error and a "Retry" button.
  - If `segments` is empty or malformed, show a warning and suggest re-generating.

C) Video Player With Live Subtitles (Using Remotion) (`VideoPlayerWithSubs.tsx`)
- Important constraints:
  - Use the uploaded File's local object URL for playback (the backend does not provide a playback streaming endpoint by default).
  - Use the structured JSON `segments` to overlay subtitles, not raw SRT/VTT parsing.
- Architecture (Remotion-specific):
  - Create a Remotion Composition that accepts:
    - `videoSrc` — the video source (object URL or an accessible URL)
    - `segments` — the array of `CaptionSegment` objects (see Types below)
  - Composition layers:
    - Base layer: video element (plays the video).
    - Subtitle layer: overlays text using the `segments` timing.
  - Subtitle rendering behavior (YouTube-like):
    - Position: bottom-center of the video.
    - Background: black semi-transparent rounded rectangle (e.g., rgba(0,0,0,0.6)).
    - Text: white, bold, with subtle drop shadow for contrast.
    - Auto-resize/wrap: ensure long lines wrap and the font size reduces if a line exceeds the width threshold.
    - Padding: a small vertical and horizontal padding inside the caption box.
    - Multi-line handling: break at sensible spaces; center-align each line.
    - Accessible: ensure subtitles are readable by screen readers (also provide toggle).
  - Timing logic pseudocode (frontend should implement exact logic in component):
    if (currentTime >= segment.start && currentTime <= segment.end) {
      show segment.text
    }
  - Implementation hints:
    - In Remotion, map `frames` → `time` to check current time (convert frames to seconds with `frame / fps`).
    - Render only the active segment(s) for currentTime to minimize re-rendering.
    - Use CSS transitions (fade in/out) for smooth appearance.
    - Avoid syncing on setInterval — use Remotion’s frame/time-driven rendering.
- Example rendering rules:
  - Keep a 200ms tolerance for early/late boundaries if necessary (but prefer exact segment times).
  - If two segments overlap, prefer showing the most recent segment text or stack them if needed (UI decision: default to single-line replacement).
- Controls & UI:
  - Subtitles toggle: show/hide.
  - Font size control and color theme toggle (optional).
  - Seek-safe behavior: when user seeks, compute the currentTime and show appropriate segment immediately after seek.

D) Optional Features (nice-to-have, optional)
- Styling options replicating YouTube captions: font shadow, letter-spacing, small caps option, background opacity slider.
- Toggle to show/hide subtitles.
- Color/theme switch for caption foreground/background.
- Caption export page that fetches the `.srt`, `.vtt`, and `.json` and packages a ZIP for download (optional).
- Per-segment editing UI (allow corrections inline; re-export updated JSON/SRT) — requires backend support to re-upload or save edits, so list as optional future enhancement.

4) General Tech Requirements for the Frontend
- Project stack:
  - React + TypeScript + Vite (preferred).
  - Remotion for composition and rendering of video + captions overlay.
  - Axios for HTTP requests.
  - React Query (optional but recommended) for mutations, caching and loading states.
  - Tailwind CSS or CSS Modules (your choice) for styling; ensure responsive design.
- Performance & UX:
  - Show progress during upload and caption generation.
  - Keep the original File in memory (object URL) for immediate playback; persist `videoId` server-side for future operations.
  - Avoid re-downloading the same captions file; use queries & caching.
- Accessibility:
  - Subtitles must be readable: contrast, font size, user controls for enabling/disabling.
  - Provide keyboard navigability on upload and generation flows.
- Error handling:
  - Gracefully handle and show messages for backend errors, network timeouts, and 4xx/5xx responses.

5) Deliverables expected from frontend Copilot
- Pages / Components (create these files, each with clear responsibilities):
  - `UploadVideo.tsx` — drag-and-drop + file picker, upload to `POST /api/upload`.
  - `GenerateCaptions.tsx` — trigger captions generation, show loader, display transcript, segments, and download links.
  - `VideoPlayerWithSubs.tsx` — uses Remotion Composition to play video and overlay subtitles from `segments`.
  - `SubtitleRenderer.tsx` — a focused component that receives `segments` and `currentTime` (or frame/fps) and renders the active subtitle(s) with YouTube-like styling.
- Utilities:
  - `api.ts` — Axios instance and typed functions: `uploadVideo(formData)`, `generateCaptions(videoId)`, `downloadFile(filePath)`.
  - `types.ts` — shared types such as `CaptionSegment`, API response shapes.
- Types (example):
  - `interface CaptionSegment { start: number; end: number; text: string; }`
  - `interface UploadResponse { message: string; videoId: string; path: string; }`
  - `interface CaptionsResponse { message: string; files: { srt: string; vtt: string; json: string }; segmentsCount: number; }`
  - Type the JSON captions file as:
    interface CaptionsFile {
      text: string;
      segments: CaptionSegment[];
    }
- Additional deliverables:
  - Minimal README.md describing how to run the frontend, environment variables (e.g., BACKEND_URL), and how to test with the local backend.
  - Small E2E or integration test plan or a couple of unit tests (e.g., SubtitleRenderer happy path and time boundary).
  - Optional: a small demo video or screenshot suggestions for the README.

6) Small contract, edge cases, and integration notes (engineering guidance)
- Tiny contract (inputs / outputs / error modes):
  - UploadVideo:
    - Input: File (video)
    - Output: { videoId, path }
    - Error modes: missing file, upload network failure, server validation failure
  - GenerateCaptions:
    - Input: { videoId }
    - Output: { files: { srt, vtt, json }, segmentsCount }
    - Error modes: transcription failure, AssemblyAI quota or auth error, long-running timeouts
  - SubtitleRenderer:
    - Input: `segments: CaptionSegment[]`, `currentTime: number`
    - Output: visible text box or empty
    - Error modes: overlapping segments, zero-length segments
- Likely edge cases to handle:
  - Empty or missing `segments` in JSON — show fallback "No captions generated" and allow re-generation.
  - Very long lines — auto-wrap or reduce font size; consider max-lines=2 to match typical caption UX.
  - Overlapping segments — decide to show last-started segment.
  - Seek behavior — ensure correct segment displayed immediately after seek.
  - Large files — show upload progress and advise users on size limits (frontend can enforce a client-side max).
  - Network failures or long timeouts — implement retry/backoff or allow user to re-request generation.
  - Non-English / punctuation edge cases — ensure default font supports target language glyphs.
- Testing suggestions:
  - Unit test `SubtitleRenderer` with a handful of segments and time points (start, middle, end).
  - Integration test for upload + generate flow using a small sample video (or mocked backend).
  - Visual QA: test rendering at various viewport sizes and with different font sizes and background opacities.
- Accessibility:
  - Provide keyboard controls and aria labels for toggles and controls.
  - Make sure text contrast meets WCAG AA at the minimum.

7) Implementation notes for Remotion specifics
- Remotion expects frame-based rendering. Convert frames into seconds via `seconds = frame / fps`. Use that to compare with segment `start`/`end`.
- The Remotion Composition should be sized to standard video dimensions (accept `width`/`height` props or derive from the video metadata).
- Keep SubtitleRenderer lightweight — render only the currently visible segment based on the time calculation. If multiple segments overlap and you need to stack, keep the stack limited to 2 lines.
- Avoid expensive layout changes inside frame rendering loops; compute text layout only when segment changes.

8) Recommended project skeleton (file list)
- src/
  - components/
    - UploadVideo.tsx
    - GenerateCaptions.tsx
    - VideoPlayerWithSubs.tsx
    - SubtitleRenderer.tsx
  - api/
    - api.ts
  - types/
    - types.ts
  - pages/
    - Home.tsx (or routes)
  - App.tsx
  - main.tsx
- public/
- README.md
- vite.config.ts
- package.json (include remotion, react-query, axios, typescript types, etc.)

9) Example integration snippets (pseudocode — for clarity only, not for direct copy)
- How to check and show the active segment:
  - Pseudocode:
    const active = segments.find(s => currentTime >= s.start && currentTime <= s.end);
    if (active) { show active.text in SubtitleRenderer }
- Loading video for playback:
  - Use `URL.createObjectURL(file)` for the `video` src (client-only). Persist `videoId` for server references and future calls.

10) Miscellaneous tips and constraints
- Environment variable: expose `VITE_API_BASE_URL` (or similar) so the frontend can call backend at `VITE_API_BASE_URL + '/api'`. Default fallback: `http://localhost:4000`.
- For downloads, provide both direct link (anchor href to the URL) and a programmatic download via `axios` if you want to preserve filename metadata.
- Security: do not embed the AssemblyAI API key in the frontend (server handles ASR). The frontend only needs the backend base URL.

11) Final instruction (important)
❗Your job is ONLY to output this detailed prompt for the frontend Copilot. DO NOT generate frontend code yourself. Provide this prompt to the frontend Copilot so it can create the complete React + TypeScript + Vite frontend, wire Remotion-based subtitle rendering using the `segments` from the JSON captions file, and implement all pages/components and types described above.

-----

Handoff checklist (for the frontend Copilot)
- [ ] Implement `UploadVideo.tsx` with drag-and-drop and `POST /api/upload`.
- [ ] Implement `GenerateCaptions.tsx` calling `POST /api/captions` and showing JSON + downloads.
- [ ] Implement `VideoPlayerWithSubs.tsx` + `SubtitleRenderer.tsx` with Remotion composition using `CaptionSegment`.
- [ ] Create `api.ts` and typed responses for robust API communication.
- [ ] Add README and run instructions with `VITE_API_BASE_URL` guidance.
- [ ] Add unit tests for `SubtitleRenderer` and integration tests for upload/generate flow (mocked or real backend).

If anything in the above conflicts with the backend implementation, ask a precise question (show the request/response you received and which endpoint/field mismatched).