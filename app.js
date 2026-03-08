/**
 * ============================================================
 *  RecycleHub Platform V1.0 — Application Logic
 *  app.js
 * ============================================================
 *  Sections:
 *    1.  Data (users_db, centers_db, materials_db, notifications_db)
 *    2.  Authentication (login, register, logout, role enforcement)
 *    3.  App Initialization (initApp)
 *    4.  Dashboard (KPIs, activity, impact bars)
 *    5.  Map & Centers (render, filter, pins, popup)
 *    6.  Material Guide (render, filter)
 *    7.  Notifications (render, read, mark all)
 *    8.  Profile (build, save)
 *    9.  Admin Panel (tabs, centers table, users table)
 *   10.  View Switching
 *   11.  Toast Notifications
 * ============================================================
 */

// ══════════════════════════════════════
// DATA
// ══════════════════════════════════════
let currentUser = null;
let currentView = 'dashboard';
let selectedCenterFilter = 'all';
let selectedMatFilter = 'all';

const users_db = [
  {id:1,fname:'Maria',lname:'Santos',email:'user@recyclehub.com',pass:'password',role:'user',location:'Quezon City',joined:'Jan 2025',status:'active',avatar:'🧍'},
  {id:2,fname:'Carlo',lname:'Reyes',email:'operator@recyclehub.com',pass:'password',role:'operator',location:'Mandaluyong',joined:'Dec 2024',status:'active',avatar:'🏭'},
  {id:3,fname:'Ana',lname:'Lim',email:'admin@recyclehub.com',pass:'password',role:'admin',location:'Makati',joined:'Nov 2024',status:'active',avatar:'🔑'},
  {id:4,fname:'Jose',lname:'Cruz',email:'jose@example.com',pass:'password',role:'user',location:'Pasig',joined:'Feb 2025',status:'active',avatar:'🧍'},
  {id:5,fname:'Lea',lname:'Torres',email:'lea@example.com',pass:'password',role:'user',location:'Caloocan',joined:'Mar 2025',status:'inactive',avatar:'🧍'},
];

const centers_db = [
  {id:1,name:'GreenPoint QC',addr:'123 Eco St, Quezon City',materials:['Plastic','Paper','Metal'],status:'open',x:40,y:35},
  {id:2,name:'EcoPoint Mandaluyong',addr:'88 Recycle Ave, Mandaluyong',materials:['E-Waste','Plastic','Batteries'],status:'open',x:55,y:55},
  {id:3,name:'CleanHub Makati',addr:'45 Verde Blvd, Makati',materials:['Paper','Cardboard','Metal'],status:'limited',x:65,y:70},
  {id:4,name:'RecycleMax Pasig',addr:'7 Green Lane, Pasig',materials:['Plastic','Glass','Metal'],status:'open',x:75,y:40},
  {id:5,name:'BioCircle Caloocan',addr:'22 Circular Dr, Caloocan',materials:['Organic','Paper'],status:'closed',x:30,y:20},
  {id:6,name:'MetroRecycle Taguig',addr:'10 BGC Loop, Taguig',materials:['E-Waste','Metal','Plastic'],status:'open',x:60,y:80},
];

