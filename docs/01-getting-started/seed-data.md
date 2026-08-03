# Seed Data

This document explains the seed data setup used during the initial development phase with Prisma ORM.

## Dev Seed Script Setup

Create the seed file at `apps/api/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const t = await db.tenant.upsert({ 
    where: { id: '00000000-0000-0000-0000-000000000001' }, 
    update: {}, 
    create: { id: '00000000-0000-0000-0000-000000000001', name: 'DevTenant' } 
  })

  const e = await db.entity.create({ 
    data: { tenantId: t.id, name: 'DevEntity' } 
  })

  await db.employee.create({ 
    data: { 
      tenantId: t.id, 
      entityId: e.id, 
      employeeNo: 'E-0001', 
      firstName: 'Budi', 
      hireDate: new Date(), 
      status: 'ACTIVE' 
    } 
  })
}

main().finally(() => db.$disconnect())
```

## Package.json Configuration

Update `package.json` in `apps/api`:

```json
{
  "scripts": { 
    "seed": "ts-node prisma/seed.ts" 
  },
  "devDependencies": { 
    "ts-node": "^10.9.2" 
  }
}
```

## Execution

To run the seed script and populate the database with the sample `Tenant`, `Entity`, and `Employee`:

```bash
pnpm prisma db seed
# or
pnpm seed
```
