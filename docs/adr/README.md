# Architecture decision records

One decision per file. They change only on a `kit/` branch, in their own PR
(the protect-paths hook enforces this). If a step's spec conflicts with an ADR,
the step stops and the conflict comes back to chat.

Source for ADRs 1–10: `docs/review iteration 1.md` ("Architecture decisions the
blueprint skipped") as amended by `docs/Playbook.md`, which wins any conflict.

| # | Decision | Status | Changed by |
| --- | --- | --- | --- |
| [1](0001-database-access.md) | Who touches the database | Accepted | |
| [2](0002-hosting.md) | Hosting | Accepted | step 3.1 confirms |
| [3](0003-domain-layout.md) | Domain layout | Accepted | step 3.1 records the setup |
| [4](0004-read-write-path.md) | Read and write path | Accepted | |
| [5](0005-query-layer.md) | Query layer | Proposed | step 1.1 decides |
| [6](0006-authentication.md) | Authentication | Accepted | |
| [7](0007-api-contract.md) | API contract | Accepted | |
| [8](0008-page-storage.md) | Puck page storage | Accepted | |
| [9](0009-payments.md) | Payments | Accepted for release 1 | step 5.1 rewrites |
| [10](0010-transactional-email.md) | Transactional email | Deferred | |

Steps 4.1 and 5.6 add ADR #11 (upload storage) and ADR #12 (sales tax and VAT).
