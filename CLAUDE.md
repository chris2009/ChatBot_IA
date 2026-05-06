# CLAUDE.md — AI Chat App

## Reglas de flujo de trabajo

Por cada avance significativo:
1. Actualizar memoria del proyecto (`~/.claude/projects/.../memory/`)
2. Actualizar este archivo (`CLAUDE.md`)
3. Actualizar `README.md` si corresponde
4. Hacer `git commit` — **NO hacer `git push`**, el usuario hace el push manualmente

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI + SQLAlchemy 2 + Pydantic v2 |
| Frontend | Next.js 15 (App Router) + React 19 + Tailwind CSS 4 |
| Base de datos | Supabase (PostgreSQL) via Session Pooler puerto 5432 |
| IA | Anthropic Claude API (`claude-sonnet-4-20250514`) streaming SSE |
| Auth | JWT HS256 con httpOnly cookies |
| Deploy | Backend → Railway, Frontend → Vercel |

---

## Estructura del proyecto

```
ChatBot_IA/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app, CORS, lifespan
│   │   ├── config.py         # Pydantic Settings desde .env
│   │   ├── database.py       # SQLAlchemy + prepare_threshold=None (PgBouncer)
│   │   ├── api/              # routes_auth, routes_chat, routes_conversations, routes_users, routes_health
│   │   ├── models/           # User, Conversation, Message (SQLAlchemy)
│   │   ├── schemas/          # Pydantic v2 schemas
│   │   └── services/         # auth_service, chat_service, conversation_service
│   ├── alembic/              # Migraciones
│   ├── requirements.txt
│   ├── Procfile              # Railway deploy
│   └── railway.toml
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css       # Estilos base + .markdown-body (sin @tailwindcss/typography)
│   │   ├── login/page.tsx
│   │   └── (main)/
│   │       ├── layout.tsx    # SidebarProvider + LayoutInner
│   │       ├── chat/page.tsx
│   │       ├── chat/[id]/page.tsx   # Client component (fetch con cookies del browser)
│   │       └── users/page.tsx
│   ├── components/
│   │   ├── Sidebar.tsx       # Responsive drawer/fixed, consume SidebarContext
│   │   ├── ChatWindow.tsx    # Streaming SSE, usa useSidebar() para refresh
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   └── StreamingText.tsx # react-markdown + remark-gfm
│   ├── context/
│   │   └── SidebarContext.tsx  # triggerRefresh() compartido entre ChatWindow y Sidebar
│   ├── lib/
│   │   ├── api.ts            # Cliente HTTP + streamChat() via ReadableStream
│   │   └── auth.ts           # Lee cookie auth-info (base64 JSON)
│   ├── middleware.ts          # JWT verify con jose en edge runtime
│   └── types/index.ts
├── dev.sh                    # Arranca backend + frontend localmente
└── CLAUDE.md                 # Este archivo
```

---

## Decisiones técnicas importantes

- `prepare_threshold=None` en `connect_args` — requerido para Supabase/PgBouncer
- `[id]/page.tsx` es **client component** — el fetch server-side no puede acceder a las cookies httpOnly
- Los estilos Markdown usan la clase `.markdown-body` con CSS manual (no `@tailwindcss/typography`)
- El sidebar refresh usa `SidebarContext` con `triggerRefresh()` — evita prop drilling
- Streaming SSE: los saltos de línea se escapan como `\n` en el stream y se restauran en el cliente
- El backend crea el usuario admin automáticamente en el `lifespan` startup

---

## Variables de entorno requeridas

### backend/.env
```
DATABASE_URL=postgresql://...supabase.com:5432/postgres
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=clave-32+-caracteres
JWT_EXPIRE_HOURS=24
ADMIN_USERNAME=admin
ADMIN_PASSWORD=...
ADMIN_EMAIL=...
ALLOWED_ORIGINS=http://localhost:3000
APP_ENV=development
```

### frontend/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:8000
JWT_SECRET=misma-clave-que-backend
```

---

## Base de datos — SQL para crear tablas en Supabase

Ejecutar en **Supabase Dashboard → SQL Editor → New query**:

```sql
-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR NOT NULL UNIQUE,
    email         VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    role          VARCHAR NOT NULL DEFAULT 'user',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);

