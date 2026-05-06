# AI Chat App

Aplicacion fullstack de chatbot con IA usando FastAPI + Next.js + Supabase + Claude.

## Stack

- **Backend:** FastAPI, SQLAlchemy 2, Pydantic v2, Uvicorn
- **Frontend:** Next.js 15, React 19, Tailwind CSS 4, TypeScript
- **Base de datos:** Supabase (PostgreSQL via Session Pooler)
- **IA:** Anthropic Claude API con streaming SSE
- **Auth:** JWT HS256 con httpOnly cookies

## Requisitos previos

- Python 3.11+
- Node.js 20+
- Cuenta en [Supabase](https://supabase.com) con proyecto creado
- API Key de [Anthropic](https://console.anthropic.com)

## Configuracion

### 1. Backend

```bash
cp backend/.env.example backend/.env
```

Editar `backend/.env`:

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=genera-una-clave-larga-y-aleatoria-aqui
JWT_EXPIRE_HOURS=24
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu-contraseña-segura
ADMIN_EMAIL=admin@tudominio.com
ALLOWED_ORIGINS=http://localhost:3000
APP_ENV=development
```

> El `DATABASE_URL` se obtiene en Supabase → Project Settings → Database → Session Pooler (puerto 5432).

### 2. Frontend

```bash
cp frontend/.env.local.example frontend/.env.local
```

Editar `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
JWT_SECRET=misma-clave-que-backend
```

## Desarrollo local

```bash
bash dev.sh
```

Esto:
1. Crea el entorno virtual Python e instala dependencias si no existen
2. Instala dependencias npm si no existen
3. Levanta el backend en `http://localhost:8000`
4. Levanta el frontend en `http://localhost:3000`

El usuario admin se crea automaticamente al iniciar el backend.

## Credenciales de acceso

El usuario admin se crea automáticamente al iniciar el backend con las variables de entorno que configuraste:

| Campo | Valor |
|-------|-------|
| Usuario | el valor de `ADMIN_USERNAME` que pusiste en Railway / `.env` |
| Contraseña | el valor de `ADMIN_PASSWORD` que pusiste en Railway / `.env` |

> Si estás en local, son los valores de `backend/.env`. En producción, los que configuraste en Railway.

---

## URLs utiles

| Servicio | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| Health check | http://localhost:8000/health |

## Base de datos — Crear tablas en Supabase

Ir a **Supabase Dashboard → SQL Editor → New query**, pegar y ejecutar:

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

> El usuario admin se crea automáticamente al iniciar el backend — no hace falta insertar nada.

---

## Migraciones (Alembic)

```bash
cd backend
source .venv/bin/activate

# Crear migracion
alembic revision --autogenerate -m "descripcion"

# Aplicar migraciones
alembic upgrade head
```

> En desarrollo, las tablas se crean automaticamente al iniciar el servidor via `Base.metadata.create_all()`.

## Deploy

### Orden de configuración

```
1. Crear tablas en Supabase (SQL Editor)
2. Configurar variables en Railway → obtener URL del backend
3. Configurar variables en Vercel con esa URL → obtener URL del frontend
4. Actualizar ALLOWED_ORIGINS en Railway con la URL de Vercel
5. Redeploy Railway para aplicar el CORS actualizado
```

### Backend → Railway

1. Conectar el repositorio en Railway
2. Pestaña **Variables** → agregar:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Session Pooler URL de Supabase (puerto 5432) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `JWT_SECRET` | cadena aleatoria ≥32 caracteres |
| `JWT_EXPIRE_HOURS` | `24` |
| `ADMIN_USERNAME` | tu usuario admin |
| `ADMIN_PASSWORD` | contraseña segura |
| `ADMIN_EMAIL` | email del admin |
| `ALLOWED_ORIGINS` | `https://tu-app.vercel.app` (sin slash final) |
| `APP_ENV` | `production` |

3. Railway redeploya automáticamente al guardar.

### Frontend → Vercel

1. Conectar el repositorio en Vercel
2. **Settings → Environment Variables** → agregar:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | URL de Railway (sin slash final) |
| `JWT_SECRET` | misma clave que en Railway |

3. Redeploy para aplicar los cambios.

## Estructura

```
ChatBot_IA/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── api/          # Routes
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic
│   ├── alembic/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   ├── lib/              # API client + auth utils
│   ├── types/            # TypeScript types
│   └── middleware.ts     # JWT verification
└── dev.sh
```
