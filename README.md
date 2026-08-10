# 🧭 TourEZ - Platform Media Sosial Pariwisata berbasis AI & Digital Passport

![TourEZ Banner](https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Leaflet.js](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**TourEZ** adalah platform media sosial pariwisata modern yang menggabungkan kecanggihan **Pengenalan Lokasi Otomatis berbasis AI & Metadata EXIF**, **Gamifikasi Paspor Digital**, **Peta Wisata Interaktif**, serta **Direktori Destinasi Pariwisata Indonesia**. 

Didesain untuk menginspirasi para pemuda, *backpacker*, dan wisatawan domestik maupun mancanegara dalam mengeksplorasi keindahan alam serta warisan budaya Indonesia.

---

## 🌟 Fitur Utama

### 🤖 1. Deteksi AI Landmark & Metadata EXIF GPS
- **Pemeriksaan EXIF Geolocation**: Membaca koordinat GPS langsung dari metadata foto JPEG yang diunggah pengguna.
- **Visual AI Landmark Recognition**: Mengidentifikasi arsitektur & fitur visual unik landmark (seperti Candi Prambanan, Candi Borobudur, Gunung Bromo, Raja Ampat, Monas, Kuta Bali, dll.).
- **Tingkat Kepercayaan (Confidence Score)**: Menampilkan persentase akurasi deteksi AI secara transparan sebelum posting.

### 🛂 2. Paspor Digital & Gamifikasi Travel
- **Koleksi Stempel Digital**: Pengguna secara otomatis mendapatkan stempel unik paspor (*stamp badge*) setelah mengunggah foto lokasi yang terverifikasi AI.
- **Level & Poin Pengalaman**: Melacak total tempat yang dikunjungi, jumlah stempel terverifikasi, serta peringkat penjelajah (*Master Explorer*).
- **Efek Selebrasi Confetti**: Animasi *canvas confetti* yang meriah saat pengguna membuka stempel baru.

### 🗺️ 3. Peta Wisata Interaktif (Leaflet.js)
- Peta spasial interaktif dengan *marker* foto penjelajah dan destinasi populer di Indonesia.
- *Popup modal* interaktif untuk melihat langsung ulasan, rating, dan detail foto lokasi.

### 📱 4. Feed Perjalanan Sosial & Bucket List
- **Feed Linimasa**: Penyaringan berdasarkan *Trending*, *Terdekat (Nearby)*, dan *Following*.
- **Interaksi Sosial**: Fitur *Like*, *Komentar*, *Share link*, dan *Bookmark* destinasi ke **Bucket List** pribadi.
- **Lencana Verifikasi AI**: Menandai postingan yang telah divalidasi keaslian lokasinya oleh AI.

### 🏛️ 5. Direktori & Panduan Destinasi Indonesia
- Informasi praktis terintegrasi: Jam buka operasional, estimasi harga tiket masuk (domestik & mancanegara), petunjuk arah, galeri foto HD, serta tips perjalanan lokal.

---

## 🏗️ Struktur Proyek

```text
tourez/
├── index.html            # Berkas HTML utama (Single Page Application view setup)
├── css/
│   └── style.css         # Custom Design System, Glassmorphism UI & Responsive Layout
├── js/
│   ├── data.js           # Mock Database: Destinasi, Posts, Profil, & Stempel Paspor
│   ├── exifAiEngine.js   # Mesin Pengolahan Metadata EXIF GPS & AI Computer Vision Matcher
│   └── app.js            # Controller Utama, Routing Tab, Modal Manager, & Interactive Map
└── README.md             # Dokumentasi Proyek
```

---

## 🛠️ Teknologi & Pustaka

- **Frontend Core**: HTML5, Vanilla JavaScript (ES6+), Vanilla CSS (Custom Utility & Design Tokens)
- **UI/UX Aesthetics**: Modern Dark/Glassmorphism theme, CSS Grid & Flexbox
- **Typography**: Google Fonts (*Outfit* & *Plus Jakarta Sans*)
- **Icons**: FontAwesome 6 (Free Solid & Regular)
- **Interactive Map**: Leaflet.js (OpenStreetMap Tile Layer)
- **Metadata Parser**: EXIF.js (Client-side JPEG EXIF Extractor)
- **Animation & Visuals**: Canvas Confetti

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini dibangun menggunakan arsitektur **Client-Side Pure Web**, sehingga **tidak memerlukan langkah kompilasi (*build process*) atau instalasi `npm` yang rumit**.

### Opsi 1: Menjalankan Langsung via Browser
1. *Clone* atau unduh repositori ini ke komputer Anda:
   ```bash
   git clone https://github.com/username/tourez.git
   ```
2. Buka folder `tourez` dan klik ganda pada berkas `index.html` untuk membukanya di peramban (Chrome, Edge, Firefox, Safari, dll.).

### Opsi 2: Menjalankan via Local HTTP Server (Direkomendasikan)
Untuk performa terbaik saat memuat modul media dan skrip:
- **VS Code Live Server**: Klik kanan `index.html` -> *Open with Live Server*.
- **Node `npx serve`**:
  ```bash
  npx serve .
  ```
  Lalu buka tautan `http://localhost:3000` di peramban Anda.

---

## 📸 Cara Menguji Fitur Deteksi AI Landmark

1. Klik tombol **Deteksi AI** (atau ikon kamera 📷) di bilah navigasi utama.
2. Anda dapat:
   - Mengunggah foto perjalanan pribadi Anda dari galeri/komputer.
   - **Atau** memilih salah satu dari **Sampel Foto AI Landmark** (Candi Prambanan, Bromo, Raja Ampat, Monas) yang tersedia di modal untuk uji coba kilat.
3. Mesin AI akan memindai fitur visual & EXIF foto.
4. Klik **Konfirmasi & Terbitkan Postingan**.
5. Buka tab **Paspor Saya** untuk melihat stempel baru yang otomatis ditambahkan beserta efek animasi selebrasi! 🎉

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE). Bebas digunakan dan dikembangkan kembali untuk keperluan edukasi, portofolio, maupun pengembangan komersial.

---

<p center align="center">
  Dibuat dengan ❤️ untuk Memajukan Pariwisata & Ekonomi Kreatif Indonesia.
</p>