const materials_db = [
  {icon:'🍶',name:'PET Plastic Bottles',cat:'Plastic',status:'recyclable',desc:'Clean PET (type 1) bottles. Remove caps and labels. Crush before drop-off if possible.'},
  {icon:'📦',name:'Cardboard Boxes',cat:'Paper',status:'recyclable',desc:'Flatten all boxes. Remove tape, staples, and foam inserts. Keep dry.'},
  {icon:'🥫',name:'Aluminum Cans',cat:'Metal',status:'recyclable',desc:'Rinse thoroughly. Any size aluminum cans are accepted at most centers.'},
  {icon:'📰',name:'Newspaper & Magazines',cat:'Paper',status:'recyclable',desc:'Bundle with twine. Acceptable even if slightly damp. No wax-coated paper.'},
  {icon:'💻',name:'Laptops & Computers',cat:'Electronics',status:'special',desc:'Requires certified e-waste center. Data should be wiped before drop-off.'},
  {icon:'🔋',name:'Batteries (AA/AAA)',cat:'Electronics',status:'special',desc:'Never put in general recycling. Bring to designated e-waste collection points only.'},
  {icon:'🍕',name:'Greasy Pizza Boxes',cat:'Paper',status:'not',desc:'Grease contamination makes recycling impossible. Compost the clean portions instead.'},
  {icon:'🧴',name:'Shampoo Bottles (HDPE)',cat:'Plastic',status:'recyclable',desc:'HDPE (type 2) plastics. Rinse well. Most centers accept these.'},
  {icon:'📱',name:'Mobile Phones',cat:'Electronics',status:'special',desc:'Drop off at manufacturer take-back programs or certified e-waste facilities.'},
  {icon:'🥛',name:'Milk Cartons (Tetra Pak)',cat:'Paper',status:'special',desc:'Requires specific facility. Check your nearest center for acceptance.'},
  {icon:'🍌',name:'Food Waste',cat:'Organic',status:'not',desc:'Not recyclable through standard centers. Use composting or organic waste bins.'},
  {icon:'🪟',name:'Window Glass',cat:'Glass',status:'not',desc:'Different composition from bottle glass. Cannot be mixed with bottle recycling.'},
  {icon:'📫',name:'Steel Food Cans',cat:'Metal',status:'recyclable',desc:'Rinse clean. Labels are okay to leave on. Both ends can stay on the can.'},
  {icon:'👕',name:'Old Clothing',cat:'Textile',status:'special',desc:'Bring to textile recycling bins or donation centers, not standard recycling.'},
  {icon:'🛢️',name:'Cooking Oil',cat:'Liquid',status:'special',desc:'Let cool and pour into sealed container. Some centers have specific oil collection.'},
  {icon:'🍾',name:'Glass Bottles & Jars',cat:'Glass',status:'recyclable',desc:'Rinse clean. Remove metal lids (recycle separately). Labels are fine.'},
];

const notifications_db = [
  {id:1,icon:'📍',title:'New Center Near You',body:'GreenPoint QC is now accepting electronics. Located 0.4 km from your area.',time:'2 hours ago',unread:true},
  {id:2,icon:'⏰',title:'Weekly Recycling Reminder',body:'Plastic collection day is tomorrow in your area. Check accepted materials before going.',time:'Yesterday',unread:true},
  {id:3,icon:'🏆',title:'Community Milestone!',body:'Your neighborhood collectively recycled 2 tonnes this month. Incredible work!',time:'2 days ago',unread:true},
  {id:4,icon:'📋',title:'Center Update: EcoPoint',body:'EcoPoint Mandaluyong confirmed your material drop-off. Contribution has been logged.',time:'3 days ago',unread:false},
  {id:5,icon:'🌱',title:'Eco Tip of the Week',body:'Did you know? Aluminum can be recycled indefinitely without losing quality. Rinse cans before drop-off.',time:'1 week ago',unread:false},
  {id:6,icon:'🔔',title:'Center Hours Changed',body:'CleanHub Makati updated their hours: now open Mon–Sat, 7AM–6PM.',time:'1 week ago',unread:false},
];

// ══════════════════════════════════════
// AUTH
// ══════════════════════════════════════
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function selectRole(el) {
  document.querySelectorAll('.role-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
}

function hintLoginRole() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const found = users_db.find(u => u.email.toLowerCase() === email);
  const hintBox = document.getElementById('login-role-hint');
  const hintText = document.getElementById('role-hint-text');
  if (found) {
    const roleLabel = found.role==='admin'?'Administrator':found.role==='operator'?'Recycling Center Operator':'General User';
    hintText.textContent = roleLabel;
    hintBox.style.display = 'block';
  } else {
    hintBox.style.display = 'none';
  }
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass  = document.getElementById('login-pass').value.trim();
  const errEl = document.getElementById('login-error');
  // Find user by email + password
  const user = users_db.find(u => u.email.toLowerCase() === email && u.pass === pass);
  if (!user) {
    // Check if email exists but wrong password
    const emailExists = users_db.find(u => u.email.toLowerCase() === email);
    if (emailExists) {
      errEl.textContent = 'Incorrect password. Please try again.';
    } else {
      errEl.textContent = 'No account found with this email. Please register first.';
    }
    errEl.style.display = 'block';
    return;
  }
  // Each account is locked to its registered role — no cross-role login allowed.
  // General Users sign in as General User only.
  // Operators sign in as Operator only.
  // Admins sign in as Administrator only.
  errEl.style.display = 'none';
  currentUser = user;
  initApp();
  showPage('page-app');
}

