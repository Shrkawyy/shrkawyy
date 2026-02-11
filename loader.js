// /public/loader.js — ZynX loading screen with disabled key system
(async function () {
  if (window.__OVERLAY_LOADED__) return;
  window.__OVERLAY_LOADED__ = true;

  /* ===================== WAIT BODY ===================== */
  async function waitForBody() {
    if (document.body) return;
    if (document.readyState === "loading") {
      await new Promise(r =>
        document.addEventListener("DOMContentLoaded", r, { once: true })
      );
    }
    while (!document.body) {
      await new Promise(r => setTimeout(r, 10));
    }
  }
  await waitForBody();

  /* ===================== HARD BLOCK ===================== */
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";

  /* ===================== OPTIMIZED ZYNX LOADING SCREEN ===================== */
  const overlay = document.createElement("div");
  // Use class instead of inline styles for better performance
  overlay.className = "zynx-loading-overlay";
  
  // Create CSS once and inject
  const style = document.createElement('style');
  style.textContent = `
    .zynx-loading-overlay {
      position: fixed;
      inset: 0;
      background: #000;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Arial', sans-serif;
    }
    
    .zynx-loading-content {
      text-align: center;
      color: #fff;
      animation: fadeIn 0.8s ease-in;
    }
    
    .zynx-loading-title {
      font-size: 4rem;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 1rem;
      letter-spacing: 3px;
    }
    
    .zynx-loading-subtitle {
      font-size: 1.2rem;
      color: #888;
      margin-bottom: 2rem;
      font-weight: 300;
    }
    
    .zynx-loading-bar {
      width: 200px;
      height: 4px;
      background: #333;
      border-radius: 2px;
      margin: 0 auto;
      overflow: hidden;
    }
    
    .zynx-loading-progress {
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, #fff, transparent);
      animation: loading 1.5s linear infinite;
    }
    
    .zynx-loading-text {
      margin-top: 1rem;
      font-size: 0.9rem;
      color: #666;
      animation: pulse 1.5s ease-in-out infinite;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes loading {
      from { transform: translateX(-100%); }
      to { transform: translateX(100%); }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    
    /* Performance optimization */
    @media (prefers-reduced-motion: reduce) {
      .zynx-loading-content,
      .zynx-loading-progress,
      .zynx-loading-text {
        animation: none;
      }
    }
  `;
  
  // Inject styles first
  document.head.appendChild(style);
  
  // Create content with classes
  overlay.innerHTML = `
    <div class="zynx-loading-content">
      <div class="zynx-loading-title">ProtonX</div>
      <div class="zynx-loading-subtitle">Private</div>
      <div class="zynx-loading-bar">
        <div class="zynx-loading-progress"></div>
      </div>
      <div class="zynx-loading-text">Loading...</div>
    </div>
  `;

  document.body.appendChild(overlay);

  /* ===================== SIMULATE LOADING ===================== */
  setTimeout(() => {
    overlay.remove();
    unlock();
    loadClient();
  }, 5000);

  /* ===================== UNLOCK ===================== */
  function unlock() {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }

  /* ===================== CUSTOM NOTIFICATION SYSTEM ===================== */
  class ZynXNotification {
    constructor() {
      this.container = null;
      this.init();
    }

    init() {
      // Create notification container
      this.container = document.createElement('div');
      this.container.id = 'zynx-notifications';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 999999;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);

      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .zynx-notification {
          background: linear-gradient(135deg, #0a0a0a, #1a1a1a);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-left: 4px solid #4a9eff;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 10px;
          min-width: 280px;
          max-width: 350px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          font-family: 'Segoe UI', system-ui, sans-serif;
          color: #ffffff;
          opacity: 0;
          transform: translateX(-100%);
          transition: all 0.3s ease;
          pointer-events: auto;
        }

        .zynx-notification.show {
          opacity: 1;
          transform: translateX(0);
        }

        .zynx-notification.success {
          border-left-color: #51cf66;
        }

        .zynx-notification.warning {
          border-left-color: #ffd43b;
        }

        .zynx-notification.error {
          border-left-color: #ff6b6b;
        }

        .zynx-notification-title {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
          color: #ffffff;
        }

        .zynx-notification-message {
          font-size: 13px;
          color: #e0e0e0;
          line-height: 1.4;
        }

        .zynx-notification-close {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 16px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .zynx-notification-close:hover {
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.1);
        }
      `;
      document.head.appendChild(style);
    }

    show(message, type = 'info', title = null, duration = 5000) {
      const notification = document.createElement('div');
      notification.className = `zynx-notification ${type}`;
      
      notification.innerHTML = `
        ${title ? `<div class="zynx-notification-title">${title}</div>` : ''}
        <div class="zynx-notification-message">${message}</div>
        <button class="zynx-notification-close">×</button>
      `;

      this.container.appendChild(notification);

      // Trigger animation
      setTimeout(() => notification.classList.add('show'), 10);

      // Close button functionality
      const closeBtn = notification.querySelector('.zynx-notification-close');
      closeBtn.addEventListener('click', () => this.remove(notification));

      // Auto remove
      if (duration > 0) {
        setTimeout(() => this.remove(notification), duration);
      }

      return notification;
    }

    remove(notification) {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }

    info(message, title = null, duration = 5000) {
      return this.show(message, 'info', title, duration);
    }

    success(message, title = null, duration = 5000) {
      return this.show(message, 'success', title, duration);
    }

    warning(message, title = null, duration = 5000) {
      return this.show(message, 'warning', title, duration);
    }

    error(message, title = null, duration = 5000) {
      return this.show(message, 'error', title, duration);
    }
  }

  // Create global notification instance
  window.zynxNotification = new ZynXNotification();

  /* ===================== CLIENT LOADER ===================== */
  async function loadClient() {
    const thirdPartyJS = [
      "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js",
      "https://unpkg.com/gifler@latest/gifler.min.js"
    ];
    const thirdPartyCSS = [
    ];
    const bundles = [
      ["./assets/js/main.bundle.js", "/assets/js/main.bundle.js"],
      ["./assets/js/chat.js", "/assets/js/chat.js"]
    ];

    function css(h) {
      return new Promise(r => {
        const l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = h;
        l.onload = r;
        document.head.appendChild(l);
      });
    }

    function js(s) {
      return new Promise(r => {
        const e = document.createElement("script");
        e.src = s;
        e.async = false;
        e.onload = () => r(true);
        e.onerror = () => r(false);
        document.head.appendChild(e);
      });
    }

    async function tryPair(p) {
      for (const s of p) if (await js(s)) return;
    }

    for (const c of thirdPartyCSS) await css(c);
    for (const j of thirdPartyJS) await js(j);
    for (const b of bundles) await tryPair(b);

    document.dispatchEvent(new Event("DOMContentLoaded"));
    window.dispatchEvent(new Event("load"));
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }

  /* ===================== PERSISTENT STATUS OVERLAY ===================== */
  function showKeyStatusOverlay(keyInfo) {
    const box = document.createElement("div");
    box.id = "__key_status_overlay";
    box.style = `
      position:fixed;
      bottom:10px;
      right:10px;
      background:rgba(0,0,0,0.7);
      color:#fff;
      font-size:12px;
      padding:8px 12px;
      border-radius:6px;
      z-index:999999;
      font-family:monospace;
      pointer-events:none;
    `;
    document.body.appendChild(box);

    function update() {
      const now = new Date();
      const exp = keyInfo.expires ? new Date(keyInfo.expires) : null;
      const remaining = exp ? Math.max(0, exp - Date.now()) : null;
      const timeStr = now.toLocaleTimeString();
      const expStr = exp ? `${exp.toLocaleString()} (${Math.ceil(remaining / 1000)}s left)` : "Never";
      box.textContent = `Time: ${timeStr} | Key Type: ${keyInfo.type} | Expires: ${expStr} | Uses: ${keyInfo.uses}`;
    }

    update();
    setInterval(update, 1000);
  }
})();
