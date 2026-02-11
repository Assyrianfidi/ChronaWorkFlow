import { z } from 'zod';
export type ApiVersion = 'v1';
export declare const CURRENT_API_VERSION: ApiVersion;
export declare const API_VERSION_HEADER: "x-api-version";
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
export declare class ContractViolationError extends Error {
    readonly contractName: string;
    constructor(contractName: string, message: string);
}
export declare const apiEnvelopeSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    data: T;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: T;
    message: z.ZodOptional<z.ZodString>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: T;
    message: z.ZodOptional<z.ZodString>;
}>, any>[k]; } : never, z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: T;
    message: z.ZodOptional<z.ZodString>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: T;
    message: z.ZodOptional<z.ZodString>;
}>[k_1]; } : never>;
export declare const apiErrorEnvelopeSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    message: z.ZodString;
    status: z.ZodOptional<z.ZodNumber>;
    code: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: false;
    status?: number | undefined;
    code?: string | undefined;
    details?: unknown;
}, {
    message: string;
    success: false;
    status?: number | undefined;
    code?: string | undefined;
    details?: unknown;
}>;
export declare const apiSuccessMessageSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: true;
}, {
    message: string;
    success: true;
}>;
export declare const inventoryListResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodUnknown, "many">;
    pagination: z.ZodObject<{
        total: z.ZodOptional<z.ZodNumber>;
        page: z.ZodOptional<z.ZodNumber>;
        limit: z.ZodOptional<z.ZodNumber>;
        totalPages: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        total?: number | undefined;
        limit?: number | undefined;
        page?: number | undefined;
        totalPages?: number | undefined;
    }, {
        total?: number | undefined;
        limit?: number | undefined;
        page?: number | undefined;
        totalPages?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    items: unknown[];
    pagination: {
        total?: number | undefined;
        limit?: number | undefined;
        page?: number | undefined;
        totalPages?: number | undefined;
    };
}, {
    items: unknown[];
    pagination: {
        total?: number | undefined;
        limit?: number | undefined;
        page?: number | undefined;
        totalPages?: number | undefined;
    };
}>;
export type InventoryListResponse = z.infer<typeof inventoryListResponseSchema>;
export declare const parseContract: <T>(contractName: string, schema: z.ZodType<T, z.ZodTypeDef, T>, value: unknown) => T;
export declare const isApiEnvelopeLike: (value: unknown) => value is {
    success: unknown;
    data: unknown;
};
//# sourceMappingURL=contracts.d.ts.map