// Main frontend behavior shared across pages (deferred)
(function(){
  'use strict';

  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function showMessage(form, msg, type = 'error'){
    let el = form.querySelector('.form-message');
    if(!el){
      el = document.createElement('div');
      el.className = 'form-message';
      form.insertBefore(el, form.querySelector('.primary-btn'));
    }
    el.textContent = msg;
    el.style.color = (type === 'error') ? '#b00020' : '#0b6b2e';
  }


  // Signup handler
  const signupForm = document.getElementById('signupForm');
  if(signupForm){
    signupForm.addEventListener('submit', function(e){
      e.preventDefault();
      const username = signupForm.querySelector('#username').value.trim();
      const password = signupForm.querySelector('#password').value;
      const confirm = signupForm.querySelector('#confirm').value;

      if(!username) return showMessage(signupForm, 'Please enter a username.');
      if(password.length < 6) return showMessage(signupForm, 'Password must be at least 6 characters.');
      if(password !== confirm) return showMessage(signupForm, 'Passwords do not match.');

      const users = JSON.parse(localStorage.getItem('fbla_users') || '[]');
      if(users.find(u => u.username.toLowerCase() === username.toLowerCase())){
        return showMessage(signupForm, 'That username is already taken.');
      }

      users.push({ username: username, password: password });
      localStorage.setItem('fbla_users', JSON.stringify(users));

      showMessage(signupForm, 'Account created — redirecting to login...', 'success');
      setTimeout(() => window.location.href = 'login.html', 900);
    });
  }

  // Login handler
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      const username = loginForm.querySelector('#username').value.trim();
      const password = loginForm.querySelector('#password').value;

      if(!username) return showMessage(loginForm, 'Please enter your username.');
      if(!password) return showMessage(loginForm, 'Please enter your password.');

      const users = JSON.parse(localStorage.getItem('fbla_users') || '[]');
      const found = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if(!found) return showMessage(loginForm, 'Invalid username or password.');

      localStorage.setItem('fbla_current', JSON.stringify({ username: found.username }));
      showMessage(loginForm, 'Login successful — redirecting...', 'success');
      setTimeout(() => window.location.href = 'index.html', 700);
    });
  }

  // Navigation/account initialization (used by index.html and others)
  (function initNav(){
    const navRight = document.getElementById('navright');
    if(!navRight) return;
    const cur = JSON.parse(localStorage.getItem('fbla_current') || 'null');
    if(cur && cur.username){
      navRight.innerHTML = '\n        <div class="dropdown">\n          <button class="dropbtn">Account (' + esc(cur.username) + ')</button>\n          <div class="dropdown-content">\n            <a href="profile.html">Profile</a>\n            <a href="#" id="logoutBtn">Logout</a>\n          </div>\n        </div>';
      const logout = document.getElementById('logoutBtn');
      if(logout){
        logout.addEventListener('click', function(e){ e.preventDefault(); localStorage.removeItem('fbla_current'); location.reload(); });
      }
    } else {
      navRight.innerHTML = '<a href="login.html" class="button">Login</a><a href="signin.html" class="nav-link">Sign up</a>';
    }
  })();

  // Profile page initializer (moves inline script from profile.html here)
  (function initProfile(){
    const area = document.getElementById('profileArea');
    if(!area) return;
    const cur = JSON.parse(localStorage.getItem('fbla_current') || 'null');
    const logoutBtn = document.getElementById('logoutNow');
    if(!cur || !cur.username){
      area.innerHTML = '<p>You are not logged in. <a href="login.html">Log in</a></p>';
      if(logoutBtn) logoutBtn.style.display = 'none';
      return;
    }
    // simple escape for username
    const safe = String(cur.username).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    area.innerHTML = '<p><strong>Username:</strong> ' + safe + '</p>';
    if(logoutBtn){
      logoutBtn.addEventListener('click', function(){ localStorage.removeItem('fbla_current'); window.location.href = 'index.html'; });
    }
  })();

  // Lessons & progress demo
  const LESSONS = [
    {id: '1-1', title: 'Lesson 1.1 — Atoms & Subatomic Particles', description: 'Intro to atoms, protons, neutrons, and electrons.', objectives: ['Describe the basic structure of an atom','Name the charges of subatomic particles']},
    {id: '1-2', title: 'Lesson 1.2 — Isotopes & Ions', description: 'Understand isotopes, ions, and how they affect properties.', objectives: ['Explain isotopes & mass number','Differentiate ions and neutral atoms']},
    {id: '1-3', title: 'Lesson 1.3 — Atomic Models', description: 'Explore Bohr, Rutherford, and modern atomic models.', objectives: ['Compare historical atomic models','Relate models to experimental evidence']}
  ];

  function getCurrentUser(){ const cur = JSON.parse(localStorage.getItem('fbla_current') || 'null'); return cur && cur.username ? cur.username : null; }

  function getProgress(){ const user = getCurrentUser(); if(!user) return {}; return JSON.parse(localStorage.getItem('fbla_progress_' + user) || '{}'); }
  function saveProgress(p){ const user = getCurrentUser(); if(!user){ alert('Please log in to track progress.'); window.location.href = 'login.html'; return; } localStorage.setItem('fbla_progress_' + user, JSON.stringify(p)); }

  function toggleLesson(id){
    const user = getCurrentUser();
    if(!user){ alert('Please log in to mark lessons complete.'); window.location.href = 'login.html'; return; }
    const p = getProgress();
    p[id] = !p[id];
    saveProgress(p);
    updateLessonsUI();
    updateProgressUI();
  }

  function updateLessonsUI(){
    const items = document.querySelectorAll('.lesson-item');
    const p = getProgress();
    const user = getCurrentUser();
    items.forEach(li => {
      const id = li.dataset.lesson;
      const btn = li.querySelector('.mark-btn');
      if(!user){ btn.textContent = 'Log in to mark'; btn.disabled = false; btn.title = 'Log in to track progress'; btn.classList.remove('completed'); btn.setAttribute('aria-pressed','false'); return; }
      btn.disabled = false;
      btn.title = '';
      if(p[id]){
        btn.textContent = 'Completed';
        btn.classList.add('completed');
        btn.setAttribute('aria-pressed','true');
      } else {
        btn.textContent = 'Mark complete';
        btn.classList.remove('completed');
        btn.setAttribute('aria-pressed','false');
      }
    });
  }

  function updateProgressUI(){
    const pctEl = document.getElementById('progressPercent');
    const listEl = document.getElementById('completedList');
    if(!pctEl || !listEl) return;
    const user = getCurrentUser();
    if(!user){ pctEl.textContent = '— (log in)'; listEl.innerHTML = '<li>Please log in to view progress and track lessons.</li>'; return; }
    const p = getProgress();
    const completed = LESSONS.filter(l => p[l.id]);
    const percent = Math.round((completed.length / LESSONS.length) * 100);
    pctEl.textContent = percent + '%';
    listEl.innerHTML = completed.length ? completed.map(l=>'<li>'+l.title+'</li>').join('') : '<li>No lessons completed yet</li>';
  }

  (function initLessonsPage(){
    const list = document.getElementById('lessonsList');
    if(!list) return;
    list.querySelectorAll('.mark-btn').forEach(btn => {
      btn.addEventListener('click', function(){ const id = this.closest('.lesson-item').dataset.lesson; toggleLesson(id); });
    });
    updateLessonsUI();
  })();

  (function initProgressPage(){
    const summary = document.getElementById('progressSummary');
    if(!summary) return;
    updateProgressUI();
  })();

  // Lesson detail page
  (function initLessonDetailPage(){
    const titleEl = document.getElementById('lessonTitle');
    const contentEl = document.getElementById('lessonContent');
    const markBtn = document.getElementById('lessonMark');
    if(!titleEl) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if(!id) return;
    const lesson = LESSONS.find(l => l.id === id);
    if(!lesson){ titleEl.textContent = 'Lesson not found'; contentEl.textContent = ''; return; }
    titleEl.textContent = lesson.title;
    contentEl.textContent = 'This is a short description for ' + lesson.title + '. Learning objectives: describe the atom, explain isotopes, and compare models.';
    if(markBtn){
      const user = getCurrentUser();
      if(!user){
        markBtn.textContent = 'Log in to mark';
        markBtn.addEventListener('click', function(){ window.location.href = 'login.html'; });
      } else {
        markBtn.addEventListener('click', function(){ toggleLesson(id); });
      }
      const p = getProgress();
      if(p[id]){ markBtn.textContent='Completed'; markBtn.classList.add('completed'); markBtn.setAttribute('aria-pressed','true'); }
    }
  })();

  // Simple quiz handling
  (function initQuizPage(){
    const btn = document.getElementById('checkQuiz');
    const res = document.getElementById('quizResult');
    if(!btn || !res) return;
    btn.addEventListener('click', function(){ const sel = document.querySelector('input[name="q1"]:checked'); if(!sel){ res.textContent = 'Select an answer.'; return; } if(sel.value === 'proton'){ res.textContent = 'Correct!'; res.style.color = '#0b6b2e'; } else { res.textContent = 'Incorrect — try again.'; res.style.color = '#b00020'; } });
  })();

  // Groups (create & join)
  function getGroups(){ return JSON.parse(localStorage.getItem('fbla_groups') || '[]'); }
  function saveGroups(g){ localStorage.setItem('fbla_groups', JSON.stringify(g)); }

  function renderGroupsList(){
    const list = document.getElementById('groupList');
    if(!list) return;
    const groups = getGroups();
    const user = getCurrentUser();
    if(!groups.length){ list.innerHTML = '<li>No groups yet</li>'; return; }
    list.innerHTML = groups.map(g => {
      if(!Array.isArray(g.members)) g.members = [];
      const joined = user && g.members.includes(user);
      const count = Array.isArray(g.members) ? g.members.length : (g.members || 0);
      return '<li>'+g.name+' — '+count+' members — <button class="join-group" data-group="'+g.name+'"'+(joined? ' disabled title="You joined"' : '')+'>'+ (joined? 'Joined' : 'Join') +'</button></li>';
    }).join('');
    list.querySelectorAll('.join-group').forEach(btn => btn.addEventListener('click', function(){ joinGroup(this.dataset.group); }));
  }

  function joinGroup(name){ const user = getCurrentUser(); if(!user){ alert('Please log in to join groups.'); window.location.href = 'login.html'; return; } const groups = getGroups(); const g = groups.find(x=> x.name===name); if(!g) return; if(!Array.isArray(g.members)) g.members = []; if(g.members.includes(user)){ alert('You already joined ' + name); return; } g.members.push(user); saveGroups(groups); renderGroupsList(); alert('Joined ' + name); }

  (function initCreateGroupPage(){ const form = document.getElementById('createGroupForm'); if(!form) return; form.addEventListener('submit', function(e){ e.preventDefault(); const user = getCurrentUser(); if(!user){ alert('Please log in to create a group.'); window.location.href = 'login.html'; return; } const name = form.querySelector('#groupName').value.trim(); const subject = form.querySelector('#groupSubject').value.trim(); if(!name){ alert('Please enter a group name'); return; } const groups = getGroups(); groups.push({ name, subject, members: [user] }); saveGroups(groups); form.reset(); renderGroupsList(); alert('Group created: ' + name); }); })();

  (function initJoinGroupPage(){ renderGroupsList(); })();

  // Tutors
  const TUTORS = [
    {id:'t1', name:'Alex Chen', subjects:'Chemistry, AP Chem', rate:'$30/hr', rating:4.8, email:'alex@example.com'},
    {id:'t2', name:'Morgan Patel', subjects:'General Chemistry, Stoichiometry', rate:'$25/hr', rating:4.6, email:'morgan@example.com'}
  ];

  function renderTutors(){ const el = document.getElementById('tutorList'); if(!el) return; const user = getCurrentUser(); const bookings = JSON.parse(localStorage.getItem('fbla_bookings')||'[]'); el.innerHTML = TUTORS.map(t => { const booked = user && bookings.find(b => b.tutor === t.name && b.user === user); return '<div class="tutor-card" data-id="'+t.id+'">' + '<h4>'+t.name+'</h4><p>'+t.subjects+'</p><p>Rating: '+t.rating+' • '+t.rate+'</p><p><button class="book-btn" data-id="'+t.id+'"'+(booked? ' disabled title="Already booked"' : '')+'>'+ (booked? 'Booked' : 'Book') +'</button></p></div>'; }).join(''); el.querySelectorAll('.book-btn').forEach(b => b.addEventListener('click', function(){ bookTutor(this.dataset.id); })); }

  function bookTutor(id){ const user = getCurrentUser(); if(!user){ alert('Please log in to book tutors.'); window.location.href = 'login.html'; return; } const tutor = TUTORS.find(t => t.id === id); if(!tutor) return; const bookings = JSON.parse(localStorage.getItem('fbla_bookings')||'[]'); if(bookings.find(b => b.tutor === tutor.name && b.user === user)){ alert('You already have a booking with ' + tutor.name); return; } bookings.push({ tutor: tutor.name, time: new Date().toISOString(), user }); localStorage.setItem('fbla_bookings', JSON.stringify(bookings)); alert('Booked ' + tutor.name); }

  (function initTutorsPage(){ renderTutors(); })();

})();