function doRegister() {
  const fname = document.getElementById('reg-fname').value.trim();
  const lname = document.getElementById('reg-lname').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const pass  = document.getElementById('reg-pass').value.trim();
  const loc   = document.getElementById('reg-location').value.trim();
  const role  = document.querySelector('.role-opt.selected').dataset.role;
  const errEl = document.getElementById('reg-error');
  if (!fname||!lname||!email||!pass||!loc) {
    errEl.textContent = 'Please fill in all fields.';
    errEl.style.display = 'block';
    return;
  }
  const emailOK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOK) {
    errEl.textContent = 'Please enter a valid email address.';
    errEl.style.display = 'block';
    return;
  }
  const exists = users_db.find(u => u.email.toLowerCase() === email);
  if (exists) {
    errEl.textContent = 'An account with this email already exists. Please sign in instead.';
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';
  const newUser = {
    id: users_db.length+1, fname, lname, email, pass, role,
    location: loc, joined: 'Mar 2025', status: 'active',
    avatar: role==='operator'?'🏭':role==='admin'?'🔑':'🧍'
  };
  users_db.push(newUser);
  currentUser = newUser;
  initApp();
  showPage('page-app');
  setTimeout(()=>showToast('Account created! Welcome to RecycleHub 🌱'),400);
}

function doLogout() {
  currentUser = null;
  showPage('page-login');
}

// ══════════════════════════════════════
// APP INIT
// ══════════════════════════════════════
function initApp() {
  // Sidebar user info
  document.getElementById('sb-name').textContent = currentUser.fname+' '+currentUser.lname;
  document.getElementById('sb-role').textContent =
    currentUser.role==='admin'?'Administrator':
    currentUser.role==='operator'?'Center Operator':'General User';
  document.getElementById('topbar-user').textContent = currentUser.fname+' '+currentUser.lname[0]+'.';

  // Show/hide role-specific nav items
  document.querySelectorAll('.operator-nav,.admin-nav,.operator-section,.admin-section').forEach(el=>{el.style.display='none';});
  if (currentUser.role==='operator'||currentUser.role==='admin') {
    document.querySelectorAll('.operator-nav').forEach(el=>el.style.display='flex');
    document.querySelectorAll('.operator-section').forEach(el=>el.style.display='block');
  }
  if (currentUser.role==='admin') {
    document.querySelectorAll('.admin-nav').forEach(el=>el.style.display='flex');
    document.querySelectorAll('.admin-section').forEach(el=>el.style.display='block');
  }

  // Populate notification badge
  const unread = notifications_db.filter(n=>n.unread).length;
  document.getElementById('notif-badge').textContent = unread;

  // Build dashboard
  buildDashboard();
  buildProfile();
  buildMap();
  buildMaterials();
  buildNotifications();
  buildAdminCenters();
  buildUsersTable();

  // Start on dashboard
  switchView('dashboard', document.querySelector('.nav-item'));
}

