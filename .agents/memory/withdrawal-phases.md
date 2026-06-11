---
name: 3-Phase Withdrawal Flow
description: How the 3-phase withdrawal process works including DB fields, API routes, and frontend logic
---

# 3-Phase Withdrawal Flow

## Phase Progression
- Phase 1: Liberation fees (`liberationFee`, `liberationFeeStatus`, `liberationFeePaidAt`) — shown first, always visible
- Phase 2: Withdrawal fees (`fees` field, `withdrawalFeeStatus`, `withdrawalFeePaidAt`) — shows 24h after phase 1 `liberationFeePaidAt`
- Phase 3: Transaction fee (`transactionFee`, `transactionFeeStatus`, `transactionFeePaidAt`) — shows 24h after phase 2 `withdrawalFeePaidAt`

## Key Rule
Phase transitions are time-based on the frontend using `hours24Passed(dateStr)` helper. The DB stores timestamps; the frontend derives which phase card to show. There is no explicit `withdrawalPhase` field in DB.

- `phase2Active = hours24Passed(user.liberationFeePaidAt)`
- `phase3Active = hours24Passed(user.withdrawalFeePaidAt)`

**Why:** Keeps the backend simple; the frontend derives current state from timestamps.

## API Routes (admin-only)
- `POST /beneficiaries/:id/pay-fees` → sets `withdrawalFeePaidAt`
- `POST /beneficiaries/:id/add-liberation-fee` / `pay-liberation-fee` → sets `liberationFeePaidAt`
- `POST /beneficiaries/:id/add-transaction-fee` / `pay-transaction-fee` → sets `transactionFeePaidAt`
- `GET /beneficiaries/:id/transactions` → admin-only financial log

## Financial Transactions Log
All operations logged to `financial_transactions` table. Admin views via "سجل العمليات المالية" button in user dashboard (only visible when admin is viewing a beneficiary via `onBack` prop).
