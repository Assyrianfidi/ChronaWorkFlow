import express from "express";

export default function bodyLimitMiddleware(app) {
  // JSON body parser with 100kb limit
  app.use(
    express.json({
      limit: "100kb",
      strict: true,
    }),
  );

  // URL-encoded body parser with 100kb limit
  app.use(
    express.urlencoded({
      extended: true,
      limit: "100kb",
    }),
  );
}
