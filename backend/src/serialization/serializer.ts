/**
 * Serializer Implementation
 * Data serialization and transformation
 */

export interface SerializationOptions {
  exclude?: string[];
  include?: string[];
  transform?: (data: any) => any;
  depth?: number;
}

export class Serializer {
  /**
   * Serialize data based on type and options
   */
  serialize(type: string, data: any, options: SerializationOptions = {}): any {
    if (!data) return data;

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.serialize(type, item, options));
    }

    // Handle objects
    if (typeof data === "object" && data !== null) {
      return this.serializeObject(data, options);
    }

    // Handle primitives
    return this.serializePrimitive(data);
  }

  /**
   * Serialize an object
   */
  private serializeObject(obj: any, options: SerializationOptions): any {
    const serialized: any = {};
    const { exclude = [], include, transform, depth = 0 } = options;

    // Prevent infinite recursion
    if (depth > 10) {
      return "[Circular]";
    }

    for (const [key, value] of Object.entries(obj)) {
      // Skip excluded fields
      if (exclude.includes(key)) {
        continue;
      }

      // Only include specified fields if include is provided
      if (include && !include.includes(key)) {
        continue;
      }

      // Skip private fields
      if (key.startsWith("_")) {
        continue;
      }

      // Serialize the value
      serialized[key] = this.serializeValue(value, {
        ...options,
        depth: depth + 1,
      });
    }

    // Apply transformation
    if (transform) {
      return transform(serialized);
    }

    return serialized;
  }

  /**
   * Serialize a value
   */
  private serializeValue(value: any, options: SerializationOptions): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.serializeValue(item, options));
    }

    if (typeof value === "object") {
      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }

      // Handle Buffer objects
      if (Buffer.isBuffer(value)) {
        return value.toString("base64");
      }

      // Handle objects with toJSON method
      if (typeof value.toJSON === "function") {
        return value.toJSON();
      }

      // Recursively serialize objects
      return this.serializeObject(value, options);
    }

    return value;
  }

  /**
   * Serialize primitive values
   */
  private serializePrimitive(value: any): any {
    // Handle BigInt
    if (typeof value === "bigint") {
      return value.toString();
    }

    // Handle functions (skip)
    if (typeof value === "function") {
      return undefined;
    }

    return value;
  }

  /**
   * Deserialize data
   */
  deserialize(type: string, data: any): any {
    if (!data) return data;

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.deserialize(type, item));
    }

    // Handle objects
    if (typeof data === "object" && data !== null) {
      return this.deserializeObject(data);
    }

    return data;
  }

  /**
   * Deserialize an object
   */
  private deserializeObject(obj: any): any {
    const deserialized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      deserialized[key] = this.deserializeValue(value);
    }

    return deserialized;
  }

  /**
   * Deserialize a value
   */
  private deserializeValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.deserializeValue(item));
    }

    if (typeof value === "object") {
      // Handle date strings
      if (typeof value === "string") {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      return this.deserializeObject(value);
    }

    return value;
  }

  /**
   * Create a serializer for specific type
   */
  forType(type: string) {
    return (data: any, options?: SerializationOptions) => {
      return this.serialize(type, data, options);
    };
  }

  /**
   * Sanitize data for output (remove sensitive fields)
   */
  sanitize(
    data: any,
    sensitiveFields: string[] = ["password", "token", "secret", "key"],
  ): any {
    return this.serialize("default", data, {
      exclude: sensitiveFields,
    });
  }

  /**
   * Convert to JSON string with error handling
   */
  toJSON(data: any, space?: number): string {
    try {
      return JSON.stringify(data, null, space);
    } catch (error) {
      // Handle circular references
      const seen = new WeakSet();
      const jsonString = JSON.stringify(
        data,
        (key, val) => {
          if (val != null && typeof val === "object") {
            if (seen.has(val)) {
              return "[Circular]";
            }
            seen.add(val);
          }
          return val;
        },
        space,
      );

      return jsonString;
    }
  }

  /**
   * Parse JSON string with error handling
   */
  fromJSON(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error(
        `Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export default Serializer;
