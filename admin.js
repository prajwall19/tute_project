import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const CATS = { pothole: "Pothole or damaged road", garbage: "Garbage or waste", streetlight: "Broken streetlight", water: "Water supply or leak", drainage: "Drainage or flooding", other: "Something else" };
const STAT = ["submitted", "acknowledged", "in_progress", "resolved"];
const LABEL = { submitted: "Submitted", acknowledged: "Acknowledged", in_progress: "In progress", resolved: "Resolved" };
const STAT_COLORS = { submitted: "#ffc933", acknowledged: "#8ab4ff", in_progress: "#5cc6cb", resolved: "#4ade80" };

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = s => document.querySelector(s);
const main = $("#main");
let currentUser = null;
let allReports = [];

/* ---- Auth slot ---- */
function authSlot() {
  const u = currentUser, el = $("#auth");
  const firstName = u ? (u.displayName || u.email || "Admin").split(" ")[0] : "";
  el.innerHTML = u
    ? `<span class="who">Hi, ${esc(firstName)}</span><button class="btn lo" id="out">Log out</button>`
    : `<a class="btn lo" href="auth.html?next=admin.html">Log in</a>`;
  if (u) $("#out").onclick = async () => { await signOut(auth); location.reload(); };
}

const ADMIN_EMAIL = "prajwal@gmail.com";

/* ---- Check if user is admin ---- */
async function isAdmin(user) {
  if (user?.email && user.email.trim().toLowerCase() === ADMIN_EMAIL) return true;
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && userDoc.data().role === "admin") return true;
  } catch (e) {
    console.error("Admin check failed:", e);
  }
  return false;
}

/* ---- Load all reports ---- */
async function loadReports() {
  const q = query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(200));
  const snap = await getDocs(q);
  allReports = snap.docs.map(d => {
    const data = d.data();
    let createdIso = new Date().toISOString();
    if (data.createdAt && typeof data.createdAt.toDate === "function") {
      createdIso = data.createdAt.toDate().toISOString();
    } else if (typeof data.createdAt === "string") {
      createdIso = data.createdAt;
    }
    return { id: d.id, ...data, createdAt: createdIso };
  });
  return allReports;
}

/* ---- Update report status ---- */
async function updateStatus(reportId, newStatus, note) {
  const report = allReports.find(r => r.id === reportId);
  if (!report) throw new Error("Report not found");

  const history = Array.isArray(report.statusHistory) ? [...report.statusHistory] : [];
  history.push({
    status: newStatus,
    changedBy: currentUser.uid,
    changedByName: currentUser.displayName || currentUser.email || "Admin",
    note: note || `Status changed to ${LABEL[newStatus]}`,
    changedAt: new Date().toISOString(),
  });

  await updateDoc(doc(db, "reports", reportId), {
    status: newStatus,
    statusHistory: history,
    updatedAt: serverTimestamp(),
  });
}

/* ---- Render stats bar ---- */
function statsBar(reports) {
  const counts = { submitted: 0, acknowledged: 0, in_progress: 0, resolved: 0 };
  reports.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
  const total = reports.length;
  return `<div class="admin-stats">
    <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Total</div></div>
    ${STAT.map(s => `<div class="stat-card"><div class="stat-num" style="color:${STAT_COLORS[s]}">${counts[s]}</div><div class="stat-label">${LABEL[s]}</div></div>`).join("")}
  </div>`;
}

/* ---- Render report row ---- */
function reportRow(r) {
  const step = STAT.indexOf(r.status);
  const loc = r.locationAddress || r.loc || "—";
  const dateStr = new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const catLabel = CATS[r.category] || r.category;
  const imgSrc = r.imageUrl || r.imageDataUrl || "";

  return `<div class="admin-card" data-id="${esc(r.id)}">
    <div class="admin-card-header">
      <div>
        <h3>${esc(r.title)}</h3>
        <p class="admin-meta">${esc(catLabel)} · ${esc(loc)} · ${dateStr}</p>
        <p class="admin-meta">By: ${esc(r.userName || "Unknown")}${r.isDemo ? ' · <span class="demo-tag">Demo</span>' : ""}</p>
        ${r.description ? `<p class="admin-desc">${esc(r.description)}</p>` : ""}
      </div>
      ${imgSrc ? `<img class="admin-thumb" src="${esc(imgSrc)}" alt="Photo" loading="lazy">` : ""}
    </div>
    <div class="admin-card-actions">
      <div class="status-track">
        ${STAT.map((s, k) => `<span class="track-step ${k <= step ? "active" : ""}" style="${k <= step ? `background:${STAT_COLORS[r.status]}` : ""}">${LABEL[s]}</span>`).join('<span class="track-arrow">→</span>')}
      </div>
      <div class="action-row">
        <select class="status-select" data-id="${esc(r.id)}">
          ${STAT.map(s => `<option value="${s}" ${s === r.status ? "selected" : ""}>${LABEL[s]}</option>`).join("")}
        </select>
        <input class="note-input" placeholder="Add a note (optional)" data-id="${esc(r.id)}">
        <button class="btn btn-primary btn-sm update-btn" data-id="${esc(r.id)}">Update</button>
      </div>
    </div>
    ${r.statusHistory && r.statusHistory.length > 1 ? `
    <details class="history-details">
      <summary>Status history (${r.statusHistory.length})</summary>
      <ul class="history-list">
        ${r.statusHistory.map(h => `<li><span class="badge ${h.status}">${LABEL[h.status] || h.status}</span> ${esc(h.note || "")} <span class="history-date">${new Date(h.changedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></li>`).join("")}
      </ul>
    </details>` : ""}
  </div>`;
}

