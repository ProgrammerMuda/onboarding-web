# Dokumentasi Fitur Manajemen Jabatan & Hierarki Organisasi (Positions Module)

> **Untuk:** Fullstack Developer  
> **Aplikasi:** ProApps Dashboard (Onboarding Web)  
> **Arsitektur:** MVP (Model - View - Presenter) + React 19 + Vite  
> **Lokasi File:**  
> - Model: [`src/models/PositionModel.js`](file:///Users/rmm/Documents/Vibe%20Coding/PROAPPS/Dashboard%20Proapps/src/models/PositionModel.js)  
> - Presenter: [`src/presenters/usePositionPresenter.js`](file:///Users/rmm/Documents/Vibe%20Coding/PROAPPS/Dashboard%20Proapps/src/presenters/usePositionPresenter.js)  
> - View: [`src/views/position/PositionView.jsx`](file:///Users/rmm/Documents/Vibe%20Coding/PROAPPS/Dashboard%20Proapps/src/views/position/PositionView.jsx)  
> - Styling: [`src/views/position/position.css`](file:///Users/rmm/Documents/Vibe%20Coding/PROAPPS/Dashboard%20Proapps/src/views/position/position.css)  
> - Unit Test: [`src/models/PositionModel.test.js`](file:///Users/rmm/Documents/Vibe%20Coding/PROAPPS/Dashboard%20Proapps/src/models/PositionModel.test.js)

---

## 1. Ikhtisar Fitur (Feature Overview)

Modul **Positions** berfungsi untuk mengelola data jabatan kerja, hierarki komando, dan alur pelaporan antar posisi di lingkungan operasional gedung (*Building Management*).

### Konsep Utama:
1. **Root Authority Tetap (`bm` / Building Manager):**
   - Organisasi wajib memiliki tepat **satu posisi tertinggi** sebagai akar (*root*) organisasi.
   - Posisi root tidak boleh dihapus dan tidak boleh memiliki atasan langsung.
   - Nama jabatan root dapat diubah (misalnya menjadi *Estate Manager*, *General Manager*, dll).
2. **Dukungan Multi-Atasan (*Dual/Matrix Reporting*):**
   - Sebuah posisi bawahan dapat memiliki **satu atau lebih atasan langsung** (*multiple direct superiors*).
   - Berguna untuk struktur organisasi matriks (misal: melapor fungsional ke Chief dan melapor administratif ke Building Manager).
3. **Pencegahan Ketergantungan Melingkar (*Anti-Circular Dependency*):**
   - Sistem secara ketat memvalidasi graf hierarki agar **bebas dari siklus / loop** (seorang bawahan tidak boleh dijadikan atasan dari atasannya sendiri).
4. **Proteksi Penghapusan Berjenjang:**
   - Jabatan tidak dapat dihapus jika masih memiliki bawahan langsung yang aktif melapor kepadanya. Bawahan harus dialihkan terlebih dahulu.

---

## 2. Struktur Data & Model Layer

Data jabatan disimpan sebagai daftar berelasi *Direct Acyclic Graph (DAG)*.

### 2.1. Skema Objek Jabatan (`Position`)
```typescript
interface Position {
  id: string;          // UUID v4 atau ID unik (cth: 'bm', 'chief', 'spv')
  name: string;        // Nama jabatan (1-80 karakter, unik case-insensitive)
  parentIds: string[]; // Array of ID atasan langsung (kosong untuk Building Manager)
}
```

### 2.2. Fungsi Inti di [`PositionModel.js`](file:///Users/rmm/Documents/Vibe%20Coding/PROAPPS/Dashboard%20Proapps/src/models/PositionModel.js)

| Fungsi | Deskripsi | Kompleksitas |
| :--- | :--- | :--- |
| `getParentIds(item)` | Mengekstrak array ID atasan, kompatibel dengan schema legacy `parentId` string tunggal maupun `parentIds` array. | $O(1)$ |
| `descendants(positions, id)` | Melakukan penelusuran graf ke bawah (*BFS*) untuk mengumpulkan **seluruh ID bawahan langsung dan tidak langsung** ke dalam `Set`. | $O(V + E)$ |
| `ancestors(positions, id)` | Melakukan penelusuran graf ke atas (*BFS*) dari anak ke atasan terdekat hingga terjauh (*Root Authority*). Hasil terurut dari terdekat ke terjauh. | $O(V + E)$ |
| `validatePosition(draft, positions)` | Memvalidasi integritas data jabatan sebelum disimpan: cek duplikasi nama, cek siklus pelaporan, dan validasi atasan. | $O(V)$ |
| `validatePositionRemoval(position, positions)` | Memvalidasi syarat penghapusan: memastikan posisi bukan root dan tidak memiliki bawahan yang bergantung. | $O(V)$ |
| `normalizePositionHierarchy(value)` | Normalisasi dan auto-heal data jika terdapat forest/cabang terputus saat memuat data. | $O(V)$ |

---

## 3. Presenter Layer (State Management)

Presenter diimplementasikan melalui React Custom Hook: [`usePositionPresenter()`](file:///Users/rmm/Documents/Vibe%20Coding/PROAPPS/Dashboard%20Proapps/src/presenters/usePositionPresenter.js).

### State & Handler yang Disediakan:
```javascript
const {
  positions,           // Array data posisi saat ini
  filtered,            // Data posisi terfilter sesuai query pencarian
  query, setQuery,     // State & handler filter pencarian
  dialog,              // State modal aktif ({ kind: 'create'|'edit'|'relationship'|'hierarchy', position })
  open(kind, pos),     // Membuka modal aksi
  close(),             // Menutup modal aktif
  save(draft, isRel),  // Menyimpan posisi baru / pembaruan nama / pembaruan atasan
  remove(position),    // Menghapus posisi setelah validasi dependensi
  successModal,        // State modal notifikasi sukses interaktif
  closeSuccessModal(), // Menutup modal sukses
  error                // Pesan error validasi form
} = usePositionPresenter();
```

> **Catatan Penyimpanan Saat Ini:**  
> Presenter saat ini menggunakan `localStorage` dengan key `proapps.hr.positions.v8`.  
> Ketika dihubungkan ke backend API, bagian method `persist()` di presenter ini dapat langsung diganti dengan pemanggilan `fetch` / `axios` ke REST API atau GraphQL.

---

## 4. View Layer & UX Interaktif

View utama berada pada [`PositionView.jsx`](file:///Users/rmm/Documents/Vibe%20Coding/PROAPPS/Dashboard%20Proapps/src/views/position/PositionView.jsx) dengan stylesheet [`position.css`](file:///Users/rmm/Documents/Vibe%20Coding/PROAPPS/Dashboard%20Proapps/src/views/position/position.css).

### 4.1. Tabel Utama (*Positions Table*)
- **Pencarian Real-Time:** Filter instan berdasarkan nama posisi.
- **Baris Root (Building Manager):** Menggunakan latar krem `#fffdf5`, label *Highest Level*, dan tombol hapus dinonaktifkan secara aman.
- **Daftar Atasan (Pill Tags):** Menampilkan chip biru atasan langsung.
- **Aksi Dropdown (•••):**
  - *Edit Position*: Mengubah nama posisi.
  - *Set Superiors*: Membuka modal pengaturan atasan langsung.
  - *View Hierarchy*: Membuka modal diagram struktur organisasi.
  - *Delete Position*: Menghapus posisi (dengan proteksi dependensi bawahan).

### 4.2. Modal View Hierarchy
Modal ini memiliki dua bagian utama:

#### A. Superior Reporting Line (Alur Pelaporan ke Atas)
Menggunakan pendekatan UX **Bottom-Up**:
$$\mathbf{[Current\ Focus]} \xrightarrow{\text{reports to}} [Direct\ Superior] \xrightarrow{\text{reports to}} [Indirect\ Superior] \xrightarrow{\text{reports to}} [\text{👑}\ Root\ Authority]$$
- **Current Focus:** Posisi aktif dengan kartu Navy Blue solid.
- **Konektor:** Kapsul pill horisontal `reports to →`.
- **Root Authority:** Beraksen emas dengan ikon `Crown`.
- **Tinggi & Penjajaran:** Seluruh kartu memiliki tinggi seragam (`58px`) dan teratur dalam 1 baris horisontal dengan scroll halus tanpa patah baris (*no broken wrapping*).

#### B. Pohon Organisasi Interaktif (*Visual Tree*)
- **Dynamic Toggle Button:** Satu tombol toggle yang otomatis berganti teks & ikon antara **"Collapse All"** (saat cabang terbuka) dan **"Expand All"** (saat cabang tertutup).
- **Komponen Rekursif `Branch`:** Mendukung kedalaman tak terbatas dengan garis konektor pohon, badge jumlah bawahan, dan tombol `Focus` untuk berpindah fokus posisi langsung di dalam modal.
- **Aksen Building Manager:** Saat dipilih di tree, menggunakan warna gradien emas (`linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`) dengan teks & ikon putih solid, rapi tanpa garis tepi kiri yang tebal.

---

## 5. Rekomendasi Integrasi Backend (Untuk Fullstack Dev)

Jika fitur ini akan dihubungkan ke database relasional (PostgreSQL / MySQL) dan REST API, berikut panduan implementasi yang disarankan:

### 5.1. Skema Database (Relasional)

```sql
-- 1. Tabel Utama Jabatan
CREATE TABLE positions (
    id VARCHAR(36) PRIMARY KEY,              -- UUID v4
    name VARCHAR(80) NOT NULL,               -- Nama jabatan
    is_root BOOLEAN NOT NULL DEFAULT FALSE,  -- True hanya untuk Building Manager
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_position_name UNIQUE (LOWER(TRIM(name)))
);

-- 2. Tabel Pivot Relasi Atasan Langsung (Many-to-Many untuk mendukung Matrix Reporting)
CREATE TABLE position_superiors (
    position_id VARCHAR(36) NOT NULL REFERENCES positions(id) ON DELETE RESTRICT,
    superior_id VARCHAR(36) NOT NULL REFERENCES positions(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (position_id, superior_id),
    CONSTRAINT chk_no_self_reporting CHECK (position_id <> superior_id)
);

CREATE INDEX idx_superior_lookup ON position_superiors(superior_id);
```

### 5.2. Spesifikasi Endpoint REST API

| Method | Endpoint | Deskripsi | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/positions` | Mengambil seluruh daftar posisi beserta relasi `parent_ids` & kalkulasi jumlah bawahan. | - |
| `POST` | `/api/v1/positions` | Menambah posisi baru. | `{ "name": "Chief Security", "parent_ids": ["bm"] }` |
| `PUT` | `/api/v1/positions/:id` | Mengubah data posisi (nama & atasan). | `{ "name": "Head of Security", "parent_ids": ["bm"] }` |
| `PATCH` | `/api/v1/positions/:id/superiors` | Memperbarui daftar atasan langsung saja. | `{ "parent_ids": ["chief_id", "bm_id"] }` |
| `DELETE` | `/api/v1/positions/:id` | Menghapus posisi (gagal 400 jika masih memiliki bawahan). | - |

### 5.3. Validasi Penting di Sisi Backend:
1. **Cek Siklus (Loop Detection):**  
   Gunakan CTE rekursif (*Recursive Common Table Expression*) di SQL atau algoritma BFS/DFS di service layer untuk memastikan penambahan atasan tidak menghasilkan siklus.
2. **Kunci Root Position:**  
   Pastikan baris jabatan dengan `is_root = true` tidak dapat dihapus (`DELETE` menghasilkan HTTP 403 / 400).
3. **Proteksi Referensi Karyawan:**  
   Ketika nantinya tabel karyawan (`employees` / `staff`) menghubungkan `position_id`, pastikan ada pemeriksaan `ON DELETE RESTRICT`.

---

## 6. Pengujian Unit (Testing)

File unit test berada di [`src/models/PositionModel.test.js`](file:///Users/rmm/Documents/Vibe%20Coding/PROAPPS/Dashboard%20Proapps/src/models/PositionModel.test.js).

Untuk menjalankan unit test modul ini:
```bash
npx vitest run src/models/PositionModel.test.js
```

Untuk menjalankan seluruh unit test aplikasi:
```bash
npx vitest run src/
```

Untuk menjalankan development server lokal:
```bash
npm run dev
# Server berjalan di: http://localhost:5173/
```

---

Dokumen ini disusun untuk memudahkan pemahaman arsitektur, data flow, dan integrasi backend tanpa mengganggu fungsionalitas UI yang telah berjalan optimal.
