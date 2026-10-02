const errorResponse = (description: string, example: { code: string; message: string }) => ({
  description,
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" }, example },
  },
});

const unauthorized = errorResponse("Missing, invalid or expired token", {
  code: "UNAUTHORIZED",
  message: "Authentication required",
});

const validationError = errorResponse("Invalid request data", {
  code: "VALIDATION_ERROR",
  message: "Invalid request data",
});

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Growth Machine Users API",
    description: "REST API for user sign up, JWT authentication and users listing.",
    version: "1.0.0",
    license: { name: "MIT" },
  },
  servers: [{ url: "/api", description: "Current server" }],
  tags: [{ name: "auth" }, { name: "users" }, { name: "health" }],
  paths: {
    "/health": {
      get: {
        tags: ["health"],
        summary: "Health check",
        responses: { "200": { description: "API and database are up" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["auth"],
        summary: "Sign in with e-mail and password",
        description: "Rate limited to 10 attempts per IP every 15 minutes.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
              example: { email: "jane.cooper@example.com", password: "Str0ng!Pass" },
            },
          },
        },
        responses: {
          "200": {
            description: "Authenticated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } },
          },
          "400": validationError,
          "401": errorResponse("Wrong e-mail or password", {
            code: "INVALID_CREDENTIALS",
            message: "Invalid credentials",
          }),
          "429": errorResponse("Too many attempts", {
            code: "TOO_MANY_REQUESTS",
            message: "Too many login attempts, try again later",
          }),
        },
      },
    },
    "/users": {
      post: {
        tags: ["users"],
        summary: "Sign up",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserRequest" },
              example: {
                email: "robert.fox@example.com",
                password: "Str0ng!Pass",
                firstName: "Robert",
                lastName: "Fox",
                birthDate: "1993-06-15T00:00:00.000Z",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
          "400": validationError,
          "409": errorResponse("E-mail already registered", {
            code: "USER_ALREADY_EXISTS",
            message: "User already exists",
          }),
        },
      },
      get: {
        tags: ["users"],
        summary: "List users",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Users ordered by creation date (newest first)",
            content: {
              "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } },
            },
          },
          "401": unauthorized,
        },
      },
    },
    "/users/me": {
      get: {
        tags: ["users"],
        summary: "Get the authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Authenticated user",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
          "401": unauthorized,
        },
      },
    },
    "/users/{id}": {
      patch: {
        tags: ["users"],
        summary: "Update your own profile",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateUserRequest" },
              example: { firstName: "Janet" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated user",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
          "400": validationError,
          "401": unauthorized,
          "403": errorResponse("Updating another user", {
            code: "FORBIDDEN",
            message: "You can only update your own profile",
          }),
          "404": errorResponse("User not found", { code: "USER_NOT_FOUND", message: "User not found" }),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      User: {
        type: "object",
        required: ["id", "email", "firstName", "lastName", "birthDate", "createdAt"],
        properties: {
          id: { type: "string", example: "65d1f0a2c3b4a5e6f7a8b901" },
          email: { type: "string", format: "email" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          birthDate: { type: ["string", "null"], format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: { email: { type: "string", format: "email" }, password: { type: "string" } },
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string", description: "JWT (HS256) to send as `Authorization: Bearer <token>`" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              firstName: { type: "string" },
              lastName: { type: "string" },
            },
          },
        },
      },
      CreateUserRequest: {
        type: "object",
        required: ["email", "password", "firstName", "lastName"],
        properties: {
          email: { type: "string", format: "email" },
          password: {
            type: "string",
            minLength: 8,
            maxLength: 72,
            description: "At least 1 uppercase, 1 lowercase, 1 number and 1 special character",
          },
          firstName: { type: "string", minLength: 3, maxLength: 50 },
          lastName: { type: "string", minLength: 3, maxLength: 50 },
          birthDate: { type: ["string", "null"], format: "date-time" },
        },
      },
      UpdateUserRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          firstName: { type: "string", minLength: 3, maxLength: 50 },
          lastName: { type: "string", minLength: 3, maxLength: 50 },
          birthDate: { type: ["string", "null"], format: "date-time" },
        },
      },
      Error: {
        type: "object",
        required: ["code", "message"],
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          details: {
            type: "array",
            items: {
              type: "object",
              properties: { path: { type: "string" }, message: { type: "string" } },
            },
          },
        },
      },
    },
  },
};
