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

## URLs utiles

| Servicio | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| Health check | http://localhost:8000/health |

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

### Backend → Railway

1. Conectar el repositorio en Railway
2. Configurar las variables de entorno del backend
3. Railway detecta `railway.toml` automaticamente

### Frontend → Vercel

1. Conectar el repositorio en Vercel
2. Configurar:
   - `NEXT_PUBLIC_API_URL` = URL del backend en Railway
   - `JWT_SECRET` = misma clave que el backend
3. Actualizar `ALLOWED_ORIGINS` en el backend con la URL de Vercel

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
