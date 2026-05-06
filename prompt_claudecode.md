Crea una aplicación fullstack de chatbot con IA llamada "AI Chat App" con la siguiente arquitectura, 
inspirada en un proyecto existente que usa FastAPI + Next.js + Supabase:

---

## STACK TECNOLÓGICO

**Backend:** FastAPI (Python), SQLAlchemy 2.x, Pydantic v2, Uvicorn
**Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS 4, TypeScript
**Base de datos:** Supabase (PostgreSQL) vía Session Pooler puerto 5432
**IA:** Anthropic Claude API (claude-sonnet-4-20250514) con streaming de respuestas
**Auth:** JWT HS256 con httpOnly cookies (passlib + bcrypt en backend, jose en frontend)
**Deploy:** Backend en Railway, Frontend en Vercel

---

## ESTRUCTURA DE DIRECTORIOS

### Backend
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, lifespan hooks
│   ├── config.py            # Settings desde .env
│   ├── database.py          # SQLAlchemy engine + sessionmaker
│   ├── api/
│   │   ├── routes_auth.py       # POST /auth/login, GET /auth/me
│   │   ├── routes_users.py      # CRUD usuarios (solo admin)
│   │   ├── routes_chat.py       # POST /chat/message (streaming SSE)
│   │   ├── routes_conversations.py  # CRUD conversaciones
│   │   └── routes_health.py     # GET /health
│   ├── models/
│   │   ├── user.py
│   │   ├── conversation.py
│   │   └── message.py
│   ├── schemas/
│   │   ├── user.py
│   │   ├── conversation.py
│   │   └── message.py
│   └── services/
│       ├── auth_service.py
│       ├── chat_service.py      # Llama Anthropic API con streaming
│       └── conversation_service.py
├── alembic/                 # Migraciones
├── requirements.txt
├── Procfile                 # railway: uvicorn app.main:app --host 0.0.0.0 --port $PORT
└── railway.toml

### Frontend
frontend/
├── app/
│   ├── layout.tsx
│   ├── login/page.tsx           # Página pública de login
│   └── (main)/
│       ├── layout.tsx           # Layout con Sidebar
│       ├── page.tsx             # Redirect a /chat
│       ├── chat/page.tsx        # Chat principal (nueva conversación)
│       ├── chat/[id]/page.tsx   # Conversación existente
│       └── users/page.tsx       # Gestión usuarios (solo admin)
├── components/
│   ├── Sidebar.tsx              # Lista conversaciones + botón nueva
│   ├── ChatWindow.tsx           # Área de mensajes con scroll
│   ├── MessageBubble.tsx        # Burbuja de mensaje (user/assistant)
│   ├── ChatInput.tsx            # Input con botón enviar y Enter
│   └── StreamingText.tsx        # Renderiza respuesta en tiempo real
├── lib/
│   ├── api.ts                   # Cliente HTTP → FastAPI
│   └── auth.ts                  # Lee cookies auth-info
├── types/index.ts
└── middleware.ts                # Verifica JWT en edge (jose)

---

## BASE DE DATOS — ESQUEMA

```sql
users
├── id SERIAL PK
├── username VARCHAR UNIQUE NOT NULL
├── email VARCHAR UNIQUE NOT NULL
├── password_hash VARCHAR NOT NULL
├── role VARCHAR CHECK('admin','user') DEFAULT 'user'
├── is_active BOOLEAN DEFAULT true
├── created_at TIMESTAMP DEFAULT NOW()
└── updated_at TIMESTAMP DEFAULT NOW()

conversations
├── id SERIAL PK
├── user_id INTEGER FK → users
├── title VARCHAR(200)          -- primeras palabras del primer mensaje
├── model VARCHAR DEFAULT 'claude-sonnet-4-20250514'
├── system_prompt TEXT          -- prompt de sistema personalizable
├── created_at TIMESTAMP DEFAULT NOW()
└── updated_at TIMESTAMP DEFAULT NOW()

messages
├── id SERIAL PK
├── conversation_id INTEGER FK → conversations CASCADE DELETE
├── role VARCHAR CHECK('user','assistant')
├── content TEXT NOT NULL
├── tokens_used INTEGER         -- tokens consumidos (de la respuesta API)
├── created_at TIMESTAMP DEFAULT NOW()
```

---

## FLUJO DE AUTENTICACIÓN

Idéntico al proyecto de referencia:
1. Login → FastAPI valida bcrypt → genera JWT HS256
2. Next.js guarda: cookie httpOnly "auth-token" (JWT completo) + cookie legible "auth-info" (base64 JSON con username y role)
3. middleware.ts verifica "auth-token" con jose.jwtVerify() en cada request
4. Rutas protegidas: todo excepto /login
5. Rutas admin: /users

---

## FUNCIONALIDAD DEL CHAT

