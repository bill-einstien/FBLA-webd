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

})();
