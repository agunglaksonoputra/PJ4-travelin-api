# Travelin API

Travelin API is the REST backend for the Travelin transport and travel operations application. It provides versioned JSON endpoints for authentication, users, vehicles, tariffs, transactions, operational reports, and owner-related operations.

The API is built with Express and uses PostgreSQL through Sequelize. The Flutter client is maintained in the [Travelin Mobile repository](https://github.com/agunglaksonoputra/PJ4-travelin-mobile).

## Features

- JWT-based authentication and role-based route authorization
- User, vehicle, owner, and tariff management
- Transaction, payment, refund, and status-log endpoints
- Activity logs and operational/monthly reporting endpoints
- PostgreSQL schema migrations and seed data through Sequelize CLI
- Request rate limiting for the versioned API routes

## Technology

- Node.js and Express
- PostgreSQL and Sequelize
- JWT and bcrypt
- `express-rate-limit`
- Sequelize migrations and seeders

## Requirements

- Node.js and npm
- PostgreSQL database

## Run locally

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/agunglaksonoputra/PJ4-travelin-api.git
   cd PJ4-travelin-api
   npm install
   ```

2. Create a `.env` file in the repository root and configure your local database and a private JWT signing secret:

   ```dotenv
   PORT=3000
   DB_USERNAME=your_local_db_user
   DB_PASSWORD=your_local_db_password
   DB_NAME=travelin
   DB_HOST=localhost
   DB_PORT=5432
   JWT_SECRET=replace_with_a_long_random_secret
   ```

   `ENV_FILE` can optionally point to a different environment file. Never commit real passwords, signing secrets, production URLs, or populated local Postman environments.

3. Create the PostgreSQL database, then apply migrations and (optionally) seed development data:

   ```bash
   npm run migrate
   npm run seed
   ```

4. Start the API in development mode:

   ```bash
   npm run dev
   ```

By default, the API listens on port `3000`. The health/root response is available at `http://localhost:3000/`.

## API overview

Version 1 endpoints use the `/api/v1` prefix. Protected routes expect a bearer token:

```http
Authorization: Bearer <access-token>
```

Main route groups include:

| Route group | Purpose |
| --- | --- |
| `/auth` | Authentication and token operations |
| `/users` | User management |
| `/vehicles`, `/tariffs` | Fleet and tariff management |
| `/transactions` | Transaction, payment, refund, report, and status operations |
| `/owners` | Owner, balance, and withdrawal operations |
| `/activity-logs` | Activity log operations |
| `/monthly-report`, `/monthly-profits` | Monthly reporting and profit operations |

Route access is role-restricted. Refer to the route definitions under `routes/v1/` for the available HTTP methods and paths. A Postman collection is included in the repository for local API exploration; use a local test account and keep secrets out of exported/shared environments.

For browser clients, the current CORS configuration is in `index.js`. Configure the allowed origin for the environment where the client is hosted.

## Project structure

```text
config/        # Sequelize environment configuration
controllers/   # HTTP request handlers
middlewares/   # Authentication and request middleware
migrations/    # Database schema migrations
models/        # Sequelize models and associations
routes/        # Versioned Express routes
seeders/       # Development seed data
services/      # Business and persistence operations
utils/         # Shared utilities
index.js       # Application entry point
```

## Related project

- [Travelin Mobile](https://github.com/agunglaksonoputra/PJ4-travelin-mobile) — Flutter client application
