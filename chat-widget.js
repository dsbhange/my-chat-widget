// Interactive Chat Widget for n8n
(function () {
  if (window.N8nChatWidgetLoaded) return;
  window.N8nChatWidgetLoaded = true;

  /* ================= FONT ================= */
  const font = document.createElement("link");
  font.rel = "stylesheet";
  font.href =
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap";
  document.head.appendChild(font);

  /* ================= STYLES ================= */
  const style = document.createElement("style");
  style.textContent = `
.chat-assist-widget {
  --chat-widget-primary:#10b981;
  --chat-widget-secondary:#059669;
  font-family:Poppins,sans-serif
}
.chat-window{
  position:fixed;
  bottom:90px;
  width:380px;
  height:580px;
  background:#fff;
  border-radius:16px;
  box-shadow:0 10px 25px rgba(0,0,0,.15);
  display:none;
  flex-direction:column;
  overflow:hidden;
  z-index:9999
}
.chat-window.visible{display:flex}
.chat-window.right{right:20px}
.chat-header{
  padding:16px;
  background:linear-gradient(135deg,var(--chat-widget-primary),var(--chat-widget-secondary));
  color:#fff;
  font-weight:600
}
.chat-body{flex:1;display:none;flex-direction:column}
.chat-body.active{display:flex}
.chat-messages{flex:1;padding:16px;overflow-y:auto;background:#f9fafb}
.chat-bubble{padding:12px 14px;border-radius:12px;margin-bottom:10px;max-width:85%}
.user{background:#10b981;color:#fff;margin-left:auto}
.bot{background:#fff;border:1px solid #e5e7eb}
.chat-controls{display:flex;padding:12px;border-top:1px solid #e5e7eb}
.chat-controls textarea{flex:1;padding:10px;border-radius:10px;border:1px solid #ddd}
.chat-controls button{margin-left:8px;background:#10b981;color:#fff;border:none;border-radius:10px;padding:10px 14px;cursor:pointer}
.chat-launcher{
  position:fixed;
  bottom:20px;
  right:20px;
  background:#10b981;
  color:#fff;
  border:none;
  border-radius:999px;
  padding:14px 18px;
  cursor:pointer;
  font-weight:600
}
.form-field{margin-bottom:12px;text-align:left}
.form-input{width:100%;padding:10px;border-radius:8px;border:1px solid #ccc}
.error-text{color:red;font-size:12px}
`;
  document.head.appendChild(style);

  /* ================= CONFIG ================= */
  const config = window.ChatWidgetConfig || {};
  const webhookUrl = config.webhook?.url || "";
  const route = config.webhook?.route || "general";

  /* ================= DOM ================= */
  const root = document.createElement("div");
  root.className = "chat-assist-widget";

  const windowEl = document.createElement("div");
  windowEl.className = "chat-window right";

  windowEl.innerHTML = `
    <div class="chat-header">${config.branding?.name || "Chat"}</div>

    <div class="chat-body" id="registration">
      <div style="padding:16px">
        <h3>${config.branding?.welcomeText || "Start chat"}</h3>

        <div class="form-field">
          <input id="name" class="form-input" placeholder="Name">
          <div class="error-text" id="nameErr"></div>
        </div>

        <div class="form-field">
          <input id="mobile" class="form-input" placeholder="Mobile">
          <div class="error-text" id="mobileErr"></div>
        </div>

        <div class="form-field">
          <input id="email" class="form-input" placeholder="Email">
          <div class="error-text" id="emailErr"></div>
        </div>

        <button id="startChat" class="chat-launcher" style="position:static;width:100%">Start Chat</button>
      </div>
    </div>

    <div class="chat-body" id="chat">
      <div class="chat-messages"></div>
      <div class="chat-controls">
        <textarea id="msg" placeholder="Type message"></textarea>
        <button id="send">Send</button>
      </div>
    </div>
  `;

  const launcher = document.createElement("button");
  launcher.className = "chat-launcher";
  launcher.textContent = "Need help?";

  root.appendChild(windowEl);
  root.appendChild(launcher);
  document.body.appendChild(root);

  /* ================= LOGIC ================= */
  let sessionId = crypto.randomUUID();

  const reg = windowEl.querySelector("#registration");
  const chat = windowEl.querySelector("#chat");
  const msgs = windowEl.querySelector(".chat-messages");

  launcher.onclick = () => windowEl.classList.toggle("visible");

  windowEl.querySelector("#startChat").onclick = async () => {
    const name = windowEl.querySelector("#name").value.trim();
    const mobile = windowEl.querySelector("#mobile").value.trim();
    const email = windowEl.querySelector("#email").value.trim();

    if (!name || !mobile || !email) return;

    reg.classList.remove("active");
    chat.classList.add("active");

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendMessage",
        sessionId,
        route,
        chatInput: `Name: ${name}\nMobile: ${mobile}\nEmail: ${email}`,
        metadata: { name, mobile, email }
      })
    });
  };

  windowEl.querySelector("#send").onclick = async () => {
    const text = windowEl.querySelector("#msg").value.trim();
    if (!text) return;

    msgs.innerHTML += `<div class="chat-bubble user">${text}</div>`;

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendMessage",
        sessionId,
        route,
        chatInput: text
      })
    });

    const data = await res.json();
    msgs.innerHTML += `<div class="chat-bubble bot">${data.output}</div>`;
    windowEl.querySelector("#msg").value = "";
  };
})();
