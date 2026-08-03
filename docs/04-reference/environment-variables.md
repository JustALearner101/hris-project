# Environment Variables Reference

This document serves as a complete reference for all environment variables used across the HRIS monorepo.

## Frontend (Next.js)

| Variable | Description | Default / Example Value |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | The base URL for the backend API | `http://localhost:8080/api/v1` |
| `NEXTAUTH_URL` | The base URL of the Next.js app for NextAuth | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret key used to encrypt the NextAuth session | `your-super-secret-key-change-in-production` |
| `NEXT_PUBLIC_KEYCLOAK_URL` | The Keycloak authentication server URL | `http://localhost:8081` |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | The Keycloak realm for the application | `hris` (Example) |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | The Keycloak Client ID used by the frontend | `hris-frontend` (Example) |

## Backend (ASP.NET Core)

| Variable | Description | Default / Example Value |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | Specifies the hosting environment (e.g., Development, Production) | `Development` |
| `ASPNETCORE_URLS` | The URLs that the ASP.NET Core app will listen on | `http://+:8080` |
| `DATABASE_URL` | The PostgreSQL database connection string | `Host=localhost;Port=5432;Database=hris;Username=hris;Password=hris` |
| `REDIS_URL` | The connection string for the Redis cache instance | `localhost:6379` |
| `PORT` | Optional port override for the backend app | `8080` (Example) |
| `JWT_SECRET` | Optional JWT secret for custom internal token validation | (Not provided by default) |

## Database (PostgreSQL)

| Variable | Description | Default / Example Value |
|---|---|---|
| `POSTGRES_USER` | The database superuser account name | `hris` |
| `POSTGRES_PASSWORD` | The password for the database superuser | `hris` |
| `POSTGRES_DB` | The name of the default database to create | `hris` |

## Cache / Queue (Redis)

| Variable | Description | Default / Example Value |
|---|---|---|
| `REDIS_URL` | Connection string when running Redis externally | `localhost:6379` |

## Authentication (Keycloak)

| Variable | Description | Default / Example Value |
|---|---|---|
| `KEYCLOAK_ADMIN` | The initial admin username for Keycloak | `admin` |
| `KEYCLOAK_ADMIN_PASSWORD` | The initial admin password for Keycloak | `admin` |
| `KEYCLOAK_URL` | Used to point to Keycloak internally/externally | `http://localhost:8081` |
