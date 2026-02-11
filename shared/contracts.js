import { z } from 'zod';
export const CURRENT_API_VERSION = 'v1';
export const API_VERSION_HEADER = 'x-api-version';
export class ContractViolationError extends Error {
    constructor(contractName, message) {
        super(message);
        this.name = 'ContractViolationError';
        this.contractName = contractName;
    }
}
export const apiEnvelopeSchema = (dataSchema) => z.object({
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
export const parseContract = (contractName, schema, value) => {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
        throw new ContractViolationError(contractName, 'Contract validation failed');
    }
    return parsed.data;
};
export const isApiEnvelopeLike = (value) => {
    if (typeof value !== 'object' || value === null)
        return false;
    return 'success' in value && 'data' in value;
};
//# sourceMappingURL=contracts.js.map