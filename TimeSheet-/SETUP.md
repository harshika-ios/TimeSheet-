# Timesheet App - Setup Guide

## 🚀 Quick Start

This guide will help you set up the timesheet application from scratch.

---

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works fine)
- Git

---

## 🗄️ Step 1: Set Up Supabase Project

### 1.1 Create a New Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name:** Timesheet (or your preferred name)
   - **Database Password:** Choose a strong password
   - **Region:** Choose closest to you
4. Wait for project to finish setting up (~2 minutes)

### 1.2 Run Database Migration

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `supabase-migration.sql` (in this repo)
4. Paste into the SQL editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

### 1.3 Get Your API Keys

1. Go to **Project Settings** → **API** (in the left sidebar)
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Project API Key** (anon/public key - the long string)

---

## ⚙️ Step 2: Configure the App

### 2.1 Install Dependencies

```bash
npm install
```

### 2.2 Set Up Environment Variables

1. Open the `.env` file in the project root
2. Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Don't commit the `.env` file to Git (it's already in `.gitignore`)

---

## 🎨 Step 3: Run the App

### 3.1 Start Development Server

```bash
npm run dev
```

The app should now be running at `http://localhost:5173`

### 3.2 Test the Setup

1. Open your browser to `http://localhost:5173`
2. You should see the app (currently just the Vite boilerplate)

---

## 🧪 Step 4: Verify Database Setup

### Option A: Via Supabase Dashboard

1. Go to **Table Editor** in your Supabase project
2. You should see all tables:
   - profiles
   - workspaces
   - workspace_members
   - clients
   - projects
   - tags
   - time_entries
   - time_entry_tags

### Option B: Create Test Data (Optional)

Run this in the Supabase SQL Editor to create a test workspace:

```sql
-- Note: You'll need a user first. Sign up through the app UI once auth is implemented.
-- This is just for reference later.
```

---

## 📁 Project Structure

```
timesheet/
├── src/
│   ├── components/       # React components (to be created)
│   ├── hooks/           # Custom React hooks (to be created)
│   ├── lib/
│   │   └── supabase.ts  # Supabase client setup ✅
│   ├── types/
│   │   ├── database.types.ts  # Database types ✅
│   │   └── index.ts           # App-level types ✅
│   ├── App.tsx
│   └── main.tsx
├── SCHEMA.md            # Database schema documentation ✅
├── SETUP.md            # This file ✅
├── claude.md           # AI context document ✅
├── .env                # Environment variables ✅
└── supabase-migration.sql  # Database setup SQL ✅
```

---

## 🔧 Development Workflow

### Building Features

The recommended order (following the schema-first approach):

1. ✅ **Database schema** - Already done!
2. ✅ **Supabase setup** - Already done!
3. **Authentication** - Sign up, login, logout
4. **Workspace management** - Create/select workspace
5. **Client & Project CRUD** - Create, read, update, delete
6. **Time tracking** - Start/stop timer
7. **Timesheet view** - Display entries by day
8. **Reports** - Aggregated data views

### Adding New Tables (Future)

If you need to add a new table:

1. Update `SCHEMA.md` with the new table design
2. Create SQL migration in `supabase-migration.sql`
3. Run the migration in Supabase SQL Editor
4. Update `src/types/database.types.ts`
5. Add corresponding app types in `src/types/index.ts`

### Regenerating Database Types

After making database schema changes, regenerate types:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Generate types (replace YOUR_PROJECT_REF with your actual project reference)
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.types.ts
```

Your project reference is in the Supabase URL: `https://YOUR_PROJECT_REF.supabase.co`

---

## 🐛 Troubleshooting

### "Missing Supabase environment variables"

- Check that `.env` file exists and has correct values
- Make sure you're using `VITE_` prefix (required for Vite)
- Restart the dev server after changing `.env`

### Migration fails with "relation already exists"

- The migration is idempotent (uses `IF NOT EXISTS`)
- If you get this error, some tables already exist
- You can either:
  - Drop all tables and re-run (destructive)
  - Or run only the parts that failed

### RLS policies blocking queries

- Make sure you're authenticated
- Check that the user is a member of the workspace
- Verify RLS policies in Supabase → Authentication → Policies

### TypeScript errors

- Make sure all dependencies are installed: `npm install`
- Restart your TypeScript server in VS Code
- Check that `src/types/database.types.ts` matches your actual schema

---

## 📚 Next Steps

Now that the foundation is set up:

1. **Implement Authentication** - Sign up, login, logout flows
2. **Create Workspace UI** - Workspace creation and selection
3. **Build Client/Project Management** - CRUD operations
4. **Time Tracking** - Timer functionality
5. **Timesheet View** - Display and edit time entries
6. **Reports** - Analytics and exports

Refer to `claude.md` for the full product requirements and architecture principles.

---

## 🆘 Getting Help

- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **TypeScript Docs:** https://www.typescriptlang.org/docs

---

## ✅ Setup Checklist

- [ ] Supabase project created
- [ ] Database migration run successfully
- [ ] API keys copied to `.env`
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)
- [ ] All tables visible in Supabase Table Editor
- [ ] No TypeScript errors in editor
- [ ] Ready to start building features!
