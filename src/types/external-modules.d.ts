declare module 'winston' {
  const winston: any;
  export = winston;
}

declare module 'winston-daily-rotate-file' {
  const dailyRotateFile: any;
  export = dailyRotateFile;
}

declare module '@sentry/node' {
  const sentry: any;
  export = sentry;
}

declare module '@sentry/types' {
  export type Context = any;
  export type Span = any;
}

declare module 'node-cron' {
  const cron: any;
  export = cron;
}
