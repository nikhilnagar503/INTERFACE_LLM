# DATABASE INTEGRATION - COMPLETE SETUP GUIDE

## ✅ What We've Done

Successfully migrated from localStorage to Supabase database for:
- **Chat Sessions** - All conversations now persist across devices
- **Chat Messages** - Full message history with role tracking
- **User Prompts** - Custom prompts saved to database
- **System Prompts** - Built-in templates seeded in database
- **Profiles** - User metadata storage

**API Keys remain secure** - Provider API keys (OpenAI, Anthropic, etc.) are **NOT** stored in the database. They remain in localStorage or backend secrets.

---

## 🚀 Setup Steps

### 1. Run the Schema in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Open `infra/supabase/schema.sql` and copy all the contents
5. Paste into the SQL Editor and click **Run**
6. Verify tables created: `profiles`, `chat_sessions`, `chat_messages`, `prompts`

### 2. Seed System Prompts

1. In Supabase SQL Editor, open `infra/supabase/seed_prompts.sql`
2. Copy and paste the entire content
3. Click **Run** to insert the 7 built-in prompt templates
4. Verify: Run `SELECT count(*) FROM prompts WHERE is_system = true;` (should return 7)

### 3. Configure Environment Variables

#### Frontend (.env)
Create `frontend/.env` (copy from `.env.example`):
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
REACT_APP_API_URL=http://localhost:5000
```

Get these values from: Supabase Dashboard → Settings → API

#### Backend (.env)
Create `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## 📊 Database Schema Overview

### Tables Created

1. **profiles** - User profile metadata
   - `user_id` → References auth.users
   - `display_name`, `avatar_url`

2. **chat_sessions** - Conversation containers
   - `id` (UUID), `user_id`, `title`, `model_used`
   - `message_count`, `last_message_at`, `is_archived`

3. **chat_messages** - Individual messages
   - `id` (UUID), `session_id`, `user_id`
   - `role` (user/assistant/system/error)
   - `content`, `model`, `tokens_used`, `metadata`

4. **prompts** - User & system prompts
   - `id` (UUID), `user_id`, `title`, `description`, `content`
   - `tags` (array), `is_public`, **`is_system`** (for built-ins)

### Row-Level Security (RLS)

All tables have RLS enabled:
- Users can only read/write their own data (`user_id = auth.uid()`)
- System prompts (`is_system = true`) are readable by everyone
- Public prompts (`is_public = true`) are readable by everyone
- Messages are protected via session ownership

---

## 🔄 Data Flow

### Before (localStorage)
```
User → ChatInterface → localStorage → [lost on clear/device switch]
```

### After (Supabase)
```
User → ChatInterface → databaseAPI → Supabase (PostgreSQL)
                    ↓
                localStorage (cache only)
```

### What's Stored Where

| Data Type | Supabase | localStorage |
|-----------|----------|--------------|
| Chat Sessions | ✅ Primary | Cache only |
| Chat Messages | ✅ Primary | Cache only |
| User Prompts | ✅ Primary | Fallback |
| System Prompts | ✅ Primary | - |
| Provider API Keys | ❌ Never | ✅ Yes |
| User Avatar | Metadata | Cache |

---

## 🧪 Testing the Integration

### 1. Test Authentication
```bash
cd frontend
npm start
```
- Sign up / Sign in
- Verify session persists on refresh

### 2. Test Chat Persistence
- Start a new chat
- Send a message
- **Close browser** completely
- Reopen and sign in
- ✅ Chat history should be there

### 3. Test Prompts
- Go to Prompt Library (click floating ✦ button)
- Click "Browse prompts" → Should see 7 system prompts
- Import one → Should save to your library
- Create a custom prompt → Should persist on reload

### 4. Verify in Supabase Dashboard
- Go to **Table Editor**
- Check `chat_sessions` → Your sessions should appear
- Check `chat_messages` → Messages should be linked to sessions
- Check `prompts` → Your custom prompts + system prompts

---

## 🐛 Troubleshooting

### "Failed to load prompts"
- Check `.env` has correct `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
- Verify RLS policies are created (check schema.sql ran successfully)
- Check browser console for detailed error

### "No authenticated session found"
- Sign out and sign in again
- Clear localStorage: `localStorage.clear()` in browser console
- Check Supabase Dashboard → Authentication → Users (user should exist)

### Messages not saving
- Check `chat_sessions` table has a row for your session
- Verify the session `id` matches in both tables
- Check browser Network tab for failed POST requests

### System prompts not showing
- Re-run `seed_prompts.sql` in Supabase SQL Editor
- Verify: `SELECT * FROM prompts WHERE is_system = true;`
- Check RLS policy allows reading system prompts

---

## 🔐 Security Notes

1. **API Keys** - Provider API keys (OpenAI, Anthropic, etc.) are **NOT** stored in Supabase
   - Remain in localStorage (frontend)
   - Or backend environment variables
   - Never exposed in database queries

2. **Row-Level Security** - Every query is filtered by `auth.uid()`
   - Users cannot read other users' chats/prompts
   - System prompts are explicitly marked public

3. **Anon Key** - Safe to expose in frontend
   - Limited permissions (defined by RLS)
   - Service role key should NEVER be in frontend

---

## 📝 Code Changes Summary

### Files Modified

1. **infra/supabase/schema.sql** - Database schema + RLS policies
2. **infra/supabase/seed_prompts.sql** - System prompt templates
3. **frontend/src/lib/databaseAPI.js** - Added `promptsAPI` methods
4. **frontend/src/features/prompts/PromptLibrary.jsx** - Load/save prompts from Supabase
5. **frontend/src/features/prompts/PromptMarketplace.jsx** - Fetch system prompts from Supabase
6. **frontend/src/features/chat/ChatInterface.jsx** - Save messages to Supabase
7. **frontend/src/app/App.jsx** - Load sessions/messages from Supabase
8. **frontend/.env.example** - Environment variable template

### New Features

- ✅ Multi-device chat sync
- ✅ Persistent message history
- ✅ Built-in prompt marketplace (database-backed)
- ✅ User prompt library with cloud sync
- ✅ Session management with timestamps
- ✅ Automatic data migration (localStorage → Supabase)

---

## 🎯 Next Steps

1. Run the schema and seed scripts in Supabase
2. Configure `.env` files with your Supabase credentials
3. Test the integration (sign in → chat → reload → verify persistence)
4. Optional: Remove localStorage fallbacks once confident in Supabase
5. Optional: Add pagination for large message histories
6. Optional: Implement message search across sessions

---

## 📚 Supabase Resources

- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- JavaScript Client: https://supabase.com/docs/reference/javascript/introduction

**Your database is ready! 🎉**
