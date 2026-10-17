# SENTINEL — Autonomous Operations Control Plane

> **Automate India Hackathon — ArmorIQ Track (Problem 1: "Autonomous, until it shouldn't be")**  
> *Autonomous AI agent execution governed by cryptographic intent plans, runtime capability verification, dynamic single-use amendments, and tamper-evident audit ledgers.*

---

## 🎯 Executive Summary & The Problem

The promise of autonomous AI agents is that they handle complex enterprise workflows end-to-end without constant human babysitting. However, "autonomous" today suffers from a broken dichotomy:
1. **The Nuisance Agent**: Asks for permission at every step, destroying productivity.
2. **The Runaway Agent**: Runs completely unchecked with root API keys until an indirect prompt injection or logic flaw causes catastrophic financial or data exfiltration damage.

### The Solution: SENTINEL with ArmorIQ
**SENTINEL** is an autonomous operations control plane that enforces **cryptographic intent plans** (`capture_plan()`) and **runtime capability governance** (`invoke()`). The agent moves fast and autonomously on everything within its declared scope, and **halts before execution** the moment an action falls outside its mathematical boundary.

- **No Keyword Filters**: An out-of-scope action is NOT detected with crude string checks like `contains("delete")` or `contains("refund")`. The agent uses legitimate tools, but fails cryptographic parameter/domain constraints.
- **Real Sandbox Side Effects**: Real file-persisted databases, real refund records, and real local outbox messages. When held, **zero bytes are written**.
- **Dynamic Single-Use Exceptions**: Human approval dynamically amends the signed plan with a single-use grant, increments the plan version, re-signs it, executes the held action, and immediately consumes the exception.
- **Tamper-Evident SHA-256 Audit Chain**: Every decision (Allowed, Held, Approved, Blocked) is cryptographically hash-linked.

---

## 🚀 Live Demo Scenarios

SENTINEL comes pre-configured with two real-world enterprise scenarios:

### Scenario 1: Customer Support & Payment Refund Agent (Primary Demo)
- **Agent Role**: Autonomous Customer Support & Refund Controller (`agt_refund_01`).
- **Declared Intent**: Process customer support claims, inspect orders and damage reports, verify payment gateway settlement, and issue refunds **up to authorized limit of ₹5,000** (`PLN-REFUND-01`).
- **Autonomous Flow**:
  1. `customer.get` $\rightarrow$ Fetches customer profile (Priya Sharma, VIP Tier) $\rightarrow$ **ALLOWED**
  2. `order.get` $\rightarrow$ Retrieves order & courier damage inspection report (Sony WH-1000XM5 Headphones - ₹25,000) $\rightarrow$ **ALLOWED**
  3. `payment.verify` $\rightarrow$ Confirms original settlement on Razorpay / HDFC Gateway $\rightarrow$ **ALLOWED**
- **The Out-of-Scope Trigger**:
  - Customer ticket requests full compensation for the broken headphones (₹25,000). The agent reasons that a full refund is warranted and attempts: `refund.issue(orderId="ORD-9942", amount=25000)`.
  - **ArmorIQ Intercepts Call**: Required tuple `[write : finance.refund, amount: 25000]` violates grant constraint `[maxAmount: 5000]`.
  - **Status: HELD BEFORE EXECUTION**. 0 bytes written to refund database.
- **Human Approval & Resumption**:
  - Finance Manager approves the exception in the dashboard.
  - Plan is amended to `v2` with single-use grant, re-signed, executed on sandbox gateway, and consumed (`v3`).
  - Agent completes `ticket.update` and dispatches `notification.send`.

### Scenario 2: Invoice & Accounts Payable Processing Pipeline
- **Agent Role**: Accounts Payable Automation Agent (`agt_7F92A1`).
- **Autonomous Flow**: Reads invoice $\rightarrow$ extracts accounting fields $\rightarrow$ validates vendor against approved registry $\rightarrow$ posts payable to ledger $\rightarrow$ notifies internal AP mailbox (`accounts-payable@ap.acme-internal.example`).
- **The Out-of-Scope Trigger**: Source document contains a document-borne prompt injection directive in its notes block telling the agent to email vendor bank details to an external address (`external-review@example.com`).
- **ArmorIQ Intercepts Call**: Catches egress to unapproved domain. **HELD BEFORE EXECUTION**.

