# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-31

### Added
- OAuth 2.0 authentication with Google and GitHub providers
- Email/password authentication with bcryptjs hashing
- JWT token management (access and refresh tokens)
- Role-Based Access Control (RBAC) with admin and user roles
- Redis-based rate limiting (10 req/min per IP)
- PostgreSQL database with Prisma ORM
- Docker and Docker Compose deployment
- Comprehensive API documentation
- GitHub Actions CI/CD pipeline
- Unit tests with Jest
- Postman API collection
- Deployment guides for AWS, Heroku, DigitalOcean
- Health check endpoints
- Database migrations and seeding

### Security
- JWT token signing with HS256
- Password hashing with bcryptjs
- CORS protection
- Input validation
- SQL injection prevention via Prisma
- Rate limiting on authentication endpoints
