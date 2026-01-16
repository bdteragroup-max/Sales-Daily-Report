// ✅ ใส่ URL Web App ของ Apps Script (exec)
const API_URL = "https://script.google.com/macros/s/AKfycbyUKtJ7e5HhY2e7V266Y8MtjoTIN8a0HleNxUG_f4MnhlkvQof_sJJVTbUQInzI4f9lBg/exec";
const REFRESH_MS = 30000;
const DEBOUNCE_DELAY = 350;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const fmt = new Intl.NumberFormat("th-TH");
const TH_DOW = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

const el = (id) => document.getElementById(id);

// =========================
// ✅ Targets (monthly)
// =========================
const MONTHLY_TARGETS = {
    // ทีมพี่ยง
    "พี่ยง": 15000000,
    "บู": 3750000,
    "อ้อม": 3750000,

    // ทีมกิ๊ฟ
    "กิ๊ฟ": 10000000,
    "แอน": 2500000,
    "ออย": 2500000,
    "ไมค์": 2500000,

    // ทีมพี่ฝน
    "พี่ฝน": 20000000,
    "เบนซ์": 10000000,

    // ทีมสกลนคร
    "นิพนธ์": 1000000,
    "ปฐมพงค์": 1000000,
    "จรรยพร": 1000000,
    "ฐานพัฒน์": 1000000,

    // ทีมอุบลราชธานี
    "เมธี": 2000000,

    // ทีมขอนแก่น
    "พชรพล": 2000000,

    // ทีมพิษณุโลก
    "อุดมทรัพย์": 1000000,
    "เขมวันต์": 1000000,
    "รังสรรค์": 1000000,

    //ทีมส่วนกลาง
    "มนต์ภัสร": 1250000,
};

const TEAM_TARGETS = {
    "พี่ยง": 15000000,
    "กิ๊ฟ": 10000000,
    "พี่ฝน": 20000000,
    "ทีมสกลนคร": 5000000,
    "ทีมอุบลราชธานี": 2000000,
    "ทีมขอนแก่น": 2000000,
    "ทีมพิษณุโลก": 3000000,
    "ทีมส่วนกลาง": 60000000
};

const GRAND_TARGET = Object.values(TEAM_TARGETS).reduce((a, b) => a + b, 0);

// ✅ alias เพื่อแก้ปัญหา: ชื่อจากชีตเป็นชื่อจริง แต่ target เป็นชื่อเล่น/คีย์ทีม
const PERSON_ALIASES = {
    "นายอาบูบากัส ฮามีต": "บู",
    "อาบูบากัส ฮามีต": "บู",
    "อาบูบากัส": "บู",

    "นางสาวอ้อมเดือน รักษาสัตย์": "อ้อม",
    "อ้อมเดือน รักษาสัตย์": "อ้อม",
    "พี่อ้อม": "อ้อม",

    "น.ส.อนุสรา จันทร์พวง": "แอน",
    "นางสาวอนุสรา จันทร์พวง": "แอน",
    "อนุสรา จันทร์พวง": "แอน",

    "นางสาวผกามาศ จันทร์เมือง": "ออย",
    "ผกามาศ จันทร์เมือง": "ออย",

    "นายธนวัฒน์ สิริศรีเทียนทอง": "ไมค์",
    "ธนวัฒน์ สิริศรีเทียนทอง": "ไมค์",

    "นายกิตติพันธ์ กิตติจิระพงศ์": "เบนซ์",
    "กิตติพันธ์ กิตติจิระพงศ์": "เบนซ์",

    "นายเมธี สมัครพงษ์": "พี่หนึ่ง",
    "เมธี สมัครพงษ์": "พี่หนึ่ง",

    "นายพชรพล ทองวิจารณ์": "พี่ตู่",
    "พชรพล ทองวิจารณ์": "พี่ตู่",

    "นายอุดมทรัพย์ สุขโข": "โอ้",
    "อุดมทรัพย์ สุขโข": "โอ้",

    // เผื่อสะกดคลาดเคลื่อน
    "นางสาวมนต์ภัสสร ปอกเพชร": "วิสุดา",
    "นางสาวมนต์ภัสสร ปกเพชร": "วิสุดา"
};

const TEAM_ALIASES = {
    "ผจก.ยงค์ศักดิ์": "พี่ยง",
    "ยงค์ศักดิ์": "พี่ยง",
    "พี่ยง": "พี่ยง",

    "คุณณัฎธินี": "กิ๊ฟ",
    "ณัฎธินี": "กิ๊ฟ",
    "กิ๊ฟ": "กิ๊ฟ",

    "ผจก.วายุรินทร์": "พี่ฝน",
    "วายุรินทร์": "พี่ฝน",
    "พี่ฝน": "พี่ฝน",

    "พี่เบล": "พี่เบล",
    "เบล": "พี่เบล"
};

