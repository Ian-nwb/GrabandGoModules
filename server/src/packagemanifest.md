# 📂 Modular Architecture & Package Manifest

This file documents the purpose and role of every package installed in this grab-and-go backend repository. The packages have been carefully chosen to handle **security, data validation, performance, database management, and development ergonomics** for scalable, self-contained modules.

---

## 🚨 Critical Architectural Note: CommonJS vs. ESM

Your `package.json` contains:

```json
"type": "module"
```

**What this means:** Node.js treats this repository as an ES Module (ESM) environment.

> ❌ Standard CommonJS syntax (`const express = require('express');` / `module.exports = ...`) will throw syntax errors out of the box.

> ✅ Modern ESM syntax must be used instead (`import express from 'express';` / `export default ...`).

> 💡 If you prefer to continue using `require()` and `module.exports`, simply delete the `"type": "module"` line from your `package.json`.

---

## 🛠️ The Module Breakdown

### 1. Core Framework & Error Management

These form the absolute runtime backbone of the server, abstracting boilerplate and gracefully containing system crashes.

| Package | Version | Purpose |
|---|---|---|
| `express` | v5.2.1 | Core web framework. Version 5 natively enhances async routing, parameter parsing, and performance. |
| `express-async-errors` | — | Automatically catches unhandled rejections inside `async/await` route handlers and passes them to Express error-handling middleware. Eliminates writing `try/catch` on every controller method. |
| `express-async-handler` | — | A utility wrapper for manual, per-route async function isolation when custom error handling is needed. |

---

### 2. Databases & ORM/ODM

Your stack is equipped to interface with both **relational (SQL)** and **non-relational (NoSQL)** ecosystems on a module-by-module basis.

| Package | Purpose |
|---|---|
| `mongoose` | ODM library for MongoDB. Gives modular auth data a schema-based structure and handles connections seamlessly. |
| `@prisma/client` | Modern, type-safe ORM for PostgreSQL. Ideal when your next module requires structured relational tables. |
| `prisma` *(dev)* | CLI tool for Prisma schema migrations and client generation. |
| `pg` | Underlying PostgreSQL client engine used by Prisma for low-level connection pool communication. |

---

### 3. Security, Encryption & Hashing

Modules dealing with authentication, sessions, and data storage rely heavily on this defensive layer to block intrusion.

| Package | Purpose |
|---|---|
| `helmet` | Automatically sets secure HTTP headers, guarding against XSS, Clickjacking, and MIME sniffing. |
| `express-rate-limit` | Tracks client IPs and limits requests to sensitive endpoints (e.g., brute-force protection on `/login`). |
| `bcrypt` | Time-tested, industry-standard password hashing algorithm. |
| `argon2` | Modern, memory-hard hashing algorithm — winner of the Password Hashing Competition. Recommended for new implementations. |
| `jsonwebtoken` | Signs and verifies stateless JWT session tokens, encoding user identity into authorization headers. |

> **Why both `bcrypt` and `argon2`?** Both are world-class. `bcrypt` is the battle-tested standard; `argon2` is the modern cryptographic champion. Choose either for your auth services depending on your security requirements.

---

### 4. Data Validation Engines

Never trust user input. These engines stop malformed payloads or malicious strings before they ever reach database queries.

| Package | Purpose |
|---|---|
| `joi` | Schema description language and object validator. Extremely readable for structural request body verification. |
| `zod` | TypeScript-first schema declaration and validation library. Delivers ultra-fast performance, static type inference, and robust schema parsing — even in vanilla JS. |

---

### 5. API Performance & Observability

These utilities maximize infrastructure bandwidth and allow developers to trace active network operations in real time.

| Package | Purpose |
|---|---|
| `compression` | Gzip compression middleware. Decreases response payload size, drastically speeding up endpoints. |
| `cors` | Configures Cross-Origin Resource Sharing rules, allowing external frontends (React, Vue, mobile) to safely query your APIs. |
| `morgan` | Automated HTTP request logger that outputs traffic diagnostics to the terminal (`METHOD /URL STATUS TIME`). |

---

### 6. System Utilities

Miscellaneous, micro-scoped tools required for day-to-day backend processes.

| Package | Purpose |
|---|---|
| `dotenv` | Injects environment variables from your local `.env` file into `process.env`. |
| `uuid` | Generates cryptographically secure UUIDv4 strings for custom indexing and unique identifiers. |
| `ms` | Converts human-readable timing strings (e.g., `"15m"`, `"2 days"`, `"2h"`) into milliseconds. Ideal for clean config settings. |

---

## 🏎️ Development Ecosystem

| Package | Purpose |
|---|---|
| `nodemon` *(dev)* | Watches the file tree and automatically restarts the server on every save — no manual restarts required. |

---

*This manifest is intended to be kept up to date as new modules are added to the repository.*