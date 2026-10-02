# Code Review — portfolio refresh

Review of the original technical-test API (Feb/2024, commit `60c8895`) and what changed to bring it up to current best practices.

Severity: 🔴 bug / security · 🟠 maintainability / architecture · 🟡 style / DX

## Security

| #   | Severity | Finding                                                                                                                                              | Fix                                                                                                                                                                                                         |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | 🔴       | **MongoDB Atlas credentials and the JWT secret were committed** (`src/enums/config.enum.ts`, `.env.example`) and `.env` was not git-ignored.         | Files removed, `.env*` ignored, config read from validated env vars (`src/config/env.ts`, fail-fast, `JWT_SECRET` ≥ 32 chars). **The leaked credentials must be rotated** — they remain in the git history. |
| S2  | 🔴       | `comparePassword` logged the **plain-text password and its hash** on every login (`console.log(this.password, password)`).                           | Removed. Structured logging with `pino`, with `password`, `token`, `authorization` and `cookie` redacted.                                                                                                   |
| S3  | 🔴       | `GET /api/users` was public: anyone could list every user's e-mail and birth date.                                                                   | Requires a valid JWT. The frontend calls it through a server-side BFF so the token never reaches browser JavaScript.                                                                                        |
| S4  | 🔴       | User enumeration: `404 User not found` vs `400 Invalid password`; and the user lookup ran before input validation.                                   | Single `401 INVALID_CREDENTIALS`; bcrypt always runs (against a dummy hash for unknown e-mails) so response timing does not leak either.                                                                    |
| S5  | 🔴       | No brute-force protection on login.                                                                                                                  | `express-rate-limit`: 10 attempts / 15 min per IP (`429 TOO_MANY_REQUESTS`).                                                                                                                                |
| S6  | 🔴       | JWT verified without pinning the algorithm; 30-day tokens.                                                                                           | `HS256` pinned on sign and verify (rejects `alg: none`/confusion), `sub` claim, configurable lifetime (default `1d`).                                                                                       |
| S7  | 🟠       | Mass assignment: `req.body` passed straight to Mongoose; no input validation beyond the schema.                                                      | Zod schemas validate and **strip unknown fields** for every body/param (`validate` middleware).                                                                                                             |
| S8  | 🟠       | `cors()` allowed every origin; no security headers; unlimited body size; `X-Powered-By` exposed; errors returned raw Mongoose objects to the client. | CORS allow-list from env, `helmet`, `express.json({ limit: "10kb" })`, `x-powered-by` disabled, centralized error handler returning `{ code, message }` only.                                               |
| S9  | 🟡       | Docker image would run as root (no Dockerfile at all).                                                                                               | Multi-stage Dockerfile, production deps only, non-root `node` user, healthcheck.                                                                                                                            |

## Bugs

| #   | Severity | Finding                                                                                                                                                                                  | Fix                                                                                                                                  |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| B1  | 🔴       | `pre("save")` hook: `if (!this.isModified("password")) next();` had no `return`, so the hash was **re-hashed on every save** — after `PUT /users/:id` the user could never log in again. | Hashing moved to the service layer on create; updates use `findByIdAndUpdate` with whitelisted fields. Covered by a regression test. |
| B2  | 🔴       | `protect` middleware never responded when the `Authorization` header was missing or not `Bearer` — **the request hung forever**.                                                         | `authenticate` always throws `401` (handled by the error middleware).                                                                |
| B3  | 🔴       | Async controllers without error handling (`await User.findOne` outside `try`) → unhandled rejections / hanging requests on Express 4.                                                    | Express 5 forwards async errors natively to the centralized `errorHandler`.                                                          |
| B4  | 🟠       | `IUser` typed `firstName`/`lastName` as `boolean`; `UsuarioModel extends Document` used the DOM `Document` type.                                                                         | Types inferred from the Mongoose schema (`InferSchemaType`) and explicit DTOs.                                                       |
| B5  | 🟠       | Invalid ObjectIds threw a `CastError` → 500; duplicate e-mails caught by a race between `findOne` and `create` returned 400 with the raw error.                                          | Params validated with Zod; `CastError` → 400 and Mongo `E11000` → 409 in the error handler.                                          |
| B6  | 🟠       | Wrong status codes: `405` for missing credentials, `201` for updates, `400` for wrong password.                                                                                          | `400` validation, `401` auth, `403` ownership, `404`, `409` conflict, `413` body too large, `429` rate limit.                        |
| B7  | 🟡       | Server started listening before the database connection was established; no graceful shutdown.                                                                                           | `bootstrap()` connects first, then listens; `SIGTERM`/`SIGINT` close the server and the Mongo connection.                            |
| B8  | 🟡       | E-mails were case-sensitive (`Jane@x.com` and `jane@x.com` were different users).                                                                                                        | E-mails trimmed and lower-cased (Zod + Mongoose `lowercase`).                                                                        |

## Architecture & patterns

| #   | Finding                                                                                                   | Fix                                                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Controllers mixed HTTP, validation, business rules and data access.                                       | Layered modules: **routes → controller (HTTP adapter) → service (business rules) → repository (data access)**, plus DTO mappers (`toUserResponse`). |
| A2  | Services impossible to test without a database.                                                           | Services built by factories with the repository injected (`createUserService(repository)`), unit-tested with fakes.                                 |
| A3  | `index.ts` connected to the database at import time, making the app untestable.                           | **Application factory** (`createApp()`) with no side effects; `server.ts` is the composition root.                                                  |
| A4  | Ad-hoc error responses (`{ message }`, sometimes `{ message, error }`).                                   | `HttpError` with machine-readable `code`s and a single error middleware.                                                                            |
| A5  | Hand-written `swagger.json` out of sync with the code (Portuguese, wrong schema keywords such as `item`). | OpenAPI 3.1 document in TypeScript (`src/docs/openapi.ts`) describing the real contract, served at `/docs`.                                         |
| A6  | CommonJS + `tsx` in production, no build step, unused deps (`@types/mongoose`, `nodemon`, `dotenv`).      | ESM + `NodeNext`, `tsc` build to `dist/`, Node's native `--env-file`, unused deps removed.                                                          |

## Naming & consistency

- Portuguese identifiers and messages (`UsuarioModel`, `nDocs`, `c`, "Servidor Local") → **English everywhere**.
- File names by module and role: `user.controller.ts`, `user.service.ts`, `user.repository.ts`, `user.schemas.ts`.
- `PUT /users/:id` (partial update) → `PATCH /users/:id`; login grouped under `/api/auth/login`.

## Tooling added

- **Prettier**, **ESLint 9 flat config** (typescript-eslint, `no-console`), `.editorconfig`, **Husky + lint-staged**.
- **Vitest + Supertest + mongodb-memory-server**: unit tests and HTTP integration tests against a real (in-memory) MongoDB, with coverage thresholds.
- **GitHub Actions**: CI (quality + build, tests with coverage, Docker build) and CD (image published to GHCR); Dependabot.
- `docker-compose.yml` (API + MongoDB) and `npm run seed` for demo data.