---

## 🛠️ Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SENTINEL FULL STACK ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────────────┘

 [ FRONTEND: React 18 / Vite / TypeScript / Tailwind CSS ]
   ├── Live SSE Stream (/api/stream)
   ├── Interactive Intent Authority Graph (DAG)
   ├── Real-Time Multi-Agent Execution Timeline
   ├── Cryptographic Approval Drawer (Hold / Reject / Single-Use Approve)
   └── Tamper-Proof Audit Chain Inspector (SHA-256 Validator)
   │
   ▼ HTTP / SSE (Port 5173 -> 8787)
 [ BACKEND GATEWAY: Node.js / Express / TypeScript ]
   ├── Multi-Agent Execution Engine (Refund & Invoice Agents)
   ├── ArmorIQ Cryptographic Engine (Ed25519 & HMAC-SHA256 Signatures)
   ├── Dynamic Plan Chain Manager (Versioned Plans v1 -> v2 -> v3)
   └── In-Memory Reactive State + Event Emitter
         │
         ▼
 [ ARMORIQ SECURITY BOUNDARY ]
   ├── capture_plan()   ──► Mint canonical JSON & Ed25519 signature
   ├── invoke()         ──► Gate every tool before touching surfaces
   ├── verify_token()   ──► Cryptographic signature & digest verification
   └── hold/block       ──► Park unverified actions; await human resolution
         │
         ▼
 [ REAL TOOL SANDBOX SURFACES (server/.sandbox/sandbox-state.json) ]
   ├── Sandbox Payment Gateway (Refund Records & Txn Ledger)
   ├── Sandbox CRM & Support Ticket Store
   ├── Sandbox Mail Outbox (Local test transport)
   └── File-backed Audit Ledger (Tamper-evident SHA-256 chain)
```

---

## ⚡ Quick Start & Running Locally

### 1. Prerequisites
- Node.js 18+ and npm
- Python 3.10+ (virtual environment `.venv` with `armoriq-sdk` installed)

### 2. Install Dependencies & Build
```powershell
# Install Node dependencies
npm run install:all

# Build backend and frontend
npm run build
```

### 3. Start the Full Application
```powershell
npm run dev
```
- **Web Console**: Open [http://localhost:5173](http://localhost:5173) in your browser.
- **Backend API Gateway**: Running on [http://localhost:8787](http://localhost:8787).

---

## 🧪 Running Automated Tests & CLI Demo

### Run the Python Test Suite
```powershell
.\.venv\Scripts\python test_suite.py
```
*Validates autonomous execution, monetary hold triggers, zero side-effects while held, post-approval execution, rejection safety, cryptographic tamper detection, and audit hash chain integrity.*

### Run the Interactive Python CLI Agent
```powershell
.\.venv\Scripts\python demo_agent.py
```
*Provides an interactive terminal UI allowing you to select and run either scenario, observe real-time tool gating, and approve held actions directly from the CLI.*

---

## 🔒 Security Model: Why Keyword Filters Fail

| Defense Type | How it Works | Vulnerability |
| :--- | :--- | :--- |
| **Keyword Filter** | Scans for `"delete"`, `"refund"`, `"drop"` | ❌ **Fails**: `refund.issue` is a legitimate tool. Both ₹4,000 (safe) and ₹25,000 (unsafe) look identical to keyword filters. |
| **System Prompt Guard** | Prompts LLM: *"Do not refund over ₹5,000"* | ❌ **Fails**: Susceptible to prompt injections, hallucination, and reasoning errors. |
| **Static RBAC** | Checks if agent has permission to call `refund.issue` | ❌ **Fails**: Binary permit/deny; cannot enforce task-scoped monetary thresholds or domain constraints. |
| **ArmorIQ Cryptographic Plan** | Evaluates capability tuples `[write : finance.refund, amount: 25000]` against signed grant `[maxAmount: 5000]` | ✅ **Succeeds**: Deterministic, non-bypassable mathematical verification at the gateway layer in <1ms. |
