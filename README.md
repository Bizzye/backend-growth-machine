<div align="center">

# Growth Machine — Users API

REST API for user sign up, JWT authentication and users listing.<br/>
Originally built as a technical challenge for **Growth Machine** (2024) and refactored in 2026 as a portfolio project.

[![CI](https://github.com/Bizzye/backend-growth-machine/actions/workflows/ci.yml/badge.svg)](https://github.com/Bizzye/backend-growth-machine/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-24-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/mongodb-8-47A248?logo=mongodb&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-6-3178C6?logo=typescript&logoColor=white)

[Frontend repository](https://github.com/Bizzye/frontend-growth-machine) · [API docs (local)](http://localhost:3333/docs) · [Code review](docs/CODE_REVIEW.md)

</div>

## Highlights

- **Layered architecture** — routes → controllers → services → repositories, with DTO mappers and dependency injection.
- **Security first** — bcrypt (cost 12), HS256-pinned JWT, rate-limited login, no user enumeration (same error _and_ same timing), helmet, CORS allow-list, body size limit, mass-assignment protection, secrets validated at startup and redacted from logs.
- **Validation** with Zod on every input; consistent error contract `{ code, message, details? }`.
- **Tested** — unit + HTTP integration tests (Supertest) against an in-memory MongoDB, ~99% line coverage.
- **Production-ready** — ESM build, structured logs (pino), health check, graceful shutdown, non-root Docker image, CI/CD with GitHub Actions.

## Endpoints

| Method  | Path              | Auth | Description                                |
| ------- | ----------------- | ---- | ------------------------------------------ |
| `GET`   | `/api/health`     | —    | API and database status                    |
| `POST`  | `/api/auth/login` | —    | Sign in → `{ token, user }` (rate limited) |
| `POST`  | `/api/users`      | —    | Sign up                                    |
| `GET`   | `/api/users`      | JWT  | List users (newest first)                  |
| `GET`   | `/api/users/me`   | JWT  | Authenticated user                         |
| `PATCH` | `/api/users/:id`  | JWT  | Update your own profile (`403` for others) |
| `GET`   | `/docs`           | —    | Interactive OpenAPI 3.1 documentation      |

Errors always follow the same shape:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": [{ "path": "email", "message": "Invalid e-mail" }]
}
```

Codes: `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `USER_NOT_FOUND`, `USER_ALREADY_EXISTS`, `PAYLOAD_TOO_LARGE`, `TOO_MANY_REQUESTS`, `INTERNAL_ERROR`.

## Getting started

### With Docker (API + MongoDB)

```bash
docker compose up --build -d
docker compose exec api node dist/scripts/seed.js   # optional: demo users (password Str0ng!Pass)
```

API at <http://localhost:3333/api> · docs at <http://localhost:3333/docs>.

> To run the **whole stack** (MongoDB + API + Next.js frontend), use the `docker-compose.yml` of the [frontend repository](https://github.com/Bizzye/frontend-growth-machine).

### Locally

Requirements: Node.js 24 (see `.nvmrc`) and a MongoDB instance (`docker compose up -d mongo` works).

```bash
cp .env.example .env   # then set JWT_SECRET
npm install
npm run seed           # optional
npm run dev
```

### Environment variables

| Variable         | Required | Default                 | Description                             |
| ---------------- | -------- | ----------------------- | --------------------------------------- |
| `MONGODB_URI`    | ✅       | —                       | MongoDB connection string               |
| `JWT_SECRET`     | ✅       | —                       | HS256 secret, at least 32 characters    |
| `JWT_EXPIRES_IN` |          | `1d`                    | Token lifetime (`15m`, `12h`, `1d`…)    |
| `CORS_ORIGIN`    |          | `http://localhost:3000` | Comma-separated list of allowed origins |
| `PORT`           |          | `3333`                  | HTTP port                               |
| `LOG_LEVEL`      |          | `info`                  | pino log level                          |

## Scripts

| Script                  | Description                               |
| ----------------------- | ----------------------------------------- |
| `npm run dev`           | Watch mode with `tsx`                     |
| `npm run build`         | Compile to `dist/`                        |
| `npm start`             | Run the compiled server                   |
| `npm run seed`          | Insert demo users (idempotent)            |
| `npm test`              | Unit + integration tests                  |
| `npm run test:coverage` | Tests with coverage report and thresholds |
| `npm run lint`          | ESLint                                    |
| `npm run format`        | Prettier                                  |
| `npm run typecheck`     | TypeScript                                |
| `npm run validate`      | Everything CI runs before tests           |

## Project structure

```
src/
├── app.ts                 # Express application factory (no side effects)
├── server.ts              # Composition root: DB connection, listen, graceful shutdown
├── config/                # Env validation (Zod) and database connection
├── docs/openapi.ts        # OpenAPI 3.1 document served at /docs
├── middlewares/           # authenticate, validate, rate limit, error handler
├── modules/
│   ├── auth/              # routes · controller · service · schemas
│   └── users/             # routes · controller · service · repository · model · mapper · schemas
├── scripts/seed.ts        # Demo data
└── shared/                # HttpError, logger, password hashing, JWT
tests/
├── unit/                  # env, token, error handler, service with fake repository
├── integration/           # Supertest against createApp() + in-memory MongoDB
└── helpers/               # factories
```

## CI/CD

- **CI** (`.github/workflows/ci.yml`) — on every push/PR: format, lint, typecheck, build, tests with coverage and a Docker build.
- **CD** (`.github/workflows/release.yml`) — after CI passes on `main` (and on `v*.*.*` tags) the image is published to `ghcr.io/bizzye/backend-growth-machine`.
- **Dependabot** keeps npm packages and GitHub Actions up to date.

## License

MIT