// ══════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════
function buildDashboard() {
  const isAdmin = currentUser.role==='admin';
  const isOp = currentUser.role==='operator';
  const kpiGrid = document.getElementById('kpi-grid');
  let kpis;
  if (isAdmin) {
    kpis = [
      {icon:'👥',val:'1,284',label:'Total Users',change:'↑ 12%',up:true},
      {icon:'🏢',val:'47',label:'Active Centers',change:'↑ 3 new',up:true},
      {icon:'♻️',val:'8.2t',label:'Recycled This Month',change:'↑ 18%',up:true},
    ];
  } else if (isOp) {
    kpis = [
      {icon:'👀',val:'342',label:'Center Views (Month)',change:'↑ 8%',up:true},
      {icon:'✅',val:'128',label:'Subscribers',change:'↑ 14',up:true},
      {icon:'⭐',val:'4.8',label:'Average Rating',change:'↑ 0.2',up:true},
    ];
  } else {
    kpis = [
      {icon:'♻️',val:'12',label:'Drop-offs Logged',change:'↑ 3 this week',up:true},
      {icon:'📍',val:'5',label:'Centers Near You',change:'1 new this week',up:true},
      {icon:'🏅',val:'Silver',label:'Eco Rank',change:'↑ from Bronze',up:true},
    ];
  }
  kpiGrid.innerHTML = kpis.map(k=>`
    <div class="kpi-card">
      <div class="kpi-icon">${k.icon}</div>
      <div class="kpi-value">${k.val}</div>
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-change ${k.up?'up':'down'}">${k.change}</div>
    </div>`).join('');

  // Recent activity
  const activities = [
    {action:'Drop-off Logged',loc:'GreenPoint QC',date:'Mar 6',status:'<span class="badge badge-green">Confirmed</span>'},
    {action:'Center Searched',loc:'EcoPoint Mandal.',date:'Mar 5',status:'<span class="badge badge-blue">Viewed</span>'},
    {action:'Material Checked',loc:'Plastic Bottles',date:'Mar 4',status:'<span class="badge badge-green">Recyclable</span>'},
    {action:'Notification Read',loc:'Weekly Reminder',date:'Mar 3',status:'<span class="badge badge-amber">Read</span>'},
  ];
  document.getElementById('recent-activity-body').innerHTML = activities.map(a=>`
    <tr><td>${a.action}</td><td>${a.loc}</td><td>${a.date}</td><td>${a.status}</td></tr>`).join('');

  // Dash notifications preview
  document.getElementById('dash-notifs').innerHTML = notifications_db.slice(0,4).map(n=>`
    <div style="display:flex;gap:.8rem;align-items:flex-start;padding:.7rem 0;border-bottom:1px solid rgba(74,158,107,.07);">
      <span style="font-size:1.1rem;">${n.icon}</span>
      <div>
        <div style="font-size:.85rem;font-weight:600;color:var(--forest);margin-bottom:.15rem;">${n.title}</div>
        <div style="font-size:.78rem;color:#7a8b80;">${n.time}</div>
      </div>
    </div>`).join('');

  // Impact bars
  const bars = [
    {label:'Plastic Recycled',pct:72},
    {label:'Paper / Cardboard',pct:58},
    {label:'Metals',pct:44},
    {label:'E-Waste',pct:29},
  ];
  document.getElementById('impact-bars').innerHTML = bars.map(b=>`
    <div style="display:flex;align-items:center;gap:.8rem;margin-bottom:.8rem;">
      <span style="font-size:.82rem;color:#556b5e;width:160px;">${b.label}</span>
      <div class="chart-bar-track" style="flex:1"><div class="chart-bar-fill" style="width:${b.pct}%"></div></div>
      <span style="font-size:.8rem;font-weight:700;color:var(--forest);width:35px;text-align:right;">${b.pct}%</span>
    </div>`).join('');
}

// ══════════════════════════════════════
// MAP / CENTERS
// ══════════════════════════════════════
function buildMap() {
  renderCenterList(centers_db);
  renderMapPins(centers_db);
}

function renderCenterList(data) {
  document.getElementById('center-list').innerHTML = data.length ? data.map(c=>`
    <div class="center-card" id="cc-${c.id}" onclick="selectCenter(${c.id})">
      <div class="center-name">${c.name}</div>
      <div class="center-addr">📍 ${c.addr}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem;">
        <span class="badge ${c.status==='open'?'badge-green':c.status==='limited'?'badge-amber':'badge-red'}">
          ${c.status==='open'?'Open':c.status==='limited'?'Limited':'Closed'}
        </span>
      </div>
      <div class="center-tags">${c.materials.map(m=>`<span class="center-tag">${m}</span>`).join('')}</div>
    </div>`).join('') :
    '<div class="empty-state"><div class="empty-icon">🔍</div><p>No centers match your search.</p></div>';
}

function renderMapPins(data) {
  document.getElementById('map-pins').innerHTML = data.map(c=>`
    <div class="map-pin ${c.status==='open'?'pin-active':c.status==='limited'?'pin-inactive':'pin-full'}"
      style="left:${c.x}%;top:${c.y}%;"
      onclick="showMapPopup(${c.id},${c.x},${c.y})">
      <div class="pin-dot"></div>
    </div>`).join('');
}

function showMapPopup(id,x,y) {
  const c = centers_db.find(c=>c.id===id);
  const popup = document.getElementById('map-popup');
  popup.style.left = (x+3)+'%';
  popup.style.top  = (y-25)+'%';
  popup.innerHTML = `
    <div class="popup-name">${c.name}</div>
    <div class="popup-status">
      <span class="badge ${c.status==='open'?'badge-green':c.status==='limited'?'badge-amber':'badge-red'}">
        ${c.status==='open'?'Open':c.status==='limited'?'Limited Hours':'Closed'}
      </span>
    </div>
    <div class="popup-materials" style="margin-top:.5rem;">
      <strong style="font-size:.78rem;color:var(--forest);">Accepts:</strong><br>
      ${c.materials.join(', ')}
    </div>
    <div style="margin-top:.5rem;font-size:.75rem;color:#7a8b80;">${c.addr}</div>
    <button class="inline-btn" style="margin-top:.8rem;font-size:.75rem;padding:.4rem 1rem;" onclick="document.getElementById('map-popup').classList.remove('show')">✕ Close</button>`;
  popup.classList.add('show');
}

