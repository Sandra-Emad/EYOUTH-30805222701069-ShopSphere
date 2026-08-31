# ADR: Extract reviews and move activity-log cleanup to serverless

**Status:** Accepted

## Decision

Product reviews are extracted from the ShopSphere monolith into the independently deployed **EYOUTH-30805222701069-ShopSphere Review Service**. The main backend keeps a small REST proxy for authentication and API compatibility; review creation, retrieval, updates, deletion, validation, and MongoDB persistence run in the review service.

The **Activity Log Cleanup** workload is moved to a Vercel Serverless Function. The function runs independently from the main application and removes activity logs older than the configured retention period.

## Why the review service is a suitable extraction

Reviews are a cohesive feature with its own data model, validation, and MongoDB queries. They are accessed independently from the catalogue and order workflows, so isolating them limits the main application's responsibilities and allows review traffic and storage to scale or evolve without changing the rest of ShopSphere. REST keeps the existing frontend-to-main-backend API stable while the main backend delegates review work to the service.

## Why serverless suits the cleanup workload

Activity-log cleanup is a short-lived background operation that does not require an always-running server. A Vercel Serverless Function can execute the cleanup independently from the main application, removing old logs only when the workload runs and avoiding the need for a continuously running background-worker process.