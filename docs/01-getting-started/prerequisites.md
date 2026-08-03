# Prerequisites

## Setup Philosophy
To ensure deterministic builds and avoid ambiguity, dependencies are pinned to specific versions (major/minor). Auto-upgrades are avoided. Patches can be upgraded if compatible, but they must be recorded in the lockfile.

> [!NOTE]
> **Evolution of the Project Tech Stack**
> The locked versions listed below were defined in an earlier specification of the project (e.g., using NestJS for the backend). The **actual current project** has evolved to use **Next.js 15**, **React 19**, and **ASP.NET Core 9**. Please use this document as a historical reference for the initial infrastructure, but follow the actual project's `README.md` for current dependency installation.

## Locked Versions (Historical Reference)
- **Node.js**: 20.x LTS (via `.nvmrc` -> `20`)
- **pnpm**: 9.x
- **Next.js**: 14.2.x (App Router, React 18)
- **React / React-DOM**: 18.2.0
- **Tailwind CSS**: 3.4.x
- **TanStack Query**: 5.x
- **shadcn/ui**: CLI-generated for Next 14
- **React Hook Form**: 7.x
- **Zod**: 3.x
- **Recharts**: 2.10.x+
- **NestJS**: 10.x (Note: Now ASP.NET Core 9)
- **Prisma**: 5.x
- **PostgreSQL**: 16.x
- **Redis**: 7.x
- **Kafka**: 3.7.x (KRaft, without Zookeeper)
- **Keycloak**: 24.x (LTS 24 line)

## Machine Requirements

1. **Git**
2. **Node 20 LTS + nvm** (Linux/Mac) or fnm (optional)
   ```bash
   # macOS (Homebrew)
   brew install nvm && mkdir -p ~/.nvm
   echo 'export NVM_DIR="$HOME/.nvm"; [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
   nvm install 20 && nvm use 20
   ```
3. **pnpm 9**:
   ```bash
   npm i -g pnpm@9
   ```
4. **Docker Desktop** (Compose v2 active) or `docker` + `docker compose` on Linux.
5. (Optional) **mkcert** for local HTTPS.

Ensure a `.nvmrc` file exists in the root repository containing `20` to enforce Node 20.
