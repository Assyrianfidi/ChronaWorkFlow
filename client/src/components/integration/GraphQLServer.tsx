import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUserExperienceMode } from "@/components/adaptive/UserExperienceMode";
import { usePerformance } from "@/components/adaptive/UI-Performance-Engine";
import { useAuthStore } from "@/../../store/auth-store";

// GraphQL Types
interface GraphQLSchema {
  types: GraphQLType[];
  queries: GraphQLField[];
  mutations: GraphQLField[];
  subscriptions: GraphQLField[];
  directives: GraphQLDirective[];
}

interface GraphQLType {
  name: string;
  kind:
    | "SCALAR"
    | "OBJECT"
    | "INTERFACE"
    | "UNION"
    | "ENUM"
    | "INPUT_OBJECT"
    | "LIST"
    | "NON_NULL";
  description?: string;
  fields?: GraphQLField[];
  interfaces?: string[];
  enumValues?: GraphQLEnumValue[];
  inputFields?: GraphQLInputValue[];
  ofType?: GraphQLType;
}

interface GraphQLField {
  name: string;
  description?: string;
  type: GraphQLType;
  args: GraphQLInputValue[];
  isDeprecated: boolean;
  deprecationReason?: string;
  resolver?: (parent: any, args: any, context: any, info: any) => any;
}

interface GraphQLInputValue {
  name: string;
  description?: string;
  type: GraphQLType;
  defaultValue?: string;
}

interface GraphQLEnumValue {
  name: string;
  description?: string;
  isDeprecated: boolean;
  deprecationReason?: string;
}

interface GraphQLDirective {
  name: string;
  description?: string;
  locations: string[];
  args: GraphQLInputValue[];
  isRepeatable: boolean;
}

interface GraphQLQuery {
  id: string;
  name: string;
  query: string;
  variables?: Record<string, any>;
  operation: "query" | "mutation" | "subscription";
  description?: string;
  tags: string[];
  createdAt: number;
  lastExecuted?: number;
  executionCount: number;
  averageDuration: number;
  successRate: number;
}

interface GraphQLExecution {
  id: string;
  queryId: string;
  operation: string;
  query: string;
  variables: Record<string, any>;
  result: any;
  errors?: GraphQLError[];
  extensions?: Record<string, any>;
  duration: number;
  timestamp: number;
  metadata: {
    userAgent: string;
    ip: string;
    userId?: string;
    complexity?: number;
    depth?: number;
  };
}

interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, any>;
}

interface GraphQLSubscription {
  id: string;
  query: string;
  variables?: Record<string, any>;
  clients: Set<string>;
  createdAt: number;
  lastActivity: number;
}

// GraphQL Context
interface GraphQLContextType {
  // Schema Management
  schema: GraphQLSchema | null;
  loadSchema: () => Promise<void>;
  addType: (type: GraphQLType) => Promise<void>;
  addField: (typeName: string, field: GraphQLField) => Promise<void>;

  // Query Management
  queries: GraphQLQuery[];
  saveQuery: (
    query: Omit<
      GraphQLQuery,
      "id" | "createdAt" | "executionCount" | "averageDuration" | "successRate"
    >,
  ) => Promise<GraphQLQuery>;
  executeQuery: (
    queryId: string,
    variables?: Record<string, any>,
  ) => Promise<GraphQLExecution>;

  // Execution History
  executions: GraphQLExecution[];
  getExecutions: (filters?: {
    queryId?: string;
    operation?: string;
    dateRange?: { start: number; end: number };
  }) => GraphQLExecution[];

  // Subscriptions
  subscriptions: Map<string, GraphQLSubscription>;
  subscribe: (
    query: string,
    variables?: Record<string, any>,
    clientId: string,
  ) => Promise<string>;
  unsubscribe: (subscriptionId: string, clientId: string) => Promise<void>;

  // Analytics
  getAnalytics: () => {
    totalQueries: number;
    averageDuration: number;
    successRate: number;
    topQueries: Array<{ query: string; executions: number }>;
    errorAnalysis: Array<{ error: string; count: number }>;
  };
}

