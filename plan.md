# orthanc-client — Project Plan

## Goal

Build and publish a production-ready **TypeScript/JavaScript client library** for the [Orthanc DICOM server](https://www.orthanc-server.com/) REST API (v1.12.11). The library must be:

- Fully typed (TypeScript first, with generated `.d.ts` for JS consumers)
- Tree-shakeable and dual-module (ESM + CJS)
- Usable in Node.js, Bun, Deno (via npm compat), and browser environments
- Published to npm

---

## Milestones

### Milestone 1 — Project Bootstrap ✅

| Task | Status |
|---|---|
| Initialize Bun project (`package.json`) | ✅ Done |
| Configure TypeScript (`tsconfig.json`) | ✅ Done |
| Configure `tsup` for dual CJS/ESM build | ✅ Done |
| Install dependencies (`class-transformer`, `reflect-metadata`, `@swc/core`, `tsup`) | ✅ Done |
| Create `src/` layout (`index.ts`, `client.ts`, `models.ts`, `types.ts`) | ✅ Done |
| Create initial test suite (`tests/client.test.ts`) | ✅ Done |
| Create `AGENTS.md` | ✅ Done |
| Create `plan.md` | ✅ Done |

---

### Milestone 2 — Core API Coverage

Cover the full Orthanc REST API surface across all resource types.

#### 2.1 — System & Tools

- [ ] `GET /system` → `system()`
- [ ] `GET /statistics` → `statistics()`
- [ ] `POST /tools/find` → `find()`
- [ ] `GET /changes` / `DELETE /changes` → `changes()` / `clearChanges()`
- [ ] `GET /exports` → `exports()`

#### 2.2 — Patients

- [ ] CRUD: list, get, delete
- [ ] Anonymize, modify
- [ ] Archive download (ZIP)
- [ ] Metadata (list, get, set, delete)
- [ ] Labels (add, remove, list)
- [ ] Statistics

#### 2.3 — Studies

- [ ] CRUD: list, get, delete
- [ ] Anonymize, modify
- [ ] Archive (ZIP) and Media (DICOM CD) download
- [ ] Metadata (list, get, set, delete)
- [ ] Labels (add, remove, list)
- [ ] Statistics
- [ ] Split/merge (advanced)

#### 2.4 — Series

- [ ] CRUD: list, get, delete
- [ ] Anonymize, modify
- [ ] Archive download (ZIP)
- [ ] Metadata and labels

#### 2.5 — Instances

- [ ] CRUD: list, get, delete
- [ ] Upload DICOM file
- [ ] Download raw DICOM file
- [ ] Tags (full, simplified, in-hierarchy)
- [ ] Frames (rendered PNG, JPEG)
- [ ] Anonymize, modify (returns modified DICOM bytes)
- [ ] Bulk data / content by path

#### 2.6 — Jobs

- [ ] List, get, cancel, pause, resume
- [ ] `waitForJob()` polling helper

#### 2.7 — Modalities (DICOM Networking)

- [ ] List, get, delete, create/update
- [ ] C-ECHO → `echoModality()`
- [ ] C-STORE → `storeToModality()`
- [ ] C-FIND → `queryModality()`
- [ ] C-MOVE (retrieve query results) → `moveQueryResults()`

#### 2.8 — Peers (Orthanc-to-Orthanc)

- [ ] List, get, delete, create/update
- [ ] Store resources to peer → `storeToPeer()`

---

### Milestone 3 — Developer Experience

- [ ] Add `README.md` with installation, quick-start, and API reference
- [ ] Add JSDoc comments to all public methods
- [ ] Add `CHANGELOG.md`
- [ ] Configure `.gitignore`
- [ ] Add ESLint + Prettier configuration
- [ ] Add GitHub Actions CI workflow (typecheck + test on push)

---

### Milestone 4 — Quality & Hardening

- [ ] Expand test coverage to ≥ 80% of public methods
- [ ] Add integration test harness (optional Docker Compose with real Orthanc)
- [ ] Add request retry logic (configurable)
- [ ] Add streaming support for large downloads
- [ ] Add AbortSignal passthrough so consumers can cancel requests
- [ ] Audit and document known browser limitations (e.g., CORS)

---

### Milestone 5 — Publishing

- [ ] Finalise `package.json` metadata (name, author, repository, keywords)
- [ ] Verify dual-module exports work from both `require()` and `import`
- [ ] Verify `.d.ts` types are correct for JS consumers (JSDoc auto-complete)
- [ ] Perform dry-run: `npm publish --dry-run`
- [ ] Tag `v0.1.0` and publish to npm
- [ ] Announce / link from Orthanc community forums (optional)

---

## Architecture Decisions

### Why `class-transformer`?

Orthanc returns plain JSON. Using `class-transformer` with `@Expose()` decorators gives us:
- Type-safe deserialization
- Easy exclusion of unknown/unexpected fields
- Future support for `@Transform()` hooks (e.g. date parsing)

### Why `tsup`?

`tsup` wraps `esbuild` and produces both CJS (`dist/index.js`) and ESM (`dist/index.mjs`) with proper `.d.ts` declaration files. This ensures the library works in all Node.js/Bun/Deno module systems without manual configuration.

### Why native `fetch`?

Using native `fetch` (available in Node.js ≥ 18, Bun, and browsers) avoids an `axios` or `node-fetch` runtime dependency. This keeps the bundle small and works in edge runtimes.

---

## Dependency Policy

| Category | Allowed |
|---|---|
| Runtime deps | `class-transformer`, `reflect-metadata` only |
| Build/dev deps | `tsup`, `typescript`, `@types/bun`, `@swc/core` |
| Testing | `bun:test` (built-in — no extra dep) |
| Peer deps | `reflect-metadata` (consumers must import it once) |

> **Rule:** Do not add new runtime dependencies without a compelling reason. Prefer stdlib.

---

## Versioning

Follows [Semantic Versioning](https://semver.org/):

- `0.x.y` — initial development, breaking changes allowed between minor bumps
- `1.0.0` — stable public API, full Orthanc API coverage, ≥ 80% test coverage
