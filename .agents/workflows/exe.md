---
description: exe
---

# TASK: STANDALONE WINDOWS BUILD WORKFLOW & AUDIT

Ты — автономный инженер сборки (Build & Release Engineer). Твоя задача: проанализировать открытый проект, подготовить его к дистрибуции и скомпилировать в полностью автономное (standalone) Windows-приложение (`.exe` / portable-бандл) с пошаговой валидацией на каждом этапе.

## ПРАВИЛА ВЫПОЛНЕНИЯ
1. **Zero-Assumption Policy:** Не предполагай наличие глобальных утилит — проверяй каждую команду перед запуском (`where.exe`, `Test-Path`).
2. **Fail-Fast & Auto-Recovery:** При любой ошибке локализуй лог, анализируй `stderr`, вноси точечный фикс и повторяй шаг (максимум 3 итерации на один сбой перед запросом ввода у пользователя).
3. **Path Safety:** Никаких абсолютных путей в кодовой базе и конфигурациях сборщика. Все ассеты и конфиги должны резолвиться относительно runtime-директории приложения.

---

### ЭТАП 1: РАЗВЕДКА И СТЕК (RECONNAISSANCE)
1. Определи стек проекта:
   - **Python:** проверь `requirements.txt`, `pyproject.toml`, точку входа (`main.py`, `app.py`, `gui.py`).
   - **Node.js / Web:** проверь `package.json` (Electron, Tauri, Neutralino, NW.js или CLI/Pkg).
   - **Go / Rust / C# / C++:** проверь `go.mod`, `Cargo.toml`, `.csproj`, `CMakeLists.txt`.
2. Проверь наличие GUI или CLI назначения.
3. Зафиксируй целевой тулчейн для сборки:
   - Python: `PyInstaller` (через `.spec`) или `Nuitka`.
   - Node.js (GUI): `Tauri` / `electron-builder` / `pkg`.
   - Go / Rust: встроенный компилятор (`go build -ldflags="-H windowsgui"` или `cargo build --release`).
   - .NET: `dotnet publish -c Release -r win-x64 --self-contained -p:PublishSingleFile=true`.

---

### ЭТАП 2: АУДИТ КОДА И САНИТИЗАЦИЯ ПУТЕЙ (PRE-FLIGHT CHECKS)
1. **Проверка резолвинга ассетов:**
   - Для Python: проверь, обёрнуты ли вызовы файлов в механизм `sys._MEIPASS` (для распаковки ресурсов в PyInstaller).
   - Для Node/Tauri/Electron: убедись, что статика не зависит от `process.cwd()` в неожиданных местах.
2. **Изоляция зависимостей:**
   - Создай/проверь чистое виртуальное окружение (`.venv`, `node_modules` через чистый `npm ci` / `pnpm install --frozen-lockfile`).
   - Убедись, что нет отсутствующих транзитивных или нативных бинарных модулей (DLL, C-extensions).

---

### ЭТАП 3: КОНФИГУРАЦИЯ И СБОРКА (BUILD EXECUTION)
1. Сгенерируй воспроизводимый конфиг сборки (например, явный `app.spec` для PyInstaller, `tauri.conf.json`, или скрипт `build.ps1`).
2. Задай метаданные:
   - Имя исполняемого файла: без пробелов и спецсимволов.
   - Иконка (`.ico`), если доступна в проекте.
   - Режим консоли: скрывать окно терминала для GUI (`--noconsole` / `-H windowsgui`) или оставлять для CLI.
3. Запусти процесс компиляции в директорию `dist/` или `build/`.
4. Перехвати и залогируй полный вывод stdout/stderr.

---

### ЭТАП 4: ВАЛИДАЦИЯ И SMOKE-TESTING
1. **Проверка артефакта:**
   - Проверь существование выходного `.exe` файла в целевой папке.
   - Замерь и выведи размер бинарника.
2. **Headless Smoke-тест:**
   - Выполни тестовый запуск бинарника через PowerShell с таймаутом (5-10 секунд):
     ```powershell
     $proc = Start-Process -FilePath "dist\App.exe" -PassThru; Start-Sleep -Seconds 5; if ($proc.HasExited) { $proc.ExitCode } else { Stop-Process -Id$proc.Id }
     ```
   - Убедись, что процесс не крашнулся с ошибками `ModuleNotFoundError`, `DLL load failed` или `Missing asset`.
3. **Аудит зависимостей:**
   - Если сборка portable/folder: проверь наличие всех сопутствующих `.dll`, шейдеров, конфигов и папки ресурсов.

---

### ЭТАП 5: ФИНАЛЬНЫЙ ОТЧЁТ (RELEASE MANIFEST)
После успешного билда выведи:
- **Путь к собранному файлу:** точный относительный путь.
- **Размер и SHA256:** контрольная сумма артефакта.
- **Инструкция по запуску:** параметры запуска и минимальные требования к ОС.
- **Debug Log:** если были предупреждения компилятора — укажи, требуют ли они внимания.
