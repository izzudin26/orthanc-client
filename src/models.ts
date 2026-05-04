import "reflect-metadata";
import { Expose, Transform, Type } from "class-transformer";

export class DicomTag {
  @Expose() Name!: string;
  @Expose() Type!: string;
  @Expose() Value!: unknown;
}

export class OrthancPatient {
  @Expose() ID!: string;
  @Expose() IsStable!: boolean;
  @Expose() LastUpdate!: string;
  @Expose() MainDicomTags!: Record<string, string>;
  @Expose() Studies!: string[];
  @Expose() Type!: "Patient";
  @Expose() AnonymizedFrom?: string;
  @Expose() Labels?: string[];
  @Expose() Metadata?: Record<string, string>;
}

export class OrthancStudy {
  @Expose() ID!: string;
  @Expose() IsStable!: boolean;
  @Expose() LastUpdate!: string;
  @Expose() MainDicomTags!: Record<string, string>;
  @Expose() PatientMainDicomTags!: Record<string, string>;
  @Expose() ParentPatient!: string;
  @Expose() Series!: string[];
  @Expose() Type!: "Study";
  @Expose() AnonymizedFrom?: string;
  @Expose() Labels?: string[];
  @Expose() Metadata?: Record<string, string>;
}

export class OrthancSeries {
  @Expose() ID!: string;
  @Expose() IsStable!: boolean;
  @Expose() LastUpdate!: string;
  @Expose() MainDicomTags!: Record<string, string>;
  @Expose() ParentStudy!: string;
  @Expose() Instances!: string[];
  @Expose() Type!: "Series";
  @Expose() ExpectedNumberOfInstances?: number;
  @Expose() Status!: string;
  @Expose() AnonymizedFrom?: string;
  @Expose() Labels?: string[];
  @Expose() Metadata?: Record<string, string>;
}

export class OrthancInstance {
  @Expose() ID!: string;
  @Expose() FileSize!: number;
  @Expose() FileUuid!: string;
  @Expose() IndexInSeries!: number;
  @Expose() MainDicomTags!: Record<string, string>;
  @Expose() ParentSeries!: string;
  @Expose() Type!: "Instance";
  @Expose() AnonymizedFrom?: string;
  @Expose() Labels?: string[];
  @Expose() Metadata?: Record<string, string>;
}

export class OrthancJob {
  @Expose() Content!: Record<string, unknown>;
  @Expose() CreationTime!: string;
  @Expose() CompletionTime!: string;
  @Expose() ErrorCode!: number;
  @Expose() ErrorDescription!: string;
  @Expose() EffectiveRuntime!: number;
  @Expose() ID!: string;
  @Expose() Priority!: number;
  @Expose() Progress!: number;
  @Expose() State!: "Pending" | "Running" | "Success" | "Failure" | "Paused" | "Retry";
  @Expose() Timestamp!: string;
  @Expose() Type!: string;
}
