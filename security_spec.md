# Security Specification — Kingdom Ambassador Dashboard

## 1. Data Invariants

1. **Global Default Deny**: Any path not explicitly matched under `/profiles/{userId}`, `/profiles/{userId}/private/{infoId}`, `/admins/{userId}`, `/advisory_meta/{metaId}`, or `/advisors/{advisorId}` is unconditionally denied (`allow read, write: if false;`).
2. **Verified Authentication & Ownership**: Every write operation requires an authenticated user (`request.auth != null`) with `request.auth.token.email_verified == true`.
3. **Path Variable Hardening**: `{userId}`, `{infoId}`, `{metaId}`, and `{advisorId}` must match `^[a-zA-Z0-9_\-]+$` and be 1..128 characters (`isValidId`).
4. **Admin Verification (`/admins/{userId}`)**:
   - Creating an admin record requires `isOwner(userId)` and `incoming().invitationCode == 'KAACC26'` with server timestamp `incoming().grantedAt == request.time`.
   - `isAdmin()` is true only when `isSignedIn()` and either `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or `request.auth.token.email == 'eleazeralvin1@gmail.com'`.
5. **Advisory Council Live Read & Admin-Only Write (`/advisory_meta/{metaId}` and `/advisors/{advisorId}`)**:
   - Public users, Student/Alumni, and Admins can `get` `/advisory_meta/roster` and `/advisors/{advisorId}` for live `onSnapshot` updates without using blanket `list` queries.
   - Only `isAdmin()` can `create` or `update` `/advisory_meta/roster` and `/advisors/{advisorId}`.
   - `advisorIds` in `/advisory_meta/roster` is bounded (`size() <= 50`) and verified (`size() == 0 || advisorIds[0] is string`).
   - Creating or updating `/advisors/{advisorId}` requires `existsAfter(/databases/$(database)/documents/advisory_meta/roster)` and `isValidAdvisorEntry(incoming(), advisorId)`.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Unauthenticated Create on Profile)**: `auth = null`, creating `/profiles/user_1`. Expected: `PERMISSION_DENIED`.
2. **Payload 2 (Unverified Email Create)**: `auth = { uid: 'user_1', token: { email_verified: false } }`, creating `/profiles/user_1`. Expected: `PERMISSION_DENIED`.
3. **Payload 3 (Cross-User Identity Spoofing)**: `auth = { uid: 'attacker_1' }`, creating `/profiles/victim_1`. Expected: `PERMISSION_DENIED`.
4. **Payload 4 (Shadow/Ghost Field Injection on Create)**: Adding `"isAdmin": true` to `/profiles/user_1`. Expected: `PERMISSION_DENIED`.
5. **Payload 5 (Unauthorized Admin Self-Promotion with Student Code)**: Creating `/admins/user_1` with `invitationCode: "KASA26"`. Expected: `PERMISSION_DENIED`.
6. **Payload 6 (Non-Admin Advisor Creation)**: Authenticated Student/Alumni (`user_sa`) attempting to create `/advisors/adv_1`. Expected: `PERMISSION_DENIED`.
7. **Payload 7 (Non-Admin Advisor Update)**: Authenticated Student/Alumni (`user_sa`) attempting to update `/advisors/adv_1`. Expected: `PERMISSION_DENIED`.
8. **Payload 8 (Oversized Advisor Details > 5000 chars)**: Admin attempting to write 10,000 chars into `details` on `/advisors/adv_1`. Expected: `PERMISSION_DENIED`.
9. **Payload 9 (Immortal Field Mutation on Advisor Update)**: Admin attempting to mutate `createdAt` or `id` on `/advisors/adv_1`. Expected: `PERMISSION_DENIED`.
10. **Payload 10 (PII Cross-User Read)**: `user_2` attempting `get` on `/profiles/user_1/private/contact`. Expected: `PERMISSION_DENIED`.
11. **Payload 11 (Unbounded Roster Array Attack)**: Admin attempting to write 100 items (`> 50`) to `advisorIds` in `/advisory_meta/roster`. Expected: `PERMISSION_DENIED`.
12. **Payload 12 (ID Poisoning Attack)**: Attempting `get` or `create` on `/advisors/invalid$id!@#` or `/advisory_meta/wrong_doc`. Expected: `PERMISSION_DENIED`.
