/* ═══════════════════════════════════════════
   DREAM LINE GLOBAL CONSULTANCY — script.js
   SPA Logic | Auth | LocalStorage DB | EmailJS
═══════════════════════════════════════════ */

'use strict';

// ── EMAILJS CONFIG ──
const EJS = {
  SERVICE: 'service_60nhmyh',
  TEMPLATE: 'template_0i37td7',
  KEY: 'SCkaneqjw-qgWFIzx'
};
(function(){ try{ emailjs.init(EJS.KEY); }catch(e){} })();

// ── SANITIZE ──
function sanitize(str){
  if(typeof str !== 'string') return '';
  return str.replace(/[<>"'`]/g, c=>({'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c]));
}

// ── DB HELPERS ──
const DB = {
  get(key){ try{ return JSON.parse(localStorage.getItem('dl_'+key))||null; }catch(e){ return null; } },
  set(key,val){ localStorage.setItem('dl_'+key, JSON.stringify(val)); },
  getArr(key){ return this.get(key)||[]; },
  setArr(key,arr){ this.set(key,arr); }
};

// ── SEED DEFAULT DATA ──
function seedData(){
  if(DB.get('seeded')) return;

  // Users
  DB.setArr('users',[
    {id:'u1',name:'Admin User',email:'admin@dreamline.ae',password:'admin123',role:'admin',phone:'+971556533417',createdAt:Date.now()},
    {id:'u2',name:'Demo Employer',email:'employer@demo.com',password:'emp123',role:'employer',phone:'+971501234567',company:'Dubai Tech LLC',createdAt:Date.now()},
    {id:'u3',name:'Demo Candidate',email:'candidate@demo.com',password:'cand123',role:'candidate',phone:'+919596115725',skills:'Accounting, Excel, SAP',experience:'3–5 years',createdAt:Date.now()}
  ]);

  // Jobs
  DB.setArr('jobs',[
    {id:'j1',title:'Senior Financial Analyst',company:'Emirates Investment Bank',category:'Finance',location:'Dubai',type:'Full-time',salary:'AED 20,000–25,000',experience:'5+ years',desc:'CPA/ACCA qualified professional required for our DIFC office. Responsible for financial modelling, variance analysis and management reporting. Strong Excel and Bloomberg skills essential.',status:'active',postedBy:'u1',createdAt:Date.now()-86400000*5},
    {id:'j2',title:'Full Stack Developer',company:'Abu Dhabi FinTech Hub',category:'Technology',location:'Abu Dhabi',type:'Hybrid',salary:'AED 16,000–20,000',experience:'3–5 years',desc:'React, Node.js, PostgreSQL stack. 3+ years of experience required. AWS certification a strong advantage. You will build scalable financial applications for our growing platform.',status:'active',postedBy:'u1',createdAt:Date.now()-86400000*3},
    {id:'j3',title:'Clinical Nurse Specialist',company:'Burjeel Hospital Group',category:'Healthcare',location:'Sharjah',type:'Full-time',salary:'AED 12,000–16,000',experience:'3–5 years',desc:'DHA/HAAD licensed ICU/CCU specialist required. Minimum 5 years post-qualification. Excellent patient care skills and ability to work under pressure in fast-paced environment.',status:'active',postedBy:'u1',createdAt:Date.now()-86400000*2},
    {id:'j4',title:'HR Manager',company:'Emaar Properties',category:'HR',location:'Dubai',type:'Full-time',salary:'AED 18,000–22,000',experience:'5+ years',desc:'CIPD qualified HR Manager to oversee full HR operations. UAE Labour Law expertise essential. Experience with Emiratisation (Nafis) programme highly preferred.',status:'active',postedBy:'u1',createdAt:Date.now()-86400000*7},
    {id:'j5',title:'Project Manager – Civil',company:'ALDAR Projects',category:'Engineering',location:'Abu Dhabi',type:'Full-time',salary:'AED 22,000–28,000',experience:'5+ years',desc:'PMP certified civil engineer with 8+ years managing infrastructure projects. GCC experience essential. You will oversee major development projects across Abu Dhabi.',status:'active',postedBy:'u1',createdAt:Date.now()-86400000*1},
    {id:'j6',title:'Sales Executive – Real Estate',company:'Damac Properties',category:'Sales',location:'Dubai',type:'Full-time',salary:'AED 8,000 + Commission',experience:'1–3 years',desc:'RERA certified sales professional for luxury property sales. Excellent communication skills required. Arabic language a strong advantage. Proven track record in UAE real estate.',status:'active',postedBy:'u1',createdAt:Date.now()-86400000*4},
    {id:'j7',title:'Accountant – VAT Specialist',company:'Srinagar Business Solutions',category:'Finance',location:'Srinagar',type:'Full-time',salary:'INR 45,000–60,000',experience:'1–3 years',desc:'UAE VAT and Indian GST knowledge required. B.Com / CA (Inter) qualified. Responsible for VAT returns, financial statements and MIS reporting for our expanding client base.',status:'active',postedBy:'u1',createdAt:Date.now()-86400000*6},
    {id:'j8',title:'IT Support Engineer',company:'Etisalat (e&)',category:'Technology',location:'Dubai',type:'Full-time',salary:'AED 10,000–13,000',experience:'1–3 years',desc:'L1/L2 IT support for enterprise clients. MCSA / CompTIA certified preferred. Strong troubleshooting skills and customer service orientation required.',status:'pending',postedBy:'u2',createdAt:Date.now()}
  ]);

  DB.setArr('applications',[]);
  DB.set('seeded', true);
}

// ── AUTH STATE ──
let currentUser = null;
function getSession(){ return DB.get('session'); }
function setSession(user){ DB.set('session',user); currentUser=user; }
function clearSession(){ localStorage.removeItem('dl_session'); currentUser=null; }

// ── ROUTER ──
const VIEWS = ['home','jobs','about','services','contact','login','register','dashboard','profile'];
let currentView = 'home';
let applyingJobId = null;

function navigate(view){
  // Guard dashboard
  if(view==='dashboard'||view==='profile'){
    const s=getSession();
    if(!s){ showToast('Please login to access your dashboard','error'); navigate('login'); return; }
  }
  VIEWS.forEach(v=>{
    const el=document.getElementById('view-'+v);
    if(el) el.style.display='none';
  });
  const target=document.getElementById('view-'+view);
  if(target){
    target.style.display='block';
    target.scrollIntoView?window.scrollTo(0,0):null;
  }
  currentView=view;
  updateNavState();
  // View-specific init
  if(view==='home') renderHomeJobs();
  if(view==='jobs') renderJobsPage();
  if(view==='dashboard') initDashboard();
  if(view==='services') initServices();
  setTimeout(initReveal,100);
  closeMobile();
}

function updateNavState(){
  const s=getSession();
  const loginBtn=document.getElementById('nav-login-btn');
  const regBtn=document.getElementById('nav-register-btn');
  const userMenu=document.getElementById('user-menu');
  const navName=document.getElementById('nav-user-name');
  if(s){
    loginBtn&&(loginBtn.style.display='none');
    regBtn&&(regBtn.style.display='none');
    userMenu&&(userMenu.style.display='flex');
    navName&&(navName.textContent=s.name.split(' ')[0]);
  } else {
    loginBtn&&(loginBtn.style.display='');
    regBtn&&(regBtn.style.display='');
    userMenu&&(userMenu.style.display='none');
  }
}

// ── AUTH ──
function doLogin(e){
  e.preventDefault();
  const email=sanitize(document.getElementById('login-email').value.trim().toLowerCase());
  const pass=document.getElementById('login-pass').value;
  const err=document.getElementById('login-error');
  const users=DB.getArr('users');
  const user=users.find(u=>u.email===email&&u.password===pass);
  if(!user){
    err.style.display='block';
    err.textContent='Invalid email or password. Try demo accounts below.';
    return;
  }
  err.style.display='none';
  const {password,...safeUser}=user;
  setSession(safeUser);
  showToast('Welcome back, '+safeUser.name.split(' ')[0]+'!','success');
  navigate('dashboard');
}

function doRegister(e){
  e.preventDefault();
  const err=document.getElementById('register-error');
  const name=sanitize(document.getElementById('reg-name').value.trim());
  const email=sanitize(document.getElementById('reg-email').value.trim().toLowerCase());
  const phone=sanitize(document.getElementById('reg-phone').value.trim());
  const role=document.getElementById('reg-role').value;
  const pass=document.getElementById('reg-pass').value;
  const pass2=document.getElementById('reg-pass2').value;
  if(!name||!email||!phone||!role||!pass){
    err.style.display='block'; err.textContent='All fields are required.'; return;
  }
  if(pass.length<6){
    err.style.display='block'; err.textContent='Password must be at least 6 characters.'; return;
  }
  if(pass!==pass2){
    err.style.display='block'; err.textContent='Passwords do not match.'; return;
  }
  const users=DB.getArr('users');
  if(users.find(u=>u.email===email)){
    err.style.display='block'; err.textContent='An account with this email already exists.'; return;
  }
  const newUser={id:'u'+Date.now(),name,email,phone,role,password:pass,createdAt:Date.now()};
  users.push(newUser);
  DB.setArr('users',users);
  const {password,...safeUser}=newUser;
  setSession(safeUser);
  err.style.display='none';
  showToast('Account created! Welcome, '+name.split(' ')[0]+'.','success');
  navigate('dashboard');
}

function logout(){
  clearSession();
  showToast('Logged out successfully.','success');
  navigate('home');
  if(document.getElementById('user-dropdown')) document.getElementById('user-dropdown').classList.remove('open');
}

function fillLogin(email,pass){
  document.getElementById('login-email').value=email;
  document.getElementById('login-pass').value=pass;
}

function togglePass(id,btn){
  const inp=document.getElementById(id);
  if(inp.type==='password'){inp.type='text';btn.innerHTML='<i class="fas fa-eye-slash"></i>';}
  else{inp.type='password';btn.innerHTML='<i class="fas fa-eye"></i>';}
}

function toggleUserMenu(){
  document.getElementById('user-dropdown').classList.toggle('open');
}

// ── JOBS RENDER ──
function renderJobCard(j, isAdmin=false){
  const statusBadge=isAdmin?`<span class="job-status-badge ${j.status==='active'?'badge-active':'badge-pending'}">${j.status}</span>`:'';
  return `
  <div class="job-card" data-id="${j.id}">
    ${statusBadge}
    <div class="job-card-top">
      <div>
        <div class="job-title-text">${sanitize(j.title)}</div>
        <div class="job-company-text"><i class="fas fa-building" style="color:var(--gold);font-size:11px;margin-right:4px;"></i>${sanitize(j.company)}</div>
      </div>
      <span class="job-type-badge">${sanitize(j.type)}</span>
    </div>
    <div class="job-meta-row">
      <span><i class="fas fa-map-marker-alt"></i>${sanitize(j.location)}</span>
      <span><i class="fas fa-layer-group"></i>${sanitize(j.category)}</span>
      <span><i class="fas fa-user-clock"></i>${sanitize(j.experience)}</span>
    </div>
    <div class="job-desc-text">${sanitize(j.desc)}</div>
    <div class="job-card-footer">
      <span class="job-salary"><i class="fas fa-money-bill-wave" style="margin-right:4px;"></i>${sanitize(j.salary)}</span>
      <button class="btn-apply" onclick="openApplyModal('${j.id}')">Apply Now <i class="fas fa-arrow-right"></i></button>
    </div>
  </div>`;
}

function renderHomeJobs(){
  const grid=document.getElementById('home-jobs-grid');
  if(!grid) return;
  const jobs=DB.getArr('jobs').filter(j=>j.status==='active').slice(0,6);
  grid.innerHTML=jobs.length?jobs.map(j=>renderJobCard(j)).join(''):'<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px;">No jobs posted yet.</p>';
}

function renderJobsPage(){
  filterJobs();
}

function filterJobs(){
  const kw=(document.getElementById('job-search')?.value||'').toLowerCase();
  const loc=document.getElementById('job-location-filter')?.value||'';
  const cat=document.getElementById('job-cat-filter')?.value||'';
  const type=document.getElementById('job-type-filter')?.value||'';
  let jobs=DB.getArr('jobs').filter(j=>j.status==='active');
  if(kw) jobs=jobs.filter(j=>j.title.toLowerCase().includes(kw)||j.company.toLowerCase().includes(kw)||j.desc.toLowerCase().includes(kw));
  if(loc) jobs=jobs.filter(j=>j.location===loc);
  if(cat) jobs=jobs.filter(j=>j.category===cat);
  if(type) jobs=jobs.filter(j=>j.type===type);
  const grid=document.getElementById('jobs-grid');
  const count=document.getElementById('jobs-count');
  if(count) count.textContent=`Showing ${jobs.length} position${jobs.length!==1?'s':''}`;
  if(grid) grid.innerHTML=jobs.length?jobs.map(j=>renderJobCard(j)).join(''):`<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-search"></i><p>No jobs match your filters.</p></div>`;
}

function quickSearch(){
  const kw=document.getElementById('qs-keyword')?.value||'';
  const loc=document.getElementById('qs-location')?.value||'';
  const cat=document.getElementById('qs-category')?.value||'';
  navigate('jobs');
  setTimeout(()=>{
    if(kw) { const el=document.getElementById('job-search'); if(el) el.value=kw; }
    if(loc) { const el=document.getElementById('job-location-filter'); if(el) el.value=loc; }
    if(cat) { const el=document.getElementById('job-cat-filter'); if(el) el.value=cat; }
    filterJobs();
  },200);
}

// ── APPLY MODAL ──
function openApplyModal(jobId){
  const s=getSession();
  if(s&&s.role==='admin'){ showToast('Admins cannot apply for jobs.','error'); return; }
  applyingJobId=jobId;
  const job=DB.getArr('jobs').find(j=>j.id===jobId);
  if(!job) return;
  document.getElementById('modal-job-title').textContent=job.title+' — '+job.company;
  document.getElementById('apply-form').style.display='block';
  document.getElementById('apply-success').style.display='none';
  if(s){
    const ep=document.getElementById('ap-name'); if(ep) ep.value=s.name||'';
    const ee=document.getElementById('ap-email'); if(ee) ee.value=s.email||'';
    const ephone=document.getElementById('ap-phone'); if(ephone) ephone.value=s.phone||'';
  } else {
    ['ap-name','ap-email','ap-phone','ap-skills'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  }
  document.getElementById('apply-modal').classList.add('open');
  document.body.style.overflow='hidden';
}

function closeApplyModal(){
  document.getElementById('apply-modal').classList.remove('open');
  document.body.style.overflow='';
  applyingJobId=null;
}

function validatePDF(input, errId){
  const errEl=document.getElementById(errId);
  if(!input.files.length) return true;
  const file=input.files[0];
  if(file.type!=='application/pdf'){
    input.value='';
    if(errEl){ errEl.style.display='block'; errEl.textContent='Only PDF files are accepted.'; }
    return false;
  }
  if(file.size>5*1024*1024){
    input.value='';
    if(errEl){ errEl.style.display='block'; errEl.textContent='File size must be under 5MB.'; }
    return false;
  }
  if(errEl) errEl.style.display='none';
  return true;
}

function submitApplication(e){
  e.preventDefault();
  const cvInput=document.getElementById('ap-cv');
  if(!validatePDF(cvInput,'ap-cv-err')) return;
  const job=DB.getArr('jobs').find(j=>j.id===applyingJobId);
  if(!job) return;
  const s=getSession();
  const name=sanitize(document.getElementById('ap-name').value.trim());
  const email=sanitize(document.getElementById('ap-email').value.trim());
  const phone=sanitize(document.getElementById('ap-phone').value.trim());
  const exp=document.getElementById('ap-exp').value;
  const skills=sanitize(document.getElementById('ap-skills').value.trim());
  if(!name||!email||!phone){ showToast('Please fill in all required fields.','error'); return; }
  // Check duplicate
  const apps=DB.getArr('applications');
  if(s && apps.find(a=>a.jobId===applyingJobId&&a.userId===s.id)){
    showToast('You have already applied for this position.','error'); return;
  }
  const app={
    id:'app'+Date.now(),
    jobId:applyingJobId,
    jobTitle:job.title,
    company:job.company,
    userId:s?s.id:null,
    name,email,phone,
    experience:exp,skills,
    status:'pending',
    appliedAt:Date.now()
  };
  apps.push(app);
  DB.setArr('applications',apps);
  // EmailJS
  tryEmailJS({
    to_name:'Dr. Hussain',
    from_name:name,
    from_email:email,
    phone,
    job_title:job.title,
    company:job.company,
    experience:exp,
    skills,
    message:`New application received for: ${job.title} at ${job.company}`
  });
  document.getElementById('apply-form').style.display='none';
  document.getElementById('apply-success').style.display='block';
  showToast('Application submitted successfully!','success');
}

function tryEmailJS(params){
  try{
    emailjs.send(EJS.SERVICE, EJS.TEMPLATE, params).catch(()=>{});
  } catch(e){}
}

// ── SERVICES FILTER ──
function initServices(){
  filterServices('all', document.querySelector('.stab'));
}

function filterServices(cat, btn){
  document.querySelectorAll('.stab').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.querySelectorAll('.svc-card').forEach(c=>{
    c.style.display=(cat==='all'||c.dataset.cat===cat)?'':'none';
  });
}

// ── CONTACT FORM ──
function submitContact(e){
  e.preventDefault();
  const name=sanitize(document.getElementById('ct-name').value.trim());
  const email=sanitize(document.getElementById('ct-email').value.trim());
  const subject=sanitize(document.getElementById('ct-subject').value.trim());
  const message=sanitize(document.getElementById('ct-message').value.trim());
  tryEmailJS({to_name:'Dr. Hussain',from_name:name,from_email:email,subject,message});
  document.getElementById('contact-form').style.display='none';
  document.getElementById('contact-success').style.display='block';
  showToast('Message sent!','success');
}

// ── DASHBOARD ──
function initDashboard(){
  const s=getSession();
  if(!s){ navigate('login'); return; }
  // Hide all dashboards
  ['candidate','employer','admin'].forEach(r=>{
    const el=document.getElementById('dashboard-'+r);
    if(el) el.style.display='none';
  });
  const dash=document.getElementById('dashboard-'+s.role);
  if(dash) dash.style.display='block';
  if(s.role==='candidate') initCandidateDash(s);
  if(s.role==='employer') initEmployerDash(s);
  if(s.role==='admin') initAdminDash(s);
}

// ── CANDIDATE DASHBOARD ──
function initCandidateDash(s){
  const nameEl=document.getElementById('dash-cand-name');
  if(nameEl) nameEl.textContent=s.name;
  loadCandProfile(s);
  loadCandApps(s);
  const apps=DB.getArr('applications').filter(a=>a.userId===s.id);
  const statsRow=document.getElementById('cand-stats-row');
  if(statsRow) statsRow.innerHTML=`
    <div class="dash-stat-card"><span class="ds-icon"><i class="fas fa-file-alt"></i></span><div class="ds-num">${apps.length}</div><div class="ds-label">Applications Sent</div></div>
    <div class="dash-stat-card"><span class="ds-icon"><i class="fas fa-clock"></i></span><div class="ds-num">${apps.filter(a=>a.status==='pending').length}</div><div class="ds-label">Pending Review</div></div>
    <div class="dash-stat-card"><span class="ds-icon"><i class="fas fa-check-circle"></i></span><div class="ds-num">${apps.filter(a=>a.status==='approved').length}</div><div class="ds-label">Shortlisted</div></div>`;
  const recentEl=document.getElementById('cand-recent-apps');
  if(recentEl){
    const recent=apps.slice(-3).reverse();
    recentEl.innerHTML=recent.length?buildTable(['Job Title','Company','Status','Applied'],recent.map(a=>[
      sanitize(a.jobTitle),sanitize(a.company),statusPill(a.status),timeAgo(a.appliedAt)
    ])):`<div class="empty-state"><i class="fas fa-file-alt"></i><p>No applications yet. <a href="#" onclick="navigate('jobs')" style="color:var(--gold);">Browse Jobs</a></p></div>`;
  }
}

function loadCandProfile(s){
  const users=DB.getArr('users');
  const user=users.find(u=>u.id===s.id)||s;
  const f=(id,val)=>{ const el=document.getElementById(id); if(el&&val) el.value=val; };
  f('cp-name',user.name); f('cp-email',user.email); f('cp-phone',user.phone);
  f('cp-nationality',user.nationality); f('cp-location',user.location);
  f('cp-skills',user.skills); f('cp-summary',user.summary);
  if(user.experience){ const el=document.getElementById('cp-exp'); if(el) el.value=user.experience; }
  if(user.cvName){
    const prev=document.getElementById('cv-preview');
    if(prev){ prev.style.display='flex'; prev.innerHTML=`<i class="fas fa-file-pdf"></i><span>${sanitize(user.cvName)}</span>`; }
  }
}

function saveCandProfile(e){
  e.preventDefault();
  const s=getSession();
  const users=DB.getArr('users');
  const idx=users.findIndex(u=>u.id===s.id);
  if(idx<0) return;
  const v=(id)=>{ const el=document.getElementById(id); return el?sanitize(el.value.trim()):''; };
  users[idx].name=v('cp-name')||users[idx].name;
  users[idx].phone=v('cp-phone')||users[idx].phone;
  users[idx].nationality=v('cp-nationality');
  users[idx].location=v('cp-location');
  users[idx].skills=v('cp-skills');
  users[idx].summary=v('cp-summary');
  const expEl=document.getElementById('cp-exp'); if(expEl) users[idx].experience=expEl.value;
  const cvInput=document.getElementById('cp-cv');
  if(cvInput&&cvInput.files.length){
    if(!validatePDF(cvInput,'')) return;
    users[idx].cvName=cvInput.files[0].name;
  }
  DB.setArr('users',users);
  const {password,...safe}=users[idx];
  setSession(safe);
  showToast('Profile saved!','success');
}

function handleCVUpload(input){
  if(!validatePDF(input,'')) return;
  const prev=document.getElementById('cv-preview');
  if(prev&&input.files.length){
    prev.style.display='flex';
    prev.innerHTML=`<i class="fas fa-file-pdf"></i><span>${sanitize(input.files[0].name)}</span>`;
  }
}

function loadCandApps(s){
  const apps=DB.getArr('applications').filter(a=>a.userId===s.id);
  const el=document.getElementById('cand-apps-table');
  if(!el) return;
  el.innerHTML=apps.length?buildTable(['Job Title','Company','Location','Status','Applied'],apps.reverse().map(a=>{
    const job=DB.getArr('jobs').find(j=>j.id===a.jobId)||{};
    return[sanitize(a.jobTitle),sanitize(a.company),sanitize(job.location||'—'),statusPill(a.status),timeAgo(a.appliedAt)];
  })):`<div class="empty-state"><i class="fas fa-file-alt"></i><p>No applications yet.</p></div>`;
}

// ── EMPLOYER DASHBOARD ──
function initEmployerDash(s){
  const nameEl=document.getElementById('dash-emp-name');
  if(nameEl) nameEl.textContent=s.name;
  const allJobs=DB.getArr('jobs').filter(j=>j.postedBy===s.id);
  const allApps=DB.getArr('applications').filter(a=>allJobs.some(j=>j.id===a.jobId));
  const statsRow=document.getElementById('emp-stats-row');
  if(statsRow) statsRow.innerHTML=`
    <div class="dash-stat-card"><span class="ds-icon"><i class="fas fa-briefcase"></i></span><div class="ds-num">${allJobs.length}</div><div class="ds-label">Requirements Posted</div></div>
    <div class="dash-stat-card"><span class="ds-icon"><i class="fas fa-users"></i></span><div class="ds-num">${allApps.length}</div><div class="ds-label">Total Applicants</div></div>
    <div class="dash-stat-card"><span class="ds-icon"><i class="fas fa-check"></i></span><div class="ds-num">${allJobs.filter(j=>j.status==='active').length}</div><div class="ds-label">Active Postings</div></div>`;
  const listEl=document.getElementById('emp-posted-list');
  if(listEl) listEl.innerHTML=allJobs.length?buildTable(['Job Title','Location','Status','Posted'],allJobs.reverse().map(j=>[
    sanitize(j.title),sanitize(j.location),statusPill(j.status),timeAgo(j.createdAt)
  ])):`<div class="empty-state"><i class="fas fa-briefcase"></i><p>No requirements posted yet.</p></div>`;
  const appsEl=document.getElementById('emp-applicants-table');
  if(appsEl) appsEl.innerHTML=allApps.length?buildTable(['Applicant','Email','Phone','Job','Status'],allApps.reverse().map(a=>[
    sanitize(a.name),sanitize(a.email),sanitize(a.phone),sanitize(a.jobTitle),statusPill(a.status)
  ])):`<div class="empty-state"><i class="fas fa-users"></i><p>No applicants yet.</p></div>`;
}

function submitStaffReq(e){
  e.preventDefault();
  const s=getSession();
  const v=(id)=>{ const el=document.getElementById(id); return el?sanitize(el.value.trim()):''; };
  const title=v('ep-title'),company=v('ep-company'),cat=document.getElementById('ep-cat')?.value,
    loc=document.getElementById('ep-location')?.value,type=document.getElementById('ep-type')?.value,
    salary=v('ep-salary'),desc=v('ep-desc'),exp=document.getElementById('ep-exp')?.value,
    count=document.getElementById('ep-count')?.value;
  if(!title||!company||!cat||!loc||!desc){ showToast('Please fill all required fields.','error'); return; }
  const jobs=DB.getArr('jobs');
  const newJob={id:'j'+Date.now(),title,company,category:cat,location:loc,type,salary:salary||'Competitive',
    experience:exp,desc,status:'pending',postedBy:s.id,positions:count,createdAt:Date.now()};
  jobs.push(newJob);
  DB.setArr('jobs',jobs);
  tryEmailJS({to_name:'Dr. Hussain',from_name:s.name,from_email:s.email,subject:'New Staff Requirement Submitted',
    message:`${s.name} submitted a requirement for ${title} at ${company}. Positions: ${count}. Pending review.`});
  showToast('Requirement submitted! Pending admin approval.','success');
  e.target.reset();
  showDashTab('emp-overview',document.querySelector('#dashboard-employer .dash-nav-item'));
  initEmployerDash(s);
}

// ── ADMIN DASHBOARD ──
function initAdminDash(){
  const users=DB.getArr('users');
  const jobs=DB.getArr('jobs');
  const apps=DB.getArr('applications');
  const statsRow=document.getElementById('admin-stats-row');
  if(statsRow) statsRow.innerHTML=`
    <div class="dash-stat-card"><span class="ds-icon"><i class="fas fa-users"></i></span><div class="ds-num">${users.length}</div><div class="ds-label">Total Users</div></div>
    <div class="dash-stat-card"><span class="ds-icon"><i class="fas fa-briefcase"></i></span><div class="ds-num">${jobs.length}</div><div class="ds-label">Job Listings</div></div>
    <div class="dash-stat-card"><span class="ds-icon"><i class="fas fa-file-alt"></i></span><div class="ds-num">${apps.length}</div><div class="ds-label">Applications</div></div>`;
  const recentEl=document.getElementById('admin-recent');
  if(recentEl){
    const recent=[...apps].reverse().slice(0,5);
    recentEl.innerHTML=recent.length?buildTable(['Applicant','Job','Status','Time'],recent.map(a=>[
      sanitize(a.name),sanitize(a.jobTitle),statusPill(a.status),timeAgo(a.appliedAt)
    ])):`<div class="empty-state"><i class="fas fa-clock"></i><p>No recent activity.</p></div>`;
  }
  renderAdminJobsTable();
  renderAdminUsersTable();
  renderAdminAppsTable();
}

function renderAdminJobsTable(){
  const jobs=DB.getArr('jobs');
  const el=document.getElementById('admin-jobs-table');
  if(!el) return;
  if(!jobs.length){ el.innerHTML=`<div class="empty-state"><i class="fas fa-briefcase"></i><p>No jobs yet.</p></div>`; return; }
  el.innerHTML=buildTableWithActions(['Title','Company','Category','Location','Status','Actions'],
    jobs.reverse().map(j=>[
      sanitize(j.title),sanitize(j.company),sanitize(j.category),sanitize(j.location),statusPill(j.status),
      `<div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${j.status==='pending'?`<button class="btn-sm btn-sm-approve" onclick="adminJobAction('${j.id}','active')">Approve</button>`:''}
        ${j.status==='active'?`<button class="btn-sm btn-sm-reject" onclick="adminJobAction('${j.id}','pending')">Suspend</button>`:''}
        <button class="btn-sm btn-sm-delete" onclick="adminDeleteJob('${j.id}')">Delete</button>
      </div>`
    ])
  );
}

function adminJobAction(jobId, status){
  const jobs=DB.getArr('jobs');
  const idx=jobs.findIndex(j=>j.id===jobId);
  if(idx<0) return;
  jobs[idx].status=status;
  DB.setArr('jobs',jobs);
  showToast('Job status updated.','success');
  renderAdminJobsTable();
}

function adminDeleteJob(jobId){
  if(!confirm('Delete this job listing?')) return;
  DB.setArr('jobs',DB.getArr('jobs').filter(j=>j.id!==jobId));
  showToast('Job deleted.','success');
  renderAdminJobsTable();
}

function adminAddJob(e){
  e.preventDefault();
  const v=(id)=>{ const el=document.getElementById(id); return el?sanitize(el.value.trim()):''; };
  const title=v('aj-title'),company=v('aj-company');
  const cat=document.getElementById('aj-cat')?.value;
  const loc=document.getElementById('aj-location')?.value;
  const type=document.getElementById('aj-type')?.value;
  const salary=v('aj-salary'); const desc=v('aj-desc');
  const exp=document.getElementById('aj-exp')?.value;
  const status=document.getElementById('aj-status')?.value;
  if(!title||!company||!cat||!loc||!desc){ showToast('Please fill all required fields.','error'); return; }
  const jobs=DB.getArr('jobs');
  jobs.push({id:'j'+Date.now(),title,company,category:cat,location:loc,type,salary:salary||'Competitive',experience:exp,desc,status,postedBy:'u1',createdAt:Date.now()});
  DB.setArr('jobs',jobs);
  showToast('Job posted successfully!','success');
  e.target.reset();
  showDashTab('admin-jobs',null);
  renderAdminJobsTable();
}

function renderAdminUsersTable(){
  const users=DB.getArr('users');
  const el=document.getElementById('admin-users-table');
  if(!el) return;
  el.innerHTML=buildTable(['Name','Email','Role','Phone','Joined'],users.map(u=>[
    sanitize(u.name),sanitize(u.email),
    `<span class="status-pill ${u.role==='admin'?'pill-active':u.role==='employer'?'pill-pending':'pill-rejected'}">${u.role}</span>`,
    sanitize(u.phone||'—'),timeAgo(u.createdAt)
  ]));
}

function renderAdminAppsTable(){
  const apps=DB.getArr('applications');
  const el=document.getElementById('admin-apps-table');
  if(!el) return;
  if(!apps.length){ el.innerHTML=`<div class="empty-state"><i class="fas fa-file-alt"></i><p>No applications yet.</p></div>`; return; }
  el.innerHTML=buildTableWithActions(['Applicant','Email','Job','Status','Actions'],
    [...apps].reverse().map(a=>[
      sanitize(a.name),sanitize(a.email),sanitize(a.jobTitle),statusPill(a.status),
      `<div style="display:flex;gap:6px;">
        <button class="btn-sm btn-sm-approve" onclick="adminAppAction('${a.id}','approved')">Approve</button>
        <button class="btn-sm btn-sm-reject" onclick="adminAppAction('${a.id}','rejected')">Reject</button>
      </div>`
    ])
  );
}

function adminAppAction(appId, status){
  const apps=DB.getArr('applications');
  const idx=apps.findIndex(a=>a.id===appId);
  if(idx<0) return;
  apps[idx].status=status;
  DB.setArr('applications',apps);
  showToast('Application '+status+'.','success');
  renderAdminAppsTable();
}

// ── TABLE BUILDERS ──
function buildTable(headers, rows){
  if(!rows.length) return `<div class="empty-state"><i class="fas fa-inbox"></i><p>No data found.</p></div>`;
  return `<div class="data-table-wrap"><table class="data-table">
    <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

function buildTableWithActions(headers, rows){
  return buildTable(headers, rows);
}

function statusPill(status){
  const map={active:'pill-active',approved:'pill-active',pending:'pill-pending',rejected:'pill-rejected'};
  return `<span class="status-pill ${map[status]||'pill-pending'}">${status}</span>`;
}

function timeAgo(ts){
  const diff=Date.now()-ts;
  const m=Math.floor(diff/60000),h=Math.floor(diff/3600000),d=Math.floor(diff/86400000);
  if(d>0) return d+'d ago';
  if(h>0) return h+'h ago';
  if(m>0) return m+'m ago';
  return 'just now';
}

// ── DASH TAB SWITCH ──
function showDashTab(tabId, btn){
  const allTabs=document.querySelectorAll('.dash-tab');
  allTabs.forEach(t=>{t.style.display='none';t.classList.remove('active');});
  const tab=document.getElementById(tabId);
  if(tab){tab.style.display='block';tab.classList.add('active');}
  document.querySelectorAll('.dash-nav-item').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
}

// ── SCROLL REVEAL ──
function initReveal(){
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible'); });
  },{threshold:0.1});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
}

// ── TOAST ──
function showToast(msg, type='success'){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.className='toast toast-'+type+' show';
  setTimeout(()=>t.classList.remove('show'),3500);
}

// ── BACK TO TOP ──
window.addEventListener('scroll',()=>{
  const b=document.getElementById('back-top');
  if(b) b.classList.toggle('show',window.scrollY>400);
});

// ── MOBILE MENU ──
function toggleMobile(){
  document.getElementById('hamburger').classList.toggle('active');
  document.getElementById('mobile-menu').classList.toggle('open');
}
function closeMobile(){
  document.getElementById('hamburger').classList.remove('active');
  document.getElementById('mobile-menu').classList.remove('open');
}

// ── CLOSE DROPDOWNS ON OUTSIDE CLICK ──
document.addEventListener('click',function(e){
  const dd=document.getElementById('user-dropdown');
  const btn=document.querySelector('.user-avatar-btn');
  if(dd&&!dd.contains(e.target)&&btn&&!btn.contains(e.target)) dd.classList.remove('open');
  const modal=document.getElementById('apply-modal');
  if(modal&&e.target===modal) closeApplyModal();
});

// ── INIT ──
document.addEventListener('DOMContentLoaded',function(){
  seedData();
  const s=getSession();
  if(s) currentUser=s;
  updateNavState();
  navigate('home');
});
