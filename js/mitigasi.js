// Basis pengetahuan & mesin rekomendasi mitigasi gangguan.
// Tiap aksi mengacu standar/program PLN, punya TARGET terukur, dan HORIZON waktu:
//   h: "pendek"  -> Jangka Pendek (operasional/quick win, ≤ 3 bulan)
//   h: "panjang" -> Menengah–Panjang (konstruksi/investasi/program, > 3 bulan)
(function () {
  const KB = {
    "E1": {
      nama: "Pohon / Vegetasi", ikon: "tree",
      actions: [
        { aksi: "Tebang-pangkas ROW (Right of Way) terjadwal pada section riwayat gangguan tinggi, diprioritaskan sebelum & saat musim hujan", standar: "Program ROW / SOP Pemeliharaan Distribusi", unit: "sectionROW", h: "pendek" },
        { aksi: "Inventarisasi & pemetaan pohon rawan (bambu, sagu, pisang) sepanjang koridor penyulang", standar: "Inspeksi Jaringan Distribusi Lv.1", unit: "fix:1 koridor penyulang", h: "pendek" },
        { aksi: "Migrasi konduktor telanjang (A3C) ke kabel berisolasi A3CS / MVTIC pada ruas rapat vegetasi", standar: "Standar Konstruksi SUTM PLN", unit: "fix:Ruas rawan terpetakan", h: "panjang" },
      ],
    },
    "E2": {
      nama: "Bencana Alam (Petir / Angin)", ikon: "storm",
      actions: [
        { aksi: "Pasang & uji lightning arrester pada titik rawan petir; perbaikan pentanahan (grounding) ≤ 5 Ω", standar: "Standar Proteksi & Pentanahan PLN", unit: "titikProteksi", h: "pendek" },
        { aksi: "Aktivasi early-warning cuaca (BMKG) & siaga regu Yantek saat cuaca ekstrem", standar: "SOP Siaga Gangguan", unit: "fix:SOP siaga aktif", h: "pendek" },
        { aksi: "Penguatan konstruksi (guy-wire / tiang) pada lintasan angin kencang & area terbuka", standar: "Standar Konstruksi SUTM PLN", unit: "titikProteksi", h: "panjang" },
      ],
    },
    "E3": {
      nama: "Pihak Ketiga / Binatang", ikon: "animal",
      actions: [
        { aksi: "Pasang animal guard / cover isolator, sungkup FCO, dan cover bushing trafo (anti kelelawar, ular, burung)", standar: "Program Pemasangan Cover Binatang PLN", unit: "titikSatwa", h: "pendek" },
        { aksi: "Sterilisasi & pembersihan sarang serta penutupan jalur masuk satwa secara berkala", standar: "Inspeksi Jaringan Distribusi Lv.1", unit: "fix:Inspeksi berkala", h: "pendek" },
        { aksi: "Pasang penghalau satwa permanen (bird/bat deterrent) pada gardu & recloser berulang terdampak", standar: "SOP Pemeliharaan Gardu", unit: "titikSatwa", h: "panjang" },
      ],
    },
    "E4": {
      nama: "Layang-layang / Baliho / Umbul-umbul", ikon: "kite",
      actions: [
        { aksi: "Sosialisasi bahaya layang-layang & APK dekat jaringan ke masyarakat / sekolah", standar: "Program K2/K3 & Komunikasi Publik", unit: "fix:Sosialisasi terjadwal", h: "pendek" },
        { aksi: "Penertiban baliho / umbul-umbul / reklame liar di koridor jaringan bersama Pemda / Satpol PP", standar: "Koordinasi Pemda — K2 Jaringan", unit: "titikSatwa", h: "pendek" },
        { aksi: "Penataan koridor & pemasangan rambu larangan permanen di zona padat bermain layang-layang", standar: "Program K2 Jaringan — Penataan ROW", unit: "fix:Zona rawan tertata", h: "panjang" },
      ],
    },
    "I1": {
      nama: "Komponen JTM", ikon: "cable",
      actions: [
        { aksi: "Audit kapasitas hantar (KHA) komponen JTM pada penyulang berbeban tinggi", standar: "Asesmen Aset Distribusi", unit: "fix:Audit per penyulang", h: "pendek" },
        { aksi: "Ganti kabel / incoming under-size ke penampang sesuai beban (mis. 150 mm²)", standar: "Standar Konstruksi & Kapasitas JTM PLN", unit: "titikPeralatan", h: "panjang" },
      ],
    },
    "I2": {
      nama: "Peralatan JTM", ikon: "tool",
      actions: [
        { aksi: "Inspeksi termovisi (IR) sambungan / konektor; retightening atau ganti konektor panas", standar: "Inspeksi Termovisi (IR) PLN", unit: "titikPeralatan", h: "pendek" },
        { aksi: "Ganti material substandar (FCO, fuse-link, isolator, jumper) sesuai SPLN", standar: "SPLN Material Distribusi", unit: "titikPeralatan", h: "pendek" },
        { aksi: "Rekondisi konstruksi pada titik konduktor mudah lepas dari isolator", standar: "Standar Konstruksi SUTM PLN", unit: "fix:Rekondisi titik kritis", h: "panjang" },
      ],
    },
    "I3": {
      nama: "Komponen Gardu", ikon: "tool",
      actions: [
        { aksi: "Pemeliharaan & pembersihan gardu, pengujian koneksi / trafo dan terminasi", standar: "SOP Pemeliharaan Gardu Distribusi", unit: "fix:Pemeliharaan gardu terjadwal", h: "pendek" },
        { aksi: "Penggantian komponen gardu rusak (LBS, FCO, trafo, arrester) sesuai SPLN", standar: "SPLN Material Distribusi", unit: "titikPeralatan", h: "panjang" },
      ],
    },
    "I4": {
      nama: "Tiang", ikon: "pole",
      actions: [
        { aksi: "Inspeksi & pelurusan tiang miring, perbaikan guy-wire / pondasi", standar: "Inspeksi Konstruksi & SOP Pemeliharaan", unit: "tiang", h: "pendek" },
        { aksi: "Penggantian tiang lapuk / keropos terjadwal sesuai prioritas risiko", standar: "Standar Konstruksi SUTM PLN", unit: "tiang", h: "panjang" },
      ],
    },
    "X": {
      nama: "Tidak Ditemukan", ikon: "search",
      actions: [
        { aksi: "Tingkatkan patroli & inspeksi malam pada section yang berulang trip", standar: "SOP Inspeksi & Patroli Jaringan", unit: "sectionBerulang", h: "pendek" },
        { aksi: "Analisa rekaman SCADA & pola arus gangguan; review setting proteksi (recloser / sectionalizer)", standar: "SOP Analisa Gangguan / SCADA", unit: "fix:Evaluasi setting proteksi", h: "pendek" },
        { aksi: "Pasang Fault Passage Indicator (FPI) untuk percepat lokalisasi titik gangguan", standar: "Program Otomatisasi & FI/FPI PLN", unit: "sectionBerulang", h: "panjang" },
      ],
    },
  };

  function targetText(unit, stats) {
    if (unit.indexOf("fix:") === 0) return unit.slice(4);
    const n = stats.distinctAset || 0;
    switch (unit) {
      case "sectionROW": return n + " section ROW prioritas";
      case "titikSatwa": return n + " titik (gardu/recloser)";
      case "titikPeralatan": return n + " titik peralatan";
      case "titikProteksi": return n + " titik proteksi";
      case "tiang": return n + " tiang";
      case "sectionBerulang": return (stats.berulang || n) + " section berulang";
      default: return n + " titik";
    }
  }

  // Bangun rencana aksi terukur per ULP dari distribusi penyebab.
  function buildPerULP(records) {
    const byUlp = {};
    records.forEach((r) => {
      const g = byUlp[r.ulp] || (byUlp[r.ulp] = { ulp: r.ulp, total: 0, atas5: 0, causes: {}, durSum: 0, durN: 0 });
      g.total++;
      if (!r.under5) g.atas5++;
      const cs = g.causes[r.kode] || (g.causes[r.kode] = { n: 0, aset: {} });
      cs.n++;
      cs.aset[r.aset] = (cs.aset[r.aset] || 0) + 1;
      if (r.durasiMin != null) { g.durSum += r.durasiMin; g.durN++; }
    });
    return Object.values(byUlp)
      .map((g) => {
        const ranked = Object.entries(g.causes).sort((a, b) => b[1].n - a[1].n);
        const top = ranked.map(([code, cs]) => {
          const distinctAset = Object.keys(cs.aset).length;
          const berulang = Object.values(cs.aset).filter((x) => x >= 2).length;
          return { code, n: cs.n, pct: Math.round((cs.n / g.total) * 100), distinctAset, berulang, nama: (KB[code] || {}).nama || code, kb: KB[code] || null };
        });
        // rencana aksi dari 3 penyebab teratas, simpan horizon waktu
        const plan = [];
        top.slice(0, 3).forEach((c) => {
          if (!c.kb) return;
          c.kb.actions.forEach((a, idx) => {
            plan.push({
              code: c.code,
              idx,
              aksi: a.aksi,
              standar: a.standar,
              target: targetText(a.unit, c),
              h: a.h || "pendek",
            });
          });
        });
        return {
          ulp: g.ulp,
          total: g.total,
          atas5: g.atas5,
          pctU5: Math.round(((g.total - g.atas5) / g.total) * 100),
          avgDur: g.durN ? Math.round(g.durSum / g.durN) : null,
          top,
          plan,
        };
      })
      .sort((a, b) => b.total - a.total);
  }

  window.Mitigasi = { KB, buildPerULP };
})();
