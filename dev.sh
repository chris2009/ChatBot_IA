#!/bin/bash
set -e

echo "Iniciando AI Chat App..."

# Backend
cd backend
if [ ! -d ".venv" ]; then
  echo "Creando entorno virtual Python..."
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt -q
echo "Backend: iniciando en http://localhost:8000"
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Frontend
cd frontend
if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias npm..."
  npm install
fi
echo "Frontend: iniciando en http://localhost:3000"
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "Servicios activos:"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Presiona Ctrl+C para detener ambos servicios."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servicios detenidos.'" EXIT
wait
