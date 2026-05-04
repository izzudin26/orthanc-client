# orthanc-client

A fully-typed TypeScript/JavaScript client library for the [Orthanc DICOM server](https://www.orthanc-server.com/) REST API (v1.12.11).

Works in **Node.js**, **Bun**, **Deno** (via npm compat), and modern **browsers**.

## Features

- Full TypeScript support with generated `.d.ts` declarations
- Dual module output — ESM (`import`) and CJS (`require`)
- Typed response models via `class-transformer` decorators
- Covers the full Orthanc resource hierarchy: Patient → Study → Series → Instance
- Built-in job polling helper (`waitForJob`)
- DICOM networking: C-ECHO, C-STORE, C-FIND via modalities and peers
- Native `fetch` — no `axios` or `node-fetch` required
- Configurable timeout and Basic Auth

## Installation

```bash
# npm
npm install @izzudin/orthanc-client reflect-metadata

# bun
bun add @izzudin/orthanc-client reflect-metadata
```

> `reflect-metadata` is a peer dependency required by `class-transformer`. Import it **once** at the entry point of your application.

## Quick Start

### TypeScript

```ts
import "reflect-metadata";
import { OrthancClient } from "@izzudin/orthanc-client";

const client = new OrthancClient({
  baseUrl: "http://localhost:8042",
  auth: { username: "orthanc", password: "orthanc" },
  timeout: 15_000, // ms, optional (default: 30000)
});

// Check server info
const info = await client.system();
console.log(info.Version); // "1.12.11"

// List all patients
const patientIds = await client.listPatients();

// Get a specific patient (typed model)
const patient = await client.getPatient(patientIds[0]);
console.log(patient.MainDicomTags);
```

### JavaScript (CommonJS)

```js
require("reflect-metadata");
const { OrthancClient } = require("@izzudin/orthanc-client");

const client = new OrthancClient({ baseUrl: "http://localhost:8042" });

client.listStudies().then((ids) => console.log(ids));
```

## Configuration

```ts
interface OrthancClientConfig {
  /** Base URL of the Orthanc server, e.g. http://localhost:8042 */
  baseUrl: string;

  /** Optional Basic Auth credentials */
  auth?: {
    username: string;
    password: string;
  };

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}
```

## API Reference

### System

| Method | Description |
|---|---|
| `system()` | Get server info (version, AET, port, …) |
| `statistics()` | Get counts of patients/studies/series/instances |
| `changes(params?)` | List recent resource changes |
| `clearChanges()` | Delete the changes log |

### Search

```ts
// Search across any resource level with DICOM tag filters
const studyIds = await client.find({
  Level: "Study",
  Query: { PatientName: "Doe*", StudyDate: "20240101-20241231" },
  Limit: 50,
});
```

### Patients

| Method | Description |
|---|---|
| `listPatients()` | List all patient IDs |
| `getPatient(id)` | Get patient details (typed `OrthancPatient`) |
| `deletePatient(id)` | Delete a patient and all its data |
| `anonymizePatient(id, options?)` | Anonymize (returns job) |
| `modifyPatient(id, options)` | Modify DICOM tags (returns job) |
| `downloadPatientArchive(id)` | Download as ZIP (`ArrayBuffer`) |
| `listPatientMetadata(id)` | List metadata keys |
| `getPatientMetadata(id, key)` | Get metadata value |
| `setPatientMetadata(id, key, value)` | Set metadata value |
| `addPatientLabel(id, label)` | Add a label |
| `removePatientLabel(id, label)` | Remove a label |

### Studies

| Method | Description |
|---|---|
| `listStudies()` | List all study IDs |
| `getStudy(id)` | Get study details (typed `OrthancStudy`) |
| `deleteStudy(id)` | Delete a study |
| `anonymizeStudy(id, options?)` | Anonymize (returns job) |
| `modifyStudy(id, options)` | Modify DICOM tags (returns job) |
| `downloadStudyArchive(id)` | Download as ZIP (`ArrayBuffer`) |
| `downloadStudyMedia(id)` | Download as DICOM Media CD (`ArrayBuffer`) |
| `listStudyMetadata(id)` | List metadata keys |
| `getStudyMetadata(id, key)` | Get metadata value |
| `setStudyMetadata(id, key, value)` | Set metadata value |
| `addStudyLabel(id, label)` | Add a label |
| `removeStudyLabel(id, label)` | Remove a label |

### Series

| Method | Description |
|---|---|
| `listSeries()` | List all series IDs |
| `getSeries(id)` | Get series details (typed `OrthancSeries`) |
| `deleteSeries(id)` | Delete a series |
| `anonymizeSeries(id, options?)` | Anonymize (returns job) |
| `modifySeries(id, options)` | Modify DICOM tags (returns job) |
| `downloadSeriesArchive(id)` | Download as ZIP (`ArrayBuffer`) |

### Instances

| Method | Description |
|---|---|
| `listInstances()` | List all instance IDs |
| `getInstance(id)` | Get instance details (typed `OrthancInstance`) |
| `uploadInstance(data)` | Upload a DICOM file (`Uint8Array` or `ArrayBuffer`) |
| `deleteInstance(id)` | Delete an instance |
| `downloadInstance(id)` | Download raw DICOM file (`ArrayBuffer`) |
| `getInstanceTags(id)` | Get full DICOM tag tree |
| `getInstanceSimplifiedTags(id)` | Get human-readable tag names |
| `getInstanceFramePng(id, frame?)` | Render a frame as PNG (`ArrayBuffer`) |
| `getInstanceFrameJpeg(id, frame?, quality?)` | Render a frame as JPEG (`ArrayBuffer`) |
| `anonymizeInstance(id, options?)` | Anonymize, returns modified DICOM bytes |
| `modifyInstance(id, options)` | Modify tags, returns modified DICOM bytes |

```ts
// Upload a DICOM file
import { readFileSync } from "fs";

const dicomBytes = readFileSync("scan.dcm");
const result = await client.uploadInstance(dicomBytes);
console.log(result.ID); // Orthanc instance UUID

// Download and save a frame as PNG
const png = await client.getInstanceFramePng(result.ID, 0);
await Bun.write("frame.png", png);
```

### Jobs

| Method | Description |
|---|---|
| `listJobs()` | List all job IDs |
| `getJob(id)` | Get job status (typed `OrthancJob`) |
| `cancelJob(id)` | Cancel a job |
| `pauseJob(id)` | Pause a job |
| `resumeJob(id)` | Resume a paused job |
| `waitForJob(id, opts?)` | Poll until job succeeds or fails |

```ts
// Anonymize a study and wait for completion
const job = await client.anonymizeStudy("study-uuid", {
  Replace: { PatientName: "Anonymous" },
  Keep: ["StudyDescription"],
});

const result = await client.waitForJob(job.ID, {
  pollIntervalMs: 1000,
  timeoutMs: 60_000,
});

if (result.State === "Failure") {
  console.error("Anonymization failed:", result.ErrorDescription);
}
```

### Modalities (DICOM Networking)

| Method | Description |
|---|---|
| `listModalities()` | List configured modality names |
| `echoModality(name)` | Send C-ECHO ping |
| `storeToModality(name, options)` | C-STORE resources to a modality |
| `queryModality(name, query)` | C-FIND query against a modality |

### Peers (Orthanc-to-Orthanc)

| Method | Description |
|---|---|
| `listPeers()` | List configured peer names |
| `storeToPeer(name, options)` | Push resources to a peer Orthanc |

## Error Handling

All non-2xx responses throw an `OrthancError`:

```ts
import { OrthancClient, OrthancError } from "@izzudin/orthanc-client";

try {
  await client.getPatient("nonexistent-id");
} catch (err) {
  if (err instanceof OrthancError) {
    console.error(err.statusCode); // 404
    console.error(err.url);        // http://localhost:8042/patients/nonexistent-id
    console.error(err.body);       // response body text
  }
}
```

## Response Models

Responses for DICOM resources are deserialized into typed classes:

| Class | Used for |
|---|---|
| `OrthancPatient` | `getPatient()` |
| `OrthancStudy` | `getStudy()` |
| `OrthancSeries` | `getSeries()` |
| `OrthancInstance` | `getInstance()` |
| `OrthancJob` | `getJob()`, `waitForJob()` |

All classes use `class-transformer` `@Expose()` decorators with `excludeExtraneousValues: true`, so unknown/extra fields from the server are stripped automatically.

## Development

```bash
bun install          # install dependencies
bun run build        # compile to dist/ (CJS + ESM + .d.ts)
bun test             # run test suite
bun run lint         # TypeScript type-check only
bun run build:watch  # watch mode
```

## Project Structure

```
src/
├── index.ts     — public barrel exports
├── client.ts    — OrthancClient class + OrthancError
├── models.ts    — class-transformer resource models
└── types.ts     — shared TypeScript interfaces
tests/
└── client.test.ts
```

## License

MIT
