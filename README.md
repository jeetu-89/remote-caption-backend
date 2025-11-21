# Remote Caption Backend

A lightweight backend that uploads videos to Cloudinary, extracts audio using FFmpeg, sends audio to AssemblyAI for transcription, and produces captions (SRT/VTT/JSON) for download. Built with TypeScript + Express.

## Features

- Upload MP4 videos via multipart/form-data and store metadata locally.
- Generate captions using AssemblyAI (supports words+timings when returned).
- Produce downloadable SRT, VTT and JSON caption files stored under the `uploads/` folder.
- Stream uploads to Cloudinary using in-memory buffering (no local storage required for uploads).
- Simple REST API with endpoints for upload, caption generation, and file download.

## Repository structure

- `src/`
  - `app.ts` - Express app configuration and route mounting.
  - `server.ts` - Server bootstrap.
  - `config/` - Configuration (env loading, cloudinary config).
  - `controllers/` - Request handlers for upload, captions, download.
  - `routes/` - Express routes.
  - `services/` - Business logic (Cloudinary + AssemblyAI + caption generation).
  - `utils/` - Helper utilities for FFmpeg, file handling, video manipulation.
- `package.json` - scripts and dependencies.

## Prerequisites

- Node.js (recommended >= 18)
- npm (comes with Node.js)

The project uses `ffmpeg-static`, so a system `ffmpeg` binary is not required.

## Install

Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd remote-caption-backend
npm install
```

## Environment variables

Create a `.env` file at the project root with the following variables:

```env
# Server
PORT=4000
UPLOAD_DIR=uploads

# Cloudinary (used for storing videos)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AssemblyAI (speech-to-text)
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
```

Notes:
- `UPLOAD_DIR` defaults to `uploads` if omitted.
- Make sure `ASSEMBLYAI_API_KEY` is valid and has transcription quota for your use.

## Run (development)

Start the server in dev mode (auto-reloads on change):

```bash
npm run dev
```

This runs `ts-node-dev --respawn --transpile-only src/server.ts` (see `package.json`).

## Build & Run (production)

Compile TypeScript and run the generated JavaScript:

```bash
npm run build
npm start
```

`npm run build` uses `tsc` and `npm start` runs the compiled `dist/server.js`.

## API Endpoints

Base path: `http://localhost:<PORT>/api`

- POST `/api/upload`
  - Upload a single MP4 video via `multipart/form-data`. Field name: `video`.
  - Example (curl):

    ```bash
    curl -X POST http://localhost:4000/api/upload \
      -F "video=@/path/to/video.mp4"
    ```

  - Response (success):
    - JSON containing `videoId` and stored metadata.

- POST `/api/captions`
  - Generate captions for an already-uploaded video.
  - Body: JSON `{ "videoId": "<videoId from upload>" }`.
  - Example:

    ```bash
    curl -X POST http://localhost:4000/api/captions \
      -H "Content-Type: application/json" \
      -d '{"videoId":"<VIDEO_ID>"}'
    ```

  - Response: links to generated files (SRT/VTT/JSON) under `/api/download`.

- POST `/api/captions/from-url`
  - Generate captions for a video available at a remote URL (e.g. Cloudinary URL).
  - Body: JSON `{ "videoUrl": "https://..." }`.
  - Example:

    ```bash
    curl -X POST http://localhost:4000/api/captions/from-url \
      -H "Content-Type: application/json" \
      -d '{"videoUrl":"https://res.cloudinary.com/.../video.mp4"}'
    ```

- GET `/api/captions/:videoId`
  - Check which caption files exist for a given `videoId`.
  - Returns JSON containing `exists` booleans and `files` (download URLs when present).

- GET `/api/download/:file`
  - Download a generated file (SRT / VTT / JSON). Example: `/api/download/<videoId>.srt`.

## Example workflow

1. Upload video:
   - POST `/api/upload` (form-data field `video`)
   - Get `videoId` from response
2. Generate captions:
   - POST `/api/captions` with `{ "videoId": "..." }`
   - Poll or just use returned file links to download captions (the server runs the transcription and returns when done).

Or, skip upload and use `POST /api/captions/from-url` with a Cloudinary or public video URL.

## Troubleshooting

- 400 errors from upload: only `video/mp4` files are accepted and file size is limited (100MB by default).
- Missing AssemblyAI key: the Assembly provider will throw if `ASSEMBLYAI_API_KEY` is not set.
- If transcription fails, check logs—AssemblyAI often returns detailed error JSON which the service surfaces.

## Notes & Next steps

- You can replace AssemblyAI with another STT provider by swapping `src/services/assembly.provider.ts`.
- Consider adding authentication, rate limiting, and background job queueing for long-running transcriptions.

## Contributing

PRs are welcome. Keep changes small and focused. Add tests where practical.

## License

MIT (please add a LICENSE file if you want to make this explicit)
