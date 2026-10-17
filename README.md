# 🚗 Fast Drive 3D (O'zbekiston Poygasi)

**Fast Drive 3D** — bu zamonaviy WebGL va Three.js texnologiyasiga asoslangan, to'liq o'zbek tilidagi 3D avtomagistral poyga o'yini.

---

## 🌟 Asosiy Imkoniyatlar va Xususiyatlar

### 1. 🏎️ O'zbekiston Avtomobillari (UZB Cars Garaji):
- **Gentra (Lacetti)** — "Shaharlik afsona": O'zbekiston ko'chalarining eng mashhur sedani, qulay boshqaruv.
- **Cobalt** — "Xalq sevgan avtomobil": Keng va mustahkam oilaviy mashina.
- **Nexia 3 (Ravon R3)** — "Chaqqon va chaqqon": Sportiv spoyler va yengil manyovr.
- **Damas** — "Biznes yo'ldoshi": O'zbekistonning ramziy mikravtobusi, baland kuzov va ajoyib burilish!
- **Tracker Turbo** — "Zamonaviy shahar krossoveri": Baland klirens va qudratli motor.
- **Malibu 2 Turbo** — "Prezident klassi": Hashamatli dizayn, dual glushitel va super nitro quvvati.
- **Har bir mashina uchun 3D ko'rik (Showroom)**: 360 daraja aylanadigan platforma, ranglar palitrasi (Oq, Qora, Mokriy asfalt, Qizil, Ko'k, Oltin).

### 2. 🎮 Rul va Boshqaruv Turlari (Sozlamalarda):
- **⌨️ Klaviatura**: WASD yoki Strelkalar, Space/Shift (Nitro).
- **🔄 Rul g'ildiragi (Virtual Steering Wheel)**: Ekrandagi aylanadigan interaktiv rul! Sichqoncha yoki sensor bilan buriladi, qo'yib yuborilganda markazga silliq qaytadi.
- **🖱️ Sichqoncha**: Sichqoncha harakatiga mos silliq ergashish.
- **📱 Ekran tugmalari**: Sensorli ekran va planshetlar uchun Chapga, O'ngga, Gaz, Tormoz va Nitro tugmalari.

### 3. 🛣️ O'yin Jarayoni (Yo'lda mashinalar va tangalar):
- **Harakatlanuvchi tirbandlik (Traffic AI)**: Yo'lda og'ir furalar (yuk mashinalari), shahar avtobuslari, sariq taksilar va turli xil yengil mashinalar harakatlanadi. Ular o'z vaqtida chiroq yoqib qator almashtiradi!
- **Tangalar yig'ish**: Yo'lda aylanuvchi oltin tangalar. Yig'ilgan tangalar avtomatik hamyoningizga yoziladi va yangi mashinalarni ochishga sarflanadi.
- **Maxsus bonuslar (Power-ups)**:
  - 🧲 **Tanga Magneti**: Barcha tangalarni avtomobilga tortadi.
  - 🛡️ **To'qnashuv Qalqoni**: 1 marta avariyadan saqlab qoladi!
  - ⚡ **2X Ball**: Ballar va tangalar qiymatini 2 barobarga oshiradi.
- **Xavfli quvib o'tish (Near Miss)**: Boshqa mashinalarning yonidan yuqori tezlikda o'tsangiz, qo'shimcha ballar beriladi!

### 4. 🔊 Ovoz va Musiqa Tizimi:
- Web Audio API orqali hech qanday tashqi faylsiz 100% mustaqil ishlaydigan dvigatel tovushi (tezlikka qarab ohang balandlashadi).
- Tangalar yig'ish, nitro shiddati, tormoz g'ijirlashi va to'qnashuv effektlari.
- Dinamik synthwave fon musiqasi.
- Sozlamalarda Master, Dvigatel, Musiqa va SFX ovoz balandligini alohida rostlash hamda "Mute" qilish imkoniyati.

### 5. 🏆 Rekordlar Bo'limi:
- Eng yuqori ball (High Score).
- Maksimal bosib o'tilgan masofa (metrlarda).
- Eng ko'p yig'ilgan tangalar.
- Oxirgi o'yinlar tarixi jadvali.
- Yangi rekord o'rnatilganda Game Over ekranida maxsus oltin medal va animatsiya!

---

## 🚀 O'yinni Ishga Tushirish

1. `start_game.bat` fayliga 2 marta bosing, yoki
2. Ushbu jildda terminal orqali:
   ```bash
   python -m http.server 8000
   ```
   buyrug'ini bajaring va brauzeringizda **http://localhost:8000** manziliga kiring!
3. Shuningdek, `index.html` faylini istalgan brauzerda to'g'ridan-to'g'ri ochishingiz ham mumkin.