// =========================
// ✅ Utilities
// =========================
function escapeHtml(str) {
    if (str == null) return "";
    return String(str).replace(/[&<>"']/g, m => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
}

function addThaiDow(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return `${dateStr} (${TH_DOW[d.getDay()]})`;
}

function setText(id, v) {
    const node = el(id);
    if (!node) return;
    node.textContent = v ?? "";
}

function setHTML(id, v) {
    const node = el(id);
    if (!node) return;
    node.innerHTML = v ?? "";
}

function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    padding: 12px 20px;
    background: ${type === "error" ? "rgba(239, 68, 68, 0.95)" : type === "success" ? "rgba(34, 197, 94, 0.95)" : "rgba(59, 130, 246, 0.95)"};
    color: white;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    backdrop-filter: blur(10px);
  `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = "slideOut 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

if (!document.getElementById("toast-animations")) {
    const style = document.createElement("style");
    style.id = "toast-animations";
    style.textContent = `
    @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
  `;
    document.head.appendChild(style);
}

function normalizeKey(s) {
    return String(s || "")
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[.\-_/()]/g, "");
}

function resolvePersonKey(selectedPerson) {
    if (!selectedPerson) return "";
    if (MONTHLY_TARGETS[selectedPerson] != null) return selectedPerson;

    // alias by exact mapping
    if (PERSON_ALIASES[selectedPerson]) return PERSON_ALIASES[selectedPerson];

    // fuzzy: try contains nickname keys
    const n = normalizeKey(selectedPerson);
    const keys = Object.keys(MONTHLY_TARGETS);
    for (const k of keys) {
        if (n.includes(normalizeKey(k))) return k;
    }

    // fuzzy: try alias list keys
    for (const [full, nick] of Object.entries(PERSON_ALIASES)) {
        if (n.includes(normalizeKey(full)) || n.includes(normalizeKey(nick))) return nick;
    }

    return ""; // unknown
}

function resolveTeamKey(selectedTeam) {
    if (!selectedTeam) return "";
    if (TEAM_TARGETS[selectedTeam] != null) return selectedTeam;
    if (TEAM_ALIASES[selectedTeam]) return TEAM_ALIASES[selectedTeam];

    const n = normalizeKey(selectedTeam);
    for (const k of Object.keys(TEAM_TARGETS)) {
        if (n.includes(normalizeKey(k))) return k;
    }
    for (const [full, teamKey] of Object.entries(TEAM_ALIASES)) {
        if (n.includes(normalizeKey(full)) || n.includes(normalizeKey(teamKey))) return teamKey;
    }
    return "";
}

// =========================
// ✅ State
// =========================
const state = {
    isLoading: false,
    autoTimer: null,
    lastPayload: null,
    activeMetric: "sales",
    latestTrendRows: [],
    retryCount: 0,
    lagBusy: false
};

// =========================
// ✅ Filter logic
// =========================
function setFilterStatus(msg, isError = false) {
    const s = el("filterStatus");
    if (!s) return;
    s.textContent = msg;
    s.style.color = isError ? "#ef4444" : "#9ca3af";
}

function debounceAutoLoad() {
    const ck = el("ckAuto");
    if (!ck || !ck.checked) return;

    if (state.autoTimer) clearTimeout(state.autoTimer);
    state.autoTimer = setTimeout(() => loadData(true), DEBOUNCE_DELAY);
}

function onDaysChange() {
    if (el("f_start")) el("f_start").value = "";
    if (el("f_end")) el("f_end").value = "";
    debounceAutoLoad();
}

function onStartEndChange() {
    const s = el("f_start")?.value || "";
    const e = el("f_end")?.value || "";
    if (s && e) debounceAutoLoad();
}

function onFilterSelectChange() {
    // update target line immediately (without waiting load)
    if (state.lastPayload) updateTargetLine(state.lastPayload);
    debounceAutoLoad();
}

function resetFilters() {
    if (el("f_days")) el("f_days").value = "60";
    if (el("f_start")) el("f_start").value = "";
    if (el("f_end")) el("f_end").value = "";
    if (el("f_team")) el("f_team").value = "";
    if (el("f_group")) el("f_group").value = "";
    if (el("f_person")) el("f_person").value = "";
    showToast("รีเซ็ตตัวกรองเรียบร้อย", "info");
    loadData(false);
}

function buildQueryFromFilters() {
    const days = el("f_days")?.value || "60";
    const start = el("f_start")?.value || "";
    const end = el("f_end")?.value || "";
    const team = el("f_team")?.value || "";
    const group = el("f_group")?.value || "";
    const person = el("f_person")?.value || "";

    const p = new URLSearchParams();

    if (start && end) {
        if (end < start) {
            p.set("start", end);
            p.set("end", start);
            if (el("f_start")) el("f_start").value = end;
            if (el("f_end")) el("f_end").value = start;
        } else {
            p.set("start", start);
            p.set("end", end);
        }
    } else {
        p.set("days", days);
    }

    if (team) p.set("teamlead", team);
    if (group) p.set("group", group);
    if (person) p.set("person", person);

    return p;
}

function fillSelect(id, items, keepValue = true) {
    const sel = el(id);
    if (!sel) return;

    const prev = sel.value;
    sel.innerHTML = "";

    const all = document.createElement("option");
    all.value = "";
    all.textContent = "(All)";
    sel.appendChild(all);

    (items || []).forEach(x => {
        const opt = document.createElement("option");
        opt.value = x;
        opt.textContent = x;
        sel.appendChild(opt);
    });

    if (keepValue && prev && [...sel.options].some(o => o.value === prev)) sel.value = prev;
    else sel.value = "";
}

function setAvailable(payload) {
    const a = payload.available || {};
    fillSelect("f_team", a.teamleads || [], true);
    fillSelect("f_group", a.groups || [], true);
    fillSelect("f_person", a.people || [], true);
}

// =========================
// ✅ JSONP loader (รองรับ concurrent requests)
// - ของเดิมใช้ lastScript ตัวเดียว ทำให้ยิงหลาย request พร้อมกันแล้วชนกัน
// - เวอร์ชันนี้ 1 call = 1 script element (ไม่แย่งกัน)
// =========================
function loadJSONP(url) {
    return new Promise((resolve, reject) => {
        const cbName = "__cb_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
        const script = document.createElement("script");

        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error("Request timeout"));
        }, 15000);

        window[cbName] = (data) => {
            clearTimeout(timeout);
            cleanup();
            resolve(data);
        };

        function cleanup() {
            try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
            if (script && script.parentNode) script.parentNode.removeChild(script);
        }

        script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + cbName + "&_=" + Date.now();
        script.onerror = () => {
            clearTimeout(timeout);
            cleanup();
            reject(new Error("JSONP load failed"));
        };

        document.body.appendChild(script);
    });
}

// =========================
// ✅ Chart (Run-rate/Pacing)
// =========================
let chart = null;

// dataset index mapping
const DS = {
    SALES_CUM: 0,
    CALLS: 1,
    VISITS: 2,
    QUOTES: 3,
    TARGET_CUM: 4
};

function bindChartCheckboxes() {
    const map = [
        { id: "ck_sales", idx: DS.SALES_CUM },
        { id: "ck_calls", idx: DS.CALLS },
        { id: "ck_visits", idx: DS.VISITS },
        { id: "ck_quotes", idx: DS.QUOTES },
        { id: "ck_target", idx: DS.TARGET_CUM }
    ];

    map.forEach(x => {
        const box = el(x.id);
        if (!box) return;
        box.addEventListener("change", () => {
            if (!chart) return;
            chart.setDatasetVisibility(x.idx, box.checked);
            chart.update("none");
        });
    });
}

function initChart() {
    if (!window.Chart) {
        setText("chartStatus", "Chart.js โหลดไม่สำเร็จ");
        return;
    }
    const canvas = el("chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "ยอดขายสะสม (บาท)",
                    data: [],
                    tension: 0.35,
                    yAxisID: "ySales",
                    pointRadius: 3,
                    pointHoverRadius: 7,
                    borderWidth: 3,
                    borderColor: "#22c55e",
                    backgroundColor: "rgba(34,197,94,0.10)",
                    fill: true
                },
                {
                    label: "โทร (ราย/วัน)",
                    data: [],
                    tension: 0.35,
                    yAxisID: "yCount",
                    pointRadius: 2,
                    pointHoverRadius: 6,
                    borderWidth: 2,
                    borderColor: "#fb7185",
                    backgroundColor: "rgba(251,113,133,0.10)",
                    fill: true
                },
                {
                    label: "เข้าพบ (ราย/วัน)",
                    data: [],
                    tension: 0.35,
                    yAxisID: "yCount",
                    pointRadius: 2,
                    pointHoverRadius: 6,
                    borderWidth: 2,
                    borderColor: "#38bdf8",
                    backgroundColor: "rgba(56,189,248,0.10)",
                    fill: true
                },
                {
                    label: "ใบเสนอราคา (ใบ/วัน)",
                    data: [],
                    tension: 0.35,
                    yAxisID: "yCount",
                    pointRadius: 2,
                    pointHoverRadius: 6,
                    borderWidth: 2,
                    borderColor: "#facc15",
                    backgroundColor: "rgba(250,204,21,0.10)",
                    fill: true
                },
                {
                    label: "Cumulative Target (บาท)",
                    data: [],
                    tension: 0,
                    yAxisID: "ySales",
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    borderWidth: 2,
                    borderColor: "#f59e0b",
                    borderDash: [8, 4],
                    backgroundColor: "transparent",
                    fill: false,
                    hidden: true // เปิด/ปิดด้วย ck_target
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: {
                    display: true,
                    labels: { color: "#cbd5e1", font: { size: 12, weight: "600" } }
                },
                tooltip: {
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    padding: 12,
                    titleColor: "#cbd5e1",
                    bodyColor: "#e5e7eb",
                    borderColor: "rgba(96, 165, 250, 0.3)",
                    borderWidth: 1,
                    callbacks: {
                        title: (items) => addThaiDow(items?.[0]?.label || ""),
                        label: (ctx) => {
                            const label = ctx.dataset.label || "";
                            const v = ctx.parsed.y ?? 0;
                            if (label.includes("บาท") || label.includes("Target")) return `${label}: ${fmt.format(v)} ฿`;
                            return `${label}: ${fmt.format(v)}`;
                        }
                    }
                }
            },
            scales: {
                ySales: {
                    position: "left",
                    min: 0,
                    beginAtZero: true,
                    grace: "5%",
                    title: { display: true, text: "ยอดขายสะสม (บาท)", color: "#cbd5e1", font: { weight: "600" } },
                    ticks: { color: "#9ca3af", callback: (v) => fmt.format(v) },
                    grid: { color: "rgba(255,255,255,0.05)" }
                },
                yCount: {
                    position: "right",
                    min: 0,
                    beginAtZero: true,
                    grace: "10%",
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: "จำนวนต่อวัน (โทร/เข้าพบ/ใบเสนอราคา)", color: "#cbd5e1", font: { weight: "600" } },
                    ticks: { color: "#9ca3af", callback: (v) => fmt.format(v) }
                },
                x: {
                    ticks: {
                        color: "#9ca3af",
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 12
                    },
                    grid: { color: "rgba(255,255,255,0.03)" }
                }
            },
            onClick: (evt) => {
                if (!chart) return;
                const pts = chart.getElementsAtEventForMode(evt, "nearest", { intersect: true }, true);
                if (!pts.length) return;

                const idx = pts[0].index;
                const row = state.latestTrendRows[idx];
                if (!row) return;

                setHTML("clickInfo",
                    `วันที่: <b>${addThaiDow(row.date)}</b> | ` +
                    `ยอดขายวันนี้: <b>${fmt.format(row.sales || 0)} ฿</b> | ` +
                    `ยอดขายสะสม: <b>${fmt.format(row.salesCum || 0)} ฿</b> | ` +
                    `โทร: <b>${fmt.format(row.calls || 0)}</b> | ` +
                    `เข้าพบ: <b>${fmt.format(row.visits || 0)}</b> | ` +
                    `ใบเสนอราคา: <b>${fmt.format(row.quotes || 0)}</b>`
                );
            }
        }
    });

    bindChartCheckboxes();
}

function setTrend(payload) {
    const rows = payload.dailyTrend || [];
    state.latestTrendRows = rows;

    if (!chart) return;

    // ✅ คำนวณยอดขายสะสมเพื่อทำ Run-rate
    let cum = 0;
    const rowsWithCum = rows.map(r => {
        cum += (r.sales || 0);
        return { ...r, salesCum: cum };
    });
    state.latestTrendRows = rowsWithCum;

    chart.data.labels = rowsWithCum.map(r => r.date);
    chart.data.datasets[DS.SALES_CUM].data = rowsWithCum.map(r => r.salesCum || 0);
    chart.data.datasets[DS.CALLS].data = rowsWithCum.map(r => r.calls || 0);
    chart.data.datasets[DS.VISITS].data = rowsWithCum.map(r => r.visits || 0);
    chart.data.datasets[DS.QUOTES].data = rowsWithCum.map(r => r.quotes || 0);

    updateTargetLine(payload);

    chart.update("active");
    setText("chartStatus", "OK");
}

// =========================
// ✅ Lead → Sales Lag Analysis
// เป้าหมาย: หา "Lag ที่ดีที่สุด" (0..maxLag) ที่ทำให้ความสัมพันธ์ (Pearson r)
// ระหว่าง (โทร/เข้าพบ/ใบเสนอราคา) กับยอดขาย "สูงที่สุด" เมื่อเลื่อนเวลาไปข้างหน้า
//
// หมายเหตุสำคัญ:
// - เป็นการวิเคราะห์เชิงสถิติ (correlation) ไม่ใช่เหตุ-ผล
// - ถ้าข้อมูลน้อย r จะไม่นิ่ง จึงต้องโชว์ n (จำนวนคู่ข้อมูลที่ใช้จริง)
// =========================

const LAG_MAX_DAYS = 30;
const LAG_MIN_N = 12; // ต่ำกว่านี้ให้เตือน

function pearsonCorr(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 5) return 0;

    let sx = 0, sy = 0;
    for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; }
    const mx = sx / n, my = sy / n;

    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) {
        const a = x[i] - mx, b = y[i] - my;
        num += a * b;
        dx += a * a;
        dy += b * b;
    }
    const den = Math.sqrt(dx * dy);
    return den === 0 ? 0 : (num / den);
}

// lagDays: x[t] เทียบกับ y[t+lag]
function lagCorrelationWithN(rows, xKey, yKey, lagDays) {
    const x = [];
    const y = [];

    for (let i = 0; i < rows.length; i++) {
        const j = i + lagDays;
        if (j >= rows.length) break;
        const xv = Number(rows[i][xKey] ?? 0);
        const yv = Number(rows[j][yKey] ?? 0);
        // ถ้าอยากตัดวันที่ไม่มี activity เลย สามารถใส่เงื่อนไขได้ที่นี่
        x.push(xv);
        y.push(yv);
    }

    const corr = pearsonCorr(x, y);
    return { corr, n: x.length };
}

function findBestLag(rows, xKey, yKey, maxLag = LAG_MAX_DAYS) {
    let best = { lag: null, corr: -Infinity, n: 0 };
    const series = [];

    for (let lag = 0; lag <= maxLag; lag++) {
        const out = lagCorrelationWithN(rows, xKey, yKey, lag);
        series.push({ lag, corr: out.corr, n: out.n });
        if (out.corr > best.corr) best = { lag, corr: out.corr, n: out.n };
    }

    if (!isFinite(best.corr)) best = { lag: null, corr: 0, n: 0 };
    return { best, series };
}

function calcBestLagFromPayload(payload, maxLag = LAG_MAX_DAYS) {
    const rows = (payload?.dailyTrend || []).map(r => ({
        date: r.date,
        sales: Number(r.sales || 0),
        calls: Number(r.calls || 0),
        visits: Number(r.visits || 0),
        quotes: Number(r.quotes || 0)
    }));

    // ถ้าข้อมูลน้อยมาก จะสรุปไม่ค่อยนิ่ง
    if (rows.length < 8) {
        return {
            v2s: { lag: null, corr: 0, n: rows.length },
            c2s: { lag: null, corr: 0, n: rows.length },
            q2s: { lag: null, corr: 0, n: rows.length },
            rowsN: rows.length
        };
    }

    const v2s = findBestLag(rows, "visits", "sales", maxLag).best;
    const c2s = findBestLag(rows, "calls", "sales", maxLag).best;
    const q2s = findBestLag(rows, "quotes", "sales", maxLag).best;

    return { v2s, c2s, q2s, rowsN: rows.length };
}

async function fetchPayloadWithOverrides(overrides = {}) {
    const qs = buildQueryFromFilters();

    // override filters
    if ("teamlead" in overrides) {
        if (overrides.teamlead) qs.set("teamlead", overrides.teamlead);
        else qs.delete("teamlead");
    }
    if ("person" in overrides) {
        if (overrides.person) qs.set("person", overrides.person);
        else qs.delete("person");
    }

    const url = API_URL + "?" + qs.toString();
    return await loadJSONP(url);
}

async function mapWithConcurrency(items, limit, worker) {
    const results = new Array(items.length);
    let idx = 0;

    const runners = Array.from({ length: Math.max(1, limit) }, async () => {
        while (idx < items.length) {
            const i = idx++;
            try {
                results[i] = await worker(items[i], i);
            } catch (e) {
                results[i] = null;
            }
        }
    });

    await Promise.all(runners);
    return results.filter(Boolean);
}

function fmtCorr(c) {
    if (c == null) return "-";
    const v = Math.round(c * 100) / 100;
    return v.toFixed(2);
}
function fmtLag(l) { return (l == null) ? "-" : `${l} วัน`; }

function renderLagCards(cards) {
    const wrap = el("lagCards");
    const status = el("lagStatus");
    if (!wrap) return;

    wrap.innerHTML = "";

    const warn = (n) => (n != null && n < LAG_MIN_N);

    cards.forEach(c => {
        const div = document.createElement("div");
        div.className = "lagCard";

        const w1 = warn(c.v2s?.n) ? "warn" : "";
        const w2 = warn(c.c2s?.n) ? "warn" : "";
        const w3 = warn(c.q2s?.n) ? "warn" : "";

        div.innerHTML = `
      <div class="lagHead">
        <div class="lagTitle">${escapeHtml(c.title)}</div>
        <div class="lagMeta">ช่วงข้อมูล: ${escapeHtml(c.range || "-")}</div>
      </div>

      <div class="lagRow ${w1}">
        <span class="k">เข้าพบ → ยอดขาย</span>
        <span class="v">${fmtLag(c.v2s?.lag)} • r ${fmtCorr(c.v2s?.corr)} • n ${c.v2s?.n ?? "-"}</span>
      </div>
      <div class="lagRow ${w2}">
        <span class="k">โทร → ยอดขาย</span>
        <span class="v">${fmtLag(c.c2s?.lag)} • r ${fmtCorr(c.c2s?.corr)} • n ${c.c2s?.n ?? "-"}</span>
      </div>
      <div class="lagRow ${w3}">
        <span class="k">ใบเสนอราคา → ยอดขาย</span>
        <span class="v">${fmtLag(c.q2s?.lag)} • r ${fmtCorr(c.q2s?.corr)} • n ${c.q2s?.n ?? "-"}</span>
      </div>

      <div class="lagFoot">
        <span class="muted">จำนวนวันในชุดข้อมูล (raw): ${c.rowsN ?? "-"}</span>
        ${(warn(c.v2s?.n) || warn(c.c2s?.n) || warn(c.q2s?.n))
                ? `<span class="lagWarn">⚠️ ข้อมูลต่อ lag น้อย (n < ${LAG_MIN_N})</span>`
                : `<span class="lagOk">พร้อมใช้งาน</span>`
            }
      </div>
    `;

        wrap.appendChild(div);
    });

    if (status && !cards.length) status.textContent = "ไม่มีข้อมูลสำหรับวิเคราะห์";
}

async function buildLagCards(payload) {
    const wrap = el("lagCards");
    const status = el("lagStatus");
    if (!wrap) return; // ไม่มีส่วน UI นี้ก็ไม่ต้องทำ

    if (state.lagBusy) return;
    state.lagBusy = true;

    const rangeTxt = payload?.range ? `${payload.range.start} → ${payload.range.end}` : "-";
    if (status) status.textContent = "กำลังวิเคราะห์ Lag…";

    try {
        // 1) รวมตามตัวกรองปัจจุบัน
        const overall = {
            title: "รวม (ตามตัวกรองปัจจุบัน)",
            range: rangeTxt,
            ...calcBestLagFromPayload(payload, LAG_MAX_DAYS)
        };

        // 2) ทีม (ทั้งหมดจาก available)
        const teams = payload?.available?.teamleads || [];

        // 3) บุคคล: เอา Top 12 จากยอดขาย (เพื่อลดการยิง request)
        const topPeople = (() => {
            const pt = payload?.personTotals || [];
            if (!pt.length) return (payload?.available?.people || []).slice(0, 12);
            return [...pt]
                .sort((a, b) => (b.sales || 0) - (a.sales || 0))
                .slice(0, 12)
                .map(x => x.person);
        })();

        // ยิงทีม/คน แบบจำกัด concurrency (เพื่อไม่ให้หนักเกิน)
        const teamCards = await mapWithConcurrency(teams, 2, async (team) => {
            const p = await fetchPayloadWithOverrides({ teamlead: team, person: "" });
            if (!p?.ok) return { title: `ทีม: ${team}`, range: rangeTxt, v2s: { lag: null, corr: 0, n: 0 }, c2s: { lag: null, corr: 0, n: 0 }, q2s: { lag: null, corr: 0, n: 0 }, rowsN: 0 };
            return { title: `ทีม: ${team}`, range: rangeTxt, ...calcBestLagFromPayload(p, LAG_MAX_DAYS) };
        });

        const personCards = await mapWithConcurrency(topPeople, 2, async (person) => {
            const p = await fetchPayloadWithOverrides({ person, teamlead: "" });
            if (!p?.ok) return { title: `บุคคล: ${person}`, range: rangeTxt, v2s: { lag: null, corr: 0, n: 0 }, c2s: { lag: null, corr: 0, n: 0 }, q2s: { lag: null, corr: 0, n: 0 }, rowsN: 0 };
            return { title: `บุคคล: ${person}`, range: rangeTxt, ...calcBestLagFromPayload(p, LAG_MAX_DAYS) };
        });

        renderLagCards([overall, ...teamCards, ...personCards]);

        if (status) status.textContent = `วิเคราะห์แล้ว: ทีม ${teams.length} • บุคคล (Top) ${topPeople.length}`;
    } catch (err) {
        console.error("Lag analysis error:", err);
        if (status) status.textContent = "วิเคราะห์ Lag ไม่สำเร็จ";
    } finally {
        state.lagBusy = false;
    }
}

// =========================
// ✅ Run-rate / Pacing logic
// =========================
function daysInMonth(year, monthIndex0) {
    return new Date(year, monthIndex0 + 1, 0).getDate();
}

function parseDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
}

// =========================
// ✅ Working-day helpers
// - วันทำงานบริษัท = จันทร์-เสาร์ (ตัดอาทิตย์)
// - ไม่รวมวันหยุด (payload.holidays = ["YYYY-MM-DD", ...])
// =========================
function dateKeyLocal(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

function getHolidaysSet(payload) {
    const arr = payload?.holidays || [];
    return new Set(arr);
}

function isWorkingDay(d, holidaysSet) {
    if (!d) return false;
    if (d.getDay() === 0) return false; // อาทิตย์
    const key = dateKeyLocal(d);
    if (holidaysSet && holidaysSet.has(key)) return false;
    return true;
}

function countWorkingDaysInMonth(year, monthIndex0, holidaysSet) {
    const last = new Date(year, monthIndex0 + 1, 0).getDate();
    let n = 0;
    for (let day = 1; day <= last; day++) {
        const d = new Date(year, monthIndex0, day);
        if (isWorkingDay(d, holidaysSet)) n++;
    }
    return n;
}

function countWorkingDaysRange(year, monthIndex0, startDay, endDay, holidaysSet) {
    if (endDay < startDay) return 0;
    let n = 0;
    for (let day = startDay; day <= endDay; day++) {
        const d = new Date(year, monthIndex0, day);
        if (isWorkingDay(d, holidaysSet)) n++;
    }
    return n;
}

function formatMoney(v) {
    return fmt.format(v || 0) + " ฿";
}

function getMonthlyTargetBySelection() {
    const selectedPersonRaw = el("f_person")?.value || "";
    const selectedTeamRaw = el("f_team")?.value || "";

    // ✅ 1) เลือกคน = เป้าคนนั้น
    if (selectedPersonRaw) {
        const key = resolvePersonKey(selectedPersonRaw);
        if (key && MONTHLY_TARGETS[key] != null) return { target: MONTHLY_TARGETS[key], label: `เป้าหมาย: ${selectedPersonRaw}` };
        return { target: 0, label: "" };
    }

    // ✅ 2) เลือกทีม = รวมเป้าทั้งทีม (ใช้ TEAM_TARGETS)
    if (selectedTeamRaw) {
        const tKey = resolveTeamKey(selectedTeamRaw);
        if (tKey && TEAM_TARGETS[tKey] != null) return { target: TEAM_TARGETS[tKey], label: `เป้าหมายทีม: ${selectedTeamRaw}` };
        return { target: 0, label: "" };
    }

    // ✅ 3) ไม่เลือก = รวมเป้าทั้งหมด
    return { target: GRAND_TARGET, label: "เป้าหมายรวมทั้งหมด" };
}

function buildCumulativeTargetSeries(rows, monthlyTarget, monthKeyYear, monthKeyIndex0, holidaysSet) {
    // ใช้ "วันทำงานจริง" เป็นฐาน (จันทร์-เสาร์ ตัดอาทิตย์ และตัดวันหยุด)
    const workDaysInMonth = Math.max(1, countWorkingDaysInMonth(monthKeyYear, monthKeyIndex0, holidaysSet));
    const daily = monthlyTarget / workDaysInMonth;

    let workIdx = 0;
    let lastCum = 0;

    return rows.map(r => {
        const d = parseDate(r.date);
        if (!d) return null;
        if (d.getFullYear() !== monthKeyYear || d.getMonth() !== monthKeyIndex0) return null;

        if (isWorkingDay(d, holidaysSet)) {
            workIdx++;
            lastCum = Math.round(daily * workIdx);
            return lastCum;
        }

        // วันอาทิตย์/วันหยุด: คงค่าล่าสุด
        return Math.round(lastCum);
    });
}

function calcRunRateKPIs(rows, monthlyTarget, monthKeyYear, monthKeyIndex0, holidaysSet) {
    const workDaysInMonth = Math.max(1, countWorkingDaysInMonth(monthKeyYear, monthKeyIndex0, holidaysSet));
    const dailyTarget = monthlyTarget / workDaysInMonth;

    const monthRows = rows
        .map(r => ({ ...r, d: parseDate(r.date) }))
        .filter(x => x.d && x.d.getFullYear() === monthKeyYear && x.d.getMonth() === monthKeyIndex0);

    if (!monthRows.length) {
        return {
            target: monthlyTarget,
            actual: 0,
            cumTarget: 0,
            remaining: monthlyTarget,
            reqPerDay: monthlyTarget / workDaysInMonth,
            projection: 0
        };
    }

    const asOf = monthRows[monthRows.length - 1].d;
    const actual = monthRows[monthRows.length - 1].salesCumMonth || 0;

    // นับวันทำงานที่ผ่านไปถึง asOf (รวมวัน asOf)
    const elapsedWorkDays = Math.max(
        1,
        countWorkingDaysRange(monthKeyYear, monthKeyIndex0, 1, asOf.getDate(), holidaysSet)
    );

    const lastDay = new Date(monthKeyYear, monthKeyIndex0 + 1, 0).getDate();
    const remainingWorkDays = Math.max(
        0,
        countWorkingDaysRange(monthKeyYear, monthKeyIndex0, asOf.getDate() + 1, lastDay, holidaysSet)
    );

    const cumTarget = dailyTarget * elapsedWorkDays;
    const remaining = monthlyTarget - actual;

    const reqPerDay = remainingWorkDays > 0 ? (remaining / remainingWorkDays) : remaining;
    const projection = (actual / elapsedWorkDays) * workDaysInMonth;

    return {
        target: monthlyTarget,
        actual,
        cumTarget,
        remaining,
        reqPerDay,
        projection
    };
}

function updateRunRateUI(kpi) {
    // ปลอดภัย: ถ้า element ไม่มี จะไม่ error
    setText("rr_target", formatMoney(kpi.target));
    setText("rr_actual", formatMoney(kpi.actual));
    setText("rr_cumTarget", formatMoney(kpi.cumTarget));
    setText("rr_remaining", formatMoney(Math.max(0, kpi.remaining)));
    setText("rr_reqPerDay", formatMoney(Math.max(0, kpi.reqPerDay)));
    setText("rr_projection", formatMoney(Math.max(0, kpi.projection)));
}

function updateTargetLine(payload) {
    if (!chart) return;

    const rows = state.latestTrendRows || [];
    const { target: monthlyTarget, label } = getMonthlyTargetBySelection();

    const holidaysSet = getHolidaysSet(payload);

    // toggle visibility from checkbox
    const ckTarget = el("ck_target");
    const showTarget = ckTarget ? ckTarget.checked : false;

    // ถ้าไม่มีเป้า หรือไม่มีข้อมูล -> ซ่อน
    if (!rows.length || !monthlyTarget) {
        chart.data.datasets[DS.TARGET_CUM].data = [];
        chart.data.datasets[DS.TARGET_CUM].hidden = true;
        hideTargetInfo();
        updateRunRateUI({ target: 0, actual: 0, cumTarget: 0, remaining: 0, reqPerDay: 0, projection: 0 });
        chart.update("none");
        return;
    }

    // เดือนที่ใช้ pacing = เดือนของ "วันสุดท้ายของกราฟ"
    const endDate = parseDate(rows[rows.length - 1].date);
    if (!endDate) return;
    const y = endDate.getFullYear();
    const m = endDate.getMonth();

    // คำนวณยอดขายสะสมเฉพาะเดือนนั้น (เพื่อ KPI run-rate)
    let cumMonth = 0;
    const rowsWithMonthCum = rows.map(r => {
        const d = parseDate(r.date);
        if (d && d.getFullYear() === y && d.getMonth() === m) cumMonth += (r.sales || 0);
        return { ...r, salesCumMonth: cumMonth };
    });
    state.latestTrendRows = rowsWithMonthCum;

    const targetSeries = buildCumulativeTargetSeries(rowsWithMonthCum, monthlyTarget, y, m, holidaysSet);

    chart.data.datasets[DS.TARGET_CUM].data = targetSeries;
    chart.data.datasets[DS.TARGET_CUM].label = label || "Cumulative Target (บาท)";
    chart.data.datasets[DS.TARGET_CUM].hidden = !showTarget;

    // KPI + target info
    const kpi = calcRunRateKPIs(rowsWithMonthCum, monthlyTarget, y, m, holidaysSet);
    updateRunRateUI(kpi);

    displayTargetInfo({
        monthlyTarget,
        name: label || "",
        actual: kpi.actual,
        achievement: monthlyTarget > 0 ? (kpi.actual / monthlyTarget) * 100 : 0,
        remaining: monthlyTarget - kpi.actual
    });

    chart.update("none");
}

function displayTargetInfo({ monthlyTarget, name, actual, achievement, remaining }) {
    const info = el("targetInfo");
    if (!info) return;

    const statusClass = achievement >= 100 ? "success" : achievement >= 80 ? "warning" : "danger";
    info.style.display = "block";
    info.innerHTML = `
    <div class="target-info-card ${statusClass}">
      <div class="target-info-header">
        <strong>📊 ${escapeHtml(name || "เป้าหมาย")}</strong>
        <span class="target-badge">เป้ารายเดือน: ${fmt.format(monthlyTarget)} ฿</span>
      </div>
      <div class="target-info-body">
        <div class="target-stat"><span class="label">ยอดสะสมเดือนนี้:</span><span class="value">${fmt.format(actual)} ฿</span></div>
        <div class="target-stat"><span class="label">ความคืบหน้า:</span><span class="value ${statusClass}">${achievement.toFixed(1)}%</span></div>
        <div class="target-stat"><span class="label">${remaining >= 0 ? "ขาดอีก:" : "เกินเป้า:"}</span><span class="value">${fmt.format(Math.abs(remaining))} ฿</span></div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${statusClass}" style="width:${Math.min(achievement, 100)}%"></div>
      </div>
    </div>
  `;
}

function hideTargetInfo() {
    const info = el("targetInfo");
    if (info) info.style.display = "none";
}

// =========================
// ✅ KPI + Summary
// =========================
function setKPI(payload) {
    const k = payload.kpiToday || {};
    setText("updatedAt", payload.updatedAt || "-");

    setText("k_sales", (k.sales != null) ? (fmt.format(k.sales) + " ฿") : "-");
    setText("k_calls", (k.calls != null) ? fmt.format(k.calls) : "-");
    setText("k_visits", (k.visits != null) ? fmt.format(k.visits) : "-");
    setText("k_quotes", (k.quotes != null) ? fmt.format(k.quotes) : "-");

    if (payload.range) setText("rangeText", `${payload.range.start} → ${payload.range.end}`);
}

function sumFromTrend(rows) {
    return (rows || []).reduce((acc, r) => {
        acc.sales += (r.sales || 0);
        acc.calls += (r.calls || 0);
        acc.visits += (r.visits || 0);
        acc.quotes += (r.quotes || 0);
        return acc;
    }, { sales: 0, calls: 0, visits: 0, quotes: 0 });
}

function setSummary(payload) {
    const s = sumFromTrend(payload.dailyTrend || []);
    setText("sum_sales", fmt.format(s.sales) + " ฿");
    setText("sum_calls", fmt.format(s.calls));
    setText("sum_visits", fmt.format(s.visits));
    setText("sum_quotes", fmt.format(s.quotes));

    if (payload.range) setText("sumRangeText", `${payload.range.start} → ${payload.range.end}`);
    else setText("sumRangeText", "-");
}

// =========================
// ✅ Employees
// =========================
function setEmployees(payload) {
    const emp = payload.employees || [];
    setText("empCount", String(emp.length));

    const body = el("empBody");
    if (!body) return;

    body.innerHTML = "";
    emp.slice(0, 400).forEach((e, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${i + 1}</td><td>${escapeHtml(e.name || "")}</td>`;
        body.appendChild(tr);
    });
}