/* ---- Main admin view ---- */
function renderAdmin(reports, filter = "all") {
  const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter);

  main.innerHTML = `<section class="page admin-page">
    <h2>All Reports</h2>
    <p class="lede">Manage and update the status of citizen reports.</p>
    ${statsBar(reports)}
    <div class="admin-filters" role="group" aria-label="Filter reports">
      ${[["all", "All"], ...STAT.map(s => [s, LABEL[s]])].map(([v, l]) =>
        `<button class="chip ${filter === v ? "active" : ""}" data-f="${v}">${l} ${v === "all" ? `(${reports.length})` : `(${reports.filter(r => r.status === v).length})`}</button>`
      ).join("")}
    </div>
    <div id="report-list">
      ${filtered.length ? filtered.map(reportRow).join("") : `<div class="state"><p>No ${filter === "all" ? "" : LABEL[filter] + " "}reports found.</p></div>`}
    </div>
  </section>`;

  /* Attach filter handlers */
  main.querySelectorAll(".chip[data-f]").forEach(btn => {
    btn.onclick = () => renderAdmin(reports, btn.dataset.f);
  });

  /* Attach update handlers */
  main.querySelectorAll(".update-btn").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const select = main.querySelector(`.status-select[data-id="${id}"]`);
      const noteInput = main.querySelector(`.note-input[data-id="${id}"]`);
      const newStatus = select.value;
      const note = noteInput.value.trim();
      const report = allReports.find(r => r.id === id);

      if (report && report.status === newStatus && !note) {
        alert("Choose a different status or add a note.");
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="spin"></span> Saving…';

      try {
        await updateStatus(id, newStatus, note);
        await loadReports();
        renderAdmin(allReports, filter);
      } catch (err) {
        alert("Failed to update: " + (err.message || "Unknown error"));
        btn.disabled = false;
        btn.textContent = "Update";
      }
    };
  });
}

/* ---- Gate: not logged in ---- */
function gateView(msg) {
  main.innerHTML = `<section class="state"><h2>${esc(msg)}</h2><p class="lede">Only admin accounts can access this panel.</p><a class="btn btn-primary" href="auth.html?next=admin.html">Log in</a></section>`;
}

/* ---- Gate: not admin ---- */
function deniedView() {
  main.innerHTML = `<section class="state"><h2>Access Denied</h2><p class="lede">Your account does not have admin privileges.</p><p>Ask a project administrator to set your role to <code>admin</code> in the Firestore <code>users</code> collection.</p><a class="btn" href="index.html#home">Back to CityFix</a></section>`;
}

/* ---- Loading view ---- */
function loadingView() {
  main.innerHTML = `<section class="page"><h2>Admin Panel</h2><div class="state"><p><span class="spin"></span> Verifying access…</p></div></section>`;
}

/* ---- Init ---- */
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  authSlot();

  if (!user) {
    gateView("Log in to access the admin panel");
    return;
  }

  loadingView();

  const admin = await isAdmin(user);
  if (!admin) {
    deniedView();
    return;
  }

  try {
    await loadReports();
    renderAdmin(allReports);
  } catch (err) {
    main.innerHTML = `<section class="page"><div class="state bad" role="alert"><p><strong>Couldn't load reports.</strong> ${esc(err.message)}</p><button class="btn" id="retry">Try again</button></div></section>`;
    $("#retry").onclick = async () => {
      loadingView();
      try {
        await loadReports();
        renderAdmin(allReports);
      } catch (e) {
        alert("Still failing: " + e.message);
      }
    };
  }
});
