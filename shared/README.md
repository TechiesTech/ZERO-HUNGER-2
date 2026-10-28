# Zero Hunger — Shared Types

This folder is a placeholder for TypeScript types and utilities shared across all three projects (`frontend/`, `admin/`, `backend/`).

## Status

🚧 **Not yet populated.** Add shared types here once the data contracts between frontend, admin, and backend are stable.

## Planned Contents

```
shared/
└── src/
    ├── types/
    │   ├── meal.ts         Meal, MealCategory
    │   ├── order.ts        Order, OrderStatus
    │   ├── rider.ts        Rider, RiderZone
    │   ├── token.ts        GiveMealToken, TokenStatus
    │   └── delivery.ts     Delivery, DeliveryEvent
    └── index.ts            Barrel export
```

## Future Usage

Once types are added, each project can reference this folder via a path alias or a local package (using `workspace:*` in pnpm workspaces or a relative `package.json` `exports` field).
