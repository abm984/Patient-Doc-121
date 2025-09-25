export interface DialogueTurn {
  speaker: string;
  dialogue: string;
}

export enum Status {
  Idle = 'IDLE',
  Active = 'ACTIVE',
  Ended = 'ENDED',
  Error = 'ERROR',
}

export interface AppState {
  status: Status;
  transcript: DialogueTurn[];
  error: string | null;
  isSummarizing: boolean;
  clinicalSummary: string | null;
}