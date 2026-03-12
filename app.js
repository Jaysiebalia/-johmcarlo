// ============================================================
//  RecycleHub Platform V1.0 — app.js
//  Local Storage (No Firebase)
// ============================================================

// ── LOCAL STORAGE HELPERS ────────────────────────────────────
function lsGet(key)        { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function lsSet(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function nowISO() { return new Date().toISOString(); }

// ── SEED DEFAULT DATA ────────────────────────────────────────
function seedDefaultData() {
  if (!lsGet("rh_seeded")) {
    lsSet("rh_users", []);
    lsSet("rh_centers", [
      { id: generateId(), name: "EcoPoint Quezon City",   address: "123 Commonwealth Ave, QC",   contact: "+63 912 000 0001", operatingHours: "08:00 – 17:00", status: "Open",          materials: ["Plastic","Paper","Metal"], isVerified: true,  createdAt: nowISO() },
      { id: generateId(), name: "GreenHub Mandaluyong",   address: "456 Shaw Blvd, Mandaluyong", contact: "+63 912 000 0002", operatingHours: "09:00 – 18:00", status: "Open",          materials: ["Glass","Electronics"],     isVerified: true,  createdAt: nowISO() },
      { id: generateId(), name: "RecyclePro Makati",      address: "789 Ayala Ave, Makati",      contact: "+63 912 000 0003", operatingHours: "08:00 – 16:00", status: "Limited Hours", materials: ["Metal","E-Waste"],         isVerified: false, createdAt: nowISO() },
    ]);
    lsSet("rh_materials", [
      { id: generateId(), name: "Plastic Bottles (PET)", category: "Plastic",     isRecyclable: true,      icon: "🧴", description: "Clean, label-free PET bottles accepted at most centers.",       createdAt: nowISO() },
      { id: generateId(), name: "Cardboard / Paper",     category: "Paper",       isRecyclable: true,      icon: "📦", description: "Flatten boxes; keep dry and free of grease.",                  createdAt: nowISO() },
      { id: generateId(), name: "Aluminum Cans",         category: "Metal",       isRecyclable: true,      icon: "🥫", description: "Rinse cans before dropping off.",                              createdAt: nowISO() },
      { id: generateId(), name: "Glass Bottles",         category: "Glass",       isRecyclable: true,      icon: "🍾", description: "Remove caps and rinse. Separate by color if possible.",        createdAt: nowISO() },
      { id: generateId(), name: "Electronics / E-Waste", category: "Electronics", isRecyclable: "special", icon: "💻", description: "Requires certified e-waste drop-off center.",                 createdAt: nowISO() },
      { id: generateId(), name: "Batteries",             category: "Hazardous",   isRecyclable: "special", icon: "🔋", description: "Never throw in general waste. Use designated hazardous bins.", createdAt: nowISO() },
      { id: generateId(), name: "Styrofoam",             category: "Plastic",     isRecyclable: false,     icon: "📬", description: "Most curbside programs do not accept styrofoam.",              createdAt: nowISO() },
      { id: generateId(), name: "Food Waste",            category: "Organic",     isRecyclable: false,     icon: "🍎", description: "Not recyclable; use compost bins instead.",                   createdAt: nowISO() },
      { id: generateId(), name: "Steel / Metal Scrap",   category: "Metal",       isRecyclable: true,      icon: "🔩", description: "Scrap metal is highly valuable and widely accepted.",         createdAt: nowISO() },
      { id: generateId(), name: "Textiles / Clothing",   category: "Textile",     isRecyclable: "special", icon: "👕", description: "Donate or use textile-specific recycling drives.",            createdAt: nowISO() },
    ]);
    lsSet("rh_notifications", []);
    lsSet("rh_visits", []);
    lsSet("rh_seeded", true);
  }
}

// ── APP STATE ────────────────────────────────────────────────
let currentUser     = null;
let currentUserData = null;
let centersCache    = [];
let materialsCache  = [];

// ── PAGE NAVIGATION ──────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function switchView(view, el) {
  document.querySelectorAll("[id^='view-']").forEach(v => { v.style.display = "none"; });
  const target = document.getElementById("view-" + view);
  if (target) target.style.display = "block";

  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  if (el) el.classList.add("active");

  document.getElementById("view-title").textContent =
    view.charAt(0).toUpperCase() + view.slice(1).replace("-", " ");

  if (view === "map")           renderMap();
  if (view === "materials")     renderMaterials();
  if (view === "notifications") renderNotifications();
  if (view === "dashboard")     renderDashboard();
  if (view === "profile")       renderProfile();
  if (view === "users")         renderUsers();
  if (view === "admin")         renderAdminCenters();
}

// ── AUTH HELPERS ─────────────────────────────────────────────
function hintLoginRole() {
  document.getElementById("login-role-hint").style.display = "none";
}

// ── REGISTER ─────────────────────────────────────────────────
function doRegister() {
  const fname    = document.getElementById("reg-fname").value.trim();
  const lname    = document.getElementById("reg-lname").value.trim();
  const email    = document.getElementById("reg-email").value.trim().toLowerCase();
  const pass     = document.getElementById("reg-pass").value;
  const location = document.getElementById("reg-location").value.trim();
  const roleEl   = document.querySelector(".role-opt.selected");
  const role     = roleEl ? roleEl.dataset.role : "user";
  const errEl    = document.getElementById("reg-error");

  errEl.style.display = "none";

  if (!fname || !lname || !email || !pass || !location) {
    errEl.textContent = "Please fill in all required fields.";
    errEl.style.display = "block";
    return;
  }
  if (pass.length < 6) {
    errEl.textContent = "Password must be at least 6 characters.";
    errEl.style.display = "block";
    return;
  }

  const users = lsGet("rh_users") || [];
  if (users.find(u => u.email === email)) {
    errEl.textContent = "This email is already registered.";
    errEl.style.display = "block";
    return;
  }

  users.push({
    uid: generateId(), firstName: fname, lastName: lname,
    name: `${fname} ${lname}`, email, password: pass,
    role, location, bio: "", createdAt: nowISO(),
    isActive: true, visitsCount: 0, notificationsCount: 0
  });
  lsSet("rh_users", users);

  showToast("Account created! Please sign in 🌱");
  showPage("page-login");
}

// ── LOGIN ─────────────────────────────────────────────────────
function doLogin() {
  const email  = document.getElementById("login-email").value.trim().toLowerCase();
  const pass   = document.getElementById("login-pass").value;
  const errEl  = document.getElementById("login-error");
  errEl.style.display = "none";

  if (!email || !pass) {
    errEl.textContent = "Please enter your email and password.";
    errEl.style.display = "block";
    return;
  }

  const user = (lsGet("rh_users") || []).find(u => u.email === email && u.password === pass);

  if (!user) {
    errEl.textContent = "Invalid email or password.";
    errEl.style.display = "block";
    return;
  }
  if (!user.isActive) {
    errEl.textContent = "Your account has been deactivated.";
    errEl.style.display = "block";
    return;
  }

  lsSet("rh_session", user.uid);
  currentUser     = { uid: user.uid };
  currentUserData = user;
  bootApp();
  showPage("page-app");
  switchView("dashboard", document.querySelector(".nav-item"));
}

// ── LOGOUT ───────────────────────────────────────────────────
function doLogout() {
  localStorage.removeItem("rh_session");
  currentUser     = null;
  currentUserData = null;
  showPage("page-login");
  showToast("Signed out successfully.");
}

// ── RESTORE SESSION ON PAGE LOAD ─────────────────────────────
function restoreSession() {
  const uid  = lsGet("rh_session");
  const user = uid && (lsGet("rh_users") || []).find(u => u.uid === uid);
  if (user && user.isActive) {
    currentUser     = { uid: user.uid };
    currentUserData = user;
    bootApp();
    showPage("page-app");
    switchView("dashboard", document.querySelector(".nav-item"));
  } else {
    localStorage.removeItem("rh_session");
    showPage("page-login");
  }
}

// ── BOOT APP ─────────────────────────────────────────────────
function bootApp() {
  const u = currentUserData;
  document.getElementById("sb-name").textContent     = u.name;
  document.getElementById("sb-role").textContent     = roleLabel(u.role);
  document.getElementById("topbar-user").textContent = u.firstName + " " + u.lastName.charAt(0) + ".";

  const isOp    = u.role === "operator" || u.role === "admin";
  const isAdmin = u.role === "admin";
  document.querySelectorAll(".operator-nav, .operator-section").forEach(el => { el.style.display = isOp    ? "" : "none"; });
  document.querySelectorAll(".admin-nav, .admin-section").forEach(el =>         { el.style.display = isAdmin ? "" : "none"; });

  loadCenters();
  loadMaterials();
}

// ── LOCAL: CENTERS ───────────────────────────────────────────
function loadCenters()  { centersCache   = lsGet("rh_centers")   || []; }
function loadMaterials(){ materialsCache = lsGet("rh_materials") || []; }

function addCenter() {
  const inputs  = document.querySelectorAll("#modal-add-center input[type='text'], #modal-add-center input:not([type])");
  const times   = document.querySelectorAll("#modal-add-center input[type='time']");
  const name    = inputs[0]?.value.trim();
  const address = inputs[1]?.value.trim();
  const contact = inputs[2]?.value.trim();
  const open    = times[0]?.value;
  const close   = times[1]?.value;
  const status  = document.querySelector("#modal-add-center select").value;

  if (!name || !address) { showToast("⚠️ Center name and address are required."); return; }

  const centers = lsGet("rh_centers") || [];
  centers.push({ id: generateId(), name, address, contact, operatingHours: `${open} – ${close}`, status, isVerified: false, materials: [], latitude: 14.6760, longitude: 121.0437, createdAt: nowISO(), createdBy: currentUser.uid });
  lsSet("rh_centers", centers);
  loadCenters();
  closeModal("modal-add-center");
  renderAdminCenters();
  showToast("✅ Center added successfully!");
}

function deleteCenter(id) {
  if (!confirm("Delete this recycling center?")) return;
  lsSet("rh_centers", (lsGet("rh_centers") || []).filter(c => c.id !== id));
  loadCenters();
  renderAdminCenters();
  showToast("🗑️ Center deleted.");
}

// ── LOCAL: NOTIFICATIONS ─────────────────────────────────────
function loadNotifications() {
  const notifs = (lsGet("rh_notifications") || [])
    .filter(n => n.userId === currentUser.uid)
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

  const unread = notifs.filter(n => !n.isRead).length;
  const badge  = document.getElementById("notif-badge");
  badge.textContent   = unread;
  badge.style.display = unread > 0 ? "flex" : "none";
  return notifs;
}

function markAllRead() {
  const all = lsGet("rh_notifications") || [];
  all.forEach(n => { if (n.userId === currentUser.uid) n.isRead = true; });
  lsSet("rh_notifications", all);
  renderNotifications();
  showToast("All notifications marked as read.");
}

function markOneRead(id, el) {
  const all = lsGet("rh_notifications") || [];
  const n   = all.find(x => x.id === id);
  if (n) { n.isRead = true; lsSet("rh_notifications", all); }
  el.classList.remove("unread");
  el.querySelector(".badge")?.remove();
  loadNotifications();
}

// ── LOCAL: PROFILE ───────────────────────────────────────────
function saveProfile() {
  const updates = {
    firstName: document.getElementById("pf-fname").value.trim(),
    lastName:  document.getElementById("pf-lname").value.trim(),
    email:     document.getElementById("pf-email").value.trim(),
    location:  document.getElementById("pf-location").value.trim(),
    bio:       document.getElementById("pf-bio").value.trim(),
  };
  updates.name = `${updates.firstName} ${updates.lastName}`;

  const users = lsGet("rh_users") || [];
  const idx   = users.findIndex(u => u.uid === currentUser.uid);
  if (idx !== -1) { users[idx] = { ...users[idx], ...updates }; lsSet("rh_users", users); }
  currentUserData = { ...currentUserData, ...updates };

  document.getElementById("sb-name").textContent     = updates.name;
  document.getElementById("topbar-user").textContent = updates.firstName + " " + updates.lastName.charAt(0) + ".";
  showToast("✅ Profile saved!");
}

// ── LOCAL: ADMIN USERS ───────────────────────────────────────
function loadAllUsers() { return lsGet("rh_users") || []; }

function toggleUserStatus(uid, current) {
  const users = lsGet("rh_users") || [];
  const idx   = users.findIndex(u => u.uid === uid);
  if (idx !== -1) { users[idx].isActive = !current; lsSet("rh_users", users); }
  renderUsers();
  showToast(`User ${!current ? "activated" : "deactivated"}.`);
}

// ── RENDER: DASHBOARD ────────────────────────────────────────
function renderDashboard() {
  const u       = currentUserData;
  const isAdmin = u.role === "admin";
  const notifs  = loadNotifications();
  const kpiGrid = document.getElementById("kpi-grid");

  const kpis = isAdmin ? [
    { icon: "👥", val: loadAllUsers().length,                                       label: "Total Users",          change: "" },
    { icon: "🏢", val: centersCache.length,                                         label: "Active Centers",       change: "" },
    { icon: "♻️", val: materialsCache.filter(m => m.isRecyclable === true).length, label: "Recyclable Materials", change: "" },
  ] : [
    { icon: "📍", val: centersCache.length,                        label: "Centers Near You",     change: "↑ 2 new this week", up: true },
    { icon: "♻️", val: materialsCache.length,                      label: "Material Guides",      change: "EPA-aligned",       up: true },
    { icon: "🔔", val: notifs.filter(n => !n.isRead).length,       label: "Unread Notifications", change: "" },
  ];

  kpiGrid.innerHTML = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-icon">${k.icon}</div>
      <div class="kpi-value">${k.val}</div>
      <div class="kpi-label">${k.label}</div>
      ${k.change ? `<div class="kpi-change ${k.up ? "up" : ""}">${k.change}</div>` : ""}
    </div>
  `).join("");

  document.getElementById("recent-activity-body").innerHTML = centersCache.slice(0, 5).map(c => `
    <tr>
      <td>Viewed Center</td><td>${c.name || "—"}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td><span class="badge badge-green">Active</span></td>
    </tr>
  `).join("") || `<tr><td colspan="4" style="text-align:center;color:#aab8b0;padding:1.5rem;">No recent activity yet</td></tr>`;

  document.getElementById("dash-notifs").innerHTML = notifs.slice(0, 4).map(n => `
    <div class="notif-row ${n.isRead ? "" : "unread"}" style="margin-bottom:.6rem;">
      <div class="notif-row-icon">${notifIcon(n.type)}</div>
      <div>
        <div class="notif-row-title">${n.title}</div>
        <div class="notif-row-body">${n.message}</div>
        <div class="notif-row-time">${formatDate(n.sentAt)}</div>
      </div>
    </div>
  `).join("") || `<div style="color:#aab8b0;font-size:.85rem;padding:.5rem;">No notifications yet</div>`;

  document.getElementById("impact-bars").innerHTML = [
    { label: "Plastic", pct: 82 }, { label: "Cardboard", pct: 67 },
    { label: "Aluminum", pct: 45 }, { label: "E-Waste", pct: 30 },
  ].map(b => `
    <div style="display:flex;align-items:center;gap:.8rem;margin-bottom:.8rem;">
      <span style="font-size:.82rem;color:#556b5e;width:100px;">${b.label}</span>
      <div class="chart-bar-track" style="flex:1"><div class="chart-bar-fill" style="width:${b.pct}%"></div></div>
      <span style="font-size:.8rem;font-weight:700;color:var(--forest);width:35px;text-align:right;">${b.pct}%</span>
    </div>
  `).join("");
}

// ── RENDER: MAP ──────────────────────────────────────────────
function renderMap() {
  const list = document.getElementById("center-list");
  const pins = document.getElementById("map-pins");

  list.innerHTML = centersCache.map((c, i) => `
    <div class="center-card" onclick="selectCenter('${c.id}', ${i})" id="cc-${c.id}">
      <div class="center-name">${c.name || "Unnamed Center"}</div>
      <div class="center-addr">📍 ${c.address || "No address"}</div>
      <div class="center-tags">
        ${(c.materials || []).map(m => `<span class="center-tag">${m}</span>`).join("")}
        <span class="badge ${statusBadge(c.status)}" style="font-size:.65rem;">${c.status || "Open"}</span>
      </div>
    </div>
  `).join("") || `<div class="empty-state"><div class="empty-icon">📍</div><p>No centers found</p></div>`;

  pins.innerHTML = centersCache.map((c, i) => {
    const left = 20 + (i % 6) * 12;
    const top  = 20 + Math.floor(i / 6) * 20;
    return `<div class="map-pin pin-active" style="left:${left}%;top:${top}%;" onclick="showPinPopup('${c.id}', ${left}, ${top})"><div class="pin-dot"></div></div>`;
  }).join("");
}

function showPinPopup(id, left, top) {
  const c = centersCache.find(x => x.id === id);
  if (!c) return;
  const popup = document.getElementById("map-popup");
  popup.className = "map-popup show";
  popup.style.left = Math.min(left + 2, 65) + "%";
  popup.style.top  = Math.max(top - 20, 5) + "%";
  popup.innerHTML  = `
    <div class="popup-name">${c.name}</div>
    <div class="popup-status"><span class="badge ${statusBadge(c.status)}">${c.status || "Open"}</span></div>
    <div class="popup-materials">🕐 ${c.operatingHours || "Hours not listed"}</div>
    <div class="popup-materials" style="margin-top:.3rem;">📞 ${c.contact || "No contact"}</div>
    <button class="inline-btn" style="margin-top:.8rem;font-size:.75rem;padding:.4rem 1rem;" onclick="logVisit('${c.id}')">Log Visit ✓</button>
  `;
}

function logVisit(centerId) {
  const visits = lsGet("rh_visits") || [];
  visits.push({ id: generateId(), userId: currentUser.uid, centerId, visitedAt: nowISO() });
  lsSet("rh_visits", visits);

  const users = lsGet("rh_users") || [];
  const idx   = users.findIndex(u => u.uid === currentUser.uid);
  if (idx !== -1) {
    users[idx].visitsCount = (users[idx].visitsCount || 0) + 1;
    lsSet("rh_users", users);
    currentUserData.visitsCount = users[idx].visitsCount;
  }
  showToast("✅ Visit logged!");
}

function selectCenter(id, i) {
  document.querySelectorAll(".center-card").forEach(c => c.classList.remove("selected"));
  const el   = document.getElementById("cc-" + id);
  if (el) el.classList.add("selected");
  const c    = centersCache.find(x => x.id === id);
  const left = 20 + (i % 6) * 12;
  const top  = 20 + Math.floor(i / 6) * 20;
  if (c) showPinPopup(id, left, top);
}

function filterCenters() {
  const q = document.getElementById("center-search").value.toLowerCase();
  document.querySelectorAll(".center-card").forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}

function filterChip(el, type) {
  document.querySelectorAll(".map-sidebar .chip").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
  document.querySelectorAll(".center-card").forEach(card => {
    card.style.display = (type === "all" || card.textContent.toLowerCase().includes(type)) ? "" : "none";
  });
}

// ── RENDER: MATERIALS ────────────────────────────────────────
function renderMaterials(filter = "all", search = "") {
  const grid = document.getElementById("materials-grid");
  let list = materialsCache;
  if (filter === "recyclable") list = list.filter(m => m.isRecyclable === true);
  if (filter === "not")        list = list.filter(m => m.isRecyclable === false);
  if (filter === "special")    list = list.filter(m => m.isRecyclable === "special");
  if (search) list = list.filter(m => m.name.toLowerCase().includes(search) || (m.description || "").toLowerCase().includes(search));

  grid.innerHTML = list.map(m => {
    const s = m.isRecyclable === true ? { color: "var(--leaf)", dot: "#4a9e6b", label: "Recyclable" }
            : m.isRecyclable === "special" ? { color: "var(--amber)", dot: "#e8a74a", label: "Special Handling" }
            : { color: "var(--red)", dot: "#e05555", label: "Not Recyclable" };
    return `
      <div class="material-card">
        <div class="material-icon">${m.icon || "♻️"}</div>
        <div class="material-name">${m.name}</div>
        <div class="material-desc">${m.description || ""}</div>
        <div class="material-status" style="color:${s.color};">
          <div class="status-dot" style="background:${s.dot};"></div>${s.label}
        </div>
      </div>`;
  }).join("") || `<div class="empty-state" style="grid-column:span 3;"><div class="empty-icon">🔍</div><p>No materials found</p></div>`;
}

function filterMaterials() {
  const q    = document.getElementById("material-search").value.toLowerCase();
  const type = (document.querySelector("#view-materials .chip.active")?.textContent || "").replace(/[^a-z]/gi, "").toLowerCase();
  renderMaterials(type === "recyclable" ? "recyclable" : type === "not" ? "not" : type === "special" ? "special" : "all", q);
}

function filterMatChip(el, type) {
  document.querySelectorAll("#view-materials .chip").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
  renderMaterials(type, document.getElementById("material-search").value.toLowerCase());
}

// ── RENDER: NOTIFICATIONS ────────────────────────────────────
function renderNotifications() {
  const notifs = loadNotifications();
  const list   = document.getElementById("notif-list-view");
  list.innerHTML = notifs.map(n => `
    <div class="notif-row ${n.isRead ? "" : "unread"}" onclick="markOneRead('${n.id}', this)">
      <div class="notif-row-icon">${notifIcon(n.type)}</div>
      <div style="flex:1">
        <div class="notif-row-title">${n.title}</div>
        <div class="notif-row-body">${n.message}</div>
        <div class="notif-row-time">${formatDate(n.sentAt)}</div>
      </div>
      ${!n.isRead ? `<span class="badge badge-green" style="align-self:center;">New</span>` : ""}
    </div>
  `).join("") || `<div class="empty-state"><div class="empty-icon">🔔</div><p>No notifications yet</p></div>`;
}

// ── RENDER: PROFILE ──────────────────────────────────────────
function renderProfile() {
  const u = currentUserData;
  document.getElementById("profile-avatar").textContent = u.role === "admin" ? "🔑" : u.role === "operator" ? "🏭" : "🧍";
  document.getElementById("profile-name").textContent   = u.name;
  document.getElementById("profile-role").textContent   = roleLabel(u.role);
  document.getElementById("pf-fname").value    = u.firstName || "";
  document.getElementById("pf-lname").value    = u.lastName  || "";
  document.getElementById("pf-email").value    = u.email     || "";
  document.getElementById("pf-location").value = u.location  || "";
  document.getElementById("pf-bio").value      = u.bio       || "";
  document.getElementById("profile-stats").innerHTML = `
    <div class="profile-stat"><div class="profile-stat-val">${u.visitsCount || 0}</div><div class="profile-stat-label">Centers Visited</div></div>
    <div class="profile-stat"><div class="profile-stat-val">${u.notificationsCount || 0}</div><div class="profile-stat-label">Notifications</div></div>
  `;
}

// ── RENDER: ADMIN USERS ──────────────────────────────────────
function renderUsers() {
  if (currentUserData?.role !== "admin") return;
  const tbody = document.getElementById("users-body");
  tbody.innerHTML = loadAllUsers().map(u => `
    <tr>
      <td>${u.name || "—"}</td><td>${u.email}</td>
      <td><span class="badge badge-blue">${roleLabel(u.role)}</span></td>
      <td>${u.location || "—"}</td><td>${formatDate(u.createdAt)}</td>
      <td><span class="badge ${u.isActive ? "badge-green" : "badge-red"}">${u.isActive ? "Active" : "Inactive"}</span></td>
      <td>
        <button class="inline-btn secondary" style="font-size:.75rem;padding:.3rem .8rem;" onclick="toggleUserStatus('${u.uid}', ${u.isActive})">
          ${u.isActive ? "Deactivate" : "Activate"}
        </button>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="7" style="text-align:center;color:#aab8b0;">No users found</td></tr>`;
}

// ── RENDER: ADMIN CENTERS ─────────────────────────────────────
function renderAdminCenters() {
  if (currentUserData?.role !== "admin") return;
  loadCenters();
  const tbody = document.getElementById("admin-centers-body");
  tbody.innerHTML = centersCache.map(c => `
    <tr>
      <td>${c.name}</td><td>${c.address}</td>
      <td>${(c.materials || []).join(", ") || "—"}</td>
      <td><span class="badge ${statusBadge(c.status)}">${c.status || "Open"}</span></td>
      <td>
        <button class="inline-btn secondary" style="font-size:.72rem;padding:.3rem .7rem;margin-right:.4rem;" onclick="showToast('Edit coming soon')">Edit</button>
        <button class="inline-btn" style="font-size:.72rem;padding:.3rem .7rem;background:var(--red);color:white;" onclick="deleteCenter('${c.id}')">Delete</button>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="5" style="text-align:center;color:#aab8b0;">No centers yet</td></tr>`;
}

// ── ADMIN TABS ───────────────────────────────────────────────
function switchAdminTab(tab, el) {
  document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.remove("active"));
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
  document.getElementById("admin-" + tab).classList.add("active");
  el.classList.add("active");
  if (tab === "centers") renderAdminCenters();
}

// ── MODAL ─────────────────────────────────────────────────────
function openAddCenter() { document.getElementById("modal-add-center").classList.add("show"); }
function closeModal(id)  { document.getElementById(id).classList.remove("show"); }

// ── ROLE PICKER ───────────────────────────────────────────────
function selectRole(el) {
  document.querySelectorAll(".role-opt").forEach(r => r.classList.remove("selected"));
  el.classList.add("selected");
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById("toast");
  document.getElementById("toast-msg").textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

// ── LOADING OVERLAY ───────────────────────────────────────────
function showLoading(show) {
  document.getElementById("loading-overlay").style.display = show ? "flex" : "none";
}

// ── HELPERS ───────────────────────────────────────────────────
function roleLabel(role) {
  return { user: "General User", operator: "Center Operator", admin: "Administrator" }[role] || role;
}
function statusBadge(status) {
  if (!status || status === "Open") return "badge-green";
  if (status === "Limited Hours")   return "badge-amber";
  return "badge-red";
}
function notifIcon(type) {
  return { reminder: "🔔", update: "📢", alert: "⚠️" }[type] || "📩";
}
function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

// ── STUB FUNCTIONS ────────────────────────────────────────────
function savePreferences()       { showToast("⚙️ Preferences saved!"); }
function changePassword()        { showToast("🔐 Password update coming soon."); }
function saveOperatorDetails()   { showToast("💾 Operator details saved!"); }
function updateMaterials()       { showToast("♻️ Materials updated!"); }
function sendSubscriberNotif()   { showToast("🔔 Notification sent to subscribers!"); }
function sendAdminNotification() { showToast("🔔 Admin notification sent!"); }
function exportReportPDF()       { showToast("⬇️ PDF export coming soon."); }
function generateReport()        { showToast("📊 Report generation coming soon."); }
function exportCSV()             { showToast("⬇️ CSV export coming soon."); }
function saveEditUser()          { closeModal("modal-edit-user"); showToast("✅ User updated!"); }

// ── GLOBAL EXPORTS ────────────────────────────────────────────
window.showPage              = showPage;
window.switchView            = switchView;
window.hintLoginRole         = hintLoginRole;
window.doLogin               = doLogin;
window.doRegister            = doRegister;
window.doLogout              = doLogout;
window.selectRole            = selectRole;
window.filterCenters         = filterCenters;
window.filterChip            = filterChip;
window.filterMaterials       = filterMaterials;
window.filterMatChip         = filterMatChip;
window.markAllRead           = markAllRead;
window.markOneRead           = markOneRead;
window.saveProfile           = saveProfile;
window.openAddCenter         = openAddCenter;
window.closeModal            = closeModal;
window.addCenter             = addCenter;
window.deleteCenter          = deleteCenter;
window.toggleUserStatus      = toggleUserStatus;
window.switchAdminTab        = switchAdminTab;
window.showToast             = showToast;
window.selectCenter          = selectCenter;
window.showPinPopup          = showPinPopup;
window.logVisit              = logVisit;
window.savePreferences       = savePreferences;
window.changePassword        = changePassword;
window.saveOperatorDetails   = saveOperatorDetails;
window.updateMaterials       = updateMaterials;
window.sendSubscriberNotif   = sendSubscriberNotif;
window.sendAdminNotification = sendAdminNotification;
window.exportReportPDF       = exportReportPDF;
window.generateReport        = generateReport;
window.exportCSV             = exportCSV;
window.saveEditUser          = saveEditUser;

// ── INIT ─────────────────────────────────────────────────────
seedDefaultData();
restoreSession();