const GraphQLContext = React.createContext<GraphQLContextType | null>(null);

// GraphQL Engine
class GraphQLEngine {
  private schema: GraphQLSchema | null = null;
  private resolvers: Map<
    string,
    (parent: any, args: any, context: any, info: any) => any
  > = new Map();
  private subscriptions: Map<string, GraphQLSubscription> = new Map();
  private middleware: Map<string, (req: any, res: any, next: any) => void> =
    new Map();
  private queries: Map<string, GraphQLQuery> = new Map();
  private executions: GraphQLExecution[] = [];
  private complexityAnalyzer: ComplexityAnalyzer;
  private queryValidator: QueryValidator;
  private subscriptionManager: SubscriptionManager;

  constructor() {
    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.queryValidator = new QueryValidator();
    this.subscriptionManager = new SubscriptionManager();
    this.initializeDefaultSchema();
    this.initializeMiddleware();
  }

  private initializeDefaultSchema(): void {
    const defaultSchema: GraphQLSchema = {
      types: [
        // Scalars
        {
          name: "String",
          kind: "SCALAR",
          description: "The `String` scalar type represents textual data",
        },
        {
          name: "Int",
          kind: "SCALAR",
          description:
            "The `Int` scalar type represents non-fractional signed whole numeric values",
        },
        {
          name: "Float",
          kind: "SCALAR",
          description:
            "The `Float` scalar type represents signed double-precision fractional values",
        },
        {
          name: "Boolean",
          kind: "SCALAR",
          description: "The `Boolean` scalar type represents `true` or `false`",
        },
        {
          name: "ID",
          kind: "SCALAR",
          description: "The `ID` scalar type represents a unique identifier",
        },
        // User type
        {
          name: "User",
          kind: "OBJECT",
          description: "A user account",
          fields: [
            {
              name: "id",
              type: {
                name: "ID",
                kind: "NON_NULL",
                ofType: { name: "ID", kind: "SCALAR" },
              },
              args: [],
              isDeprecated: false,
            },
            {
              name: "name",
              type: { name: "String", kind: "SCALAR" },
              args: [],
              isDeprecated: false,
            },
            {
              name: "email",
              type: { name: "String", kind: "SCALAR" },
              args: [],
              isDeprecated: false,
            },
            {
              name: "createdAt",
              type: { name: "String", kind: "SCALAR" },
              args: [],
              isDeprecated: false,
            },
          ],
        },
        // Query type
        {
          name: "Query",
          kind: "OBJECT",
          description: "The root query type",
          fields: [
            {
              name: "user",
              description: "Get a user by ID",
              type: { name: "User", kind: "OBJECT" },
              args: [
                {
                  name: "id",
                  description: "The user ID",
                  type: {
                    name: "ID",
                    kind: "NON_NULL",
                    ofType: { name: "ID", kind: "SCALAR" },
                  },
                },
              ],
              isDeprecated: false,
              resolver: this.resolveUser.bind(this),
            },
            {
              name: "users",
              description: "Get a list of users",
              type: {
                name: "List",
                kind: "LIST",
                ofType: { name: "User", kind: "OBJECT" },
              },
              args: [
                {
                  name: "limit",
                  description: "Maximum number of users to return",
                  type: { name: "Int", kind: "SCALAR" },
                },
                {
                  name: "offset",
                  description: "Number of users to skip",
                  type: { name: "Int", kind: "SCALAR" },
                },
              ],
              isDeprecated: false,
              resolver: this.resolveUsers.bind(this),
            },
          ],
        },
        // Mutation type
        {
          name: "Mutation",
          kind: "OBJECT",
          description: "The root mutation type",
          fields: [
            {
              name: "createUser",
              description: "Create a new user",
              type: { name: "User", kind: "OBJECT" },
              args: [
                {
                  name: "input",
                  description: "User input data",
                  type: { name: "CreateUserInput", kind: "INPUT_OBJECT" },
                },
              ],
              isDeprecated: false,
              resolver: this.resolveCreateUser.bind(this),
            },
            {
              name: "updateUser",
              description: "Update an existing user",
              type: { name: "User", kind: "OBJECT" },
              args: [
                {
                  name: "id",
                  description: "The user ID",
                  type: {
                    name: "ID",
                    kind: "NON_NULL",
                    ofType: { name: "ID", kind: "SCALAR" },
                  },
                },
                {
                  name: "input",
                  description: "User update data",
                  type: { name: "UpdateUserInput", kind: "INPUT_OBJECT" },
                },
              ],
              isDeprecated: false,
              resolver: this.resolveUpdateUser.bind(this),
            },
          ],
        },
        // Subscription type
        {
          name: "Subscription",
          kind: "OBJECT",
          description: "The root subscription type",
          fields: [
            {
              name: "userUpdated",
              description: "Subscribe to user updates",
              type: { name: "User", kind: "OBJECT" },
              args: [
                {
                  name: "id",
                  description: "The user ID to watch",
                  type: {
                    name: "ID",
                    kind: "NON_NULL",
                    ofType: { name: "ID", kind: "SCALAR" },
                  },
                },
              ],
              isDeprecated: false,
              resolver: this.resolveUserUpdated.bind(this),
            },
          ],
        },
        // Input types
        {
          name: "CreateUserInput",
          kind: "INPUT_OBJECT",
          description: "Input for creating a user",
          inputFields: [
            {
              name: "name",
              description: "User name",
              type: {
                name: "String",
                kind: "NON_NULL",
                ofType: { name: "String", kind: "SCALAR" },
              },
            },
            {
              name: "email",
              description: "User email",
              type: {
                name: "String",
                kind: "NON_NULL",
                ofType: { name: "String", kind: "SCALAR" },
              },
            },
          ],
        },
        {
          name: "UpdateUserInput",
          kind: "INPUT_OBJECT",
          description: "Input for updating a user",
          inputFields: [
            {
              name: "name",
              description: "User name",
              type: { name: "String", kind: "SCALAR" },
            },
            {
              name: "email",
              description: "User email",
              type: { name: "String", kind: "SCALAR" },
            },
          ],
        },
      ],
      queries: [],
      mutations: [],
      subscriptions: [],
      directives: [
        {
          name: "deprecated",
          description:
            "Marks an element of a GraphQL schema as no longer supported",
          locations: ["FIELD_DEFINITION", "ENUM_VALUE"],
          args: [
            {
              name: "reason",
              description: "Reason for deprecation",
              type: { name: "String", kind: "SCALAR" },
            },
          ],
          isRepeatable: false,
        },
      ],
    };

    // Extract queries, mutations, and subscriptions
    const queryType = defaultSchema.types.find((t) => t.name === "Query");
    const mutationType = defaultSchema.types.find((t) => t.name === "Mutation");
    const subscriptionType = defaultSchema.types.find(
      (t) => t.name === "Subscription",
    );

    defaultSchema.queries = queryType?.fields || [];
    defaultSchema.mutations = mutationType?.fields || [];
    defaultSchema.subscriptions = subscriptionType?.fields || [];

    this.schema = defaultSchema;
  }

