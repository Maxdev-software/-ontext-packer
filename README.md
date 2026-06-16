# 📦 Context Packer

**[English](#english) · [Русский](#русский)**

---

## English

> A VS Code extension for vibe-coders. Pack selected files into structured Markdown and copy to clipboard in one click — with a token count so you know what you're spending.

### The problem

You're switching between your editor and an AI chat. You need to give the model some controllers, types, and configs. So you open each file, copy it, paste it, add the path manually, repeat. It's tedious and you have no idea how many tokens you're burning.

### The solution

Hold **Ctrl**, click the files you need in the Explorer, right-click → **Context Packer: Pack Selected Files**. Done. Your clipboard now contains a clean Markdown document with a file tree, paths, and all the file contents in syntax-highlighted code blocks. A side panel shows the token estimate.

### Features

- **One-click packing** — multiselect with Ctrl in the Explorer, then right-click
- **Structured Markdown output** — file tree + flat path list + full file contents with language-tagged code blocks
- **Token estimation** — no native dependencies, works offline; supports `cl100k` (Claude, GPT-4), `o200k` (GPT-4o, o1), `gpt2` (Llama 2, legacy)
- **Context window bar** — visual indicator of how full the model's context will be
- **Auto language detection** — 40+ extensions mapped to the right code fence label
- **Binary & size guards** — skips images, binaries, and files over the size limit automatically
- **Configurable** — exclusion patterns, max file size, XML output mode, tree toggle

### Output format

```
# Context Pack — MyProject

> Packed by Context Packer · 2025-01-15 12:34:00 UTC
> Files: 3 · Skipped: 0

## File Tree

📁 src
├── 📄 controllers/UserController.ts
└── 📄 types/User.ts
📄 config/database.yaml

## File Contents

### `src/controllers/UserController.ts`

```typescript
// full file content...
```
```

Works with all major models: Claude, GPT-4/4o, Gemini, Mistral, DeepSeek, Llama, and any local model via Ollama.

### Installation

1. Download `context-packer-1.0.0.vsix` from [Releases](../../releases)
2. In VS Code: **Extensions → ··· → Install from VSIX…**
3. Select the downloaded file

### Settings

| Setting | Default | Description |
|---|---|---|
| `contextPacker.tokenModel` | `cl100k` | Token estimation model |
| `contextPacker.maxFileSize` | `500` | Max file size in KB |
| `contextPacker.excludePatterns` | `["*.lock", "*.min.js", "node_modules/**"]` | Patterns to skip |
| `contextPacker.includeTree` | `true` | Include file tree in output |
| `contextPacker.wrapInXml` | `false` | Use `<file>` XML tags instead of Markdown fences |

### Build from source

```bash
git clone https://github.com/Maxdev-software/-ontext-packer
cd context-packer
npm install
npm run compile
# F5 in VS Code to launch the Extension Development Host

# To build .vsix:
npm install -g @vscode/vsce
vsce package
```

---

## Русский

> VS Code расширение для вайбкодеров. Выделяешь файлы, жмёшь — всё в буфере обмена. С подсчётом токенов, чтобы не сжигать контекст вслепую.

### Проблема

Переключаешься между редактором и AI-чатом. Нужно скинуть модели пару контроллеров, типов и конфигов. Открываешь каждый файл, копируешь, вставляешь, дописываешь путь вручную, повторяешь. Долго, муторно, и непонятно сколько токенов съедается.

### Решение

Зажать **Ctrl**, кликнуть нужные файлы в проводнике, правый клик → **Context Packer: Pack Selected Files**. Всё. В буфере обмена — аккуратный Markdown-документ с деревом файлов, путями и содержимым в блоках кода. Боковая панель показывает оценку токенов.

### Возможности

- **Упаковка в один клик** — мультиселект через Ctrl в проводнике, потом правый клик
- **Структурированный Markdown** — дерево файлов + список путей + содержимое с нужными метками языка
- **Подсчёт токенов** — без нативных зависимостей, работает офлайн; поддерживает `cl100k` (Claude, GPT-4), `o200k` (GPT-4o, o1), `gpt2` (Llama 2, старые модели)
- **Полоска контекста** — визуально показывает, насколько заполнено контекстное окно модели
- **Автоопределение языка** — 40+ расширений файлов правильно маппятся в метку блока кода
- **Защита от мусора** — бинарники, картинки и слишком большие файлы пропускаются автоматически
- **Гибкие настройки** — паттерны исключений, лимит размера файла, XML-режим вывода, отключение дерева

### Формат вывода

```
# Context Pack — MyProject

> Packed by Context Packer · 2025-01-15 12:34:00 UTC
> Files: 3 · Skipped: 0

## File Tree

📁 src
├── 📄 controllers/UserController.ts
└── 📄 types/User.ts
📄 config/database.yaml

## File Contents

### `src/controllers/UserController.ts`

```typescript
// полное содержимое файла...
```
```

Работает со всеми популярными моделями: Claude, GPT-4/4o, Gemini, Mistral, DeepSeek, Llama и любыми локальными моделями через Ollama.

### Установка

1. Скачать `context-packer-1.0.0.vsix` из [Releases](../../releases)
2. В VS Code: **Extensions → ··· → Install from VSIX…**
3. Выбрать скачанный файл

### Настройки

| Параметр | По умолчанию | Описание |
|---|---|---|
| `contextPacker.tokenModel` | `cl100k` | Модель для оценки токенов |
| `contextPacker.maxFileSize` | `500` | Максимальный размер файла в КБ |
| `contextPacker.excludePatterns` | `["*.lock", "*.min.js", "node_modules/**"]` | Паттерны для исключения |
| `contextPacker.includeTree` | `true` | Включить дерево файлов в вывод |
| `contextPacker.wrapInXml` | `false` | Оборачивать файлы в XML-теги `<file>` вместо Markdown |

### Сборка из исходников

```bash
git clone https://github.com/Maxdev-software/-ontext-packer
cd context-packer
npm install
npm run compile
# F5 в VS Code запускает Extension Development Host

# Для сборки .vsix:
npm install -g @vscode/vsce
vsce package
```

---

<p align="center">
  Made for people who talk to AI all day and want to stop wasting tokens on boilerplate.<br>
  Сделано для тех, кто весь день общается с AI и не хочет тратить токены на копипасту.
</p>
