# 🧬 Спецификация API, типов и структур данных: 000-Mission-Control

В данном документе приведена детальная спецификация всех моделей данных, TypeScript интерфейсов, форматов криптографических пейлоадов, команд встроенного CLI-терминала и схемы хранения в `localStorage`.

---

## 📑 Содержание

1. [TypeScript Интерфейсы (Core Data Types)](#1-typescript-интерфейсы-core-data-types)
2. [Криптографический формат (EncryptedPayload)](#2-криптографический-формат-encryptedpayload)
3. [Спецификация команд CLI-терминала (Terminal Commands)](#3-спецификация-команд-cli-терминала-terminal-commands)
4. [Схема постоянного хранилища (LocalStorage Schema)](#4-схема-постоянного-хранилища-localstorage-schema)
5. [Спецификация быстрого тулбокса (Floating Tools)](#5-спецификация-быстрого-тулбокса-floating-tools)

---

## 1. TypeScript Интерфейсы (Core Data Types)

Все типы определены в [`src/types/index.ts`](file:///home/mx/000/src/types/index.ts).

### 1.1. Окружение и статусы сервисов
```typescript
export type Environment = 'production' | 'staging' | 'development' | 'infra' | 'internal';

export type ServiceStatus = 'operational' | 'degraded' | 'down' | 'checking' | 'unknown';

export type DefconLevel = 5 | 4 | 3 | 2 | 1;
```

### 1.2. Проект и сервис (`ProjectItem`)
```typescript
export interface ProjectLink {
  label: string;
  url: string;
  type: 'web' | 'repo' | 'api' | 'docs' | 'ci' | 'cloud' | 'analytics' | 'db' | 'terminal';
}

export interface ProjectItem {
  id: string;
  name: string;
  tagline: string;
  category: 'Fullstack' | 'AI & LLM' | 'Backend API' | 'Mobile & Web' | 'Cloud Infra' | 'DevOps & CI/CD';
  env: Environment;
  status: ServiceStatus;
  latency?: number;           // RTT в миллисекундах
  healthUrl?: string;         // URL эндпоинта проверки здоровья
  tags: string[];             // Технологические теги (например, ['React', 'GCP', 'TypeScript'])
  links: ProjectLink[];       // Список внешних ссылок
  updatedAt: string;          // ISO Timestamp последнего обновления
  description: string;        // Развернутое описание сервиса
  starred?: boolean;          // Флаг избранного для виджета A3
}
```

### 1.3. Секрет и ключ доступа (`SecretItem`)
```typescript
export type SecretCategory = 
  | 'API Key' 
  | 'OAuth / Token' 
  | 'SSH / RSA Key' 
  | 'Database Connection' 
  | 'Webhook Secret' 
  | 'Cloud Credentials';

export interface SecretItem {
  id: string;
  name: string;
  category: SecretCategory;
  value: string;              // Открытое значение в расшифрованном состоянии
  maskedValue?: string;       // Замаскированное представление (••••••••)
  env: Environment;
  service: string;            // Название сервиса (например, "Stripe", "Supabase")
  tags: string[];
  description: string;
  expiresAt?: string;         // Дата истечения срока действия (ISO Date)
  isRevealed?: boolean;       // Открыто ли отображение значения
  lastCopiedAt?: string;      // Дата последнего копирования в буфер
}
```

### 1.4. Релизный артефакт (`ArtifactItem`)
```typescript
export interface ArtifactItem {
  id: string;
  name: string;
  version: string;            // Версия semver (например, "2.6.4")
  category: 
    | 'Docker Image' 
    | 'Release Binary' 
    | 'SSL / Cert' 
    | 'Config Dump' 
    | 'Database Backup' 
    | 'AI Model Weights';
  size: string;               // Читаемый размер (например, "48.2 MB")
  sha256: string;             // 64-символьный хэш SHA-256
  downloadUrl: string;        // Прямая ссылка для скачивания
  env: Environment;
  buildNumber: string;        // Номер CI/CD пайплайна
  createdAt: string;
  status: 'verified' | 'signing' | 'archived';
  notes: string;
}
```

### 1.5. Эндпоинт мониторинга (`HealthEndpoint`)
```typescript
export interface HealthEndpoint {
  id: string;
  name: string;
  url: string;
  category: string;
  status: ServiceStatus;
  latencyMs: number;          // Текущий RTT пинг
  uptime24h: number;          // Процент доступности за последние сутки (например, 99.98)
  lastChecked: string;
  history: number[];          // Массив значений для отрисовки sparklines (▂▃▅▆▇)
}
```

### 1.6. Быстрое действие / Ранбук (`QuickAction`)
```typescript
export interface QuickAction {
  id: string;
  title: string;
  description: string;
  category: 'Webhook' | 'Cache Flush' | 'Audit' | 'Deploy Trigger' | 'Diagnostics';
  type: 'http_post' | 'http_get' | 'curl' | 'diagnostic' | 'webhook';
  targetUrl?: string;
  payload?: Record<string, any>;
  headers?: Record<string, string>;
  commandSnippet?: string;
}
```

### 1.7. Запись журнала аудита (`AuditLog`)
```typescript
export interface AuditLog {
  id: string;
  timestamp: string;          // Время в формате HH:MM:SS
  level: 'info' | 'warn' | 'success' | 'alert' | 'critical';
  action: string;             // Идентификатор действия (например, "DEPLOY", "VAULT", "DEFCON")
  details: string;            // Подробности события
  operator: string;           // Имя оператора ("ROOT", "SYSTEM")
}
```

---

## 2. Криптографический формат (EncryptedPayload)

При экспорте или персистентном сохранении зашифрованных данных используется структура:

```typescript
export interface EncryptedPayload {
  version: number;            // Версия схемы (1)
  salt: string;               // 16 байт в Hex кодировке (32 символа)
  iv: string;                 // 12 байт в Hex кодировке (24 символа)
  ciphertext: string;         // Зашифрованные данные AES-GCM 256 в Hex кодировке
}
```

### Пример полезной нагрузки:
```json
{
  "version": 1,
  "salt": "a4f891b2c4e57199a0b1c2d3e4f50123",
  "iv": "3d91e847c210ab56cd7890ef",
  "ciphertext": "89f1ab34cd67ef9012345678abcdef0123456789"
}
```

---

## 3. Спецификация команд CLI-терминала (Terminal Commands)

Эмулятор командной строки доступен в модуле `E1` и поддерживает следующий синтаксис:

| Команда | Аргументы | Описание | Пример |
|---|---|---|---|
| `help` | — | Показывает список всех доступных команд | `help` |
| `status` | — | Выводит текущий статус ключевых шлюзов и общий процент SLA | `status` |
| `ping` | `[host]` | Выполняет синтетический ICMP/HTTP пинг заданного хоста (по умолч. `000.localhost`) | `ping 000.localhost` |
| `defcon` | `<1-5>` | Переключает глобальный уровень боеготовности системы (1 = максимальный локдаун) | `defcon 1` |
| `deploy` | `[env]` | Инициирует регламент развертывания пайплайна (`staging`, `prod`) | `deploy staging` |
| `add` | `<module_code>` | Динамически добавляет указанный модуль в активную сетку дашборда | `add B4` |
| `clear` | — | Очищает буфер вывода терминала | `clear` |

---

## 4. Схема постоянного хранилища (LocalStorage Schema)

| Ключ в `localStorage` | Формат | Описание |
|---|---|---|
| `000_active_modules` | JSON `string[]` | Массив кодов модулей для композитора (`["A1", "B1", "D1", "E1", "F1", "H2"]`) |
| `000_layout_style` | Строка | Стиль сетки: `'grid'`, `'master'`, `'rows'` |
| `000_cols` | Строка / Число | Количество колонок сетки (`1`, `2`, `3`, `4`) |
| `000_density` | Строка | Режим плотности: `'standard'` (11px) или `'nano'` (9.5px) |
| `000_theme` | Строка | Цветовая тема: `'cyber'`, `'matrix'`, `'amber'`, `'mono'` |
| `000_notepad` | Строка (Markdown) | Текущий текст оперативного блокнота разработчика |
| `000_audit_logs` | JSON `AuditLog[]` | Массив последних 50 записей системного аудита |
| `000_slot_1` | JSON Объект | Снапшот памяти: `{ modules, layoutStyle, colsMode, density, theme }` |
| `000_slot_2` | JSON Объект | Снапшот памяти: `{ modules, layoutStyle, colsMode, density, theme }` |
| `000_slot_3` | JSON Объект | Снапшот памяти: `{ modules, layoutStyle, colsMode, density, theme }` |

---

## 5. Спецификация быстрого тулбокса (Floating Tools)

Выдвижная панель (`~` / Backquote) объединяет 5 инструментов:

1. **Ping Probe (`ping`)**:
   - Вход: URL (`http://000.localhost:3000`).
   - Выход: Статус-код, latency (мс), протоколы TLS 1.3 / HTTP/2.
2. **Entropy Token Generator (`gen`)**:
   - Параметры: Длина (16, 32, 64 символа), Тип (`hex`, `alphanumeric`).
   - Функция: Генерация криптографически стойких токенов с 1-click копированием.
3. **SHA-256 Verifier (`hash`)**:
   - Вход: 64-символьная строка контрольной суммы.
   - Функция: Автоматическое сопоставление с реестром релизных артефактов (`[MATCH] <artifact_name>` или `[NOT FOUND]`).
4. **Base64 Encoder / Decoder (`b64`)**:
   - Операции: Кодирование строки в `btoa` и декодирование из `atob`.
5. **JSON Formatter & Validator (`json`)**:
   - Функция: Парсинг сырого JSON, валидация синтаксиса и красивое форматирование с отступами в 2 пробела.
