# 🤖 Telegram AI Bot

بوت تلغرام احترافي مجاني 100%، يعدّل الصور بالذكاء الاصطناعي ويحوّل الرسائل إلى صاحب البوت.

A free, professional Telegram bot that edits images with AI and forwards every incoming message to the owner.

---

## 🇸🇦 العربية

### الميزات
- 🎨 **تعديل صور بالذكاء الاصطناعي**: أرسل صورة + caption يصف التعديل (مثال: «حوّلها رسم كرتوني»).
- 📨 **تحويل تلقائي**: كل رسالة/ملف/صورة تصل البوت تُحوَّل لحسابك (`OWNER_CHAT_ID`).
- 🌍 **ثنائي اللغة**: يتعرف تلقائياً على لغة المستخدم (عربي/إنجليزي).
- ⏱️ **Rate limiting** لحماية حصة الـ API المجانية.
- 📦 **يدعم أي صيغة صورة** (JPG / PNG / WEBP / HEIC...) — يعاد ترميزها داخلياً إلى PNG.
- 🆓 **مجاني 100%**: يعمل على Render Free + Gemini Free Tier + UptimeRobot.

### الخدمات المستخدمة (كلها مجانية)
| الغرض | الخدمة | الحد المجاني |
|---|---|---|
| تعديل الصور | Google Gemini 2.5 Flash Image | ~1500 طلب/يوم |
| احتياطي للتوليد | Pollinations.ai | غير محدود (بدون مفتاح) |
| الاستضافة | Render Free Web Service | 512MB RAM |
| إبقاء البوت نشطاً | UptimeRobot | 50 ping كل 5 دقائق |

### خطوات النشر

#### الطريقة الأسرع والأسهل: Hugging Face Spaces (مجاني تماماً، بدون بطاقة) ⭐

