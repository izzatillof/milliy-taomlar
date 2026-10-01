# Milliy taomlar buyurtmasi

## Nimalar bor?
- Milliy uslubdagi moslashuvchan web-ilova
- Taomlarni qidirish va kategoriya bo‘yicha filtrlash
- Savatchaga taom qo‘shish, miqdorini oshirish/kamaytirish
- Mijoz ismi, telefon raqami va manzilini kiritish
- Buyurtmani Telegram’ga yuborish uchun backend

## Ishga tushirish (Windows)
1. Kompyuteringizga Node.js (18 yoki undan yangi versiya) o‘rnating.
2. Shu papkadagi `.env.example` faylidan nusxa oling va nusxasini `.env` deb nomlang.
3. `.env` faylida `TELEGRAM_BOT_TOKEN` va `TELEGRAM_CHAT_ID` qiymatlarini kiriting.
4. Papkada terminal/CMD ochib `node server.js` buyrug‘ini bajaring.
5. Brauzerda `http://localhost:3000` manzilini oching. HTML faylni ikki marta bosib ochmang — backend ishlashi kerak.

## Telegram sozlash
1. Telegram’da @BotFather orqali bot yarating yoki mavjud botingiz uchun token oling.
2. Avvalgi HTML faylingizda token ochiq ko‘rinib turgan edi. Xavfsizlik uchun @BotFather orqali eski tokenni bekor qiling (revoke) va yangi token oling.
3. Buyurtmalar kelishi kerak bo‘lgan Telegram akkaunt/bot chatida botga `/start` yuboring. Guruhga yuborilsa, botni guruhga qo‘shing.
4. Chat ID ni aniqlab `.env` fayliga kiriting.

## Muhim
- `.env` faylini hech kimga yubormang va internetga joylamang.
- Oddiy HTML faylni `file:///...` orqali ochganda `/api/order` server endpointi ishlamaydi.
- Bu boshlang‘ich loyiha. Internetga ommaviy joylashdan oldin HTTPS, server himoyasi, buyurtmalarni cheklash va maxfiylik siyosatini sozlang.

## Admin panel
1. `.env` faylida `ADMIN_PASSWORD` qiymatiga kuchli, o‘zingiz biladigan parol yozing (misol qiymatini albatta almashtiring).
2. `node server.js` bilan serverni ishga tushiring.
3. Brauzerda `http://localhost:3000/admin` manzilini ochib, admin paroli bilan kiring.
4. Admin panelda mahsulot nomi, narxi, kategoriya, emoji, rasm URL va tavsifini o‘zgartirishingiz, yangi mahsulot qo‘shishingiz yoki mahsulotni o‘chirishingiz mumkin.
5. Menyu o‘zgarishlari `foods.json` faylida saqlanadi. Server ishlayotgan hostingda ushbu faylga yozish ruxsati bo‘lishi kerak.

## Internetga joylash
Ilova Node.js serveri talab qiladi. Render, Railway yoki VPS kabi Node.js hosting tanlang; loyiha papkasini joylang, Start Command sifatida `node server.js` kiriting va Environment Variables bo‘limida `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `ADMIN_PASSWORD` qiymatlarini belgilang. `PORT` qiymatini hostingning o‘zi bersa, uni o‘zgartirmang. Hosting bepul rejalarida fayl tizimi vaqtinchalik bo‘lishi mumkin: `foods.json` o‘zgarishlari qayta deploy/restartdan keyin saqlanmasligi ehtimoli bor. Barqaror ishlash uchun persistent disk yoki ma’lumotlar bazasi kerak. Internetga chiqarganda kuchli admin paroli ishlating.
