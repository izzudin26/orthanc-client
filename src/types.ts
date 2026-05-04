export interface OrthancClientConfig {
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

export type ResourceLevel = "Patient" | "Study" | "Series" | "Instance";

export interface FindQuery {
  Level: ResourceLevel;
  Query: Record<string, string>;
  Limit?: number;
  Since?: number;
  Expand?: boolean;
  CaseSensitive?: boolean;
  Full?: boolean;
}

export interface ChangeItem {
  ChangeType: string;
  Date: string;
  ID: string;
  Path: string;
  ResourceType: string;
  Seq: number;
}

export interface ChangesResponse {
  Changes: ChangeItem[];
  Done: boolean;
  Last: number;
}

export interface SystemInfo {
  ApiVersion: number;
  DatabaseBackendPlugin: string | null;
  DatabaseVersion: number;
  DicomAet: string;
  DicomPort: number;
  HttpPort: number;
  IsHttpServerSecure: boolean;
  Name: string;
  OrthancApiVersion: string;
  PluginsEnabled: boolean;
  StorageAreaPlugin: string | null;
  Version: string;
}

export interface Statistics {
  CountInstances: number;
  CountPatients: number;
  CountSeries: number;
  CountStudies: number;
  TotalDiskSize: string;
  TotalDiskSizeInt: number;
  TotalUncompressedSize: string;
  TotalUncompressedSizeInt: number;
}

export interface JobInfo {
  Content: Record<string, unknown>;
  CreationTime: string;
  CompletionTime: string;
  ErrorCode: number;
  ErrorDescription: string;
  EffectiveRuntime: number;
  ID: string;
  Priority: number;
  Progress: number;
  State: "Pending" | "Running" | "Success" | "Failure" | "Paused" | "Retry";
  Timestamp: string;
  Type: string;
}

export interface AnonymizeOptions {
  Keep?: string[];
  KeepPrivateTags?: boolean;
  Replace?: Record<string, string>;
  Force?: boolean;
  DicomVersion?: string;
}

export interface ModifyOptions {
  Keep?: string[];
  Remove?: string[];
  Replace?: Record<string, string>;
  Force?: boolean;
  KeepSource?: boolean;
  Transcode?: string;
}

export interface StoreOptions {
  Resources: string[];
  Synchronous?: boolean;
  Priority?: number;
}

export interface QueryOptions {
  Level: ResourceLevel;
  Query: Record<string, string>;
}

export interface UploadResult {
  ID: string;
  ParentPatient: string;
  ParentSeries: string;
  ParentStudy: string;
  Path: string;
  Status: "Success" | "AlreadyStored";
}
