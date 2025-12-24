// Interactive Chat Widget for n8n (WORKING + PHONE ADDED)
(function () {
  if (window.N8nChatWidgetLoaded) return;
  window.N8nChatWidgetLoaded = true;

  /* -------------------- FONT -------------------- */
  const font = document.createElement("link");
  font.rel = "stylesheet";
  font.href =
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap";
  document.head.appendChild(font);

  /* -------------------- STYLES -------------------- */
  const style = document.createElement("style");
  style.textContent = `
.chat-assist-widget { font-family: 'Poppins', sans-serif; }

.chat-window {
  position: fixed;
  bottom: 90px;
  width: 380px;
  height: 580px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 15px rgba(0,0,0,.15);
  display: none;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
}

.chat-window.visible { display: flex; }

.chat-window.right { right: 20px; }
.chat-window.left { left: 20px; }

.chat-header {
  background: #10b981;
  color: #fff;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header button {
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
}

.chat-welcome,
.user-registration {
  padding: 24px;
  text-align: center;
}

.chat-welcome h2 {
  font-size: 20px;
  margin-bottom: 20px;
}

.chat-start-btn {
  width: 100%;
  padding: 12px;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
}

.user-registration { display: none; }
.user-registration.active { display: block; }

.form-field { margin-bottom: 12px; text-align: left; }
.form-field label { font-size: 13px; }
.form-field input {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
}
.form-field input.error { border-color: red; }
.error-text { color: red; font-size: 12px; }

.chat-body { display: none; flex-direction: column; height: 100%; }
.chat-body.active { display: flex; }

.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #f9fafb;
}

.chat-bubble {
  max-width: 80%;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 12px;
  font-size: 14px;
}

.user { background: #10b981; color: #fff; margin-left: auto; }
.bot { background: #fff; border: 1px solid #eee; }

.chat-controls {
  padding: 12px;
  display: flex;
  gap: 8px;
  border-top: 1px solid #eee;
}

.chat-controls textarea {
  flex: 1;
  resize: none;
  border-radius: 8px;
  padding: 10px;
}

.chat-controls button {
  width: 44px;
  background: #10b981;
  border: none;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
}

.chat-launcher {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 12px 18px;
  cursor: pointer;
  font-weight: 600;
}
`;
  document.head.appendChild(style);

  /* -------------------- CONFIG -------------------- */
  const cfg = window.ChatWidgetConfig || {};
  const webhookUrl = cfg.webhook?.url || "YOUR_N8N_WEBHOOK_URL";
  const route = cfg.webhook?.route || "general";

  /* -------------------- DOM -------------------- */
  const root = document.createElement("div");
  root.className = "chat-assist-widget";

  const chat = document.createElement("div");
  chat.className = "chat-window right";

  chat.innerHTML = `
<div class="chat-header">
  <span>Chat</span>
  <button id="closeChat">×</button>
</div>

<div class="chat-welcome">
  <h2>How can we help you?</h2>
  <button class="chat-start-btn">Start chatting</button>
</div>

<div class="user-registration">
  <form>
    <div class="form-field">
      <label>Name</label>
      <input id="name" />
      <div class="error-text" id="nameErr"></div>
    </div>
    <div class="form-field">
      <label>Email</label>
      <input id="email" />
      <div class="error-text" id="emailErr"></div>
    </div>
    <div class="form-field">
      <label>Phone</label>
      <input id="phone" />
      <div class="error-text" id="phoneErr"></div>
    </div>
    <button class="chat-start-btn">Continue</button>
  </form>
</div>

<div class="chat-body">
  <div class="chat-messages"></div>
  <div class="chat-controls">
    <textarea rows="1"></textarea>
    <button>➤</button>
  </div>
</div>
`;

  const launcher = document.createElement("button");
  launcher.className = "chat-launcher";
  launcher.textContent = "Need help?";

  root.appendChild(chat);
  root.appendChild(launcher);
  document.body.appendChild(root);

  /* -------------------- STATE -------------------- */
  let sessionId = null;
  let waiting = false;

  /* -------------------- HELPERS -------------------- */
  const $ = (s) => chat.querySelector(s);
  const messages = $(".chat-messages");

  function uuid() {
    return "sess-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  }

  function bubble(text, cls) {
    const d = document.createElement("div");
    d.className = `chat-bubble ${cls}`;
    d.textContent = text;
    messages.appendChild(d);
    messages.scrollTop = messages.scrollHeight;
  }

  /* -------------------- EVENTS -------------------- */
  launcher.onclick = () => chat.classList.add("visible");
  $("#closeChat").onclick = () => chat.classList.remove("visible");

  $(".chat-start-btn").onclick = () => {
    $(".chat-welcome").style.display = "none";
    $(".user-registration").classList.add("active");
  };

  $(".user-registration form").onsubmit = async (e) => {
    e.preventDefault();

    const name = $("#name").value.trim();
    const email = $("#email").value.trim();
    const phone = $("#phone").value.trim();

    $("#nameErr").textContent = "";
    $("#emailErr").textContent = "";
    $("#phoneErr").textContent = "";

    if (!name) return ($("#nameErr").textContent = "Required");
    if (!email) return ($("#emailErr").textContent = "Required");
    if (!/^[6-9]\d{9}$/.test(phone))
      return ($("#phoneErr").textContent = "Invalid phone");

    sessionId = uuid();

    $(".user-registration").classList.remove("active");
    $(".chat-body").classList.add("active");

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendMessage",
        sessionId,
        route,
        chatInput: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}`,
        metadata: { name, email, phone },
      }),
    });
  };

  $(".chat-controls button").onclick = async () => {
    if (waiting) return;
    const input = $(".chat-controls textarea");
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    bubble(text, "user");

    waiting = true;

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendMessage",
        sessionId,
        route,
        chatInput: text,
      }),
    });

    const data = await res.json();
    bubble(data.output || "OK", "bot");
    waiting = false;
  };
})();
