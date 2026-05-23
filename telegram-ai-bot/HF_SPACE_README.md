---
title: Telegram AI Bot
emoji: 🤖
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# Telegram AI Bot — Hugging Face Space

This is the README that Hugging Face Spaces uses to configure the Space.

When deploying to Hugging Face Spaces, copy the YAML frontmatter above into
your Space's `README.md`. The Docker SDK reads `app_port` to know which port
to expose publicly.

The bot itself reads the `PORT` env var that Hugging Face injects (default
`7860` for Spaces), so no code changes are needed.

## Required secrets (set in Space → Settings → Variables and secrets)

- `BOT_TOKEN` — your Telegram bot token from @BotFather
- `OWNER_CHAT_ID` — your Telegram numeric user ID (from @userinfobot)
- `GEMINI_API_KEY` — your Google AI Studio API key

## Optional variables

- `MODE` = `polling` (default)
- `LOG_LEVEL` = `INFO`
- `MAX_IMAGE_MB` = `20`
- `RATE_LIMIT_PER_MINUTE` = `10`

See the main `README.md` for full feature documentation.
