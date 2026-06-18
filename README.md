# Moving Earnings Tracker

A production-ready web app for tracking moving job earnings. Built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, NextAuth (Google OAuth), and Google Sheets as the database.

## Features

- Google OAuth sign-in
- Row-level data isolation — each user only sees their own entries
- Per-user hourly rate settings (default $25/hr)
- Dashboard with earnings summary cards
- Date range filtering
- Add, edit, and delete job entries
- Live earnings preview ($25/hr + $20/review + tips)
- Dark mode toggle
- Mobile-responsive layout (table on desktop, cards on mobile)
- Toast notifications for all actions

## Tech Stack

- **Next.js 15+** (App Router)
- **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui**
- **NextAuth.js** (Google OAuth)
- **Google Sheets API** (sole database)
- **React Hook Form** + **Zod**

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Step-by-Step Setup Guide

### Part 1: Google Cloud OAuth (User Sign-In)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Navigate to **APIs & Services → OAuth consent screen**.
   - Choose **External** (or Internal for Workspace).
   - Fill in app name, support email, and developer contact.
   - Add scopes: `email`, `profile`, `openid`.
   - Add your email as a test user (while in Testing mode).
4. Go to **APIs & Services → Credentials**.
5. Click **Create Credentials → OAuth client ID**.
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://your-app.vercel.app` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-app.vercel.app/api/auth/callback/google`
6. Copy the **Client ID** and **Client Secret** into `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### Part 2: Google Sheets API + Service Account (Database)

1. In Google Cloud Console, go to **APIs & Services → Library**.
2. Search for **Google Sheets API** and click **Enable**.
3. Go to **APIs & Services → Credentials**.
4. Click **Create Credentials → Service account**.
   - Name it (e.g. `moving-earnings-sheets`).
   - Skip optional role grants → Done.
5. Click the new service account → **Keys** tab → **Add Key → Create new key → JSON**.
   - Save the downloaded JSON file securely.
6. From the JSON file, copy:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY` (keep `\n` newlines)
7. Create a new [Google Sheet](https://sheets.google.com).
8. Rename the first sheet tab to **`Jobs`**.
9. Add header row in row 1:

   | A   | B          | C    | D          | E            | F       | G    |
   |-----|------------|------|------------|--------------|---------|------|
   | ID  | User Email | Date | Work Hours | Travel Hours | Reviews | Tips |

   > **Migrating an existing sheet?** If your sheet uses the old 6-column layout, run:
   > ```bash
   > npm run migrate-sheet -- your-email@gmail.com
   > ```
   > See [Sheet Migration](#sheet-migration) below.

10. Copy the Spreadsheet ID from the URL:
    ```
    https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
    ```
    Set `GOOGLE_SHEETS_ID=SPREADSHEET_ID` in `.env.local`.

11. **Share the sheet** with the service account email (from step 6) as **Editor**.

12. Create a second sheet tab named **`Settings`** with header row:

    | A          | B           |
    |------------|-------------|
    | User Email | Hourly Rate |

    Each user gets one row when they save their settings. New users default to $25/hr.

### Part 3: NextAuth Secret

Generate a secret:

```bash
openssl rand -base64 32
```

Add to `.env.local`:

```
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=http://localhost:3000
```

### Part 4: Vercel Deployment

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Add all environment variables from `.env.local` in **Project Settings → Environment Variables**:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` → `https://your-app.vercel.app`
   - `GOOGLE_SHEETS_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` → paste the full key; Vercel handles multiline values
4. Deploy.
5. Update Google OAuth redirect URIs (Part 1, step 5) with your Vercel URL.
6. If OAuth consent screen is in Testing mode, add production users as test users.

---

## Earnings Formula

```
earnings = (workHours + travelHours) × hourlyRate + (reviews × $20) + tips
```

`hourlyRate` is configured per user on the **Settings** page (default: $25).

## Sheet Migration

If your Google Sheet was created before row-level ownership was added, existing rows use the old 6-column layout without a **User Email** column. Those rows are invisible to all users until migrated.

Run the migration script to:

1. Insert a **User Email** column (column B) if missing
2. Update the header row to the new 7-column format
3. Assign all existing rows to the specified email address

```bash
npm run migrate-sheet -- your-email@gmail.com
```

Use the Google account email that should own the existing data. The script reads credentials from `.env.local`.

**Security notes:**

- Ownership is enforced server-side using `session.user.email` from NextAuth
- The API never accepts `userEmail` from the client
- Users can only read, update, or delete rows where `User Email` matches their session email
- Rows with a missing email are excluded from all queries until migrated

## Project Structure

```
src/
  app/
    login/page.tsx
    dashboard/page.tsx
    settings/page.tsx
    api/auth/[...nextauth]/route.ts
    api/entries/route.ts
    api/entries/[id]/route.ts
    api/settings/route.ts
  components/
    dashboard/          # Dashboard UI components
    ui/                 # shadcn/ui components
  lib/
    auth.ts             # NextAuth configuration
    googleSheets.ts     # Sheets CRUD with row-level ownership
    settings.ts         # Per-user hourly rate settings
    session.ts          # Session email helpers
    calculations.ts     # Earnings calculations
    format.ts           # Currency and date formatting
  types/
    entry.ts
```

## Scripts

```bash
npm run dev            # Start development server
npm run build          # Production build
npm run start          # Start production server
npm run lint           # Run ESLint
npm run migrate-sheet  # Migrate sheet to User Email column (see above)
```

## License

MIT
# movinghour
