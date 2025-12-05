// This file helps TypeScript understand our path aliases
declare module '@/db' {
  export * from '../../../src/db';
}

declare module '@/db/schema' {
  export * from '../../../src/db/schema';
}

declare module '@/common/repositories/base.repository' {
  export * from '../../../src/common/repositories/base.repository';
}

declare module './user.interface' {
  export * from '../../../src/modules/user/user.interface';
}

// Add other module declarations as needed