  private initializeMiddleware(): void {
    // Authentication middleware
    this.middleware.set("auth", async (context: any, info: any) => {
      // Simulate authentication check
      return context.user ? true : false;
    });

    // Rate limiting middleware
    this.middleware.set("rateLimit", async (context: any, info: any) => {
      // Simulate rate limiting
      return true;
    });

    // Logging middleware
    this.middleware.set("logging", async (context: any, info: any) => {
      console.log(`GraphQL Query: ${info.operationName}`, {
        timestamp: Date.now(),
        userId: context.user?.id,
      });
      return true;
    });

    // Complexity analysis middleware
    this.middleware.set("complexity", async (context: any, info: any) => {
      const complexity = this.complexityAnalyzer.analyze(info.query);
      if (complexity > 1000) {
        throw new Error("Query too complex");
      }
      return true;
    });
  }

  async executeQuery(
    query: string,
    variables: Record<string, any> = {},
    context: any = {},
  ): Promise<GraphQLExecution> {
    const startTime = Date.now();
    const executionId = Math.random().toString(36);

    try {
      // Parse and validate query
      const parsedQuery = this.parseQuery(query);
      const operation = this.extractOperation(parsedQuery);

      // Apply middleware
      await this.applyMiddleware(context, { query, operation });

      // Validate query
      await this.queryValidator.validate(parsedQuery, this.schema!);

      // Analyze complexity
      const complexity = this.complexityAnalyzer.analyze(query);

      // Execute query
      const result = await this.executeQueryOperation(
        parsedQuery,
        variables,
        context,
      );

      const execution: GraphQLExecution = {
        id: executionId,
        queryId: "adhoc",
        operation: operation,
        query,
        variables,
        result,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
        metadata: {
          userAgent: context.userAgent || "unknown",
          ip: context.ip || "unknown",
          userId: context.user?.id,
          complexity,
          depth: this.calculateQueryDepth(query),
        },
      };

      this.executions.push(execution);
      return execution;
    } catch (error) {
      const execution: GraphQLExecution = {
        id: executionId,
        queryId: "adhoc",
        operation: "unknown",
        query,
        variables,
        result: { data: null },
        errors: [
          {
            message: error instanceof Error ? error.message : "Unknown error",
            locations: [],
          },
        ],
        duration: Date.now() - startTime,
        timestamp: Date.now(),
        metadata: {
          userAgent: context.userAgent || "unknown",
          ip: context.ip || "unknown",
        },
      };

      this.executions.push(execution);
      return execution;
    }
  }