1. **إنشاء حساب مجاني** على [huggingface.co](https://huggingface.co/join) (إيميل + كلمة سر).
2. اضغط **+ New** (يمين فوق) → **Space**.
3. اعبّي:
   - **Space name**: `telegram-ai-bot` (أو أي اسم)
   - **License**: MIT
   - **SDK**: اختار **Docker** → **Blank**
   - **Visibility**: Public
4. اضغط **Create Space**.
5. افتح تبويب **Files** في الـ Space اللي أنشأته وارفع الملفات التالية من
   مجلد `telegram-ai-bot/` (ضغط زر **+ Add file → Upload files**):
   - `bot.py`
   - `handlers.py`
   - `ai_service.py`
   - `config.py`
   - `i18n.py`
   - `requirements.txt`
   - `Dockerfile`
6. استبدل ملف `README.md` المُنشأ تلقائياً بمحتوى ملف
   [`HF_SPACE_README.md`](./HF_SPACE_README.md) (الـ YAML في بدايته يخبر الـ Space أي بورت يفتح).
7. روح **Settings** → **Variables and secrets** → **New secret** وأضف:
   - `BOT_TOKEN` = توكن البوت من BotFather
   - `OWNER_CHAT_ID` = معرّف حسابك في تلغرام
   - `GEMINI_API_KEY` = مفتاح Gemini
8. الـ Space رح يبنى تلقائياً. استنى لما تشوف **Running** ✅
9. خلصنا — البوت شغال 24/7 مجاناً ⚡

#### الطريقة الثانية: Render (يطلب بطاقة للتحقق فقط، بدون خصم فعلي)

1. الحصول على المفاتيح المطلوبة
1. **توكن البوت**: من [@BotFather](https://t.me/BotFather) → `/newbot`.
2. **معرّف حسابك**: من [@userinfobot](https://t.me/userinfobot) — رقم شكله `7878003028`.
3. **مفتاح Gemini المجاني**: من [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → Create API Key.

#### 2. النشر على Render (مجاني)
1. عمل fork للـ repo على GitHub.
2. الذهاب لـ [render.com](https://render.com) → تسجيل دخول بـ GitHub.
3. **New +** → **Blueprint** → اختار repo → Render سيكتشف ملف `render.yaml`.
4. إضافة المتغيرات السرية في الـ dashboard:
   - `BOT_TOKEN`
   - `OWNER_CHAT_ID`
   - `GEMINI_API_KEY`
5. اضغط **Apply** — البوت رح يُنشر خلال 3-5 دقائق.

#### 3. منع البوت من النوم (مهم لخطة Render المجانية)
Render Free يجمّد الخدمة بعد 15 دقيقة بدون نشاط. لحل هذا:
1. روح لـ [uptimerobot.com](https://uptimerobot.com) → اشترك مجاناً.
2. **+ Add New Monitor**:
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://اسم-تطبيقك.onrender.com/health`
   - **Interval**: 5 minutes
3. **Create Monitor** — البوت رح يبقى مستيقظاً 24/7.

#### 4. التشغيل محلياً للتطوير
```bash
cd telegram-ai-bot
cp .env.example .env
# عدّل .env وضع المفاتيح
pip install -r requirements.txt
python bot.py
```

### الاستخدام
1. ابحث عن البوت بالـ username اللي اخترته في BotFather.
2. اكتب `/start`.
3. أرسل صورة + caption مثل: «أضف نظارة شمسية وخلفية شاطئ» أو in English.

### حدود مهمة (المجاني له قيود)
- **Gemini**: 1500 طلب/يوم تقريباً للحساب المجاني. لما ينتهي ينتقل تلقائياً لـ Pollinations (توليد فقط).
- **Render Free**: ينام بعد 15 دقيقة → نحلها بـ UptimeRobot.
- **Telegram**: حجم الصورة المرسلة ≤ 20MB (افتراضي).

---

## 🇬🇧 English

### Features
- 🎨 **AI image editing** — send a photo with a caption describing the edit.
- 📨 **Auto-forwarding** — every incoming message/file/photo is forwarded to the owner (`OWNER_CHAT_ID`).
- 🌍 **Bilingual** — auto-detects Arabic vs English from the user's text.
- ⏱️ **Per-user rate limiting** to protect the free quota.
- 📦 **Any image format** (JPG / PNG / WEBP / HEIC...) — normalized to PNG internally.
- 🆓 **100% free** stack — Render + Gemini free tier + UptimeRobot.

### Services (all free)
| Purpose | Service | Free quota |
|---|---|---|
| Image editing | Google Gemini 2.5 Flash Image | ~1500 req/day |
| Generation fallback | Pollinations.ai | unlimited (no key) |
| Hosting | Render Free Web Service | 512MB RAM |
| Keep-alive ping | UptimeRobot | 50 monitors / 5-min interval |

## 🚀 Deployment options

| Platform | Card required? | Free 24/7? | Difficulty |
|---|---|---|---|
| **Hugging Face Spaces** | ❌ No | ✅ Yes | ⭐ Easiest |
| **Render** | ✅ Yes (verify only, no charge) | ⚠️ Sleeps after 15 min | ⭐⭐ Easy |
| **VPS / Docker host** | depends | ✅ Yes | ⭐⭐⭐ |

### Option A: Deploy to Hugging Face Spaces (recommended, no card)

1. Create a free account at [huggingface.co](https://huggingface.co/join).
2. Click **+ New** (top right) → **Space**.
3. Fill in:
   - **Owner**: your username
   - **Space name**: `telegram-ai-bot` (or anything)
   - **License**: MIT
   - **SDK**: select **Docker** → **Blank**
   - **Visibility**: Public (free)
4. Click **Create Space**.
5. Open the **Files** tab in your new Space and upload these files from this
   folder (drag-and-drop or **+ Add file → Upload files**):
   - `bot.py`
   - `handlers.py`
   - `ai_service.py`
   - `config.py`
   - `i18n.py`
   - `requirements.txt`
   - `Dockerfile`
6. Replace the auto-generated `README.md` in the Space with the contents of
   [`HF_SPACE_README.md`](./HF_SPACE_README.md) (the YAML frontmatter is what
   tells the Space which port to expose).
7. Go to **Settings** → **Variables and secrets** → **New secret** and add:
   - `BOT_TOKEN` = your bot token
   - `OWNER_CHAT_ID` = your Telegram user id
   - `GEMINI_API_KEY` = your Gemini key
8. The Space rebuilds automatically. Wait until it shows **Running**.
9. Done — the bot is live 24/7.

### Option B: Deploy to Render

### Local dev
```bash
cd telegram-ai-bot
cp .env.example .env
# fill in the values
pip install -r requirements.txt
python bot.py
```

### File layout
```
telegram-ai-bot/
├── bot.py            # Entry point: polling/webhook + health server
├── handlers.py       # Telegram handlers (commands, photo edit, forwarder)
├── ai_service.py     # Gemini + Pollinations integration
├── i18n.py           # Bilingual catalog + language detection
├── config.py         # Env-var driven settings
├── requirements.txt
├── Dockerfile
├── render.yaml
├── .env.example
└── README.md
```

### Security note
Never commit `.env`. The bot token shared during setup should be rotated via `/revoke` in @BotFather if it was ever exposed in chat or logs.
