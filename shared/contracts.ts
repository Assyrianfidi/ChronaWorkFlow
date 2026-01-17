export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type ApiErrorEnvelope = {
  success: false;
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
};