// =========================
// ✅ Person Totals panel (optional)
// =========================
function renderPersonTotals(payload) {
    const body = el("personTotalsBody");
    const meta = el("personSummaryMeta");
    const hint = el("personSummaryHint");
    if (!body || !meta || !hint) return;

    body.innerHTML = "";

    const selectedPerson = el("f_person")?.value || "";
    const rows = payload.personTotals || [];
    const rangeTxt = payload.range ? `${payload.range.start} → ${payload.range.end}` : "-";
    meta.textContent = rangeTxt;

    if (selectedPerson) {
        hint.textContent = `แสดงเฉพาะ: ${selectedPerson}`;
        const one = rows.find(x => x.person === selectedPerson);
        const r = one || { person: selectedPerson, sales: 0, calls: 0, visits: 0, quotes: 0 };

        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>1</td>
      <td>${escapeHtml(r.person || "")}</td>
      <td class="num">${fmt.format(r.sales || 0)} ฿</td>
      <td class="num">${fmt.format(r.calls || 0)}</td>
      <td class="num">${fmt.format(r.visits || 0)}</td>
      <td class="num">${fmt.format(r.quotes || 0)}</td>
    `;
        body.appendChild(tr);
        return;
    }

    hint.textContent = "แสดง Top รายบุคคล (ตามช่วงที่เลือก)";
    const top = [...rows].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 30);

    if (!top.length) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="6" class="muted">ไม่มีข้อมูลในช่วงที่เลือก</td>`;
        body.appendChild(tr);
        return;
    }

    top.forEach((r, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${escapeHtml(r.person || "")}</td>
      <td class="num">${fmt.format(r.sales || 0)} ฿</td>
      <td class="num">${fmt.format(r.calls || 0)}</td>
      <td class="num">${fmt.format(r.visits || 0)}</td>
      <td class="num">${fmt.format(r.quotes || 0)}</td>
    `;
        body.appendChild(tr);
    });
}

// =========================
// ✅ Top 5 per team
// =========================
function formatValue(metric, v) {
    if (metric === "sales") return fmt.format(v || 0) + " ฿";
    return fmt.format(v || 0);
}

function renderTop5(payload) {
    const wrap = el("top5Wrap");
    if (!wrap) return;

    const topByTeam = payload.topByTeam || {};
    wrap.innerHTML = "";

    const teams = Object.keys(topByTeam).sort((a, b) => a.localeCompare(b, "th"));
    if (!teams.length) {
        wrap.innerHTML = `<div class="muted">ไม่มีข้อมูล Top 5 ในช่วงที่เลือก</div>`;
        return;
    }

    teams.forEach(team => {
        const t = topByTeam[team] || {};
        const list =
            state.activeMetric === "sales" ? (t.topSales || []) :
                state.activeMetric === "calls" ? (t.topCalls || []) :
                    state.activeMetric === "visits" ? (t.topVisits || []) :
                        (t.topQuotes || []);

        const title =
            state.activeMetric === "sales" ? "Top 5: ยอดขาย" :
                state.activeMetric === "calls" ? "Top 5: โทร" :
                    state.activeMetric === "visits" ? "Top 5: เข้าพบ" :
                        "Top 5: ใบเสนอราคา";

        const card = document.createElement("div");
        card.className = "tcard";
        card.innerHTML = `<h4>${escapeHtml(team)}</h4><div class="mini">${title}</div>`;

        if (!list.length) {
            card.innerHTML += `<div class="muted" style="margin-top:8px;">ไม่มีข้อมูล</div>`;
        } else {
            list.forEach((row, idx) => {
                const val =
                    state.activeMetric === "sales" ? row.sales :
                        state.activeMetric === "calls" ? row.calls :
                            state.activeMetric === "visits" ? row.visits :
                                row.quotes;

                const div = document.createElement("div");
                div.className = "trow";
                div.innerHTML =
                    `<div class="rank">${idx + 1}</div>` +
                    `<div class="name">${escapeHtml(row.person || "")}</div>` +
                    `<div class="val">${formatValue(state.activeMetric, val)}</div>`;
                card.appendChild(div);
            });
        }

        wrap.appendChild(card);
    });
}

// =========================
// ✅ Load Data (with retry)
// =========================
async function loadData(isAuto = false) {
    if (state.isLoading) return;

    state.isLoading = true;
    setFilterStatus("กำลังโหลด…");

    const btnApply = el("btnApply");
    const originalText = btnApply?.textContent;
    if (btnApply) btnApply.textContent = "Loading...";

    try {
        const qs = buildQueryFromFilters();
        const url = API_URL + "?" + qs.toString();
        const payload = await loadJSONP(url);

        if (!payload || !payload.ok) throw new Error(payload?.error || "Invalid response from server");

        state.lastPayload = payload;
        state.retryCount = 0;

        setKPI(payload);
        setAvailable(payload);
        setEmployees(payload);
        setTrend(payload);
        setSummary(payload);
        renderPersonTotals(payload);
        renderTop5(payload);

        // ✅ วิเคราะห์ Lag (ไม่บล็อก UI)
        buildLagCards(payload);

        setFilterStatus("พร้อมใช้งาน");
        if (!isAuto) showToast("โหลดข้อมูลสำเร็จ", "success");
    } catch (err) {
        console.error("API load error:", err);
        setText("chartStatus", "API error");
        setFilterStatus("โหลดไม่สำเร็จ", true);

        if (state.retryCount < MAX_RETRIES) {
            state.retryCount++;
            showToast(`กำลังลองใหม่... (${state.retryCount}/${MAX_RETRIES})`, "info");
            setTimeout(() => loadData(true), RETRY_DELAY);
        } else {
            showToast("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", "error");
            state.retryCount = 0;
        }
    } finally {
        state.isLoading = false;
        if (btnApply) btnApply.textContent = originalText;
    }
}

// =========================
// ✅ Bind events
// =========================
function bindFilterEvents() {
    el("f_days")?.addEventListener("change", onDaysChange);
    el("f_start")?.addEventListener("change", onStartEndChange);
    el("f_end")?.addEventListener("change", onStartEndChange);

    el("f_team")?.addEventListener("change", onFilterSelectChange);
    el("f_group")?.addEventListener("change", onFilterSelectChange);

    el("f_person")?.addEventListener("change", () => {
        // เปลี่ยนคน -> อัปเดต target/pacing ทันที + debounce โหลด
        if (state.lastPayload) {
            renderPersonTotals(state.lastPayload);
            updateTargetLine(state.lastPayload);
        }
        debounceAutoLoad();
    });

    el("btnApply")?.addEventListener("click", () => loadData(false));
    el("btnReset")?.addEventListener("click", resetFilters);

    // ck_target เปิด/ปิดเส้นเป้าหมายแบบทันที
    el("ck_target")?.addEventListener("change", () => {
        if (state.lastPayload) updateTargetLine(state.lastPayload);
    });
}

function bindTop5Tabs() {
    el("metricTabs")?.addEventListener("click", (ev) => {
        const t = ev.target.closest(".tab");
        if (!t) return;

        state.activeMetric = t.dataset.metric;

        document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
        t.classList.add("active");

        if (state.lastPayload) renderTop5(state.lastPayload);
    });
}

function bindKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "r") {
            e.preventDefault();
            loadData(false);
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            resetFilters();
        }
    });
}

function handleVisibilityChange() {
    if (!document.hidden) loadData(true);
}

// =========================
// ✅ Init
// =========================
window.addEventListener("load", () => {
    bindFilterEvents();
    bindTop5Tabs();
    bindKeyboardShortcuts();
    initChart();
    loadData(false);

    setInterval(() => {
        if (!document.hidden) loadData(true);
    }, REFRESH_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);
});