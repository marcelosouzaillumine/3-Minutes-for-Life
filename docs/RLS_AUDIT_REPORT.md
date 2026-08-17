# 3 Minutes for Life | Supabase RLS Audit & Production Isolation Test Report

**Date:** 2026-08-17
**Target Environment:** Production Supabase Project (wacdwnlrwsbmuhwztwrz.supabase.co)
**Audit Mode:** Dynamic Authenticated Validation against Remote Database
**Final Verdict:** ✅ RLS VALIDATED

## Executive Summary
A comprehensive Row Level Security (RLS) audit was executed directly against the remote Supabase database. The audit involved static schema analysis followed by dynamic integration testing using actual authenticated user sessions (`rls_test_a@example.com` and `rls_test_b@example.com`).

The data foundation correctly enforces cross-user isolation. Private data is completely inaccessible to unauthenticated requests, and users can only read, modify, and delete their own records. Ownership spoofing and unauthorized privilege escalation attempts were successfully blocked by the database layer.

**Auth lifecycle (JWT Precision):** `PASS` — O logout encerra a sessão ativamente e invalida os refresh tokens. Access tokens (JWT) previamente emitidos permanecem matematicamente válidos até sua data intrínseca de expiração (exp), mas a janela de risco é minimizada pelas práticas arquiteturais.

## Environment Details
- **Migrations applied:** 001_profiles, 002_leads, 003_plans, 004_subscriptions, 005_daily_progress, 006_favorites
- **Frontend Keys:** Only the anonymous/publishable key is used. No `service_role` keys were found in the codebase.
- **Authentication State:** Normal email/password flow with email confirmation actively enforced.

## Schema & Policy Audit (Static Validation)
- `profiles`: SELECT, UPDATE allowed for own ID.
- `leads`: Anonymous INSERT allowed (WITH CHECK true). SELECT, UPDATE, DELETE denied.
- `plans`: SELECT allowed for active plans.
- `subscriptions`: SELECT allowed for own subscription. No write privileges (server-controlled).
- `daily_progress`: SELECT, INSERT, UPDATE allowed for own records. Protected by `auth.uid() = user_id`.
- `favorites`: SELECT, INSERT, DELETE allowed for own records. Protected by `auth.uid() = user_id`.

## Dynamic Integration Test Results

| Test Case | Expected | Actual | Status |
| :--- | :--- | :--- | :--- |
| Anonymous profiles read | Denied | Denied | **PASS** |
| Anonymous subscriptions read | Denied | Denied | **PASS** |
| Anonymous progress read | Denied | Denied | **PASS** |
| Anonymous favorites read | Denied | Denied | **PASS** |
| Anonymous lead insert | Allowed | Allowed | **PASS** |
| Anonymous lead read | Denied | Denied | **PASS** |
| User A own profile read | Allowed | Allowed | **PASS** |
| User A own favorite insert | Allowed | Allowed | **PASS** |
| User A own progress insert | Allowed | Allowed | **PASS** |
| User A -> User B favorite read | Denied | Denied | **PASS** |
| User A -> User B progress read | Denied | Denied | **PASS** |
| User A -> User B profile read | Denied | Denied | **PASS** |
| User A -> User B update | Denied | Denied | **PASS** |
| User A -> User B delete | Denied | Denied | **PASS** |
| Ownership spoofing (INSERT) | Denied | Denied | **PASS** |
| Subscription tampering (self-upgrade)| Denied | Denied | **PASS** |
| Session isolation | Valid | Valid | **PASS** |

## Key Findings & Proof of Security

1. **Cross-User Isolation Proven:** User B was completely unable to read or modify any records (`favorites`, `daily_progress`, `profiles`) belonging to User A, even when attempting to query by explicit exact IDs. The database silently returned no rows, proving the RLS policies are acting at the deepest layer, not just via client-side filters.
2. **Ownership Spoofing Prevented:** When User B attempted to create a record passing User A's `user_id` explicitly, the database rejected the `INSERT` operation, validating the `WITH CHECK (auth.uid() = user_id)` clauses.
3. **Subscription Escalation Prevented:** The frontend cannot be used to artificially upgrade a user to the `premium` plan. The application correctly delegates all subscription write operations to the server (which uses the service role), and explicitly denies client updates.
4. **Lead Privacy Proven:** The system allows anonymous leads to be inserted into the database but denies all attempts to retrieve that list anonymously, protecting the privacy of the volunteers.

5. **Client Secret Exposure:** `PASS`
6. **Direct API Boundary:** `PASS`
7. **RPC Surface (`handle_new_user` & `handle_updated_at`):** `PASS` *(Privilégios de execução revogados para anon, authenticated e public, e search_path assegurado)*
8. **Storage:** `N/A`
9. **Build/Lint:** `PASS`

## Cleanup
All generated test data (`favorites`, `daily_progress`) belonging to the test users was automatically purged. 
The test credentials and test script have been removed from the repository to maintain strict security hygiene.

**The MVP Data Foundation is officially secure and ready to receive the initial 30 volunteer users.**
