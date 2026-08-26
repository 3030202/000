# 🐳 Руководство по развертыванию: Docker & VPS Deployment Guide

Полное руководство по сборке, запуску и эксплуатации **000-Mission-Control** в Docker-контейнерах и на серверах VPS (Ubuntu, Debian, CentOS, AlmaLinux, Arch).

---

## 📑 Содержание

1. [Архитектура развертывания (Deployment Topology)](#1-архитектура-развертывания-deployment-topology)
2. [Быстрый запуск на VPS за 2 минуты (Quick Start)](#2-быстрый-запуск-на-vps-за-2-минуты-quick-start)
3. [Ручной запуск через Docker Compose (Manual Setup)](#3-ручной-запуск-через-docker-compose-manual-setup)
4. [Автономный запуск Standalone (без Caddy)](#4-автономный-запуск-standalone-без-caddy)
5. [Настройка доменов, DNS и Cloudflare](#5-настройка-доменов-dns-и-cloudflare)
6. [Регламенты обслуживания и команды SRE (Ops Runbook)](#6-регламенты-обслуживания-и-команды-sre-ops-runbook)
7. [Устранение неполадок (Troubleshooting)](#7-устранение-неполадок-troubleshooting)

---

## 1. Архитектура развертывания (Deployment Topology)

Стек развертывания состоит из двух изолированных контейнеров, объединенных в сеть `000-net`:

```
+─────────────────────────────────────────────────────────────────────────────+
|                               ИНТЕРНЕТ / КЛИЕНТ                             |
+───────────────────────────────────────┬─────────────────────────────────────+
                                        │ HTTPS :443 (HTTP/3 QUIC) / HTTP :80
                                        ▼
+─────────────────────────────────────────────────────────────────────────────+
|  [CADDY EDGE REVERSE PROXY] (caddy:2.8-alpine)                              |
|  • Автоматический выпуск Let's Encrypt / ZeroSSL сертификатов              |
|  • Авто-редирект HTTP (80) -> HTTPS (443)                                   |
|  • Заголовки безопасности: HSTS, nosniff, SAMEORIGIN, Referrer-Policy       |
|  • Высокоскоростное сжатие zstd + gzip                                      |
+───────────────────────────────────────┬─────────────────────────────────────+
                                        │ Внутренняя сеть bridge (000-net:80)
                                        ▼
+─────────────────────────────────────────────────────────────────────────────+
|  [000-MISSION-CONTROL APP] (nginx:1.27-alpine < 25MB)                       |
|  • Скомпилированный React 19 + TypeScript + Vite бандл                     |
|  • Маршрутизация Single Page Application (try_files $uri /index.html)       |
|  • Кэширование статических ассетов /assets/ (1 год, immutable)              |
|  • Встроенный Healthcheck-зонд (/ || exit 1)                                |
+─────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Быстрый запуск на VPS за 2 минуты (Quick Start)

На вашем VPS сервере (Ubuntu / Debian / CentOS / AlmaLinux) выполните:

```bash
# 1. Клонируйте репозиторий на сервер
git clone https://github.com/3030202/000.git /opt/000
cd /opt/000

# 2. Запустите автоматический интерактивный мастер установки
sudo ./scripts/deploy-vps.sh
```

### Что сделает скрипт `deploy-vps.sh`:
- Проверит наличие `docker` и `docker compose` (и автоматически установит официальный Docker Engine при необходимости).
- Запросит ваш публичный домен (например, `000.yourdomain.com`) и контактный email.
- Сгенерирует файл `.env`.
- Соберет оптимизированный образ `000_app` и поднимет Caddy прокси с автоматическим получением бесплатного SSL-сертификата Let's Encrypt.
- Проверит статус здоровья и выведет готовую ссылку.

---

## 3. Ручной запуск через Docker Compose (Manual Setup)

Если вы предпочитаете ручной контроль:

### Шаг 1: Конфигурация переменных
Создайте файл `.env` из примера:
```bash
cp .env.example .env
```
Отредактируйте `.env`:
```ini
DOMAIN_NAME=000.yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
PORT=3000
```

### Шаг 2: Сборка и запуск
```bash
# Сборка multi-stage образов и старт в фоне
docker compose up -d --build
```

### Шаг 3: Проверка статуса
```bash
docker compose ps
```
Ожидаемый вывод:
```
NAME         IMAGE              COMMAND                  SERVICE   CREATED          STATUS                    PORTS
000_app      000-app            "/docker-entrypoint.…"   app       10 seconds ago   Up 9 seconds (healthy)    80/tcp
000_caddy    caddy:2.8-alpine   "caddy run --config …"   caddy     9 seconds ago    Up 8 seconds              0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

---

## 4. Автономный запуск Standalone (без Caddy)

Используйте этот режим, если:
- Сервер уже находится за внешним прокси (**Nginx Proxy Manager**, **Traefik**, **Cloudflare Tunnel**);
- Требуется запустить дашборд локально на порту `3000` без выпуска SSL.

```bash
# Запуск одиночного контейнера на порту 3000:
docker compose -f docker-compose.standalone.yml up -d --build
```

Панель станет доступна по адресу:
- `http://localhost:3000`
- `http://000.localhost:3000`

---

## 5. Настройка доменов, DNS и Cloudflare

### 5.1. Стандартный DNS (A-запись):
Создайте DNS-запись у вашего регистратора:
```
Тип: A
Имя: 000 (или @)
Значение: <IP-АДРЕС_ВАШЕГО_VPS>
TTL: Auto / 300
```

### 5.2. При использовании Cloudflare (Режим CDN / WAF):
- **SSL/TLS Encryption Mode**: Установите в режим **Full** или **Full (Strict)**.
- **Proxy Status**: Оранжевое облако (**Proxied**) активно.
- Caddy успешно получит origin-сертификат, а Cloudflare обеспечит DDoS-защиту и кэширование статики на Edge.

---

## 6. Регламенты обслуживания и команды SRE (Ops Runbook)

### 🔄 Бесшовное обновление до новой версии (Zero-Downtime Update):
```bash
# Автоматический скрипт:
./scripts/update-vps.sh

# Либо вручную:
git pull origin main
docker compose build --no-cache app
docker compose up -d --no-deps app
```

### 📜 Просмотр журналов в реальном времени:
```bash
# Логи всего стека:
docker compose logs -f

# Логи веб-сервера Caddy (SSL запросы, HTTP коды):
docker compose logs -f caddy

# Логи статического контейнера App:
docker compose logs -f app
```

### 💾 Резервное копирование SSL-сертификатов Caddy:
Сертификаты Let's Encrypt сохраняются в постоянном томе `000_caddy_data`. Для создания бэкапа:
```bash
docker run --rm -v 000_caddy_data:/data -v $(pwd):/backup alpine tar czf /backup/caddy_certs_backup.tar.gz /data
```

---

## 7. Устранение неполадок (Troubleshooting)

| Проблема | Причина | Решение |
|---|---|---|
| **Port 80/443 already in use** | На сервере уже запущен Apache или системный Nginx | Остановите конфликтную службу: `sudo systemctl stop nginx` или `sudo systemctl stop apache2`, либо используйте `docker-compose.standalone.yml` на порту 3000. |
| **SSL Certificate Error (Pending)** | Домен еще не указывает на IP сервера | Проверьте `dig +short A 000.yourdomain.com` и убедитесь, что порт 80 открыт в фаерволе (`sudo ufw allow 80/tcp && sudo ufw allow 443/tcp`). |
| **Blank Screen / 404 on refresh** | Отсутствует SPA fallback в Nginx | Проверьте, что в `nginx.conf` активна директива `try_files $uri $uri/ /index.html;`. |
| **CORS upon external API calls** | Запросы к Telegram/Cloudflare блокируются браузером | Убедитесь, что запросы к Telegram/Cloudflare выполняются через HTTPS на зарегистрированные API-эндпоинты. |
