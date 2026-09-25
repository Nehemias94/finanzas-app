# ------------------------------------------------------------
# BASE: Linux con PHP 8.3 y el servidor web Apache ya instalados
# Es una imagen oficial de PHP, mantenida por la comunidad de Docker
# ------------------------------------------------------------
FROM php:8.3-apache

# ------------------------------------------------------------
# PAQUETES DEL SISTEMA Y EXTENSIONES DE PHP
# ------------------------------------------------------------
# libpq-dev: librería que necesita PHP para hablar con PostgreSQL (Supabase)
# unzip y git: los usa Composer para descargar paquetes
# Al final borramos la lista de paquetes descargada para que la imagen pese menos
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev unzip git \
    && rm -rf /var/lib/apt/lists/*

# pdo_pgsql: el mismo driver que activaste en XAMPP en el Paso 2
# opcache: el mismo que activaste para acelerar PHP
RUN docker-php-ext-install pdo_pgsql opcache

# ------------------------------------------------------------
# CONFIGURACIÓN DE PHP PARA PRODUCCIÓN
# ------------------------------------------------------------
# La imagen trae dos php.ini de ejemplo: uno para desarrollo y otro para producción
# Usamos el de producción, que oculta los errores al público
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Configuración de OPcache:
# validate_timestamps=0 = no revisar si los archivos cambiaron
# En un contenedor el código NUNCA cambia mientras corre, así que esa revisión sería trabajo inútil
RUN { \
      echo 'opcache.enable=1'; \
      echo 'opcache.memory_consumption=128'; \
      echo 'opcache.max_accelerated_files=10000'; \
      echo 'opcache.validate_timestamps=0'; \
    } > "$PHP_INI_DIR/conf.d/opcache.ini"

# ------------------------------------------------------------
# CONFIGURACIÓN DE APACHE
# ------------------------------------------------------------
# Laravel debe servirse desde la carpeta "public", no desde la raíz del proyecto
# (así nadie puede descargar tu .env ni tu código desde el navegador)
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

# 1. Cambia la carpeta raíz de Apache a "public"
# 2. AllowOverride All: permite que funcione el archivo public/.htaccess de Laravel,
#    que dirige todas las rutas a index.php y deja pasar el encabezado Authorization (el token)
# 3. a2enmod rewrite: activa el módulo que usa ese .htaccess
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf \
    && sed -ri -e 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf \
    && a2enmod rewrite

# Render le indica a la app en qué puerto escuchar mediante la variable PORT
# Apache normalmente usa el puerto 80; lo cambiamos para que use ${PORT}
# Apache lee el valor de la variable cuando arranca. Por defecto usamos 8080
ENV PORT=8080
RUN sed -i 's/Listen 80/Listen ${PORT}/' /etc/apache2/ports.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/' /etc/apache2/sites-available/000-default.conf

# ------------------------------------------------------------
# COMPOSER
# ------------------------------------------------------------
# Copiamos el programa composer desde su imagen oficial, en vez de instalarlo a mano
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Carpeta de trabajo: aquí vivirá tu proyecto dentro del contenedor
WORKDIR /var/www/html

# Primero copiamos SOLO los archivos de dependencias e instalamos
# Truco de Docker: cada paso se guarda en caché. Si solo cambias tu código,
# pero no composer.json, Docker reutiliza este paso y la construcción es mucho más rápida
# --no-dev: no instala las herramientas de desarrollo (no se necesitan en producción)
# --no-scripts y --no-autoloader: se ejecutan después, cuando ya esté copiado todo el código
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# Ahora sí, copiamos todo el proyecto (excepto lo que diga .dockerignore)
COPY . .

# Genera el autoloader optimizado (el "índice" de todas las clases del proyecto)
RUN composer dump-autoload --optimize --no-dev

# Laravel necesita estas carpetas para escribir archivos temporales
# Las creamos (por si no vinieron) y se las damos al usuario de Apache (www-data)
RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views \
      storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

# Damos permiso de ejecución al script de arranque
RUN chmod +x docker/start.sh

# ------------------------------------------------------------
# ARRANQUE
# ------------------------------------------------------------
# Comando que se ejecuta cada vez que el contenedor arranca
CMD ["docker/start.sh"]