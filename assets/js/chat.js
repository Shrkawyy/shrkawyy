(function () {
  'use strict';

  const WS_CONFIG = { CHAT: 'wss://chat--ahmar22244.replit.app/chat' };

  const qs = (s, r = document) => r.querySelector(s);
  const getText = e => (e && 'value' in e) ? String(e.value) : '';
  const normTag = s => String(s || '').trim().toUpperCase();
  const nowHHMM = () => new Date().toTimeString().slice(0, 5);

  function nicknameEl() { return qs('#nickname') || qs('input[name="nick"]') || qs('input[name="nickname"]') || qs('input[placeholder*="name" i]'); }
  function detectGameNick() { const e = nicknameEl(); return (e ? getText(e).trim() : '') || 'Anon'; }
  function tagEl() { return qs('#tag') || qs('input[placeholder*="tag" i]'); }
  function currentTag() { return normTag(getText(tagEl())); }

  function detectCategory() {
    const s = qs('#servers'); if (!s) return 'ffa';
    const o = s.options[s.selectedIndex];
    const l = (o?.textContent || '').toLowerCase(), v = (o?.value || '').toLowerCase();
    if (l.includes('macro') || v.includes('macro') || v.includes(':6001')) return 'macro';
    return 'ffa';
  }

  function composeRoom(cat, mode, tag) {
    if (mode === 'party') { const T = normTag(tag); return T ? `${cat}:party:${T}` : null; }
    return `${cat}:global`;
  }

  const css = `
  .ZYX-chat{position:fixed;left:10px;bottom:10px;width:250px;height:280px;display:flex;flex-direction:column;background:rgba(10, 10, 10, 0.3);backdrop-filter:blur(8px);border:none;border-radius:0;color:#fff;font:13px/1.4 'Segoe UI', system-ui,-apple-system,Segoe UI,Roboto,Arial;z-index:2147483647}
  .ZYX-chat-header{display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid rgba(255,255,255,.03);background:rgba(0,0,0,0.2)}
  .ZYX-chat-badge{font-weight:600;padding:3px 8px;border-radius:4px;background:rgba(0,0,0,0.3);color:#fff;font-size:12px;text-transform:uppercase}
  .ZYX-chat-toggle{margin-left:auto;display:flex;gap:4px}
  .ZYX-chat-toggle button{padding:4px 8px;border-radius:4px;border:none;background:rgba(0,0,0,0.2);color:#aaa;cursor:pointer;font-size:12px;transition:all 0.2s ease}
  .ZYX-chat-toggle button:hover{background:rgba(0,0,0,0.4);color:#fff}
  .ZYX-chat-toggle button.active{background:rgba(0,0,0,0.5);color:#fff}
  .ZYX-chat-body{flex:1;overflow:auto;padding:8px 10px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent;background:transparent}
  .ZYX-chat-body::-webkit-scrollbar{width:4px}
  .ZYX-chat-body::-webkit-scrollbar-track{background:transparent}
  .ZYX-chat-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
  .ZYX-chat-body::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.2)}
  .ZYX-chat-msg{margin:2px 0;padding:1px 0;line-height:1.2;word-wrap:break-word}
  .ZYX-chat-time{opacity:.8;margin-right:6px;color:#999;font-size:10px;font-family:'Courier New', monospace}
  .ZYX-chat-name{font-weight:500;margin-right:6px;font-size:11px}
  .ZYX-chat-name.user1{color:#4a9eff}
  .ZYX-chat-name.user2{color:#ff6b6b}
  .ZYX-chat-name.user3{color:#51cf66}
  .ZYX-chat-name.user4{color:#ffd43b}
  .ZYX-chat-name.user5{color:#ff8cc8}
  .ZYX-chat-name.system{color:#868e96;font-style:italic}
  .ZYX-chat-text{color:#fff;font-weight:400;font-size:12px}
  .ZYX-chat-foot{display:flex;gap:6px;padding:8px 10px;border-top:1px solid rgba(255,255,255,.03);background:rgba(0,0,0,0.2)}
  .ZYX-chat-foot input{flex:1;padding:8px 12px;border-radius:4px;border:none;background:rgba(0,0,0,0.3);color:#fff;font-size:13px;outline:none;transition:all 0.2s ease}
  .ZYX-chat-foot input:focus{background:rgba(0,0,0,0.5)}
  .ZYX-chat-foot input::placeholder{color:rgba(255,255,255,.4)}
  .ZYX-chat-foot button{padding:8px 12px;border-radius:4px;border:none;background:rgba(0,0,0,0.3);color:#fff;cursor:pointer;font-size:12px;font-weight:500;transition:all 0.2s ease}
  .ZYX-chat-foot button:hover{background:rgba(0,0,0,0.5)}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const root = document.createElement('div');
  root.className = 'ZYX-chat';
  root.innerHTML = `
    <div class="ZYX-chat-header">
      <span class="ZYX-chat-badge" id="ZYXRoomLabel">…</span>
      <div class="ZYX-chat-toggle">
        <button id="ZYXBtnGlobal" class="active">G</button>
        <button id="ZYXBtnParty">P</button>
      </div>
    </div>
    <div class="ZYX-chat-body" id="ZYXLog"></div>
    <div class="ZYX-chat-foot">
      <input id="ZYXInput" maxlength="300" placeholder="Message">
      <button id="ZYXSend">›</button>
    </div>`;
  document.body.appendChild(root);

  const q = s => root.querySelector(s);
  const logEl = q('#ZYXLog'), inputEl = q('#ZYXInput'),
        sendBtn = q('#ZYXSend'), labelEl = q('#ZYXRoomLabel'),
        btnGlobal = q('#ZYXBtnGlobal'), btnParty = q('#ZYXBtnParty');

  function logLine(name, msg, sys) {
    const r = document.createElement('div'); r.className = 'ZYX-chat-msg';
    const safe = String(msg || '').replace(/[<>]/g, m => ({ '<': '&lt;', '>': '&gt;' }[m]));
    
    // Generate user color class based on name
    const userClass = getUserColorClass(name);
    
    r.innerHTML = sys
      ? `<span class="ZYX-chat-time">[${nowHHMM()}]</span><span class="ZYX-chat-name system">${name}</span><span class="ZYX-chat-text">${safe}</span>`
      : `<span class="ZYX-chat-time">[${nowHHMM()}]</span><span class="ZYX-chat-name ${userClass}">${name}</span><span class="ZYX-chat-text">${safe}</span>`;
    logEl.appendChild(r);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function getUserColorClass(name) {
    // Generate consistent color based on username hash
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % 5 + 1; // user1 to user5
    return `user${colorIndex}`;
  }

  const sockets = new Map(), logsByRoom = new Map(), connectionStates = new Map();
  const timeoutTimers = new Map(), reconnectAttempts = new Map();
  const heartbeatIntervals = new Map();
  const WS_TIMEOUT = 3600000; // 1 hour (60 minutes)
  const RECONNECT_COOLDOWN = 5000; // 5 seconds anti-spam
  const HEARTBEAT_INTERVAL = 10000; // Check for connection every 10 seconds
  
  let myName = detectGameNick().slice(0, 24);
  let mode = 'global';
  let currentCategory = detectCategory();
  let currentTagSnapshot = currentTag();
  let chatOpen = false;
  let chatVisible = true;

  function activeRoom() { 
    return mode === 'party' && currentTagSnapshot ? `${currentCategory}:party:${currentTagSnapshot}` : `${currentCategory}:global`;
  }

  function append(room, from, text) {
    if (!logsByRoom.has(room)) logsByRoom.set(room, []);
    logsByRoom.get(room).push({ from, text });
    
    if (room === activeRoom()) logLine(from, text);
  }

  function renderRoom(r) {
    logEl.innerHTML = '';
    const messages = logsByRoom.get(r) || [];
    messages.forEach(m => logLine(m.from, m.text));
    logEl.scrollTop = logEl.scrollHeight;
  }

  function ensureSocket(room, forceReconnect = false) {
    if (!room || typeof room !== 'string') return;
    
    const existingWs = sockets.get(room);
    if (existingWs?.readyState === 1 && !forceReconnect) return;
    
    // Anti-spam: check if we recently tried to reconnect
    const lastAttempt = reconnectAttempts.get(room) || 0;
    const now = Date.now();
    if (now - lastAttempt < RECONNECT_COOLDOWN && !forceReconnect) {
      return; // Skip reconnect to prevent spam
    }
    
    reconnectAttempts.set(room, now);
    
    // Clear existing timeout timer
    if (timeoutTimers.has(room)) {
      clearTimeout(timeoutTimers.get(room));
      timeoutTimers.delete(room);
    }
    
    // Clear existing heartbeat
    if (heartbeatIntervals.has(room)) {
      clearInterval(heartbeatIntervals.get(room));
      heartbeatIntervals.delete(room);
    }
    
    // Close existing connection if any
    if (existingWs) {
      existingWs.close();
      sockets.delete(room);
    }

    const u = new URL(WS_CONFIG.CHAT);
    u.searchParams.set('room', room);
    u.searchParams.set('name', myName || 'Anonymous');

    const ws = new WebSocket(u);
    sockets.set(room, ws);
    
    // Set up 30-second timeout
    const timeoutId = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Timeout');
      }
    }, WS_TIMEOUT);
    timeoutTimers.set(room, timeoutId);

    ws.onopen = () => { 
      ws.send(JSON.stringify({ type: 'rename', name: myName || 'Anonymous' })); 
      // Show connected message only on first ever connection
      if (!connectionStates.has(room)) {
        append(room, '•', `Connected to ${room}`);
        connectionStates.set(room, { connected: true, disconnected: false, firstConnectionDone: true });
      } else {
        // Silent reconnection - just update state
        connectionStates.set(room, { connected: true, disconnected: false, firstConnectionDone: true });
      }
      
      // Clear heartbeat when successfully connected
      if (heartbeatIntervals.has(room)) {
        clearInterval(heartbeatIntervals.get(room));
        heartbeatIntervals.delete(room);
      }
      
      // Reset timeout on successful connection
      if (timeoutTimers.has(room)) {
        clearTimeout(timeoutTimers.get(room));
      }
      const newTimeoutId = setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Timeout');
        }
      }, WS_TIMEOUT);
      timeoutTimers.set(room, newTimeoutId);
    };
    
    ws.onmessage = e => {
      let d;
      try { d = JSON.parse(e.data); } catch { return; }
      
      // Reset timeout on any message activity
      if (timeoutTimers.has(room)) {
        clearTimeout(timeoutTimers.get(room));
      }
      const newTimeoutId = setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Timeout');
        }
      }, WS_TIMEOUT);
      timeoutTimers.set(room, newTimeoutId);
      
      if (d.type === 'chat') {
        append(room, d.name || '??', d.text || '');
      }
      else if (d.type === 'system') append(room, '•', d.text || 'system');
    };
    
    ws.onclose = () => { 
      // Clear timeout
      if (timeoutTimers.has(room)) {
        clearTimeout(timeoutTimers.get(room));
        timeoutTimers.delete(room);
      }
      
      // Clear heartbeat
      if (heartbeatIntervals.has(room)) {
        clearInterval(heartbeatIntervals.get(room));
        heartbeatIntervals.delete(room);
      }
      
      // Only track disconnection state silently
      const state = connectionStates.get(room);
      if (state && state.connected && !state.disconnected) {
        connectionStates.set(room, { ...state, disconnected: true });
      }
      
      // No auto-reconnection - stay disconnected
    };
    
    ws.onerror = () => append(room, '•', `Error in ${room}`);
  }

  function startHeartbeat(room) {
    // Clear existing heartbeat if any
    if (heartbeatIntervals.has(room)) {
      clearInterval(heartbeatIntervals.get(room));
    }
    
    // Start periodic check for reconnection
    const intervalId = setInterval(() => {
      const ws = sockets.get(room);
      const state = connectionStates.get(room);
      
      // If socket is disconnected and we haven't reconnected recently, try to reconnect
      if ((!ws || ws.readyState !== WebSocket.OPEN) && state?.disconnected) {
        const lastAttempt = reconnectAttempts.get(room) || 0;
        const now = Date.now();
        
        if (now - lastAttempt >= RECONNECT_COOLDOWN) {
          ensureSocket(room, true);
        }
      }
    }, HEARTBEAT_INTERVAL);
    
    heartbeatIntervals.set(room, intervalId);
  }

  function connectCategory(cat) {
    ensureSocket(`${cat}:global`);
    if (mode === 'party' && currentTagSnapshot) ensureSocket(`${cat}:party:${currentTagSnapshot}`);
    renderRoom(activeRoom());
  }

  function updateHeader() {
    labelEl.textContent = mode === 'party' ? `${currentCategory.toUpperCase()} • PARTY • ${currentTagSnapshot || '—'}` : `${currentCategory.toUpperCase()} • GLOBAL`;
    renderRoom(activeRoom());
  }

  function send(text) {
    const r = activeRoom();
    if (!r) return;
    
    const ws = sockets.get(r);
    if (!ws || ws.readyState !== 1) {
      // Reconnect when user tries to send message
      ensureSocket(r, true);
      // Wait a bit for connection, then send
      setTimeout(() => {
        const newWs = sockets.get(r);
        if (newWs && newWs.readyState === 1) {
          newWs.send(JSON.stringify({ type: 'chat', text })); 
          append(r, myName, text);
        }
      }, 100);
    } else {
      ws.send(JSON.stringify({ type: 'chat', text })); 
      append(r, myName, text);
    }
  }

  sendBtn.onclick = () => { const v = inputEl.value.trim(); if (v) send(v); inputEl.value = ''; chatOpen = false; };
  
  function toggleChatHUD() {
    chatVisible = !chatVisible;
    root.style.display = chatVisible ? 'flex' : 'none';
  }
  
  document.addEventListener('keydown', e => {
    const tag = e.target.tagName;
    const isChatInput = e.target === inputEl;
    const typing = isChatInput;
    
    // Get all game control key bindings from settings
    function getGameControlKeys() {
      const keys = [];
      const keyInputs = [
        'macroFeedKey', 'splitKey', 'doubleSplitKey', 'tricksplitKey',
        'switchPlayerkey', 'toggleBackgroundKey', 'toggleChatHUDKey',
        'lineSplitKey', 'startRecordingKey', 'stopRecordingKey'
      ];
      
      keyInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input && input.value) {
          let keyValue = input.value;
          // Convert KeyE -> e, Space -> ' ', ShiftLeft -> Shift, etc.
          if (keyValue.startsWith('Key')) {
            keyValue = keyValue.substring(3).toLowerCase();
          } else if (keyValue === 'Space') {
            keyValue = ' ';
          } else if (keyValue === 'Tab') {
            keyValue = 'Tab';
          } else if (keyValue.startsWith('Shift')) {
            keyValue = 'Shift';
          } else if (keyValue.startsWith('Control')) {
            keyValue = 'Control';
          } else if (keyValue.startsWith('Alt')) {
            keyValue = 'Alt';
          }
          keys.push(keyValue);
        }
      });
      
      return keys;
    }
    
    // Block game control functions when typing in chat input
    if (typing) {
      const gameKeys = getGameControlKeys();
      
      // Check if current key matches any game control
      let currentKey = e.key;
      if (currentKey === ' ') currentKey = ' '; // Keep space as is
      
      if (gameKeys.includes(currentKey) || gameKeys.includes(e.code)) {
        // Stop the event from reaching game handlers, but let input handle it
        e.stopPropagation();
        e.stopImmediatePropagation();
        // Don't preventDefault() so the input can still receive the character
        return false;
      }
    }
    
    // Don't process game keys if focused on other inputs
    if ((tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) && !isChatInput) return;
    
    const toggleKeyInput = document.getElementById('toggleChatHUDKey');
    if (toggleKeyInput && e.code === toggleKeyInput.value) {
      e.preventDefault();
      toggleChatHUD();
      return;
    }
    
    if (e.key === 'Enter') {
      e.preventDefault();
      if (typing) {
        // If typing in chat input, send the message
        sendBtn.onclick();
      } else if (!chatOpen) {
        // If chat is closed, open it and focus
        chatOpen = true;
        inputEl.focus();
      }
    }
  });

  btnGlobal.onclick = () => { 
    mode = 'global'; 
    btnGlobal.classList.add('active'); 
    btnParty.classList.remove('active'); 
    updateHeader(); 
    connectCategory(currentCategory);
  };
  
  btnParty.onclick = () => {
    currentTagSnapshot = currentTag();
    if (!currentTagSnapshot) { append(activeRoom(), '•', 'Enter Tag for Party chat'); return; }
    mode = 'party'; 
    btnParty.classList.add('active'); 
    btnGlobal.classList.remove('active'); 
    updateHeader(); 
    connectCategory(currentCategory);
  };

  setTimeout(() => {
    myName = detectGameNick().slice(0, 24);
    currentTagSnapshot = currentTag();
    updateHeader();
    mode = 'global';
    btnGlobal.classList.add('active');
    btnParty.classList.remove('active');
    connectCategory(currentCategory);

    const tEl = tagEl();
    if (tEl) tEl.addEventListener('input', () => {
      const newTag = currentTag();
      if (mode === 'party' && newTag !== currentTagSnapshot) {
        currentTagSnapshot = newTag;
        updateHeader();
        connectCategory(currentCategory);
      }
    });
  }, 50);

})();
