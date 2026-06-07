LOTOS v14 — music fix

Исправлено:
1. Музыка включается по кнопке.
2. Путь к файлу:
   audio/theme.mp3?v=14
3. Если файл не найден, кнопка покажет "!". 
4. Добавлен preload="auto" и playsinline.
5. Кэш CSS/JS/data сброшен до v14.

Важно:
На GitHub Pages путь чувствителен к регистру.
Файл должен лежать строго так:
audio/theme.mp3

Не:
Audio/theme.mp3
audio/Theme.mp3
audio/theme.MP3

Минимально заменить:
- index.html
- script.js
- style-lotos-v3.css

И обязательно проверить, что в репозитории есть:
- audio/theme.mp3

После коммита:
?fresh=v14music
