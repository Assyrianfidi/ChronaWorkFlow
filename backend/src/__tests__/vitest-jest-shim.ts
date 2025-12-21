export const describe = global.describe;
export const it = global.it;
export const test = global.test;
export const expect = global.expect;
export const beforeAll = global.beforeAll;
export const afterAll = global.afterAll;
export const beforeEach = global.beforeEach;
export const afterEach = global.afterEach;

type MockFactory = () => any;

const jestRef: typeof jest = (globalThis as any).jest ?? jest;

export const vi = {
  fn: jestRef.fn.bind(jestRef),
  spyOn: jestRef.spyOn.bind(jestRef),
  mock: (moduleName: string, factory?: MockFactory) => {
    if (factory) {
      jestRef.mock(moduleName, factory);
      return;
    }
    jestRef.mock(moduleName);
  },
  hoisted: <T>(factory: () => T): T => factory(),
  clearAllMocks: jestRef.clearAllMocks.bind(jestRef),
  resetAllMocks: jestRef.resetAllMocks.bind(jestRef),
  restoreAllMocks: jestRef.restoreAllMocks.bind(jestRef),
};
