# OAuth 2.0 Authentication Service

> **Production-ready multi-provider authentication service** with OAuth 2.0, JWT tokens, and role-based access control

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start-5-minutes)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [API Reference](#api-reference)
7. [Configuration](#configuration)
8. [Common Workflows](#common-workflows)
9. [Database Schema](#database-schema)
10. [Development](#development)
11. [Troubleshooting](#troubleshooting)

---

## Overview

### What is This?

An enterprise-grade authentication service that provides:
- **Multi-Provider OAuth 2.0** (Google, GitHub, Email/Password)
- **JWT Token Management** (Access + Refresh tokens)
- **Role-Based Access Control** (Admin/User roles)
- **Rate Limiting** (10 req/min per IP using Redis)
- **Production Deployment** (Docker Compose ready)

### 🎥 Video Demo

Watch the complete walkthrough: [OAuth Service Demo Video](https://docs.google.com/videos/d/1bPlFVYVm2YmI4TktE3O8HEPUzhyQ5CNWGliW-SA6K4s/edit?usp=sharing)

### Key Capabilities

| Feature | Details |
|---------|---------|
| Authentication | Email/password + Google/GitHub OAuth 2.0 |
| Security | JWT tokens + bcryptjs password hashing |
| Authorization | Role-based access control (Admin/User) |
| Rate Limiting | 10 req/min per IP using Redis |
| Database | PostgreSQL 13 with Prisma ORM |
| Caching | Redis 6.2 for sessions & rate limiting |
| Monitoring | Health checks for all services |
| Deployment | Fully containerized with Docker Compose |

---

## Quick Start (5 Minutes)

### Prerequisites

- ✅ **Docker & Docker Compose** installed
- ✅ **Port 8080** available (or modify `API_PORT` in .env)
- ✅ **Git** installed

### Step-by-Step Setup

**Step 0: Clone Repository**
```bash
git clone <repository-url>
cd oauth-auth-service
```

**Step 1: Setup Environment**
```bash
cp .env.example .env
```

**Step 2: Start All Services**
```bash
docker-compose up --build
```
> Wait 2-3 minutes for containers to become healthy

**Step 3: Verify Services**
```bash
docker-compose ps
```
> ✓ All 3 services should show `Up ... (healthy)`

**Step 4: Health Check**
```bash
curl http://localhost:8080/health
```
> ✓ Response: `{"status":"ok"}`

**Step 5: Test Login**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPassword123!"
  }'
```
> ✓ Receives tokens with user data

**🎉 Success!** Service is running on `http://localhost:8080`

---

## Features

### Security

✅ **Password Hashing** - bcryptjs with salt rounds  
✅ **JWT Tokens** - Signed with HS256, 15-min expiry  
✅ **Refresh Tokens** - 7-day expiry for token renewal  
✅ **Rate Limiting** - Redis-backed per-IP throttling  
✅ **RBAC** - Admin and user role enforcement  
✅ **Input Validation** - Email format & password strength  
✅ **CORS** - Configurable cross-origin policies  

---

## Tech Stack

```
┌─────────────────────────────────────────┐
│         Node.js 18 + Express.js         │
├─────────────────────────────────────────┤
│ Authentication                          │
│  ├─ Passport.js (OAuth 2.0)            │
│  ├─ JWT (jsonwebtoken)                 │
│  └─ bcryptjs (password hashing)        │
│                                         │
│ Database                                │
│  ├─ PostgreSQL 13                      │
│  └─ Prisma ORM                         │
│                                         │
│ Cache & Rate Limiting                   │
│  ├─ Redis 6.2                          │
│  └─ express-rate-limit                 │
│                                         │
│ Deployment                              │
│  ├─ Docker                             │
│  └─ Docker Compose                     │
└─────────────────────────────────────────┘
```

---

## Project Structure

### Directory Layout

```
oauth-auth-service/
│
├── 📄 Configuration Files
│   ├── docker-compose.yml       # Orchestrates 3 services
│   ├── Dockerfile               # App container image
│   ├── package.json             # Dependencies
│   └── .env.example             # Environment template
│
├── 📦 Prisma (Database)
│   ├── schema.prisma            # Database schema definition
│   ├── seed.js                  # Test data seeder
│   └── migrations/              # Schema migrations
│
├── 🔧 Application (src/)
│   ├── app.js                   # Express app setup
│   ├── server.js                # Server entry point
│   │
│   ├── config/                  # Configuration modules
│   │   ├── db.js                # Database connection
│   │   ├── env.js               # Environment config
│   │   ├── passport.js          # OAuth strategies
│   │   └── redis.js             # Redis connection
│   │
│   ├── controllers/             # Business logic
│   │   ├── auth.controller.js   # Auth operations
│   │   └── user.controller.js   # User operations
│   │
│   ├── routes/                  # API endpoints
│   │   ├── auth.routes.js       # Auth routes
│   │   └── user.routes.js       # User routes
│   │
│   ├── middleware/              # Request interceptors
│   │   ├── auth.middleware.js   # JWT validation
│   │   ├── rbac.middleware.js   # Role check
│   │   └── rateLimit.middleware.js  # Rate limiting
│   │
│   └── utils/                   # Helper utilities
│       ├── jwt.js               # Token utilities
│       └── password.js          # Password utilities
│
├── 📋 tests/                    # Test files
│
├── 📚 Documentation
│   ├── README.md                # This file
│   ├── TESTING_GUIDE.md         # API test examples
│   └── submission.json          # Test credentials
│
└── seeds/                       # SQL initialization
    └── init.sql
```

### Directory Reference

| Directory | Purpose |
|-----------|---------|
| `src/config/` | Service connections (DB, Cache, Auth) |
| `src/controllers/` | Business logic & request handlers |
| `src/routes/` | API endpoint definitions |
| `src/middleware/` | Request interceptors & validation |
| `src/utils/` | Utility functions |
| `prisma/` | Database schema & migrations |

---

## API Reference

### Test Credentials (Pre-seeded)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@example.com` | `AdminPassword123!` |
| **User** | `user@example.com` | `UserPassword123!` |

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create new user |
| `POST` | `/api/auth/login` | Login with credentials |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `GET` | `/api/auth/google` | Start Google OAuth |
| `GET` | `/api/auth/google/callback` | Google OAuth callback |
| `GET` | `/api/auth/github` | Start GitHub OAuth |
| `GET` | `/api/auth/github/callback` | GitHub OAuth callback |

### User Endpoints (Protected)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/users/me` | ✓ | Get current user |
| `PATCH` | `/api/users/me` | ✓ | Update profile |
| `GET` | `/api/users` | ✓ Admin | List all users |

### Example Requests

**Register**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

**Login**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPassword123!"
  }'
```

**Get Profile (with token)**
```bash
curl http://localhost:8080/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Response Formats

**Success (2xx)**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "user"
}
```

**Error (4xx/5xx)**
```json
{
  "error": "Descriptive error message"
}
```

---

## Configuration

### Environment Variables

Create `.env` from `.env.example`:

```env
# Server
API_PORT=8080

# Database
DATABASE_URL=postgresql://user:password@db:5432/oauth_db

# Cache
REDIS_URL=redis://cache:6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Rate Limiting

- **Limit**: 10 requests per minute per IP
- **Applies to**: Authentication endpoints
- **Response**: 429 Too Many Requests when exceeded
- **Headers**: 
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

---

## Common Workflows

### 1️⃣ Start Service

```bash
# First time setup
cp .env.example .env
docker-compose up --build

# Or after first setup
docker-compose up
```

### 2️⃣ Stop Service

```bash
# Stop containers (keep data)
docker-compose down

# Stop and remove all data
docker-compose down -v

# Restart fresh
docker-compose down && docker-compose up --build
```

### 3️⃣ Test Login

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPassword123!"}'

# Copy accessToken from response

# Use token
curl http://localhost:8080/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4️⃣ Register User

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"New User",
    "email":"newuser@example.com",
    "password":"SecurePassword123!"
  }'
```

### 5️⃣ Database Operations

```bash
# View users
docker-compose exec db psql -U postgres -d oauth_db \
  -c "SELECT id, email, name, role FROM users;"

# Seed test data
docker-compose exec app npm run seed

# Reset database
docker-compose exec app npx prisma db push --force-reset
```

### 6️⃣ View Logs

```bash
# App logs
docker-compose logs app

# Database logs
docker-compose logs db

# Cache logs
docker-compose logs cache

# Real-time logs (all services)
docker-compose logs -f
```

### 7️⃣ Database Migration

```bash
# Run pending migrations
npx prisma migrate dev

# Reset database
npx prisma db push --force-reset

# Seed test data
node prisma/seed.js
```

---

## Database Schema

### Users Table

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
email           VARCHAR UNIQUE NOT NULL
password_hash   VARCHAR NULL (NULL for OAuth users)
name            VARCHAR NOT NULL
role            VARCHAR NOT NULL DEFAULT 'user'
created_at      TIMESTAMP NOT NULL DEFAULT NOW()
```

### Auth Providers Table

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL FOREIGN KEY → users.id
provider        VARCHAR NOT NULL
provider_user_id VARCHAR NOT NULL
-- Constraint: UNIQUE(provider, provider_user_id)
```

---

## Development

### Requirements

- Docker & Docker Compose
- Node.js 18+ (optional, for local development)

### Running with Docker (Recommended)

```bash
docker-compose up --build
# Service: http://localhost:8080
```

### Running with Node.js

```bash
npm install
npm start
# Service: http://localhost:8080
```

### Database Migrations

```bash
# Run migrations
npx prisma migrate dev

# Reset database
npx prisma db push --force-reset

# Seed test data
node prisma/seed.js
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Port 8080 in use | Change `API_PORT` in `.env` to another port |
| DB connection failed | Check `DATABASE_URL` format in `.env` |
| Redis connection error | Verify `REDIS_URL` in `.env` |
| Containers won't start | Run `docker-compose down -v && docker-compose up --build` |
| Tests failing | Ensure all services are healthy: `docker-compose ps` |
| Migration errors | Run `npx prisma db push --force-reset` |
| Port still in use after stopping | Run `docker system prune` |

### Debug Commands

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Access database
docker-compose exec db psql -U postgres -d oauth_db

# Access app shell
docker-compose exec app sh

# Restart services
docker-compose restart

# Remove everything and start fresh
docker system prune -a
docker-compose up --build
```

---

## Additional Resources

- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Comprehensive API test examples
- [submission.json](submission.json) - Test credentials reference
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [JWT Introduction](https://jwt.io/introduction)
- [Docker Documentation](https://docs.docker.com/)

---

## License

ISC
