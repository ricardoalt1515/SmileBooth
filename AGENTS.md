# Repository Guidelines

## Project Structure & Module Organization
Active desktop client lives in `frontend-new/` with Electron processes in `src/main` and `src/preload`, UI flows in `screens/`, shared pieces in `components/`, state in `store/`, and HTTP helpers in `services/api.ts` + `config/constants.ts`. FastAPI runs under `backend/app/` where `api/` routers delegate to `services/`, contracts stay in `schemas/`, and persistence lives in `models/`. Runtime outputs are written to `data/photos`, `data/strips`, and `data/designs`, while legacy experiments in `app-photobooth/` stay untouched unless updating their documentation.

## Build, Test, and Development Commands
- `cd backend && uv pip install -r requirements.txt`: install dependencies via UV.
- `cd backend && python app/main.py` (or `uvicorn app.main:app --reload`): run the FastAPI server.
- `cd frontend-new && npm start`: start Vite + Electron development with HMR.
- `cd frontend-new && npm run make`: produce installers for the current OS.
- `cd frontend-new && npm run lint`: enforce ESLint on all `.ts/.tsx` files.
- `cd backend && pytest -q`: execute backend tests under `backend/tests/`.

## Coding Style & Naming Conventions
Use 2-space indents and semicolons in TypeScript, `PascalCase` for components, and `camelCase` hooks/state; keep Tailwind utilities ordered layout → color → effects for cleaner diffs. Python follows PEP 8 with 4-space indents, type hinted `snake_case` functions, and `CamelCase` Pydantic models stored in `schemas/`. API contracts and shared constants must stay in those centralized modules so both tiers stay aligned.

## Testing Guidelines
Follow `TESTING.md` whenever you touch camera, countdown, or kiosk behavior. Automate regressions with `pytest` suites inside `backend/tests/test_<feature>.py` using `fastapi.testclient` plus sample assets from `data/`. UI logic should be exercised with Vitest + Testing Library files in `frontend-new/src/__tests__/*.test.tsx`, mocking `window.electronAPI`; document any remaining manual steps in the PR checklist.

## Commit & Pull Request Guidelines
Commit subjects stay short, Spanish, and imperative (e.g., `bug botones`, `estable 01`), under 50 characters and scoped to one concern; add architectural context in the body when both tiers move. PRs must include a summary, linked issue or rationale, verification steps (commands + screenshots/GIFs), and notes about data folder impacts. Request reviews from both backend and frontend owners whenever a change crosses layers.

## Security & Configuration Tips
Do not commit `.env`, UV environments, or generated photos; rely on `config/constants.ts` overrides such as `VITE_API_URL`, `KIOSK_MODE=true npm start`, and the settings loaded by `backend/app/config.py`. Keep ports 8000/5173 so preload bridges keep working. If you touch `data/`, sanitize filenames and describe cleanup steps in the PR.
