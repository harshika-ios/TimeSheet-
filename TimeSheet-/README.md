# Timesheet - Time Tracking Web Application

A modern, Excel-replacement time tracking application built with React, TypeScript, and Supabase.

## 🎯 Purpose

This application **replaces Excel-based timesheets** with a robust, web-based solution for tracking time across clients and projects. Designed for office/team use with workspace collaboration.

## ✨ Key Features

- **Time Tracking** - Start/stop timer, manual time entries
- **Client & Project Management** - Organized hierarchy: Workspace → Client → Project → Time Entry
- **Collaborative Workspaces** - Team-based access control
- **Timesheet View** - Day-wise grouping with totals (like Excel rows)
- **Reports & Analytics** - Time by client, project, or user
- **Data Integrity** - Row-level security, audit trails

## 🛠 Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **State Management:** React hooks (Zustand for complex state if needed)

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup instructions
- **[SCHEMA.md](./SCHEMA.md)** - Database schema and design decisions
- **[claude.md](./claude.md)** - Product requirements & AI context

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd timesheet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase** (see [SETUP.md](./SETUP.md) for detailed steps)
   - Create Supabase project
   - Run `supabase-migration.sql`
   - Copy API keys to `.env`

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
src/
├── components/       # React components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and configurations
│   └── supabase.ts  # Supabase client
├── types/           # TypeScript type definitions
│   ├── database.types.ts  # Generated from DB schema
│   └── index.ts           # App-level types
├── App.tsx
└── main.tsx
```

## 🗄️ Database Schema

8 main tables:
- `profiles` - User profiles
- `workspaces` - Organizations/teams
- `workspace_members` - User-workspace relationships
- `clients` - Customer/client records
- `projects` - Client projects
- `tags` - Categorization tags
- `time_entries` - Individual time records
- `time_entry_tags` - Time entry ↔ tag relationships

Full schema: [SCHEMA.md](./SCHEMA.md)

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Workspace-scoped data access
- User-owned time entries
- Role-based permissions (owner/admin/member)

## 🧪 Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📝 License

Private/Internal use

## 🤝 Contributing

This is an internal project. Follow the architecture principles in `claude.md` when adding features.

---

**Current Status:** Foundation setup complete, ready for feature development
