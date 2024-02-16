
# Back end Growth Machine

Desafio técnico proposto pela Growth Machine a fim de avaliar competência técnica.


## Instalação

#### No terminal: 

```bash
  git clone https://github.com/Bizzye/backend-growth-machine.git
  cd backend-growth-machine
```

#### E execute uma das opções abaixo

```bash
  npm run dev
```

```bash
  yarn dev 
```

```bash
  pnpm dev 
```

```bash
  bun dev
```
    
## Documentação da API

#### Retorna todos os usuários

```http
  GET /api/users
```

#### Cadastra um usuário

```http
  POST /api/users/
```

#### Loga com email e senha

```http
  POST /api/login/
```

#### Atualiza um usuário

```http
  PUT /api/users/${id}
```

#### Documentação com Swagger

```http
  GET /docs
```


## Documentação

[Documentação (necessário rodar localmente)](http://localhost:3333/docs/)


## Funcionalidades

- [x] Cadastro de usuário
- [x] Login
- [x] Listagem de usuários

## Diferencias

- [x] JWT


## Stack utilizada

**[Front-end](https://github.com/Bizzye/frontend-growth-machine.git):** React, NextJs, TailwindCSS, Shadcn UI, Typescript 

**[Back-end](https://github.com/Bizzye/backend-growth-machine.git):** Node, Express, MongoDB, Typescript

