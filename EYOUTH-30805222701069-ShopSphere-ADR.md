# ADR: Extract reviews and schedule a review digest

**Status:** Accepted

## Decision

Product reviews are extracted from the ShopSphere monolith into the independently deployed **EYOUTH-30805222701069-ShopSphere Review Service**. The main backend keeps only a small REST proxy for authentication and API compatibility; review creation, retrieval, updates, deletion, validation, and MongoDB persistence run in the review service.

A Vercel serverless function, **Daily Review Summary**, runs on a daily schedule. It calls the review service, aggregates the configured products' review counts and average ratings, and records a summary outside the main application.

## Why the review service is a suitable extraction

Reviews are a cohesive feature with its own data model, validation, and MongoDB queries. They are accessed independently from the catalogue and order workflows, so isolating them limits the main application's responsibilities and allows review traffic and storage to scale or evolve without changing the rest of ShopSphere. REST keeps the existing frontend-to-main-backend API stable while the main backend delegates review work to the service.

## Why serverless suits the digest

The summary is scheduled, short-lived, and does not require an always-running server. Vercel invokes the function only when the scheduled workload runs, which keeps it outside the main application and avoids maintaining a dedicated background-worker process for an infrequent task.
