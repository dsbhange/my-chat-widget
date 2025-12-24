// Interactive Chat Widget for n8n
(function () {
  if (window.N8nChatWidgetLoaded) return;
  window.N8nChatWidgetLoaded = true;

  const fontElement = document.createElement("link");
  fontElement.rel = "stylesheet";
  fontElement.href =
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap";
  document.head.appendChild(fontElement);

  const widgetStyles = document.createElement("style");
  widgetStyles.textContent = `
    .chat-assist-widget {
      --chat-color-primary: var(--chat-widget-primary, #10b981);
      --chat-color-secondary: var(--chat-widget-secondary, #059669);
      --chat-color-surface: var(--chat-widget-surface, #ffffff);
      --chat-color-text: var(--chat-widget-text, #1f2937);
      font-family: 'Poppins', sans-serif;
    }
    .chat-assist-widget .chat-window {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 380px;
      height: 580px;
      background: var(--chat-color-surface);
      border-radius: 12px;
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 999;
    }
    .chat-assist-widget .chat-window.visible {
      display: flex;
    }
    .chat-assist-widget .chat-header {
      padding: 16px;
      background: linear-gradient(135deg, var(--chat-color-primary), var(--chat-color-secondary));
      color: white;
      font-weight: 600;
      font-size: 16px;
    }
    .chat-assist-widget .chat-body {
      flex: 1;
      display: none;
      flex-direction: column;
    }
    .chat-assist-widget .chat-body.active {
      display: flex;
    }
    .chat-assist-widget .chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background: #f9fafb;
    }
    .chat-assist-widget .chat-controls {
      padding: 12px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 10px;
    }
    .chat-assist-widget .chat-textarea {
      flex: 1;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #ddd;
      resize: none;
    }
    .chat-assist-widget .chat-submit {
      background: linear-gradient(135deg, var(--chat-color-primary), var(--chat-color-secondary));
      color: white;
      border: none;
      border-radius: 8px;
      width: 48px;
      cursor: pointer;
    }
    .chat-assist-widget .chat-launcher {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, var(--chat-color-primary), var(--chat-color-secondary));
      color: white;
      border: none;
      border-radius: 9999px;
      padding: 14px 18px;
      cursor: pointer;
      font-weight: 600;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
      z-index: 999;
    }
    .chat-assist-widget .chat-bubble {
      padding: 12px 14px;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .chat-assist-widget .user-bubble {
      background: var(--chat-color-primary);
      color: white;
      align-self: flex-end;
    }
    .chat-assist-widget .bot-bubble {
      background: white;
      color: var(--chat-color-text);
      align-self: flex-start;
      border: 1px solid #e5e7eb;
    }
    .error-text { color: red; font-size: 12px; margin-top: 4px; }
  `;
  document.head.appendChild(widgetStyles);

  const defaultSettings = {
    webhook: { url: "", route: "" },
    branding: { name: "", welcomeText: "" },
    style: {}
  };

  const settings = window.ChatWidgetConfig
    ? {
        webhook: { ...defaultSettings.webhook, ...window.ChatWidgetConfig.webhook },
        branding: { ...defaultSettings.branding, ...window.ChatWidgetConfig.branding },
        style: { ...defaultSettings.style, ...window.ChatWidgetConfig.style }
      }
    : defaultSettings;

  let conversationId = "";

  const widgetRoot = document.createElement("div");
  widgetRoot.className = "chat-assist-widget";

  const chatWindow = document.createElement("div");
  chatWindow.className = "chat-window";

  chatWindow.innerHTML = `
    <div class="chat-header">${settings.branding.name || "Chat"}</div>

    <div class="chat-body" id="mobileEntry">
      <div style="padding:16px">
        <h3>${settings.branding.welcomeText || "Enter Your Mobile to Start Chat"}</h3>
        <input type="text" id="mobileInput" placeholder="Mobile Number" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;">
        <div class="error-text" id="mobileError"></div>
        <button id="mobileSubmit" style="margin-top:12px;padding:12px 16px;background:#10b981;color:white;border:none;border-radius:8px;width:100%;cursor:pointer;">Continue</button>
      </div>
    </div>

    <div class="chat-body" id="chatBody">
      <div class="chat-messages"></div>
      <div class="chat-controls">
        <textarea class="chat-textarea" placeholder="Type message..."></textarea>
        <button class="chat-submit">Send</button>
      </div>
    </div>
  `;

  const launcher = document.createElement("button");
  launcher.className = "chat-launcher";
  launcher.innerText = "Chat with us";
  widgetRoot.appendChild(chatWindow);
  widgetRoot.appendChild(launcher);
  document.body.appendChild(widgetRoot);

  const mobileInput = chatWindow.querySelector("#mobileInput");
  const mobileError = chatWindow.querySelector("#mobileError");
  const mobileEntry = chatWindow.querySelector("#mobileEntry");
  const chatBody = chatWindow.querySelector("#chatBody");
  const messagesContainer = chatWindow.querySelector(".chat-messages");
  const textArea = chatWindow.querySelector(".chat-textarea");
  const sendBtn = chatWindow.querySelector(".chat-submit");

  launcher.addEventListener("click", () => {
    chatWindow.classList.toggle("visible");
  });

  document.querySelector("#mobileSubmit").addEventListener("click", async () => {
    const mobile = mobileInput.value.trim();
    mobileError.innerText = "";
    if (!mobile) {
      mobileError.innerText = "Please enter mobile number";
      return;
    }

    conversationId = crypto.randomUUID();
    mobileEntry.style.display = "none";
    chatBody.classList.add("active");

    await fetch(settings.webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendMessage",
        sessionId: conversationId,
        route: settings.webhook.route,
        chatInput: `Mobile: ${mobile}`,
        metadata: { mobile }
      })
    });
  });

  sendBtn.addEventListener("click", async () => {
    const text = textArea.value.trim();
    if (!text) return;

    messagesContainer.innerHTML += `<div class="chat-bubble user-bubble">${text}</div>`;
    textArea.value = "";

    const res = await fetch(settings.webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendMessage",
        sessionId: conversationId,
        route: settings.webhook.route,
        chatInput: text
      })
    });
    const data = await res.json();
    messagesContainer.innerHTML += `<div class="chat-bubble bot-bubble">${data.output}</div>`;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
})();
