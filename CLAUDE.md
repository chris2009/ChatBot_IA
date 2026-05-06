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

## Estado actual

- [x] Backend completo (auth, chat streaming, conversations, users)
- [x] Frontend completo (login, chat, sidebar, users admin)
- [x] TypeScript sin errores (`tsc --noEmit` limpio)
- [x] Build de producción exitoso (`next build` OK)
- [x] Repositorio GitHub inicializado
- [ ] Variables de entorno configuradas (pendiente del usuario)
- [ ] Deploy en Railway / Vercel (pendiente)
