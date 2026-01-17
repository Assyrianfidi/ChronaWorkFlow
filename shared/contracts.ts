import { z } from 'zod';

export type ApiVersion = 'v1';
export const CURRENT_API_VERSION: ApiVersion = 'v1';

export const API_VERSION_HEADER = 'x-api-version' as const;

export type AssertBackwardCompatible<Prev, Next> = Next extends Prev ? true : never;

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

export class ContractViolationError extends Error {
  public readonly contractName: string;

  constructor(contractName: string, message: string) {
    super(message);
    this.name = 'ContractViolationError';
    this.contractName = contractName;
  }
}

export const apiEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
  });

export const apiErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  status: z.number().optional(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

export const apiSuccessMessageSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

export const inventoryListResponseSchema = z.object({
  items: z.array(z.unknown()),
  pagination: z.object({
    total: z.number().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
    totalPages: z.number().optional(),
  }),
});

export type InventoryListResponse = z.infer<typeof inventoryListResponseSchema>;

export const parseContract = <T>(
  contractName: string,
  schema: z.ZodType<T>,
  value: unknown,
): T => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ContractViolationError(contractName, 'Contract validation failed');
  }
  return parsed.data;
};

export const isApiEnvelopeLike = (value: unknown): value is { success: unknown; data: unknown } => {
  if (typeof value !== 'object' || value === null) return false;
  return 'success' in value && 'data' in value;
};
