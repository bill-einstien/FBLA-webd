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
      const roleEl = signupForm.querySelector('input[name="role"]:checked');
      const role = roleEl ? roleEl.value : 'student';

      if(!username) return showMessage(signupForm, 'Please enter a username.');
      if(password.length < 6) return showMessage(signupForm, 'Password must be at least 6 characters.');
      if(password !== confirm) return showMessage(signupForm, 'Passwords do not match.');

      const users = JSON.parse(localStorage.getItem('chem_users') || '[]');
      if(users.find(u => u.username.toLowerCase() === username.toLowerCase())){
        return showMessage(signupForm, 'That username is already taken.');
      }

      users.push({ username: username, password: password, role: role });
      localStorage.setItem('chem_users', JSON.stringify(users));

      const message = role === 'tutor' ? 'Tutor account created — please log in to complete your tutor profile.' : 'Account created — redirecting to login...';
      showMessage(signupForm, message, 'success');
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

      const users = JSON.parse(localStorage.getItem('chem_users') || '[]');
      const found = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if(!found) return showMessage(loginForm, 'Invalid username or password.');

      localStorage.setItem('chem_current', JSON.stringify({ username: found.username }));
      showMessage(loginForm, 'Login successful — redirecting...', 'success');
      setTimeout(() => window.location.href = 'index.html', 700);
    });
  }

  // Navigation/account initialization (used by index.html and others)
  (function initNav(){
    const navRight = document.getElementById('navright');
    if(!navRight) return;
    const cur = JSON.parse(localStorage.getItem('chem_current') || 'null');
    if(cur && cur.username){
      navRight.innerHTML = '\n        <div class="dropdown">\n          <button class="dropbtn">Account (' + esc(cur.username) + ')</button>\n          <div class="dropdown-content">\n            <a href="profile.html">Profile</a>\n            <a href="#" id="logoutBtn">Logout</a>\n          </div>\n        </div>';
      const logout = document.getElementById('logoutBtn');
      if(logout){
        logout.addEventListener('click', function(e){ e.preventDefault(); localStorage.removeItem('chem_current'); location.reload(); });
      }
    } else {
      navRight.innerHTML = '<a href="login.html" class="button">Login</a><a href="signin.html" class="nav-link">Sign up</a>';
    }
  })();

  // Profile page initializer (moves inline script from profile.html here)
  (function initProfile(){
    const area = document.getElementById('profileArea');
    if(!area) return;
    const cur = JSON.parse(localStorage.getItem('chem_current') || 'null');
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
      logoutBtn.addEventListener('click', function(){ localStorage.removeItem('chem_current'); window.location.href = 'index.html'; });
    }
  })();

  // Lessons & progress demo
  const LESSONS = [
    {id: '1-1', title: 'Lesson 1.1 — Atoms & Subatomic Particles', description: 'Intro to atoms, protons, neutrons, and electrons.', objectives: ['Describe the basic structure of an atom','Name the charges of subatomic particles']},
    {id: '1-2', title: 'Lesson 1.2 — Isotopes & Ions', description: 'Understand isotopes, ions, and how they affect properties.', objectives: ['Explain isotopes & mass number','Differentiate ions and neutral atoms']},
    {id: '1-3', title: 'Lesson 1.3 — Atomic Models', description: 'Explore Bohr, Rutherford, and modern atomic models.', objectives: ['Compare historical atomic models','Relate models to experimental evidence']}
  ];

  function getCurrentUser(){ const cur = JSON.parse(localStorage.getItem('chem_current') || 'null'); return cur && cur.username ? cur.username : null; }

  function getProgress(){ const user = getCurrentUser(); if(!user) return {}; return JSON.parse(localStorage.getItem('chem_progress_' + user) || '{}'); }
  function saveProgress(p){ const user = getCurrentUser(); if(!user){ alert('Please log in to track progress.'); window.location.href = 'login.html'; return; } localStorage.setItem('chem_progress_' + user, JSON.stringify(p)); }

  function toggleLesson(id){
    const user = getCurrentUser();
    if(!user){ alert('Please log in to mark lessons complete.'); window.location.href = 'login.html'; return; }
    const p = getProgress();
    p[id] = !p[id];
    saveProgress(p);
    updateLessonsUI();
    updateProgressUI();
    const detailBtn = document.getElementById('lessonMark');
    if(detailBtn){
      const p2 = getProgress();
      if(p2[id]){
        detailBtn.textContent = 'Completed';
        detailBtn.classList.add('completed');
        detailBtn.setAttribute('aria-pressed','true');
      } else {
        detailBtn.textContent = 'Mark complete';
        detailBtn.classList.remove('completed');
        detailBtn.setAttribute('aria-pressed','false');
      }
    }
  }

  function updateLessonsUI(){
    const items = document.querySelectorAll('[data-lesson]');
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
    const barEl = document.getElementById('progressBarFill');
    if(!pctEl || !listEl || !barEl) return;
    const user = getCurrentUser();
    if(!user){
      pctEl.textContent = '— (log in)';
      listEl.innerHTML = '<li>Please log in to view progress and track lessons.</li>';
      barEl.style.width = '0%';
      barEl.setAttribute('aria-valuenow', '0');
      barEl.setAttribute('title','Log in to see progress');
      return;
    }
    const p = getProgress();
    const completed = LESSONS.filter(l => p[l.id]);
    const percent = LESSONS.length ? Math.round((completed.length / LESSONS.length) * 100) : 0;
    pctEl.textContent = percent + '%';
    listEl.innerHTML = completed.length ? completed.map(l=>'<li>'+l.title+'</li>').join('') : '<li>No lessons completed yet</li>';
    // Update the progress bar fill and accessibility attributes
    barEl.style.width = percent + '%';
    barEl.setAttribute('aria-valuenow', String(percent));
    barEl.setAttribute('title', percent + '% complete');
  }

  (function initLessonsPage(){
    const list = document.getElementById('lessonsList') || document.getElementById('lessonsGrid');
    if(!list) return;
    list.querySelectorAll('.mark-btn').forEach(btn => {
      btn.addEventListener('click', function(){
        const container = this.closest('[data-lesson]');
        if(!container) return;
        const id = container.dataset.lesson;
        toggleLesson(id);
      });
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
  function getGroups(){ return JSON.parse(localStorage.getItem('chem_groups') || '[]'); }
  function saveGroups(g){ localStorage.setItem('chem_groups', JSON.stringify(g)); }

  function renderGroupsList(){
    const list = document.getElementById('groupList');
    if(!list) return;
    const groups = getGroups();
    const user = getCurrentUser();

    if(!groups.length){ list.innerHTML = '<li>No groups yet</li>'; return; }

    // optional 'upcoming within 7 days' filter
    const upcomingOnly = !!document.getElementById('upcomingFilter') && document.getElementById('upcomingFilter').checked;
    const now = new Date();
    const in7 = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

    list.innerHTML = groups.filter(g => {
      if(!upcomingOnly) return true;
      if(!g.meeting || !g.meeting.date) return false;
      const dt = new Date(g.meeting.date + 'T' + (g.meeting.time || '00:00'));
      return dt >= now && dt <= in7;
    }).map(g => {
      if(!Array.isArray(g.members)) g.members = [];
      const joined = user && g.members.includes(user);
      const count = Array.isArray(g.members) ? g.members.length : (g.members || 0);
      const owner = g.owner || 'unknown';
      const subject = g.subject ? ('<div class="muted">Subject: ' + (g.subject) + '</div>') : '';
      let meeting = '';
      if(g.meeting && g.meeting.date){
        const t = g.meeting.time ? (' @ ' + g.meeting.time) : '';
        meeting = '<div class="muted">Next meeting: ' + g.meeting.date + t + (g.meeting.link ? (' — <a href="' + g.meeting.link + '" target="_blank">Link</a>') : '') + '</div>';
      }
      const deleteBtn = (user && g.owner === user) ? (' <button class="delete-group" data-id="'+g.id+'">Delete</button>') : '';
      return '<li data-id="'+g.id+'"><strong>'+esc(g.name)+'</strong> — <em>'+esc(owner)+'</em> — '+count+' members '+deleteBtn+'<div style="margin-top:6px">'+subject+meeting+'</div><div style="margin-top:6px"><button class="join-group" data-id="'+g.id+'"'+(joined? ' disabled title="You joined"' : '')+'>'+ (joined? 'Joined' : 'Join') +'</button></div></li>';
    }).join('');

    list.querySelectorAll('.join-group').forEach(btn => btn.addEventListener('click', function(){ joinGroupById(this.dataset.id); }));
    list.querySelectorAll('.delete-group').forEach(btn => btn.addEventListener('click', function(){ deleteGroup(this.dataset.id); }));
  }

  function joinGroupById(id){ const user = getCurrentUser(); if(!user){ alert('Please log in to join groups.'); window.location.href = 'login.html'; return; } const groups = getGroups(); const g = groups.find(x=> x.id===id); if(!g) return; if(!Array.isArray(g.members)) g.members = []; if(g.members.includes(user)){ alert('You already joined ' + g.name); return; } g.members.push(user); saveGroups(groups); renderGroupsList(); alert('Joined ' + g.name); }

  function deleteGroup(id){ const user = getCurrentUser(); const groups = getGroups(); const g = groups.find(x=> x.id===id); if(!g) return; if(g.owner !== user){ alert('Only the owner can delete this group.'); return; } if(!confirm('Delete group "' + g.name + '"?')) return; const idx = groups.findIndex(x=> x.id===id); if(idx >= 0) groups.splice(idx,1); saveGroups(groups); renderGroupsList(); alert('Group deleted.'); }

  (function initCreateGroupPage(){
    const form = document.getElementById('createGroupForm');
    if(!form) return;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const user = getCurrentUser();
      if(!user){ alert('Please log in to create a group.'); window.location.href = 'login.html'; return; }
      const name = form.querySelector('#groupName').value.trim();
      const subject = form.querySelector('#groupSubject').value.trim();
      const meetingDate = form.querySelector('#meetingDate').value || null;
      const meetingTime = form.querySelector('#meetingTime').value || null;
      const meetingRecurrence = form.querySelector('#meetingRecurrence').value || 'none';
      const meetingLink = form.querySelector('#meetingLink').value.trim() || null;
      if(!name){ alert('Please enter a group name'); return; }

      const groups = getGroups();
      if(groups.find(g => g.name.toLowerCase() === name.toLowerCase())){ alert('A group with that name already exists. Choose another name.'); return; }

      const newGroup = {
        id: 'g_' + Date.now(),
        name,
        subject,
        owner: user,
        members: [user],
        meeting: meetingDate ? { date: meetingDate, time: meetingTime, recurrence: meetingRecurrence, link: meetingLink } : null
      };
      groups.push(newGroup);
      saveGroups(groups);
      form.reset();
      renderGroupsList();
      alert('Group created: ' + name);
    });
  })();

  (function initJoinGroupPage(){ renderGroupsList(); const upcoming = document.getElementById('upcomingFilter'); if(upcoming) upcoming.addEventListener('change', renderGroupsList); })();

  // Tutors (only persisted tutor profiles created by users)
  function getStoredTutors(){ return JSON.parse(localStorage.getItem('chem_tutors') || '[]'); }
  function saveStoredTutors(arr){ localStorage.setItem('chem_tutors', JSON.stringify(arr)); }
  function getAllTutors(){ return getStoredTutors(); }

  function renderTutors(){
    const el = document.getElementById('tutorList'); if(!el) return;
    const user = getCurrentUser();
    const bookings = JSON.parse(localStorage.getItem('chem_bookings')||'[]');
    const tutors = getAllTutors();

    if(!tutors.length){ el.innerHTML = '<p>No tutors available yet. <a href="signin.html">Sign up</a> to create a tutor profile.</p>'; return; }

    el.innerHTML = tutors.map(t => {
      const booked = user && bookings.find(b => b.tutor === t.name && b.user === user);
      const ownerNote = t.owner ? ('<div class="muted">Profile by: ' + esc(t.owner) + '</div>') : '';
      return '<div class="tutor-card" data-id="'+t.id+'">' + '<h4>'+esc(t.name)+'</h4><p>'+esc(t.subjects)+'</p><p>' + (t.rating ? ('Rating: '+t.rating+' • ') : '') + esc(t.rate || '') + '</p>' + ownerNote + '<p><button class="book-btn" data-id="'+t.id+'"'+(booked? ' disabled title="Already booked"' : '')+'>'+ (booked? 'Booked' : 'Book') +'</button></p></div>';
    }).join('');

    el.querySelectorAll('.book-btn').forEach(b => b.addEventListener('click', function(){ bookTutor(this.dataset.id); }));
  }

  function bookTutor(id){
    const user = getCurrentUser(); if(!user){ alert('Please log in to book tutors.'); window.location.href = 'login.html'; return; }
    const tutors = getAllTutors(); const tutor = tutors.find(t => t.id === id); if(!tutor){ alert('Tutor not found.'); return; }
    const bookings = JSON.parse(localStorage.getItem('chem_bookings')||'[]');
    if(bookings.find(b => b.tutor === tutor.name && b.user === user)){ alert('You already have a booking with ' + tutor.name); return; }
    bookings.push({ tutor: tutor.name, time: new Date().toISOString(), user }); localStorage.setItem('chem_bookings', JSON.stringify(bookings)); alert('Booked ' + tutor.name);
  }

  (function initTutorsPage(){
    renderTutors();
    const area = document.getElementById('myTutorArea');
    if(!area) return;
    const cur = getCurrentUser();
    if(!cur){ area.innerHTML = '<p><a href="login.html">Log in</a> to create a tutor profile.</p>'; return; }
    const users = JSON.parse(localStorage.getItem('chem_users')||'[]');
    const me = users.find(u => u.username === cur);
    const stored = getStoredTutors();
    const myProfile = stored.find(t => t.owner === cur);

    if(!me || me.role !== 'tutor'){
      area.innerHTML = '<p>Want to teach? <a href="signin.html">Sign up</a> and select "Tutor" as account type.</p>';
      return;
    }

    if(myProfile){
      area.innerHTML = '<h3>Your Tutor Profile</h3><div class="resource-card"><strong>'+esc(myProfile.name)+'</strong><div class="muted">Subjects: '+esc(myProfile.subjects)+'</div><div>'+esc(myProfile.rate || '')+'</div><div style="margin-top:8px"><button id="editTutor">Edit</button> <button id="removeTutor">Remove</button></div></div>';
      document.getElementById('editTutor').addEventListener('click', function(){ area.innerHTML = renderTutorForm(myProfile); bindTutorForm(area, myProfile); });
      document.getElementById('removeTutor').addEventListener('click', function(){ if(!confirm('Remove your tutor profile?')) return; const idx = stored.findIndex(t => t.owner === cur); if(idx >=0){ stored.splice(idx,1); saveStoredTutors(stored); area.innerHTML = '<p>Your tutor profile was removed.</p>'; renderTutors(); } });
    } else {
      area.innerHTML = renderTutorForm(); bindTutorForm(area, null);
    }

    function renderTutorForm(data){ data = data || {}; return '<form id="tutorForm" class="resource-card"><label>Name<br><input id="tutorName" value="'+esc(data.name||cur)+'"></label><br><label>Subjects (comma separated)<br><input id="tutorSubjects" value="'+esc(data.subjects||'')+'"></label><br><label>Rate (e.g. $30/hr)<br><input id="tutorRate" value="'+esc(data.rate||'')+'"></label><br><label>Email<br><input id="tutorEmail" value="'+esc(data.email||'')+'"></label><br><input type="submit" class="primary-btn" value="'+(data.id? 'Update Profile' : 'Create Profile')+'"></form>'; }
    function bindTutorForm(container, existing){
      const form = container.querySelector('#tutorForm');
      form.addEventListener('submit', function(e){
        e.preventDefault();
        const name = form.querySelector('#tutorName').value.trim();
        const subjects = form.querySelector('#tutorSubjects').value.trim();
        const rate = form.querySelector('#tutorRate').value.trim();
        const email = form.querySelector('#tutorEmail').value.trim();
        if(!name || !subjects){ alert('Please provide a name and subjects.'); return; }
        const stored = getStoredTutors();
        if(existing){ const t = stored.find(x => x.owner === cur); if(t){ t.name = name; t.subjects = subjects; t.rate = rate; t.email = email; saveStoredTutors(stored); area.innerHTML = '<p>Profile updated.</p>'; renderTutors(); return; } }
        else { const newTutor = { id: 'ut_' + Date.now(), name, subjects, rate, rating: 0, email, owner: cur }; stored.push(newTutor); saveStoredTutors(stored); area.innerHTML = '<p>Profile created.</p>'; renderTutors(); }
      });
    }

  })();

})();
