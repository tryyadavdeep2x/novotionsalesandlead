# Novotion Enterprise Platform (Decoupled Workspace)

An enterprise B2B Sales Acceleration, Lead Prospecting, and Cold Outreach ecosystem decoupled into **3 independent production-ready projects**.

---

## 🏗️ Architecture Overview

```text
novotion-sales-lead-portal/
├── 1-novotion-crm-portal/           # Project 1: High-Velocity CRM & RBAC Pipeline
│   ├── frontend/                    # React 18, Vite, Tailwind CSS (Port 3000)
│   └── backend/                     # Node.js, Express, Prisma (Port 4000)
│
├── 2-novotion-lead-prospector/      # Project 2: UK & USA Healthcare Lead Finder
│   ├── frontend/                    # React 18, Vite, Tailwind CSS (Port 3001)
│   └── backend/                     # Python 3, FastAPI, Uvicorn, BS4 (Port 8000)
│
└── 3-novotion-email-automation/     # Project 3: Smart SMTP Outreach & AI Copilot
    ├── frontend/                    # Email Studio, macOS Mail Preview (Port 5050)
    └── backend/                     # Express, Nodemailer, Multi-AI Engine (Port 5051)
```

---

## 🌐 Port Allocation & Communication Matrix

| Project | Sub-Module | Tech Stack | Port | Direct URL |
| :--- | :--- | :--- | :--- | :--- |
| **1-novotion-crm-portal** | Frontend | React 18 + Vite | `3000` | [http://localhost:3000](http://localhost:3000) |
| | Backend | Node.js + Express + Prisma | `4000` | [http://localhost:4000](http://localhost:4000) |
| **2-novotion-lead-prospector** | Frontend | React 18 + Vite | `3001` | [http://localhost:3001](http://localhost:3001) |
| | Backend | Python 3 + FastAPI | `8000` | [http://localhost:8000](http://localhost:8000) |
| **3-novotion-email-automation**| Frontend | Email Studio SPA | `5050` | [http://localhost:5050](http://localhost:5050) |
| | Backend | Express + Nodemailer + Multi-AI| `5051` | [http://localhost:5051](http://localhost:5051) |

> **REST & SSE Integration**:
> - **Lead Prospector ➔ CRM**: 1-click `Push to CRM` button in Project 2 sends verified leads via `POST http://localhost:4000/api/leads`.
> - **Email Automation Telemetry**: Real-time batch progress streamed via Server-Sent Events from `http://localhost:5051/api/campaign/dispatch-stream`.

---

## 🚀 Quick Start Guide

### Project 1: CRM Portal

```bash
# 1. Backend (Terminal 1)
cd 1-novotion-crm-portal/backend
npm install
npm run dev     # Runs on http://localhost:4000

# 2. Frontend (Terminal 2)
cd 1-novotion-crm-portal/frontend
npm install
npm run dev     # Runs on http://localhost:3000
```

### Project 2: Lead Prospector (UK & USA Healthcare)

```bash
# 1. Backend (Terminal 3)
cd 2-novotion-lead-prospector/backend
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# 2. Frontend (Terminal 4)
cd 2-novotion-lead-prospector/frontend
npm install
npm run dev     # Runs on http://localhost:3001
```

### Project 3: Email Automation & AI Studio

```bash
# 1. Backend (Terminal 5)
cd 3-novotion-email-automation/backend
npm install
npm run dev     # Runs on http://localhost:5051

# 2. Frontend (Terminal 6)
cd 3-novotion-email-automation/frontend
npm install
npm run dev     # Runs on http://localhost:5050
```

### Option B: Docker Compose (All 6 Services in 1 Command)

```bash
docker-compose up --build
```
This boots all 6 isolated containers attached to a shared bridge network (`novotion_network`) with host port bindings:
- `http://localhost:3000` (CRM Frontend)
- `http://localhost:4000` (CRM Backend)
- `http://localhost:3001` (Prospector Frontend)
- `http://localhost:8000` (Prospector Backend)
- `http://localhost:5050` (Email Studio Frontend)
- `http://localhost:5051` (Email Studio Backend)

---

## 📦 Features Breakdown

### 1. Novotion CRM Portal
- **RBAC**: Lead Specialist (`LEAD_TEAM`), Sales Representative (`SALES_TEAM`), Executive Admin (`ADMIN`).
- **Pipeline Stages**: Kanban & tabular views (Lead ➔ Contacted ➔ Qualified ➔ Proposal ➔ Negotiation ➔ Closed Won/Lost).
- **Command Center**: Global Command Palette (`⌘K`), quick filtering, Light/Dark mode.

### 2. Novotion Lead Prospector
- **Targeted Discovery**: Search UK NHS Trusts, Harley Street clinics, US hospital groups, and private practices.
- **Enrichment**: Decision maker names, verified emails, direct phone numbers, LinkedIn URLs, and tier classification (`Hot`, `Warm`, `Cold`).
- **Interoperability**: 1-click CSV export and direct push to CRM pipeline.

### 3. Novotion Email Automation
- **SMTP/IMAP Auto-Discovery**: Automatic DNS MX and port configuration.
- **Dynamic Variable Studio**: Drag-and-drop Excel/CSV parser with macOS Mail live preview (`{{first_name}}`, `{{company}}`).
- **Universal Multi-AI Engine**: Connect Google Gemini, OpenAI, Anthropic Claude, Groq, or local Ollama.
- **Live SSE Telemetry**: Real-time batch delivery stream with pacing (1–30s) and pause/resume/stop controls.
