export type VisitorType = 'trusted' | 'blocked';

export interface Visitor {
  id: string;
  name: string;
  relationship: string;
  lastInteraction: string;
  notes: string;
  photoBase64: string;
  type: VisitorType; // Distinguish between trusted family and blacklisted individuals
}

export interface DetectedPerson {
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 scale
  matchFound: boolean;
  visitorId?: string | null;
  name: string;
  relationship?: string;
  lastInteraction?: string;
  notes?: string;
  type?: VisitorType; // Carries over the visitor type
  confidenceIsLow?: boolean; // If lighting is bad or face is obscure
}

export interface RecognitionResult {
  people: DetectedPerson[];
}

export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  HUD = 'HUD'
}