// Admin tools for managing fbla_users in localStorage
(function(){
  'use strict';

  const adminMsg = (txt, type='info') => {
    const el = document.getElementById('adminMessage');
    if(!el) return;
    el.textContent = txt;
    el.style.color = type === 'error' ? '#b00020' : (type === 'success' ? '#0b6b2e' : '#333');
  };

  function getUsers(){
    return JSON.parse(localStorage.getItem('fbla_users') || '[]');
  }
  function setUsers(u){
    localStorage.setItem('fbla_users', JSON.stringify(u || []));
  }

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function render(){
    const tbody = document.getElementById('usersBody');
    if(!tbody) return;
    const users = getUsers();
    tbody.innerHTML = '';
    users.forEach((u,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding:8px">${i+1}</td>
        <td style="padding:8px">${escapeHtml(u.username)}</td>
        <td style="padding:8px"><span data-i="${i}" class="pwd">••••••</span></td>
        <td style="padding:8px">
          <button data-i="${i}" class="reveal">Reveal</button>
          <button data-i="${i}" class="del">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });
    adminMsg(users.length + ' user(s) loaded');
  }

  // event delegation
  document.addEventListener('click', function(e){
    if(e.target.matches('.del')){
      const i = Number(e.target.dataset.i);
      if(!confirm('Delete user #' + (i+1) + '? This cannot be undone.')) return;
      const users = getUsers(); users.splice(i,1); setUsers(users); render();
    }
    if(e.target.matches('.reveal')){
      const i = Number(e.target.dataset.i);
      const users = getUsers();
      const pwdSpan = document.querySelector('.pwd[data-i="'+i+'"]');
      if(!pwdSpan) return;
      if(pwdSpan.textContent === '••••••') pwdSpan.textContent = users[i] ? users[i].password : '';
      else pwdSpan.textContent = '••••••';
    }
  });

  // export
  const exportBtn = document.getElementById('exportBtn');
  if(exportBtn){
    exportBtn.addEventListener('click', function(){
      const data = localStorage.getItem('fbla_users') || '[]';
      const blob = new Blob([data], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'fbla_users.json'; document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
      adminMsg('Exported users.json', 'success');
    });
  }

  // import
  const importFile = document.getElementById('importFile');
  const importBtn = document.getElementById('importBtn');
  if(importBtn && importFile){
    importBtn.addEventListener('click', ()=> importFile.click());
    importFile.addEventListener('change', function(e){
      const f = e.target.files && e.target.files[0];
      if(!f) return;
      const reader = new FileReader();
      reader.onload = function(){
        try{
          const data = JSON.parse(reader.result);
          if(!Array.isArray(data)) throw new Error('JSON is not an array');
          // basic shape check
          for(const it of data){ if(typeof it.username !== 'string' || typeof it.password !== 'string') throw new Error('Invalid user object'); }
          setUsers(data);
          render();
          adminMsg('Imported ' + data.length + ' user(s)', 'success');
        }catch(err){ adminMsg('Import failed: ' + err.message, 'error'); }
      };
      reader.readAsText(f);
      importFile.value = '';
    });
  }

  // clear all
  const clearBtn = document.getElementById('clearBtn');
  if(clearBtn){
    clearBtn.addEventListener('click', function(){
      if(!confirm('Remove ALL users from localStorage?')) return;
      setUsers([]); render(); adminMsg('All users removed', 'success');
    });
  }

  // initial render
  document.addEventListener('DOMContentLoaded', render);

})();
