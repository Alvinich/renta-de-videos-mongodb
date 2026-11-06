#!/usr/bin/env bash
# Ejecuta los 4 scripts en orden contra el MongoDB indicado (por defecto, local).
# Uso:  ./ejecutar_todo.sh
#       MONGO_URI="mongodb://usuario:clave@host:27017" ./ejecutar_todo.sh
set -e

URI="${MONGO_URI:-mongodb://localhost:27017}"

for script in scripts/01_crear.js scripts/02_llenar.js scripts/03_consultas.js scripts/04_actualizar_eliminar.js; do
  echo
  echo "############ $script ############"
  mongosh "$URI" --quiet --file "$script"
done