  private parseQuery(query: string): any {
    // Simplified GraphQL parsing - in production use proper GraphQL parser
    const operationMatch = query.match(
      /(query|mutation|subscription)\s+(\w+)?/,
    );
    return {
      operation: operationMatch?.[1] || "query",
      name: operationMatch?.[2] || "anonymous",
      raw: query,
    };
  }

  private extractOperation(parsedQuery: any): string {
    return parsedQuery.operation;
  }

  private async applyMiddleware(context: any, info: any): Promise<void> {
    const middlewareOrder = ["auth", "rateLimit", "logging", "complexity"];

    for (const middlewareName of middlewareOrder) {
      const middleware = this.middleware.get(middlewareName);
      if (middleware) {
        await middleware(context, info);
      }
    }
  }

  private async executeQueryOperation(
    parsedQuery: any,
    variables: Record<string, any>,
    context: any,
  ): Promise<any> {
    // Simplified execution - in production use proper GraphQL execution engine
    const operation = parsedQuery.operation;

    switch (operation) {
      case "query":
        return await this.executeQueries(parsedQuery, variables, context);
      case "mutation":
        return await this.executeMutations(parsedQuery, variables, context);
      case "subscription":
        return await this.executeSubscriptions(parsedQuery, variables, context);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  private async executeQueries(
    parsedQuery: any,
    variables: Record<string, any>,
    context: any,
  ): Promise<any> {
    // Extract field selections from query
    const fieldMatches = parsedQuery.raw.match(/\{(\w+)(\([^)]*\))?\s*{/g);
    if (!fieldMatches) {
      return { data: {} };
    }

    const data: any = {};

    for (const fieldMatch of fieldMatches) {
      const fieldName = fieldMatch.match(/\{(\w+)/)?.[1];
      if (!fieldName) continue;

      const field = this.schema?.queries.find((f) => f.name === fieldName);
      if (!field?.resolver) continue;

      try {
        const result = await field.resolver(variables, context);
        data[fieldName] = result;
      } catch (error) {
        data[fieldName] = null;
      }
    }

    return { data };
  }

  private async executeMutations(
    parsedQuery: any,
    variables: Record<string, any>,
    context: any,
  ): Promise<any> {
    // Similar to queries but for mutations
    const fieldMatches = parsedQuery.raw.match(/\{(\w+)(\([^)]*\))?\s*{/g);
    if (!fieldMatches) {
      return { data: {} };
    }

    const data: any = {};

    for (const fieldMatch of fieldMatches) {
      const fieldName = fieldMatch.match(/\{(\w+)/)?.[1];
      if (!fieldName) continue;

      const field = this.schema?.mutations.find((f) => f.name === fieldName);
      if (!field?.resolver) continue;

      try {
        const result = await field.resolver(variables, context);
        data[fieldName] = result;
      } catch (error) {
        data[fieldName] = null;
      }
    }

    return { data };
  }

  private async executeSubscriptions(
    parsedQuery: any,
    variables: Record<string, any>,
    context: any,
  ): Promise<any> {
    // Handle subscriptions
    return { data: { subscription: "created" } };
  }

  private calculateQueryDepth(query: string): number {
    // Simple depth calculation
    const openBraces = (query.match(/\{/g) || []).length;
    const closeBraces = (query.match(/\}/g) || []).length;
    return Math.max(openBraces - closeBraces, 1);
  }

  // Resolvers
  private async resolveUser(args: any, context: any): Promise<any> {
    // Mock user resolver
    return {
      id: args.id,
      name: "John Doe",
      email: "john.doe@example.com",
      createdAt: new Date().toISOString(),
    };
  }

  private async resolveUsers(args: any, context: any): Promise<any[]> {
    // Mock users resolver
    const limit = args.limit || 10;
    const offset = args.offset || 0;

    const users = [];
    for (let i = offset; i < offset + limit; i++) {
      users.push({
        id: `user-${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        createdAt: new Date().toISOString(),
      });
    }

    return users;
  }

  private async resolveCreateUser(args: any, context: any): Promise<any> {
    // Mock create user resolver
    return {
      id: Math.random().toString(36),
      name: args.input.name,
      email: args.input.email,
      createdAt: new Date().toISOString(),
    };
  }

  private async resolveUpdateUser(args: any, context: any): Promise<any> {
    // Mock update user resolver
    return {
      id: args.id,
      name: args.input.name || "Updated Name",
      email: args.input.email || "updated@example.com",
      createdAt: new Date().toISOString(),
    };
  }

  private async resolveUserUpdated(args: any, context: any): Promise<any> {
    // Mock subscription resolver
    return {
      id: args.id,
      name: "Updated User",
      email: "updated@example.com",
      createdAt: new Date().toISOString(),
    };
  }

  // Subscription management
  async subscribe(
    query: string,
    variables: Record<string, any>,
    clientId: string,
  ): Promise<string> {
    return this.subscriptionManager.subscribe(query, variables, clientId);
  }

  async unsubscribe(subscriptionId: string, clientId: string): Promise<void> {
    this.subscriptionManager.unsubscribe(subscriptionId, clientId);
  }

  // Analytics
  getAnalytics() {
    const executions = this.executions;
    const totalQueries = executions.length;

    const durations = executions.map((exec) => exec.duration);
    const averageDuration =
      durations.length > 0
        ? durations.reduce((sum, duration) => sum + duration, 0) /
          durations.length
        : 0;

    const successfulExecutions = executions.filter(
      (exec) => !exec.errors || exec.errors.length === 0,
    );
    const successRate =
      totalQueries > 0 ? successfulExecutions.length / totalQueries : 0;

    // Top queries
    const queryCounts: Record<string, number> = {};
    executions.forEach((exec) => {
      queryCounts[exec.query] = (queryCounts[exec.query] || 0) + 1;
    });
    const topQueries = Object.entries(queryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([query, executions]) => ({ query, executions }));

    // Error analysis
    const errorCounts: Record<string, number> = {};
    executions.forEach((exec) => {
      if (exec.errors) {
        exec.errors.forEach((error) => {
          errorCounts[error.message] = (errorCounts[error.message] || 0) + 1;
        });
      }
    });
    const errorAnalysis = Object.entries(errorCounts).map(([error, count]) => ({
      error,
      count,
    }));

    return {
      totalQueries,
      averageDuration,
      successRate,
      topQueries,
      errorAnalysis,
    };
  }

  // Public getters
  getSchema(): GraphQLSchema | null {
    return this.schema;
  }

  getExecutions(): GraphQLExecution[] {
    return this.executions;
  }

  getSubscriptions(): Map<string, GraphQLSubscription> {
    return this.subscriptions;
  }
}

// Complexity Analyzer
class ComplexityAnalyzer {
  analyze(query: string): number {
    // Simple complexity analysis
    let complexity = 1;

    // Add complexity for each field
    const fieldMatches = query.match(/\w+\s*{/g);
    if (fieldMatches) {
      complexity += fieldMatches.length * 2;
    }

    // Add complexity for nested fields
    const nestedMatches = query.match(/\{[^{}]*\{/g);
    if (nestedMatches) {
      complexity += nestedMatches.length * 5;
    }

    // Add complexity for arguments
    const argMatches = query.match(/\([^)]*\)/g);
    if (argMatches) {
      complexity += argMatches.length * 1;
    }

    return complexity;
  }
}

// Query Validator
class QueryValidator {
  async validate(parsedQuery: any, schema: GraphQLSchema): Promise<boolean> {
    // Simplified validation - in production use proper GraphQL validation
    return true;
  }
}

// Subscription Manager
class SubscriptionManager {
  private subscriptions: Map<string, GraphQLSubscription> = new Map();

  async subscribe(
    query: string,
    variables: Record<string, any>,
    clientId: string,
  ): Promise<string> {
    const subscriptionId = Math.random().toString(36);

    const subscription: GraphQLSubscription = {
      id: subscriptionId,
      query,
      variables,
      clients: new Set([clientId]),
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscriptionId;
  }

  async unsubscribe(subscriptionId: string, clientId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.clients.delete(clientId);

      if (subscription.clients.size === 0) {
        this.subscriptions.delete(subscriptionId);
      }
    }
  }

  getSubscriptions(): Map<string, GraphQLSubscription> {
    return this.subscriptions;
  }
}

// Main GraphQL Server Component
export const GraphQLServer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentMode } = useUserExperienceMode();
  const { isLowPerformanceMode } = usePerformance();
  const { user } = useAuthStore();

  const [schema, setSchema] = useState<GraphQLSchema | null>(null);
  const [queries, setQueries] = useState<GraphQLQuery[]>([]);
  const [executions, setExecutions] = useState<GraphQLExecution[]>([]);
  const [subscriptions, setSubscriptions] = useState<
    Map<string, GraphQLSubscription>
  >(new Map());

  const engineRef = useRef<GraphQLEngine>();

  // Initialize engine
  useEffect(() => {
    engineRef.current = new GraphQLEngine();
    loadData();

    return () => {
      // Cleanup
    };
  }, []);

  const loadData = useCallback(() => {
    if (!engineRef.current) return;

    setSchema(engineRef.current.getSchema());
    setExecutions(engineRef.current.getExecutions());
    setSubscriptions(engineRef.current.getSubscriptions());
  }, []);

  const loadSchema = useCallback(async (): Promise<void> => {
    // Schema is loaded during initialization
    loadData();
  }, [loadData]);

  const addType = useCallback(
    async (type: GraphQLType): Promise<void> => {
      if (!engineRef.current || !schema) return;

      const updatedSchema = {
        ...schema,
        types: [...schema.types, type],
      };

      setSchema(updatedSchema);
    },
    [schema],
  );

  const addField = useCallback(
    async (typeName: string, field: GraphQLField): Promise<void> => {
      if (!engineRef.current || !schema) return;

      const updatedTypes = schema.types.map((type) => {
        if (type.name === typeName && type.fields) {
          return {
            ...type,
            fields: [...type.fields, field],
          };
        }
        return type;
      });

      const updatedSchema = {
        ...schema,
        types: updatedTypes,
      };

      setSchema(updatedSchema);
    },
    [schema],
  );

  const saveQuery = useCallback(
    async (
      queryData: Omit<
        GraphQLQuery,
        | "id"
        | "createdAt"
        | "executionCount"
        | "averageDuration"
        | "successRate"
      >,
    ): Promise<GraphQLQuery> => {
      const query: GraphQLQuery = {
        ...queryData,
        id: Math.random().toString(36),
        createdAt: Date.now(),
        executionCount: 0,
        averageDuration: 0,
        successRate: 1.0,
      };

      setQueries((prev) => [...prev, query]);
      return query;
    },
    [],
  );

  const executeQuery = useCallback(
    async (
      queryId: string,
      variables?: Record<string, any>,
    ): Promise<GraphQLExecution> => {
      if (!engineRef.current) {
        throw new Error("GraphQL Engine not initialized");
      }

      const query = queries.find((q) => q.id === queryId);
      if (!query) {
        throw new Error("Query not found");
      }

      const execution = await engineRef.current.executeQuery(
        query.query,
        variables,
        {
          user,
          userAgent: navigator.userAgent,
          ip: "127.0.0.1",
        },
      );

      setExecutions((prev) => [...prev, execution]);

      // Update query statistics
      setQueries((prev) =>
        prev.map((q) =>
          q.id === queryId
            ? {
                ...q,
                lastExecuted: Date.now(),
                executionCount: q.executionCount + 1,
                averageDuration:
                  (q.averageDuration * q.executionCount + execution.duration) /
                  (q.executionCount + 1),
                successRate:
                  (q.successRate * q.executionCount +
                    (execution.errors?.length ? 0 : 1)) /
                  (q.executionCount + 1),
              }
            : q,
        ),
      );

      return execution;
    },
    [queries, user],
  );

  const getExecutions = useCallback(
    (filters?: {
      queryId?: string;
      operation?: string;
      dateRange?: { start: number; end: number };
    }): GraphQLExecution[] => {
      let filteredExecutions = executions;

      if (filters?.queryId) {
        filteredExecutions = filteredExecutions.filter(
          (exec) => exec.queryId === filters.queryId,
        );
      }

      if (filters?.operation) {
        filteredExecutions = filteredExecutions.filter(
          (exec) => exec.operation === filters.operation,
        );
      }

      if (filters?.dateRange) {
        filteredExecutions = filteredExecutions.filter(
          (exec) =>
            exec.timestamp >= filters.dateRange!.start &&
            exec.timestamp <= filters.dateRange!.end,
        );
      }

      return filteredExecutions.sort((a, b) => b.timestamp - a.timestamp);
    },
    [executions],
  );

  const subscribe = useCallback(
    async (
      query: string,
      variables?: Record<string, any>,
      clientId?: string,
    ): Promise<string> => {
      if (!engineRef.current) {
        throw new Error("GraphQL Engine not initialized");
      }

      const subscriptionId = await engineRef.current.subscribe(
        query,
        variables,
        clientId || "default",
      );
      loadData();
      return subscriptionId;
    },
    [loadData],
  );

  const unsubscribe = useCallback(
    async (subscriptionId: string, clientId?: string): Promise<void> => {
      if (!engineRef.current) return;

      await engineRef.current.unsubscribe(
        subscriptionId,
        clientId || "default",
      );
      loadData();
    },
    [loadData],
  );

  const getAnalytics = useCallback(() => {
    if (!engineRef.current) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        successRate: 0,
        topQueries: [],
        errorAnalysis: [],
      };
    }

    return engineRef.current.getAnalytics();
  }, []);

  const contextValue: GraphQLContextType = {
    schema,
    loadSchema,
    addType,
    addField,
    queries,
    saveQuery,
    executeQuery,
    executions,
    getExecutions,
    subscriptions,
    subscribe,
    unsubscribe,
    getAnalytics,
  };

  return (
    <GraphQLContext.Provider value={contextValue}>
      {children}
    </GraphQLContext.Provider>
  );
};

// Hooks
export const useGraphQL = (): GraphQLContextType => {
  const context = React.useContext(GraphQLContext);
  if (!context) {
    throw new Error("useGraphQL must be used within GraphQLServer");
  }
  return context;
};

// Higher-Order Components
export const withGraphQL = <P extends object>(
  Component: React.ComponentType<P>,
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <GraphQLServer>
      <Component {...props} ref={ref} />
    </GraphQLServer>
  ));
};

// Utility Components
export { GraphQLContext };
export default GraphQLServer;
