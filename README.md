# ProApps - Building Management System (Onboarding & HR Admin)

Web application admin panel for Building Management System (Indoland Group / ProApps).

---

## Approval Flow Module (HR Parameter)

Pengaturan alur persetujuan pengajuan karyawan (**Izin/Cuti**, **Presensi Manual**, **Lembur**, **Tukar Shift**).

### 1. Data Model

```typescript
type RequestType = 'leave' | 'manual_attendance' | 'overtime' | 'change_shift';

type ApprovalLevel = {
  id: string;
  roleId: string;
  mode: 'all' | 'selected';
  userIds: string[];            // Digunakan ketika mode === 'selected'
  rule: 'any' | 'all';          // 'any' (salah satu) atau 'all' (semua setuju)
};

type ApprovalChain = {
  levels: ApprovalLevel[];      // Min 1 level, Max 5 levels
  requireRejectNote: boolean;   // Wajib menyertakan alasan penolakan
  fallback: 'escalate' | 'role_all' | 'notify_admin';
};

type ApprovalConfig = {
  id: string;
  targetType: 'department' | 'employee';
  targetId: string;
  scope: 'all_types' | RequestType;  // 'all_types' = aturan umum
  chain: ApprovalChain;
};
```

---

### 2. Resolution Logic & Specificity Order (`resolveApprovalChain`)

Penentuan rantai alur persetujuan yang berlaku untuk suatu request dieksekusi dengan urutan prioritas tertinggi ke terendah (**most specific wins**):

1. **Employee + Specific Type** (Karyawan tertentu + Jenis pengajuan spesifik)
2. **Employee + All Types** (`scope: 'all_types'` pada level karyawan)
3. **Department + Specific Type** (Departemen karyawan + Jenis pengajuan spesifik)
4. **Department + All Types** (`scope: 'all_types'` pada level departemen)
5. **Global Fallback** (Aturan default sistem jika departemen/karyawan belum dikonfigurasi)

#### Penanganan Kasus Khusus (Edge Cases):
- **Self-Approval Skip**: Pemohon tidak dapat menjadi approver atas pengajuannya sendiri. Sistem otomatis menghapus pemohon dari daftar approver pada level terkait atau melewati (escalate) level tersebut jika pemohon adalah satu-satunya approver terpilih.
- **Consecutive Duplicate Skip**: Jika level ke-`N` memiliki approver tunggal yang sama persis dengan level ke-`N-1`, sistem secara otomatis melakukan auto-skip pada level berulang tersebut.
- **Empty Pool Fallback**: Jika pool approver kosong (misalnya staf nonaktif):
  - `'escalate'`: Melewati level tersebut ke level berikutnya.
  - `'role_all'`: Memperluas ke seluruh anggota aktif pada role tersebut.
  - `'notify_admin'`: Mengalihkan request ke Administrator.

---

### 3. Menjalankan Unit Test

Untuk menjalankan suite pengujian resolusi alur persetujuan:

```bash
npx vitest run
```
