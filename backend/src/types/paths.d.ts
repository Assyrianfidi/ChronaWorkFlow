// This file helps TypeScript understand our path aliases
declare module "@/db" {
  export * from "../../../src/db.js";
}

declare module "@/db/schema" {
  export * from "../../../src/db/schema.js";
}

declare module "@/common/repositories/base.repository" {
  export * from "../../../src/common/repositories/base.repository.js";
}

declare module "./user.interface" {
  export * from "../../../src/modules/user/user.interface.js";
}

// Add other module declarations as needed
