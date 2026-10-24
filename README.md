# React + Vite

## Cloudflare Workers deployment

In Cloudflare **Settings → Build**, use:

- Build command: `pnpm run build`
- Deploy command: `pnpm run deploy`
- Preview command (non-production branches): `npx wrangler preview`
- Root directory: repository root

`wrangler.jsonc` is the deployment configuration. Do not pass `vite.config.js`
to Wrangler's `--config` option. Set `name` in `wrangler.jsonc` to match the
Worker name configured in Cloudflare (`casequest2026`).

Run `pnpm run build` then `pnpm run deploy:check` to validate the deployment
bundle without publishing. `pnpm run preview:cloudflare` previews the app and
its `/api/sync-excel` endpoint in the Workers runtime.

The Worker serves the Vite `dist/` assets and handles Excel refresh requests.
Without a remote workbook URL it returns the bundled, cleaned historical
snapshot; no filesystem access is required. Browser workbook imports still work.
Remote workbook links must be downloadable without an interactive sign-in.
For a server-side default workbook URL, set `VITE_EXCEL_ONLINE_URL` under
Cloudflare **Settings → Variables and Secrets**, not just build variables.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## Microsoft 365 / SharePoint Live Excel Sync

This project supports live, periodic synchronization with your online Microsoft Excel (`CaseQuest2026Dataset.xlsx`) file on SharePoint / OneDrive for Business.

### How it works
1. **Periodic Background Polling**: The dashboard checks for newer data every 2 minutes (customizable to 1m, 5m, 10m, or manual).
2. **One-Click Manual Sync**: Click the refresh icon next to the "Live" badge in the top bar to pull updates immediately.
3. **Live Sync Settings Modal**: Click the settings icon in the top bar to paste your SharePoint link, test the connection, or adjust sync frequency.
4. **CORS-Free Backend Endpoint**: The `/api/sync-excel` endpoint fetches directly from SharePoint, cleans and normalizes dirty IDs and duplicate exports, and calculates downtime stages, causes, and financial margins.
5. **Instant Local Fallback**: You can also drag-and-drop an `.xlsx` file right into the settings modal for zero-setup instant updates in the browser.

### Getting your SharePoint Share Link
1. Open `CaseQuest2026Dataset.xlsx` in Microsoft 365 / SharePoint.
2. Click **Share** (top-right corner).
3. Ensure the permission is set to **"Anyone with the link can view"** (or organizational view).
4. Click **Copy link** and paste it into the sync settings dialog in the dashboard (or save in `.env` as `VITE_EXCEL_ONLINE_URL`).
