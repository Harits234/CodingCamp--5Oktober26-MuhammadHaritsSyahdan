# Project: Personal Dashboard — Muhammad Harits Syahdan

## Deskripsi
Aplikasi web personal dashboard yang berjalan sepenuhnya di browser (client-side). Dibuat untuk CodingCamp 5 Oktober 2026.

## Tech Stack
- **HTML** — struktur halaman (`index.html` di root)
- **CSS** — styling (`css/style.css`)
- **JavaScript** — logika aplikasi (`js/app.js`)
- Tidak ada framework, tidak ada backend, tidak ada build tool
- Data disimpan menggunakan **Browser LocalStorage** API

## Struktur Folder
```
/
├── index.html          # Entry point utama
├── css/
│   └── style.css       # Semua styling
├── js/
│   └── app.js          # Semua logika JavaScript
└── .kiro/
    └── steering/
        └── project.md  # File ini
```

## Fitur yang Ada (MVP)
1. **Greeting & Clock** — Sapaan berdasarkan waktu + jam + tanggal live
2. **Focus Timer** — Timer Pomodoro dengan durasi yang bisa diubah (preset 25/50/90 menit atau custom), tombol Start/Stop/Reset
3. **To-Do List** — Tambah, edit, selesaikan, hapus tugas; disimpan di LocalStorage; validasi duplikat (case-insensitive)
4. **Quick Links** — Tambah dan hapus link favorit; disimpan di LocalStorage
5. **Dark/Light Mode** — Toggle tema gelap/terang; pilihan disimpan di LocalStorage

## Aturan Coding
- Gunakan **Vanilla JavaScript** murni — jangan tambahkan framework (React, Vue, dll.)
- Semua kode JS ditulis di `js/app.js`, semua CSS di `css/style.css`
- Gunakan `'use strict';` di awal file JS
- Variabel dengan `const`/`let`, hindari `var`
- Nama fungsi dan variabel dalam **bahasa Inggris**, komentar boleh Indonesia
- Gunakan CSS custom properties (`--var`) untuk warna dan nilai yang berulang
- Tema terang diaktifkan via `[data-theme="light"]` pada elemen `<html>`
- Data LocalStorage menggunakan prefix key `dashboard_` (contoh: `dashboard_todos`, `dashboard_theme`)

## LocalStorage Keys
| Key | Isi |
|-----|-----|
| `dashboard_theme` | `"dark"` atau `"light"` |
| `dashboard_todos` | Array JSON `[{ text, done }]` |
| `dashboard_links` | Array JSON `[{ name, url }]` |
| `dashboard_timer_minutes` | Integer 1–180 |

## Konvensi HTML
- Selalu sertakan `lang="en"` pada `<html>`
- Gunakan semantic HTML (`<header>`, `<main>`, `<section>`, `<ul>`, dll.)
- Setiap tombol interaktif harus punya atribut `aria-label`
- Path CSS: `href="css/style.css"`, path JS: `src="js/app.js"`

## Browser Target
Chrome, Firefox, Edge, Safari (modern — tidak perlu support IE)