### Backend — chat_service.py
- Recibe: conversation_id (opcional), mensaje del usuario
- Si no hay conversation_id → crea nueva conversación con título = primeras 6 palabras del mensaje
- Carga historial de mensajes de la conversación desde Supabase
- Llama Anthropic API con streaming:
```python
  with anthropic_client.messages.stream(
      model="claude-sonnet-4-20250514",
      max_tokens=1024,
      system="Eres un asistente útil y amigable.",
      messages=history  # historial completo de la conversación
  ) as stream:
      for text in stream.text_stream:
          yield f"data: {text}\n\n"
```
- Guarda mensaje del usuario y respuesta completa en tabla messages
- Endpoint: POST /chat/message → StreamingResponse (SSE)

### Frontend — ChatWindow.tsx
- Usa fetch con ReadableStream para recibir SSE
- Muestra texto generándose en tiempo real (efecto typewriter)
- Scroll automático al último mensaje
- Deshabilita input mientras genera respuesta
- Botón para detener generación

---

## ENDPOINTS API

### Públicos
- GET  /health
- POST /auth/login

### JWT requerido
- GET  /auth/me
- GET  /conversations                    → lista conversaciones del usuario autenticado
- POST /conversations                    → crear conversación vacía
- GET  /conversations/{id}               → conversación con sus mensajes
- DELETE /conversations/{id}             → eliminar conversación
- PUT  /conversations/{id}/title         → renombrar conversación
- POST /chat/message                     → enviar mensaje (SSE streaming)
  Body: { conversation_id?: int, message: string }

### Admin JWT
- GET    /users
- POST   /users
- PUT    /users/{id}
- DELETE /users/{id}

---

## UI/UX — DISEÑO

El diseño debe ser responsive (mobile-first) e inspirado en ChatGPT / Claude.ai:

**Sidebar (desktop: 260px fijo | mobile: drawer con hamburger)**
- Header: logo "AI Chat" + botón "Nueva conversación" (ícono +)
- Lista de conversaciones del usuario ordenadas por updated_at DESC
- Cada item: título truncado + ícono de borrar al hover
- Footer: nombre de usuario + botón logout

**ChatWindow**
- Área scrollable de mensajes
- Mensaje usuario: burbuja derecha, fondo azul/indigo
- Mensaje asistente: burbuja izquierda, fondo gris claro, con ícono de robot
- Texto del asistente renderiza Markdown (usar react-markdown)
- Estado vacío: pantalla de bienvenida con ejemplos de preguntas clickeables

**ChatInput (sticky bottom)**
- Textarea autoexpandible (1 a 6 líneas)
- Enter para enviar, Shift+Enter para nueva línea
- Botón enviar (ícono de flecha) que se convierte en botón stop durante streaming
- Contador de caracteres opcional

**Responsive breakpoints:**
- Mobile (<768px): sidebar oculto, botón hamburger en header, chat ocupa pantalla completa
- Tablet (768-1024px): sidebar colapsable
- Desktop (>1024px): sidebar siempre visible

---

## VARIABLES DE ENTORNO

### Backend (.env)
DATABASE_URL=postgresql://postgres.xxx:pass@aws-0-xxx.pooler.supabase.com:5432/postgres
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=clave-larga-aleatoria
JWT_EXPIRE_HOURS=24
ADMIN_USERNAME=admin
ADMIN_PASSWORD=contraseña-segura
ADMIN_EMAIL=admin@example.com
ALLOWED_ORIGINS=http://localhost:3000,https://tu-app.vercel.app
APP_ENV=development

### Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
JWT_SECRET=misma-clave-que-backend

---

## SCRIPT DE DESARROLLO

Crea dev.sh en la raíz:
```bash
#!/bin/bash
cd backend && uvicorn app.main:app --reload --port 8000 &
cd frontend && npm run dev &
wait
```

---

## CONSIDERACIONES TÉCNICAS

1. **CORS:** Configurar en FastAPI para aceptar el origen de Vercel y localhost:3000
2. **Streaming SSE:** El endpoint /chat/message debe retornar StreamingResponse con media_type="text/event-stream" y headers Cache-Control: no-cache
3. **Historial de contexto:** Enviar siempre los últimos 20 mensajes de la conversación a la API de Claude para mantener contexto
4. **Supabase connection:** Usar prepare_threshold=None en connect_args para evitar errores con PgBouncer
5. **Railway deploy:** Incluir Procfile con el comando uvicorn y railway.toml con healthcheckPath = "/health"
6. **Vercel deploy:** next.config.ts debe tener rewrites para proxear /api/* al backend Railway en producción
7. **Admin inicial:** Crear usuario admin automáticamente en el lifespan startup si no existe
8. **react-markdown:** Instalar para renderizar respuestas con formato Markdown del asistente
9. **Tokens:** Guardar usage.output_tokens de la respuesta Anthropic en la columna tokens_used de messages

---

Genera todos los archivos necesarios para que el proyecto funcione con `bash dev.sh`. 
Incluye README.md con instrucciones de instalación y configuración de variables de entorno.