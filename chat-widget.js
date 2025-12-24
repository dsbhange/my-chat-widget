/**
 * ============================================================
 * CHAT WIDGET – ENTERPRISE VERSION
 * ============================================================
 * File Name : chat-widget.js
 * Author    : Your Company
 * Purpose   : Website Chat Widget with Lead Capture
 * Version   : 1.0.0
 * ============================================================
 *
 * FEATURES
 * ------------------------------------------------------------
 * ✓ Floating Chat Button
 * ✓ Expandable Chat Window
 * ✓ Name / Phone / Email Capture
 * ✓ Input Validation
 * ✓ Session Management
 * ✓ Webhook (n8n compatible)
 * ✓ Error Handling
 * ✓ Debug Mode
 * ✓ Styling via Config
 * ✓ Pure JavaScript (No libraries)
 *
 * ============================================================
 */

(function () {
  "use strict";

  /* ============================================================
     SECTION 1: GLOBAL CONFIG & SAFETY CHECKS
     ============================================================ */

  if (!window) {
    console.error("ChatWidget: window object not found");
    return;
  }

  const DEFAULT_CONFIG = {
    webhook: {
      url: "",
      route: "general",
      timeout: 10000
    },
    branding: {
      name: "Chat Support",
      welcomeText: "Welcome! 👋",
      primaryColor: "#10b981"
    },
    position: "right",
    debug: false
  };

  const USER_CONFIG = window.ChatWidgetConfig || {};
  const CONFIG = deepMerge(DEFAULT_CONFIG, USER_CONFIG);

  if (!CONFIG.webhook.url) {
    console.error("ChatWidget Error: webhook.url missing");
    return;
  }

  /* ============================================================
     SECTION 2: UTILITIES
     ============================================================ */

  function deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (isObject(source[key])) {
          if (!(key in target)) Object.assign(output, { [key]: source[key] });
          else output[key] = deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  function isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
  }

  function logDebug() {
    if (CONFIG.debug) {
      console.log.apply(console, arguments);
    }
  }

  function generateSessionId() {
    return (
      "cw-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 10)
    );
  }

  function sanitizeInput(str) {
    return str.replace(/[<>]/g, "");
  }

  function validatePhone(phone) {
    return /^[6-9]\d{9}$/.test(phone);
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ============================================================
     SECTION 3: STATE MANAGEMENT
     ============================================================ */

  const STATE = {
    sessionId: generateSessionId(),
    step: "name", // name → phone → email → chat
    lead: {
      name: "",
      phone: "",
      email: ""
    },
    messages: [],
    isOpen: false
  };

  logDebug("Session ID:", STATE.sessionId);

  /* ============================================================
     SECTION 4: DOM CREATION
     ============================================================ */

  const root = document.createElement("div");
  root.id = "cw-root";

  const styles = `
    #cw-root * { box-sizing: border-box; font-family: Arial, sans-serif; }

    #cw-launcher {
      position: fixed;
      bottom: 20px;
      ${CONFIG.position === "left" ? "left:20px;" : "right:20px;"}
      background: ${CONFIG.branding.primaryColor};
      color: #fff;
      padding: 12px 18px;
      border-radius: 30px;
      cursor: pointer;
      z-index: 9999;
    }

    #cw-box {
      position: fixed;
      bottom: 80px;
      ${CONFIG.position === "left" ? "left:20px;" : "right:20px;"}
      width: 340px;
      height: 420px;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 15px 40px rgba(0,0,0,.2);
      display: none;
      flex-direction: column;
      z-index: 9999;
    }

    #cw-header {
      padding: 14px;
      background: ${CONFIG.branding.primaryColor};
      color: #fff;
      font-weight: bold;
      border-radius: 14px 14px 0 0;
    }

    #cw-messages {
      flex: 1;
      padding: 12px;
      overflow-y: auto;
      font-size: 14px;
    }

    .cw-bot {
      margin-bottom: 8px;
      color: #333;
    }

    .cw-user {
      margin-bottom: 8px;
      text-align: right;
      color: #000;
    }

    #cw-input {
      display: flex;
      border-top: 1px solid #eee;
    }

    #cw-input input {
      flex: 1;
      border: none;
      padding: 12px;
      outline: none;
    }

    #cw-input button {
      background: ${CONFIG.branding.primaryColor};
      color: #fff;
      border: none;
      padding: 12px 16px;
      cursor: pointer;
    }
  `;

  root.innerHTML = `
    <style>${styles}</style>
    <div id="cw-launcher">Chat</div>
    <div id="cw-box">
      <div id="cw-header">${CONFIG.branding.name}</div>
      <div id="cw-messages"></div>
      <div id="cw-input">
        <input type="text" placeholder="Type here..." />
        <button>Send</button>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  /* ============================================================
     SECTION 5: ELEMENT REFERENCES
     ============================================================ */

  const launcher = document.getElementById("cw-launcher");
  const box = document.getElementById("cw-box");
  const messagesEl = document.getElementById("cw-messages");
  const inputEl = box.querySelector("input");
  const sendBtn = box.querySelector("button");

  /* ============================================================
     SECTION 6: UI FUNCTIONS
     ============================================================ */

  function toggleChat() {
    STATE.isOpen = !STATE.isOpen;
    box.style.display = STATE.isOpen ? "flex" : "none";
  }

  function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = type === "user" ? "cw-user" : "cw-bot";
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    STATE.messages.push({ type, text, ts: Date.now() });
  }

  function askNextQuestion() {
    if (STATE.step === "name") {
      addMessage("Hi 👋 What's your name?", "bot");
    } else if (STATE.step === "phone") {
      addMessage("Please enter your 10-digit mobile number 📞", "bot");
    } else if (STATE.step === "email") {
      addMessage("Your email address 📧", "bot");
    }
  }

  /* ============================================================
     SECTION 7: WEBHOOK COMMUNICATION
     ============================================================ */

  async function sendToWebhook(message) {
    const payload = {
      sessionId: STATE.sessionId,
      route: CONFIG.webhook.route,
      message,
      lead: STATE.lead,
      history: STATE.messages
    };

    logDebug("Sending payload:", payload);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        CONFIG.webhook.timeout
      );

      const response = await fetch(CONFIG.webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      const data = await response.json();
      if (data && data.reply) {
        addMessage(data.reply, "bot");
      }
    } catch (err) {
      console.error("ChatWidget Webhook Error:", err);
      addMessage("⚠️ Something went wrong. Please try again.", "bot");
    }
  }

  /* ============================================================
     SECTION 8: INPUT HANDLING
     ============================================================ */

  function handleSend() {
    const raw = inputEl.value.trim();
    if (!raw) return;

    const text = sanitizeInput(raw);
    inputEl.value = "";
    addMessage(text, "user");

    if (STATE.step === "name") {
      STATE.lead.name = text;
      STATE.step = "phone";
      askNextQuestion();
      return;
    }

    if (STATE.step === "phone") {
      if (!validatePhone(text)) {
        addMessage("❌ Please enter a valid Indian mobile number.", "bot");
        return;
      }
      STATE.lead.phone = text;
      STATE.step = "email";
      askNextQuestion();
      return;
    }

    if (STATE.step === "email") {
      if (!validateEmail(text)) {
        addMessage("❌ Please enter a valid email address.", "bot");
        return;
      }
      STATE.lead.email = text;
      STATE.step = "chat";
      addMessage("✅ Thanks! How can I help you today?", "bot");
      sendToWebhook("Lead Captured");
      return;
    }

    sendToWebhook(text);
  }

  /* ============================================================
     SECTION 9: EVENTS
     ============================================================ */

  launcher.addEventListener("click", toggleChat);
  sendBtn.addEventListener("click", handleSend);
  inputEl.addEventListener("keypress", function (e) {
    if (e.key === "Enter") handleSend();
  });

  /* ============================================================
     SECTION 10: INIT
     ============================================================ */

  addMessage(CONFIG.branding.welcomeText, "bot");
  askNextQuestion();

})();
