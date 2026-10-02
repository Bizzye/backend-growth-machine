<div align="center">

# Growth Machine — API de Usuários

API REST para cadastro de usuários, autenticação JWT e listagem de usuários.<br/>
Criada originalmente como desafio técnico para a **Growth Machine** (2024) e refatorada em 2026 como projeto de portfólio.

[![CI](https://github.com/Bizzye/backend-growth-machine/actions/workflows/ci.yml/badge.svg)](https://github.com/Bizzye/backend-growth-machine/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-24-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/mongodb-8-47A248?logo=mongodb&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-6-3178C6?logo=typescript&logoColor=white)

[Repositório do frontend](https://github.com/Bizzye/frontend-growth-machine) · [Documentação da API (local)](http://localhost:3333/docs) · [Code review](docs/CODE_REVIEW.md)

</div>

## Destaques

- **Arquitetura em camadas** — routes → controllers → services → repositories, com mappers de DTO e injeção de dependência.
- **Segurança em primeiro lugar** — bcrypt (custo 12), JWT fixado em HS256, rate limit no login, sem _user enumeration_ (mesmo erro _e_ mesmo tempo de resposta), helmet, CORS com allow-list, limite de tamanho do body, proteção contra mass assignment, segredos validados na inicialização e removidos dos logs.
- **Validação** com Zod em todas as entradas; contrato de erro consistente `{ code, message, details? }`.
- **Testado** — testes unitários e de integração HTTP (Supertest) contra um MongoDB em memória, ~99% de cobertura de linhas.
- **Pronto para produção** — build ESM, logs estruturados (pino), health check, graceful shutdown, imagem Docker sem root e CI/CD com GitHub Actions.

> O código e as mensagens da API estão em inglês para manter a codebase padronizada.

## Endpoints

| Método  | Rota              | Auth | Descrição                                     |
| ------- | ----------------- | ---- | --------------------------------------------- |
| `GET`   | `/api/health`     | —    | Status da API e do banco                      |
| `POST`  | `/api/auth/login` | —    | Login → `{ token, user }` (com rate limit)    |
| `POST`  | `/api/users`      | —    | Cadastro                                      |
| `GET`   | `/api/users`      | JWT  | Lista usuários (mais recentes primeiro)       |
| `GET`   | `/api/users/me`   | JWT  | Usuário autenticado                           |
| `PATCH` | `/api/users/:id`  | JWT  | Atualiza o próprio perfil (`403` para outros) |
| `GET`   | `/docs`           | —    | Documentação interativa OpenAPI 3.1           |

Os erros sempre seguem o mesmo formato:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": [{ "path": "email", "message": "Invalid e-mail" }]
}
```

Códigos: `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `USER_NOT_FOUND`, `USER_ALREADY_EXISTS`, `PAYLOAD_TOO_LARGE`, `TOO_MANY_REQUESTS`, `INTERNAL_ERROR`.

## Como rodar

### Com Docker (API + MongoDB)

```bash
docker compose up --build -d
docker compose exec api node dist/scripts/seed.js   # opcional: usuários de demonstração (senha Str0ng!Pass)
```

API em <http://localhost:3333/api> · documentação em <http://localhost:3333/docs>.

> Para rodar a **stack completa** (MongoDB + API + frontend Next.js), use o `docker-compose.yml` do [repositório do frontend](https://github.com/Bizzye/frontend-growth-machine).

### Localmente

Requisitos: Node.js 24 (veja `.nvmrc`) e uma instância do MongoDB (`docker compose up -d mongo` resolve).

```bash
cp .env.example .env   # depois defina o JWT_SECRET
npm install
npm run seed           # opcional
npm run dev
```

### Variáveis de ambiente

| Variável         | Obrigatória | Padrão                  | Descrição                                                           |
| ---------------- | ----------- | ----------------------- | ------------------------------------------------------------------- |
| `MONGODB_URI`    | ✅          | —                       | String de conexão do MongoDB                                        |
| `JWT_SECRET`     | ✅          | —                       | Segredo HS256, com pelo menos 32 caracteres                         |
| `JWT_EXPIRES_IN` |             | `1d`                    | Validade do token (`15m`, `12h`, `1d`…)                             |
| `CORS_ORIGIN`    |             | `http://localhost:3000` | Origens permitidas, separadas por vírgula                           |
| `TRUST_PROXY`    |             | `0`                     | Quantidade de proxies reversos na frente da API (0 = acesso direto) |
| `PORT`           |             | `3333`                  | Porta HTTP                                                          |
| `LOG_LEVEL`      |             | `info`                  | Nível de log do pino                                                |

## Scripts

| Script                  | Descrição                                      |
| ----------------------- | ---------------------------------------------- |
| `npm run dev`           | Modo watch com `tsx`                           |
| `npm run build`         | Compila para `dist/`                           |
| `npm start`             | Executa o servidor compilado                   |
| `npm run seed`          | Insere usuários de demonstração (idempotente)  |
| `npm test`              | Testes unitários + integração                  |
| `npm run test:coverage` | Testes com relatório de cobertura e thresholds |
| `npm run lint`          | ESLint                                         |
| `npm run format`        | Prettier                                       |
| `npm run typecheck`     | TypeScript                                     |
| `npm run validate`      | Tudo o que o CI roda antes dos testes          |

## Estrutura do projeto

```
src/
├── app.ts                 # Factory da aplicação Express (sem efeitos colaterais)
├── server.ts              # Composition root: conexão com o banco, listen, graceful shutdown
├── config/                # Validação de env (Zod) e conexão com o banco
├── docs/openapi.ts        # Documento OpenAPI 3.1 servido em /docs
├── middlewares/           # authenticate, validate, rate limit, error handler
├── modules/
│   ├── auth/              # routes · controller · service · schemas
│   └── users/             # routes · controller · service · repository · model · mapper · schemas
├── scripts/seed.ts        # Dados de demonstração
└── shared/                # HttpError, logger, hash de senha, JWT
tests/
├── unit/                  # env, token, senha, error handler, service com repository fake
├── integration/           # Supertest contra createApp() + MongoDB em memória
└── helpers/               # factories
```

## CI/CD

- **CI** (`.github/workflows/ci.yml`) — a cada push/PR: format, lint, typecheck, build, testes com cobertura e build da imagem Docker.
- **CD** (`.github/workflows/release.yml`) — depois que o CI passa na `main` (e em tags `v*.*.*`) a imagem é publicada em `ghcr.io/bizzye/backend-growth-machine`.
- **Dependabot** mantém os pacotes npm e as GitHub Actions atualizados.

## Licença

MIT