function selectCenter(id) {
  document.querySelectorAll('.center-card').forEach(c=>c.classList.remove('selected'));
  document.getElementById('cc-'+id).classList.add('selected');
  const c = centers_db.find(c=>c.id===id);
  showMapPopup(id,c.x,c.y);
}

function filterCenters() {
  const q = document.getElementById('center-search').value.toLowerCase();
  const filtered = centers_db.filter(c =>
    c.name.toLowerCase().includes(q) || c.addr.toLowerCase().includes(q) ||
    (selectedCenterFilter==='all' || c.materials.some(m=>m.toLowerCase().includes(selectedCenterFilter)))
  );
  renderCenterList(filtered);
}

function filterChip(el,val) {
  document.querySelectorAll('.filter-chips .chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  selectedCenterFilter = val;
  filterCenters();
}

// ══════════════════════════════════════
// MATERIALS
// ══════════════════════════════════════
function buildMaterials() { renderMaterials(materials_db); }

function renderMaterials(data) {
  document.getElementById('materials-grid').innerHTML = data.map(m=>`
    <div class="material-card">
      <div class="material-icon">${m.icon}</div>
      <div class="material-name">${m.name}</div>
      <div style="font-size:.72rem;color:var(--leaf);font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:.3rem;">${m.cat}</div>
      <p class="material-desc">${m.desc}</p>
      <div class="material-status">
        <div class="status-dot" style="background:${m.status==='recyclable'?'var(--leaf)':m.status==='special'?'var(--amber)':'var(--red)'}"></div>
        <span style="color:${m.status==='recyclable'?'var(--leaf)':m.status==='special'?'var(--amber)':'var(--red)'}">
          ${m.status==='recyclable'?'✅ Recyclable':m.status==='special'?'⚠️ Special Handling':'❌ Not Recyclable'}
        </span>
      </div>
    </div>`).join('');
}

function filterMaterials() {
  const q = document.getElementById('material-search').value.toLowerCase();
  const filtered = materials_db.filter(m =>
    (m.name.toLowerCase().includes(q)||m.cat.toLowerCase().includes(q)||m.desc.toLowerCase().includes(q)) &&
    (selectedMatFilter==='all'||
     (selectedMatFilter==='recyclable'&&m.status==='recyclable')||
     (selectedMatFilter==='not'&&m.status==='not')||
     (selectedMatFilter==='special'&&m.status==='special'))
  );
  renderMaterials(filtered);
}

function filterMatChip(el,val) {
  document.querySelectorAll('#view-materials .chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  selectedMatFilter = val;
  filterMaterials();
}

// ══════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════
function buildNotifications() {
  document.getElementById('notif-list-view').innerHTML = notifications_db.map(n=>`
    <div class="notif-row ${n.unread?'unread':''}" onclick="readNotif(${n.id},this)">
      <div class="notif-row-icon">${n.icon}</div>
      <div style="flex:1;">
        <div class="notif-row-title">${n.title} ${n.unread?'<span class="badge badge-green" style="font-size:.65rem;">New</span>':''}</div>
        <div class="notif-row-body">${n.body}</div>
        <div class="notif-row-time">🕒 ${n.time}</div>
      </div>
    </div>`).join('');
}

function readNotif(id, el) {
  const n = notifications_db.find(n=>n.id===id);
  if (n) { n.unread=false; }
  el.classList.remove('unread');
  el.querySelector('.notif-row-title').innerHTML = el.querySelector('.notif-row-title').textContent.trim();
  updateBadge();
}

function markAllRead() {
  notifications_db.forEach(n=>n.unread=false);
  buildNotifications();
  updateBadge();
  showToast('All notifications marked as read');
}

function updateBadge() {
  const count = notifications_db.filter(n=>n.unread).length;
  const badge = document.getElementById('notif-badge');
  badge.textContent = count;
  badge.style.display = count>0?'flex':'none';
}

// ══════════════════════════════════════
// PROFILE
// ══════════════════════════════════════
function buildProfile() {
  document.getElementById('profile-avatar').textContent = currentUser.avatar;
  document.getElementById('profile-name').textContent = currentUser.fname+' '+currentUser.lname;
  document.getElementById('profile-role').textContent =
    currentUser.role==='admin'?'Administrator':currentUser.role==='operator'?'Center Operator':'General User';
  document.getElementById('pf-fname').value = currentUser.fname;
  document.getElementById('pf-lname').value = currentUser.lname;
  document.getElementById('pf-email').value = currentUser.email;
  document.getElementById('pf-location').value = currentUser.location;
  document.getElementById('profile-stats').innerHTML = `
    <div class="profile-stat"><div class="profile-stat-val">12</div><div class="profile-stat-label">Drop-offs</div></div>
    <div class="profile-stat"><div class="profile-stat-val">Silver</div><div class="profile-stat-label">Eco Rank</div></div>
    <div class="profile-stat"><div class="profile-stat-val">5</div><div class="profile-stat-label">Centers Used</div></div>
    <div class="profile-stat"><div class="profile-stat-val">2.4kg</div><div class="profile-stat-label">Recycled</div></div>`;
}

function saveProfile() {
  currentUser.fname = document.getElementById('pf-fname').value;
  currentUser.lname = document.getElementById('pf-lname').value;
  currentUser.location = document.getElementById('pf-location').value;
  document.getElementById('sb-name').textContent = currentUser.fname+' '+currentUser.lname;
  document.getElementById('profile-name').textContent = currentUser.fname+' '+currentUser.lname;
  document.getElementById('topbar-user').textContent = currentUser.fname+' '+currentUser.lname[0]+'.';
  showToast('Profile updated successfully!');
}

// ══════════════════════════════════════
// ADMIN
// ══════════════════════════════════════
function buildAdminCenters() {
  document.getElementById('admin-centers-body').innerHTML = centers_db.map(c=>`
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.addr}</td>
      <td>${c.materials.join(', ')}</td>
      <td><span class="badge ${c.status==='open'?'badge-green':c.status==='limited'?'badge-amber':'badge-red'}">
        ${c.status==='open'?'Open':c.status==='limited'?'Limited':'Closed'}
      </span></td>
      <td>
        <span style="cursor:pointer;font-size:.8rem;color:var(--leaf);font-weight:600;" onclick="showToast('Center editing coming soon!')">Edit</span>
        &nbsp;·&nbsp;
        <span style="cursor:pointer;font-size:.8rem;color:var(--red);font-weight:600;" onclick="showToast('Center removed!')">Remove</span>
      </td>
    </tr>`).join('');
}

function buildUsersTable() {
  document.getElementById('users-body').innerHTML = users_db.map(u=>`
    <tr>
      <td><strong>${u.fname} ${u.lname}</strong></td>
      <td>${u.email}</td>
      <td><span class="badge ${u.role==='admin'?'badge-red':u.role==='operator'?'badge-blue':'badge-green'}">
        ${u.role==='admin'?'Admin':u.role==='operator'?'Operator':'User'}
      </span></td>
      <td>${u.location}</td>
      <td>${u.joined}</td>
      <td><span class="badge ${u.status==='active'?'badge-green':'badge-amber'}">${u.status}</span></td>
      <td>
        <span style="cursor:pointer;font-size:.8rem;color:var(--leaf);font-weight:600;" onclick="showToast('User updated!')">Edit</span>
        &nbsp;·&nbsp;
        <span style="cursor:pointer;font-size:.8rem;color:var(--red);font-weight:600;" onclick="showToast('User suspended!')">Suspend</span>
      </td>
    </tr>`).join('');
}

function switchAdminTab(tab, el) {
  document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(t=>t.classList.remove('active'));
  if(el) el.classList.add('active');
  document.getElementById('admin-'+tab).classList.add('active');
}

function openAddCenter() {
  document.getElementById('modal-add-center').classList.add('show');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}
function addCenter() {
  closeModal('modal-add-center');
  showToast('New center added to the platform!');
  buildAdminCenters();
}

// ══════════════════════════════════════
// VIEW SWITCHING
// ══════════════════════════════════════
const viewTitles = {
  dashboard:'Dashboard',map:'Find Recycling Centers',
  materials:'Material Guide',notifications:'Notifications',
  profile:'My Profile',operator:'My Recycling Center',
  admin:'Admin Panel',users:'User Management'
};

function switchView(view, navEl) {
  // Hide all views
  document.querySelectorAll('[id^="view-"]').forEach(v=>v.style.display='none');
  // Show target
  const target = document.getElementById('view-'+view);
  if(target) target.style.display = view==='map'?'block':'block';
  // Nav active
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(navEl) navEl.classList.add('active');
  // Title
  document.getElementById('view-title').textContent = viewTitles[view]||'';
  currentView = view;
}

// ══════════════════════════════════════
// TOAST
// ══════════════════════════════════════
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'), 3000);
}
