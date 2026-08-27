export interface ModuleDefinition {
  id: string;
  code: string;
  name: string;
  group: string;
  groupId: string;
  widgetType: string;
  description: string;
  defaultActive?: boolean;
}

export interface ModuleGroup {
  id: string;
  title: string;
  count: number;
}

export const MODULE_GROUPS: ModuleGroup[] = [
  { id: 'A', title: 'A. ПРОЕКТЫ И СЕРВИСЫ', count: 7 },
  { id: 'B', title: 'B. СЕКРЕТЫ И CREDENTIALS', count: 8 },
  { id: 'C', title: 'C. АРТЕФАКТЫ И РЕЛИЗЫ', count: 7 },
  { id: 'D', title: 'D. МОНИТОРИНГ И HEALTH', count: 8 },
  { id: 'E', title: 'E. ОПЕРАЦИИ И АВТОМАТИЗАЦИЯ', count: 8 },
  { id: 'F', title: 'F. АУДИТ И БЕЗОПАСНОСТЬ', count: 7 },
  { id: 'G', title: 'G. ВИЗУАЛИЗАЦИЯ И ИНФРАСТРУКТУРА', count: 6 },
  { id: 'H', title: 'H. ИНФОРМАЦИОННЫЕ И УТИЛИТАРНЫЕ', count: 10 },
  { id: 'I', title: 'I. КАНАЛЫ И НОТИФИКАЦИИ', count: 5 },
];

