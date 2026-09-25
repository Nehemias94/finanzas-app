#!/bin/sh
# La línea de arriba indica que este archivo se ejecuta con el intérprete "sh" de Linux

# set -e: si cualquier comando falla, el script se detiene
# Así, si las migraciones fallan, el servidor NO arranca con la base de datos a medias
set -e

# Guarda toda la configuración en un solo archivo en caché (arranque más rápido)
# Se hace AQUÍ, y no en el Dockerfile, porque las variables de entorno de Render
# (contraseña de la base de datos, APP_KEY...) solo existen cuando el contenedor arranca
php artisan config:cache

# Lo mismo con las rutas
php artisan route:cache

# Ejecuta las migraciones pendientes en Supabase
# --force es obligatorio en producción: sin él, Laravel pide confirmación y se quedaría esperando
php artisan migrate --force

# Arranca Apache. "exec" hace que Apache reemplace a este script como proceso principal,
# así Render puede detenerlo correctamente cuando publique una nueva versión
exec apache2-foreground