-- 2. CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         VARCHAR(200) NOT NULL DEFAULT 'Nueva conversación',
    model         VARCHAR NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    system_prompt TEXT NOT NULL DEFAULT 'Eres un asistente útil y amigable.',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations (user_id);

-- 3. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id              SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            VARCHAR NOT NULL,
    content         TEXT NOT NULL,
    tokens_used     INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
```

> El usuario admin se crea automáticamente en el `lifespan` startup del backend — no insertar manualmente.

---

## Guía de deploy — Variables de entorno en producción

### Railway (Backend)

1. Ir a [railway.app](https://railway.app) → tu proyecto → servicio del backend
2. Pestaña **Variables** → botón **New Variable** (o importar desde `.env`)
3. Agregar una por una:

| Variable | Valor en producción |
|----------|-------------------|
| `DATABASE_URL` | `postgresql://...supabase.com:5432/postgres` (Session Pooler) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `JWT_SECRET` | cadena aleatoria ≥32 caracteres (igual que en Vercel) |
| `JWT_EXPIRE_HOURS` | `24` |
| `ADMIN_USERNAME` | tu usuario admin |
| `ADMIN_PASSWORD` | contraseña segura |
| `ADMIN_EMAIL` | email del admin |
| `ALLOWED_ORIGINS` | `https://tu-app.vercel.app` (URL de Vercel, sin slash final) |
| `APP_ENV` | `production` |

4. Railway redeploya automáticamente al guardar variables.
5. Copiar la URL pública del servicio (ej. `https://chatbot-backend.up.railway.app`) — la necesitarás en Vercel.

> **Nota CORS:** `ALLOWED_ORIGINS` debe ser exactamente la URL de Vercel sin slash final. Si tienes dominio custom, agrégalo también separado por coma: `https://tudominio.com,https://tu-app.vercel.app`

---

### Vercel (Frontend)

1. Ir a [vercel.com](https://vercel.com) → tu proyecto → **Settings** → **Environment Variables**
2. Agregar:

| Variable | Valor | Entornos |
|----------|-------|----------|
| `NEXT_PUBLIC_API_URL` | `https://chatbot-backend.up.railway.app` (URL de Railway, sin slash final) | Production, Preview, Development |
| `JWT_SECRET` | misma cadena que usaste en Railway | Production, Preview, Development |

3. Ir a **Deployments** → redeploy el último deploy para que tome las nuevas variables.

> **`NEXT_PUBLIC_`** el prefijo hace que la variable sea accesible en el browser (client-side). `JWT_SECRET` NO lleva ese prefijo porque solo se usa en el `middleware.ts` (edge runtime server-side).

---

### Orden recomendado de configuración

```
1. Configurar variables en Railway → obtener URL del backend
2. Configurar variables en Vercel con esa URL → obtener URL del frontend
3. Actualizar ALLOWED_ORIGINS en Railway con la URL de Vercel
4. Redeploy Railway para aplicar el CORS actualizado
```

---

## Credenciales de acceso

El usuario admin se crea automáticamente en el `lifespan` startup. Las credenciales son las variables de entorno:

| Variable | Dónde está |
|----------|-----------|
| `ADMIN_USERNAME` | Railway (producción) o `backend/.env` (local) |
| `ADMIN_PASSWORD` | Railway (producción) o `backend/.env` (local) |

No hay credenciales hardcodeadas — el usuario usa lo que configuró en sus variables de entorno.

---

## Deploy — Directorios raíz

| Plataforma | Root Directory |
|------------|---------------|
| Railway | `backend` |
| Vercel | `frontend` |

Ambas plataformas deben apuntar a su subdirectorio correspondiente, no a la raíz del repo.

---

## Estado actual

- [x] Backend completo (auth, chat streaming, conversations, users)
- [x] Frontend completo (login, chat, sidebar, users admin)
- [x] TypeScript sin errores (`tsc --noEmit` limpio)
- [x] Build de producción exitoso (`next build` OK)
- [x] Repositorio GitHub inicializado
- [ ] Variables de entorno configuradas (pendiente del usuario)
- [ ] Deploy en Railway / Vercel (pendiente)