export const ALL_MODULES: ModuleDefinition[] = [
  // Group A
  { id: 'A1', code: 'A1', name: 'Project Table', group: 'A. ПРОЕКТЫ И СЕРВИСЫ', groupId: 'A', widgetType: 'Таблица', description: 'Полная таблица сервисов, окружений, latency и ссылок', defaultActive: true },
  { id: 'A2', code: 'A2', name: 'Project Cards', group: 'A. ПРОЕКТЫ И СЕРВИСЫ', groupId: 'A', widgetType: 'Сетка', description: 'Карточки проектов с тегами и ссылками' },
  { id: 'A3', code: 'A3', name: 'Starred Projects', group: 'A. ПРОЕКТЫ И СЕРВИСЫ', groupId: 'A', widgetType: 'Список', description: 'Только избранные приоритетные сервисы', defaultActive: true },
  { id: 'A4', code: 'A4', name: 'Quick Links Dock', group: 'A. ПРОЕКТЫ И СЕРВИСЫ', groupId: 'A', widgetType: 'Панель', description: 'Быстрый доступ к Cloud Console, DB, GitHub, Stripe' },
  { id: 'A5', code: 'A5', name: 'Service Registry', group: 'A. ПРОЕКТЫ И СЕРВИСЫ', groupId: 'A', widgetType: 'Таблица', description: 'Реестр портов, URL, протоколов и версий' },
  { id: 'A6', code: 'A6', name: 'Dependency Map', group: 'A. ПРОЕКТЫ И СЕРВИСЫ', groupId: 'A', widgetType: 'ASCII-граф', description: 'Текстовое дерево связей между микросервисами' },
  { id: 'A7', code: 'A7', name: 'Environment Switcher', group: 'A. ПРОЕКТЫ И СЕРВИСЫ', groupId: 'A', widgetType: 'Переключатель', description: 'Глобальный фильтр Prod / Staging / Dev' },

  // Group B
  { id: 'B1', code: 'B1', name: 'Secrets Vault', group: 'B. СЕКРЕТЫ И CREDENTIALS', groupId: 'B', widgetType: 'Vault', description: 'AES-256 хранилище ключей с маскировкой и 1-click copy', defaultActive: true },
  { id: 'B2', code: 'B2', name: 'Vault Status Metric', group: 'B. СЕКРЕТЫ И CREDENTIALS', groupId: 'B', widgetType: 'Метрика', description: 'Индикатор блокировки, шифрование и число ключей' },
  { id: 'B3', code: 'B3', name: 'Expiring Keys Alert', group: 'B. СЕКРЕТЫ И CREDENTIALS', groupId: 'B', widgetType: 'Алерт-лист', description: 'Ключи и сертификаты с истекающим сроком (<30 дней)' },
  { id: 'B4', code: 'B4', name: 'Key Generator', group: 'B. СЕКРЕТЫ И CREDENTIALS', groupId: 'B', widgetType: 'Инструмент', description: 'Генератор энтропии токенов (Hex, Base64, Alphanumeric)', defaultActive: true },
  { id: 'B5', code: 'B5', name: 'Vault Backup Export/Import', group: 'B. СЕКРЕТЫ И CREDENTIALS', groupId: 'B', widgetType: 'Кнопки', description: 'Зашифрованный экспорт/импорт JSON архива' },
  { id: 'B6', code: 'B6', name: 'Clipboard Guard', group: 'B. СЕКРЕТЫ И CREDENTIALS', groupId: 'B', widgetType: 'Индикатор', description: 'Автоочистка буфера обмена через 30 сек' },
  { id: 'B7', code: 'B7', name: 'Env Variables (.env)', group: 'B. СЕКРЕТЫ И CREDENTIALS', groupId: 'B', widgetType: 'Таблица', description: 'Сниппеты переменных окружения по проектам' },
  { id: 'B8', code: 'B8', name: 'SSH Key Ring', group: 'B. СЕКРЕТЫ И CREDENTIALS', groupId: 'B', widgetType: 'Список', description: 'Fingerprints и хосты SSH/RSA ключей' },

  // Group C
  { id: 'C1', code: 'C1', name: 'Artifacts Registry', group: 'C. АРТЕФАКТЫ И РЕЛИЗЫ', groupId: 'C', widgetType: 'Таблица', description: 'Реестр сборок, Docker образов, дампов и SHA256', defaultActive: true },
  { id: 'C2', code: 'C2', name: 'Latest Release Card', group: 'C. АРТЕФАКТЫ И РЕЛИЗЫ', groupId: 'C', widgetType: 'Карточка', description: 'Текущая production версия, changelog, скачивание' },
  { id: 'C3', code: 'C3', name: 'Docker Image Tags', group: 'C. АРТЕФАКТЫ И РЕЛИЗЫ', groupId: 'C', widgetType: 'Список', description: 'Хэши контейнеров и теги в реестре' },
  { id: 'C4', code: 'C4', name: 'SSL/TLS Certs Monitor', group: 'C. АРТЕФАКТЫ И РЕЛИЗЫ', groupId: 'C', widgetType: 'Таблица', description: 'Домены, Issuer, сроки действия сертификатов' },
  { id: 'C5', code: 'C5', name: 'SHA-256 Hash Verifier', group: 'C. АРТЕФАКТЫ И РЕЛИЗЫ', groupId: 'C', widgetType: 'Инструмент', description: 'Интерактивная проверка целостности файлов' },
  { id: 'C6', code: 'C6', name: 'Config Snapshots', group: 'C. АРТЕФАКТЫ И РЕЛИЗЫ', groupId: 'C', widgetType: 'Список', description: 'Снапшоты конфигов и diff' },
  { id: 'C7', code: 'C7', name: 'Database Backups', group: 'C. АРТЕФАКТЫ И РЕЛИЗЫ', groupId: 'C', widgetType: 'Таблица', description: 'Дампы PostgreSQL/MySQL и WAL replication' },

  // Group D
  { id: 'D1', code: 'D1', name: 'Health Matrix', group: 'D. МОНИТОРИНГ И HEALTH', groupId: 'D', widgetType: 'Таблица', description: 'Живой пинг узлов, latency sparklines и SLA 24h', defaultActive: true },
  { id: 'D2', code: 'D2', name: 'Uptime SLA Metric', group: 'D. МОНИТОРИНГ И HEALTH', groupId: 'D', widgetType: 'Метрика', description: 'Глобальный процент аптайма 99.98% и статус нод', defaultActive: true },
  { id: 'D3', code: 'D3', name: 'Latency Sparklines', group: 'D. МОНИТОРИНГ И HEALTH', groupId: 'D', widgetType: 'График', description: 'Тренды времени отклика по эндпоинтам' },
  { id: 'D4', code: 'D4', name: 'Instant Ping Tester', group: 'D. МОНИТОРИНГ И HEALTH', groupId: 'D', widgetType: 'Инструмент', description: 'Синтетический HTTP/TLS пинг произвольного URL' },
  { id: 'D5', code: 'D5', name: 'Public Status Page Bar', group: 'D. МОНИТОРИНГ И HEALTH', groupId: 'D', widgetType: 'Сводка', description: 'Компактная полоса статуса сервисов' },
  { id: 'D6', code: 'D6', name: 'Incident Log', group: 'D. МОНИТОРИНГ И HEALTH', groupId: 'D', widgetType: 'Хронология', description: 'Журнал сбоев и восстановлений' },
  { id: 'D7', code: 'D7', name: 'HTTP Response Codes', group: 'D. МОНИТОРИНГ И HEALTH', groupId: 'D', widgetType: 'Гистограмма', description: 'Распределение кодов 2xx, 3xx, 4xx, 5xx' },
  { id: 'D8', code: 'D8', name: 'DNS Resolution Check', group: 'D. МОНИТОРИНГ И HEALTH', groupId: 'D', widgetType: 'Инструмент', description: 'Проверка A/AAAA/CNAME записей доменов' },

  // Group E
  { id: 'E1', code: 'E1', name: 'Interactive CLI Terminal', group: 'E. ОПЕРАЦИИ И АВТОМАТИЗАЦИЯ', groupId: 'E', widgetType: 'Терминал', description: 'Интерактивная консоль (help, status, ping, defcon, deploy, matrix)', defaultActive: true },
  { id: 'E2', code: 'E2', name: 'Quick Runbooks', group: 'E. ОПЕРАЦИИ И АВТОМАТИЗАЦИЯ', groupId: 'E', widgetType: 'Кнопки', description: 'Запуск типовых операций (Purge Cache, Staging Deploy, Audit)' },
  { id: 'E3', code: 'E3', name: 'Webhook Dispatcher', group: 'E. ОПЕРАЦИИ И АВТОМАТИЗАЦИЯ', groupId: 'E', widgetType: 'Форма', description: 'Отправка произвольных HTTP POST/GET вебхуков' },
  { id: 'E4', code: 'E4', name: 'Curl Command Builder', group: 'E. ОПЕРАЦИИ И АВТОМАТИЗАЦИЯ', groupId: 'E', widgetType: 'Генератор', description: 'Визуальный сборщик CURL запросов' },
  { id: 'E5', code: 'E5', name: 'Cron Schedule Table', group: 'E. ОПЕРАЦИИ И АВТОМАТИЗАЦИЯ', groupId: 'E', widgetType: 'Таблица', description: 'Расписание фоновых задач и следующий запуск' },
  { id: 'E6', code: 'E6', name: 'Deploy History Log', group: 'E. ОПЕРАЦИИ И АВТОМАТИЗАЦИЯ', groupId: 'E', widgetType: 'Лог', description: 'История развертываний по средам' },
  { id: 'E7', code: 'E7', name: 'Feature Flags Switcher', group: 'E. ОПЕРАЦИИ И АВТОМАТИЗАЦИЯ', groupId: 'E', widgetType: 'Тогглы', description: 'Включение/выключение фич-флагов' },
  { id: 'E8', code: 'E8', name: 'Maintenance Window Banner', group: 'E. ОПЕРАЦИИ И АВТОМАТИЗАЦИЯ', groupId: 'E', widgetType: 'Индикатор', description: 'Таймер запланированных техработ' },
  { id: 'E9', code: 'E9', name: 'AI Mission Copilot & Diagnostics', group: 'E. ОПЕРАЦИИ И АВТОМАТИЗАЦИЯ', groupId: 'E', widgetType: 'AI Copilot', description: 'OpenAI-совместимый AI ассистент, авто-подгрузка моделей (/v1/models), SSE стриминг и контекст инфраструктуры' },

  // Group F
  { id: 'F1', code: 'F1', name: 'System Audit Log', group: 'F. АУДИТ И БЕЗОПАСНОСТЬ', groupId: 'F', widgetType: 'Лог-поток', description: 'Журнал всех действий и операций в системе', defaultActive: true },
  { id: 'F2', code: 'F2', name: 'DEFCON Defense Control', group: 'F. АУДИТ И БЕЗОПАСНОСТЬ', groupId: 'F', widgetType: 'Переключатель', description: 'Уровни готовности DEFCON 1-5 и режим локдауна' },
  { id: 'F3', code: 'F3', name: 'Access Audit Ledger', group: 'F. АУДИТ И БЕЗОПАСНОСТЬ', groupId: 'F', widgetType: 'Таблица', description: 'Кто и когда обращался к Vault и API' },
  { id: 'F4', code: 'F4', name: 'Active Sessions Manager', group: 'F. АУДИТ И БЕЗОПАСНОСТЬ', groupId: 'F', widgetType: 'Список', description: 'Браузерные сессии и кнопка Kill Session' },
  { id: 'F5', code: 'F5', name: 'Security Score Matrix', group: 'F. АУДИТ И БЕЗОПАСНОСТЬ', groupId: 'F', widgetType: 'Метрика', description: 'Оценка надежности ключей и уязвимостей' },
  { id: 'F6', code: 'F6', name: 'IP Allowlist Config', group: 'F. АУДИТ И БЕЗОПАСНОСТЬ', groupId: 'F', widgetType: 'Таблица', description: 'Список доверенных IP-адресов' },
  { id: 'F7', code: 'F7', name: '2FA Auth Status', group: 'F. АУДИТ И БЕЗОПАСНОСТЬ', groupId: 'F', widgetType: 'Индикатор', description: 'Статус двухфакторной аутентификации' },

  // Group G
  { id: 'G1', code: 'G1', name: 'Interactive Cyber Topology', group: 'G. ВИЗУАЛИЗАЦИЯ И ИНФРАСТРУКТУРА', groupId: 'G', widgetType: 'Canvas', description: 'Карта сети с анимированными потоками пакетов' },
  { id: 'G2', code: 'G2', name: 'ASCII Network Topology', group: 'G. ВИЗУАЛИЗАЦИЯ И ИНФРАСТРУКТУРА', groupId: 'G', widgetType: 'ASCII-текст', description: 'Текстовая топология без canvas для максимальной скорости', defaultActive: true },
  { id: 'G3', code: 'G3', name: 'Resource Usage (CPU/RAM)', group: 'G. ВИЗУАЛИЗАЦИЯ И ИНФРАСТРУКТУРА', groupId: 'G', widgetType: 'Метрики', description: 'Потребление ресурсов по нодам' },
  { id: 'G4', code: 'G4', name: 'Cloud Billing & Cost Tracker', group: 'G. ВИЗУАЛИЗАЦИЯ И ИНФРАСТРУКТУРА', groupId: 'G', widgetType: 'Таблица', description: 'Оценка затрат на GCP/AWS за текущий месяц' },
  { id: 'G5', code: 'G5', name: 'Cloud Region Map', group: 'G. ВИЗУАЛИЗАЦИЯ И ИНФРАСТРУКТУРА', groupId: 'G', widgetType: 'Таблица', description: 'Зоны размещения (us-central1, europe-west1)' },
  { id: 'G6', code: 'G6', name: 'Container Cluster Status', group: 'G. ВИЗУАЛИЗАЦИЯ И ИНФРАСТРУКТУРА', groupId: 'G', widgetType: 'Таблица', description: 'Статусы подов и контейнеров Cloud Run/K8s' },

  // Group H
  { id: 'H1', code: 'H1', name: 'System UTC & Local Clock', group: 'H. ИНФОРМАЦИОННЫЕ И УТИЛИТАРНЫЕ', groupId: 'H', widgetType: 'Часы', description: 'Точные часы UTC/Local и счетчик аптайма', defaultActive: true },
  { id: 'H2', code: 'H2', name: 'Terminal Scratch Notepad', group: 'H. ИНФОРМАЦИОННЫЕ И УТИЛИТАРНЫЕ', groupId: 'H', widgetType: 'Блокнот', description: 'Быстрые заметки с сохранением в localStorage', defaultActive: true },
  { id: 'H3', code: 'H3', name: 'Custom Bookmarks', group: 'H. ИНФОРМАЦИОННЫЕ И УТИЛИТАРНЫЕ', groupId: 'H', widgetType: 'Список', description: 'Пользовательские ссылки и закладки' },
  { id: 'H4', code: 'H4', name: 'Subdomain 000.* Router Info', group: 'H. ИНФОРМАЦИОННЫЕ И УТИЛИТАРНЫЕ', groupId: 'H', widgetType: 'Инфо', description: 'Инструкции по 000.localhost и DNS bind' },
  { id: 'H5', code: 'H5', name: 'JSON Formatter & Inspector', group: 'H. ИНФОРМАЦИОННЫЕ И УТИЛИТАРНЫЕ', groupId: 'H', widgetType: 'Инструмент', description: 'Валидатор и форматировщик JSON' },
  { id: 'H6', code: 'H6', name: 'Base64 Encoder / Decoder', group: 'H. ИНФОРМАЦИОННЫЕ И УТИЛИТАРНЫЕ', groupId: 'H', widgetType: 'Инструмент', description: 'Быстрое кодирование/декодирование Base64' },
  { id: 'H7', code: 'H7', name: 'Text Diff Viewer', group: 'H. ИНФОРМАЦИОННЫЕ И УТИЛИТАРНЫЕ', groupId: 'H', widgetType: 'Инструмент', description: 'Сравнение двух фрагментов текста' },
  { id: 'H8', code: 'H8', name: 'Release Countdown Timer', group: 'H. ИНФОРМАЦИОННЫЕ И УТИЛИТАРНЫЕ', groupId: 'H', widgetType: 'Таймер', description: 'Обратный отсчет до следующего релиза' },
  { id: 'H9', code: 'H9', name: 'Changelog Feed', group: 'H. ИНФОРМАЦИОННЫЕ И УТИЛИТАРНЫЕ', groupId: 'H', widgetType: 'Лог', description: 'История изменений версии v2.6.4' },
  { id: 'H10', code: 'H10', name: 'Markdown Previewer', group: 'H. ИНФОРМАЦИОННЫЕ И УТИЛИТАРНЫЕ', groupId: 'H', widgetType: 'Инструмент', description: 'Быстрый просмотр Markdown текста' },

  // Group I
  { id: 'I1', code: 'I1', name: 'Live Alert Stream', group: 'I. КАНАЛЫ И НОТИФИКАЦИИ', groupId: 'I', widgetType: 'Лента', description: 'Поток критических системных предупреждений' },
  { id: 'I2', code: 'I2', name: 'Telegram Bot Notifier', group: 'I. КАНАЛЫ И НОТИФИКАЦИИ', groupId: 'I', widgetType: 'Конфигуратор', description: 'Тестовая отправка уведомлений в Telegram' },
  { id: 'I3', code: 'I3', name: 'Slack Webhook Gateway', group: 'I. КАНАЛЫ И НОТИФИКАЦИИ', groupId: 'I', widgetType: 'Конфигуратор', description: 'Отправка сообщений в каналы Slack' },
  { id: 'I4', code: 'I4', name: 'SMTP Email Alert Rules', group: 'I. КАНАЛЫ И НОТИФИКАЦИИ', groupId: 'I', widgetType: 'Настройки', description: 'Правила отправки почтовых алертов' },
  { id: 'I5', code: 'I5', name: 'External RSS/Status Feeds', group: 'I. КАНАЛЫ И НОТИФИКАЦИИ', groupId: 'I', widgetType: 'Лента', description: 'Мониторинг статусов GCP/GitHub status feeds' },
];
