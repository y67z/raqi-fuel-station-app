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

#### 1. الحصول على المفاتيح المطلوبة
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

### Deploy
1. Get your `BOT_TOKEN` from [@BotFather](https://t.me/BotFather), your `OWNER_CHAT_ID` from [@userinfobot](https://t.me/userinfobot), and a free `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey).
2. Fork this repo, go to Render → **New + → Blueprint**, pick the repo. Render auto-detects `render.yaml`.
3. Set the three secret env vars in the Render dashboard, click **Apply**.
4. Add a free [UptimeRobot](https://uptimerobot.com) HTTP monitor for `https://<your-app>.onrender.com/health` at a 5-minute interval to prevent the free service from sleeping.

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
