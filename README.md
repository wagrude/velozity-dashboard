# Velozity

Real-time project management dashboard with role-based access control.

## Tech Stack

* React + TypeScript + Vite
* Node.js + Express + TypeScript
* PostgreSQL + Prisma
* Socket.IO
* JWT + refresh tokens
* Zod
* node-cron

## Features

* Role-based access control
* Project and task management
* Task assignment and status updates
* Status, priority and due-date filters
* Real-time task and activity updates
* Online user presence
* Notifications with unread count
* Automatic overdue task processing
* Seed data

## Roles

* **Admin:** Full access
* **PM:** Manage own projects and their tasks
* **Developer:** View assigned tasks and update their status

## Run Locally

### Backend

```bash
cd server
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```
## Live Demo

[Live Demo](YOUR_VERCEL_URL)

## Repository

[GitHub Repository](YOUR_GITHUB_URL)

## Demo Accounts

Password for all accounts:

`Password@123`

**Admin**

* [admin@example.com](mailto:admin@example.com)

**PM**

* [pm1@example.com](mailto:pm1@example.com)
* [pm2@example.com](mailto:pm2@example.com)

**Developers**

* [dev1@example.com](mailto:dev1@example.com)
* [dev2@example.com](mailto:dev2@example.com)
* [dev3@example.com](mailto:dev3@example.com)
* [dev4@example.com](mailto:dev4@example.com)
