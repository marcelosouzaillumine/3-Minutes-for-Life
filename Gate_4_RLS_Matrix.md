# Gate 4 RLS Security Validation Matrix

| Test | Actor | Operation | Target | Expected | Actual | Result |
|------|-------|-----------|--------|----------|--------|--------|
| G5 - ANON SUPPORTERS READ | Anon | SELECT | supporters | 0 rows |  | **FAIL** |
| G5 - ANON CONTRIBUTIONS READ | Anon | SELECT | contributions | 0 rows |  | **FAIL** |
| G5 - ANON PAYMENT_EVENTS READ | Anon | SELECT | payment_events | 0 rows |  | **FAIL** |
| Explicit 5 | Anon | INSERT | supporters | Error | Connecting to local database... {"_tag":"Error","error":{"code":"LegacyDbQueryEx | **FAIL** |
| G1 - OWN SUPPORTER READ | User A | SELECT | supporters | uidA |  | **FAIL** |
| G2 - CROSS-USER SUPPORTER ISOLATION | User A | SELECT | supporters (User B) | 0 |  | **FAIL** |
| G3 - CONTRIBUTION TAMPERING (amount) | User A | UPDATE | contributions | Error or 0 updated | Connecting to local database... {"_tag":"Error","error":{"code":"LegacyDbQueryEx | **PASS** |
| G4 - PAYMENT EVENTS (read) | User A | SELECT | payment_events | 0 rows |  | **FAIL** |
| G4 - PAYMENT EVENTS (insert) | User A | INSERT | payment_events | Error | Connecting to local database... {"_tag":"Error","error":{"code":"LegacyDbQueryEx | **FAIL** |
| G6 - USER_ID SPOOFING | User A | INSERT | supporters (user_id=B) | Error | Connecting to local database... {"_tag":"Error","error":{"code":"LegacyDbQueryEx | **FAIL** |
| G7 - CONTRIBUTION CROSS-USER ISOLATION | User A | SELECT | contributions (Not Own) | 0 rows |  | **FAIL** |
| G7 - CONTRIBUTION CROSS-USER ISOLATION | User A | UPDATE | contributions (Not Own) | 0 updated |  | **FAIL** |
| Explicit 1 | User A | INSERT | supporters | Error | Connecting to local database... {"_tag":"Error","error":{"code":"LegacyDbQueryEx | **FAIL** |
| Explicit 2 | User A | INSERT | contributions | Error | Connecting to local database... {"_tag":"Error","error":{"code":"LegacyDbQueryEx | **FAIL** |
| Explicit 3 | User A | UPDATE | supporters.status | 0 updated |  | **FAIL** |
