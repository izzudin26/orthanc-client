import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import type {
  OrthancClientConfig,
  FindQuery,
  ChangesResponse,
  SystemInfo,
  Statistics,
  UploadResult,
  AnonymizeOptions,
  ModifyOptions,
  StoreOptions,
  QueryOptions,
  JobInfo,
} from "./types";
import {
  OrthancPatient,
  OrthancStudy,
  OrthancSeries,
  OrthancInstance,
  OrthancJob,
} from "./models";

export class OrthancClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly timeout: number;

  constructor(config: OrthancClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.timeout = config.timeout ?? 30_000;
    this.headers = { "Content-Type": "application/json" };

    if (config.auth) {
      const credentials = btoa(`${config.auth.username}:${config.auth.password}`);
      this.headers["Authorization"] = `Basic ${credentials}`;
    }
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    options?: { body?: unknown; binary?: boolean; accept?: string }
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = { ...this.headers };

    if (options?.accept) {
      headers["Accept"] = options.accept;
    }

    if (options?.binary) {
      delete headers["Content-Type"];
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    let body: string | Uint8Array | ArrayBuffer | undefined;
    if (options?.body instanceof Uint8Array || options?.body instanceof ArrayBuffer) {
      body = options.body;
      headers["Content-Type"] = "application/dicom";
    } else if (options?.body !== undefined) {
      body = JSON.stringify(options.body);
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new OrthancError(res.status, text, url);
      }

      if (options?.binary) {
        return (await res.arrayBuffer()) as T;
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        return (await res.json()) as T;
      }

      return (await res.text()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  private get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  private getBinary(path: string): Promise<ArrayBuffer> {
    return this.request<ArrayBuffer>("GET", path, { binary: true });
  }

  private post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, { body });
  }

  private postBinary<T>(path: string, data: Uint8Array | ArrayBuffer): Promise<T> {
    return this.request<T>("POST", path, { body: data, binary: true });
  }

  private put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, { body });
  }

  private delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  // ---------------------------------------------------------------------------
  // System
  // ---------------------------------------------------------------------------

  /** Retrieve server system information */
  system(): Promise<SystemInfo> {
    return this.get<SystemInfo>("/system");
  }

  /** Retrieve global statistics */
  statistics(): Promise<Statistics> {
    return this.get<Statistics>("/statistics");
  }

  // ---------------------------------------------------------------------------
  // Changes
  // ---------------------------------------------------------------------------

  /** List recent changes */
  changes(params?: { since?: number; limit?: number }): Promise<ChangesResponse> {
    const qs = new URLSearchParams();
    if (params?.since !== undefined) qs.set("since", String(params.since));
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return this.get<ChangesResponse>(`/changes${query ? `?${query}` : ""}`);
  }

  /** Clear the changes log */
  clearChanges(): Promise<void> {
    return this.delete<void>("/changes");
  }

  // ---------------------------------------------------------------------------
  // Tools / Search
  // ---------------------------------------------------------------------------

  /** Search resources using C-FIND-style query */
  find(query: FindQuery): Promise<string[]> {
    return this.post<string[]>("/tools/find", query);
  }

  // ---------------------------------------------------------------------------
  // Patients
  // ---------------------------------------------------------------------------

  /** List all patient IDs */
  listPatients(): Promise<string[]> {
    return this.get<string[]>("/patients");
  }

  /** Get a patient by ID */
  async getPatient(id: string): Promise<OrthancPatient> {
    const data = await this.get<object>(`/patients/${id}`);
    return plainToInstance(OrthancPatient, data, { excludeExtraneousValues: true });
  }

  /** Delete a patient */
  deletePatient(id: string): Promise<void> {
    return this.delete<void>(`/patients/${id}`);
  }

  /** Anonymize a patient */
  anonymizePatient(id: string, options?: AnonymizeOptions): Promise<JobInfo> {
    return this.post<JobInfo>(`/patients/${id}/anonymize`, options ?? {});
  }

  /** Modify a patient */
  modifyPatient(id: string, options: ModifyOptions): Promise<JobInfo> {
    return this.post<JobInfo>(`/patients/${id}/modify`, options);
  }

  /** Download a patient archive as ZIP */
  downloadPatientArchive(id: string): Promise<ArrayBuffer> {
    return this.getBinary(`/patients/${id}/archive`);
  }

  /** Get patient metadata keys */
  listPatientMetadata(id: string): Promise<string[]> {
    return this.get<string[]>(`/patients/${id}/metadata`);
  }

  /** Get a patient metadata value */
  getPatientMetadata(id: string, key: string): Promise<string> {
    return this.get<string>(`/patients/${id}/metadata/${key}`);
  }

  /** Set a patient metadata value */
  setPatientMetadata(id: string, key: string, value: string): Promise<void> {
    return this.put<void>(`/patients/${id}/metadata/${key}`, value);
  }

  /** Add or remove labels on a patient */
  addPatientLabel(id: string, label: string): Promise<void> {
    return this.put<void>(`/patients/${id}/labels/${label}`);
  }

  removePatientLabel(id: string, label: string): Promise<void> {
    return this.delete<void>(`/patients/${id}/labels/${label}`);
  }

  // ---------------------------------------------------------------------------
  // Studies
  // ---------------------------------------------------------------------------

  /** List all study IDs */
  listStudies(): Promise<string[]> {
    return this.get<string[]>("/studies");
  }

  /** Get a study by ID */
  async getStudy(id: string): Promise<OrthancStudy> {
    const data = await this.get<object>(`/studies/${id}`);
    return plainToInstance(OrthancStudy, data, { excludeExtraneousValues: true });
  }

  /** Delete a study */
  deleteStudy(id: string): Promise<void> {
    return this.delete<void>(`/studies/${id}`);
  }

  /** Anonymize a study */
  anonymizeStudy(id: string, options?: AnonymizeOptions): Promise<JobInfo> {
    return this.post<JobInfo>(`/studies/${id}/anonymize`, options ?? {});
  }

  /** Modify a study */
  modifyStudy(id: string, options: ModifyOptions): Promise<JobInfo> {
    return this.post<JobInfo>(`/studies/${id}/modify`, options);
  }

  /** Download a study archive as ZIP */
  downloadStudyArchive(id: string): Promise<ArrayBuffer> {
    return this.getBinary(`/studies/${id}/archive`);
  }

  /** Download a study as DICOM Media (CD-ROM) */
  downloadStudyMedia(id: string): Promise<ArrayBuffer> {
    return this.getBinary(`/studies/${id}/media`);
  }

  /** Get study metadata */
  listStudyMetadata(id: string): Promise<string[]> {
    return this.get<string[]>(`/studies/${id}/metadata`);
  }

  getStudyMetadata(id: string, key: string): Promise<string> {
    return this.get<string>(`/studies/${id}/metadata/${key}`);
  }

  setStudyMetadata(id: string, key: string, value: string): Promise<void> {
    return this.put<void>(`/studies/${id}/metadata/${key}`, value);
  }

  addStudyLabel(id: string, label: string): Promise<void> {
    return this.put<void>(`/studies/${id}/labels/${label}`);
  }

  removeStudyLabel(id: string, label: string): Promise<void> {
    return this.delete<void>(`/studies/${id}/labels/${label}`);
  }

  // ---------------------------------------------------------------------------
  // Series
  // ---------------------------------------------------------------------------

  /** List all series IDs */
  listSeries(): Promise<string[]> {
    return this.get<string[]>("/series");
  }

  /** Get a series by ID */
  async getSeries(id: string): Promise<OrthancSeries> {
    const data = await this.get<object>(`/series/${id}`);
    return plainToInstance(OrthancSeries, data, { excludeExtraneousValues: true });
  }

  /** Delete a series */
  deleteSeries(id: string): Promise<void> {
    return this.delete<void>(`/series/${id}`);
  }

  /** Anonymize a series */
  anonymizeSeries(id: string, options?: AnonymizeOptions): Promise<JobInfo> {
    return this.post<JobInfo>(`/series/${id}/anonymize`, options ?? {});
  }

  /** Modify a series */
  modifySeries(id: string, options: ModifyOptions): Promise<JobInfo> {
    return this.post<JobInfo>(`/series/${id}/modify`, options);
  }

  /** Download a series archive as ZIP */
  downloadSeriesArchive(id: string): Promise<ArrayBuffer> {
    return this.getBinary(`/series/${id}/archive`);
  }

  // ---------------------------------------------------------------------------
  // Instances
  // ---------------------------------------------------------------------------

  /** List all instance IDs */
  listInstances(): Promise<string[]> {
    return this.get<string[]>("/instances");
  }

  /** Get an instance by ID */
  async getInstance(id: string): Promise<OrthancInstance> {
    const data = await this.get<object>(`/instances/${id}`);
    return plainToInstance(OrthancInstance, data, { excludeExtraneousValues: true });
  }

  /** Upload a DICOM file */
  uploadInstance(data: Uint8Array | ArrayBuffer): Promise<UploadResult> {
    return this.postBinary<UploadResult>("/instances", data);
  }

  /** Delete an instance */
  deleteInstance(id: string): Promise<void> {
    return this.delete<void>(`/instances/${id}`);
  }

  /** Download the raw DICOM file */
  downloadInstance(id: string): Promise<ArrayBuffer> {
    return this.getBinary(`/instances/${id}/file`);
  }

  /** Get all DICOM tags of an instance */
  getInstanceTags(id: string): Promise<Record<string, unknown>> {
    return this.get<Record<string, unknown>>(`/instances/${id}/tags`);
  }

  /** Get simplified (human-readable) tags */
  getInstanceSimplifiedTags(id: string): Promise<Record<string, unknown>> {
    return this.get<Record<string, unknown>>(`/instances/${id}/simplified-tags`);
  }

  /** Get a specific frame as a PNG image */
  getInstanceFramePng(id: string, frame = 0): Promise<ArrayBuffer> {
    return this.getBinary(`/instances/${id}/frames/${frame}/rendered`);
  }

  /** Get a specific frame as a JPEG image */
  getInstanceFrameJpeg(id: string, frame = 0, quality = 90): Promise<ArrayBuffer> {
    return this.getBinary(
      `/instances/${id}/frames/${frame}/rendered?quality=${quality}&transcode=1.2.840.10008.1.2.4.50`
    );
  }

  /** Anonymize an instance */
  anonymizeInstance(id: string, options?: AnonymizeOptions): Promise<ArrayBuffer> {
    return this.request<ArrayBuffer>("POST", `/instances/${id}/anonymize`, {
      body: options ?? {},
      binary: true,
    });
  }

  /** Modify an instance */
  modifyInstance(id: string, options: ModifyOptions): Promise<ArrayBuffer> {
    return this.request<ArrayBuffer>("POST", `/instances/${id}/modify`, {
      body: options,
      binary: true,
    });
  }

  // ---------------------------------------------------------------------------
  // Jobs
  // ---------------------------------------------------------------------------

  /** List all job IDs */
  listJobs(): Promise<string[]> {
    return this.get<string[]>("/jobs");
  }

  /** Get a job by ID */
  async getJob(id: string): Promise<OrthancJob> {
    const data = await this.get<object>(`/jobs/${id}`);
    return plainToInstance(OrthancJob, data, { excludeExtraneousValues: true });
  }

  /** Cancel a job */
  cancelJob(id: string): Promise<void> {
    return this.post<void>(`/jobs/${id}/cancel`);
  }

  /** Pause a job */
  pauseJob(id: string): Promise<void> {
    return this.post<void>(`/jobs/${id}/pause`);
  }

  /** Resume a job */
  resumeJob(id: string): Promise<void> {
    return this.post<void>(`/jobs/${id}/resume`);
  }

  /** Poll a job until completion */
  async waitForJob(
    id: string,
    opts: { pollIntervalMs?: number; timeoutMs?: number } = {}
  ): Promise<OrthancJob> {
    const interval = opts.pollIntervalMs ?? 1_000;
    const deadline = opts.timeoutMs ? Date.now() + opts.timeoutMs : Infinity;

    while (true) {
      const job = await this.getJob(id);
      if (job.State === "Success" || job.State === "Failure") {
        return job;
      }
      if (Date.now() >= deadline) {
        throw new Error(`Job ${id} timed out after ${opts.timeoutMs}ms`);
      }
      await new Promise((r) => setTimeout(r, interval));
    }
  }

  // ---------------------------------------------------------------------------
  // Modalities (DICOM networking)
  // ---------------------------------------------------------------------------

  /** List configured modalities */
  listModalities(): Promise<string[]> {
    return this.get<string[]>("/modalities");
  }

  /** Send resources to a remote modality (C-STORE) */
  storeToModality(modality: string, options: StoreOptions): Promise<JobInfo> {
    return this.post<JobInfo>(`/modalities/${modality}/store`, options);
  }

  /** Send a C-FIND query to a remote modality */
  queryModality(modality: string, query: QueryOptions): Promise<{ ID: string; Path: string }> {
    return this.post<{ ID: string; Path: string }>(
      `/modalities/${modality}/query`,
      query
    );
  }

  /** Send C-ECHO to a modality */
  echoModality(modality: string): Promise<void> {
    return this.post<void>(`/modalities/${modality}/echo`);
  }

  // ---------------------------------------------------------------------------
  // Peers (Orthanc-to-Orthanc)
  // ---------------------------------------------------------------------------

  /** List configured Orthanc peers */
  listPeers(): Promise<string[]> {
    return this.get<string[]>("/peers");
  }

  /** Push resources to a peer */
  storeToPeer(peer: string, options: StoreOptions): Promise<JobInfo> {
    return this.post<JobInfo>(`/peers/${peer}/store`, options);
  }
}

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class OrthancError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly body: string,
    public readonly url: string
  ) {
    super(`OrthancError ${statusCode} at ${url}: ${body}`);
    this.name = "OrthancError";
  }
}
