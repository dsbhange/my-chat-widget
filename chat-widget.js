(function () {
  const config = window.ChatWidgetConfig || {};
  const webhookUrl = config.webhook?.url;
  const route = config.webhook?.route || "general";

  if (!webhookUrl) {
    console.error("ChatWidget: Webhook URL missing");
    return;
  }

  // ---------- State ----------
  let sessionId = Date.now() + "-" + Math.random().toString(36).substring(2);
  let step = "name"; // name → phone → email → chat
  let leadData = {
    name: "",
    phone: "",
    email: ""
  };

  // ---------- UI ----------
  const widget = document.createElement("div");
  widget.innerHTML = `
    <style>
      .cw-btn { position: fixed; bottom: 20px; right: 20px; background: #10b981; color: #fff; padding: 12px 16px; border-radius: 50px; cursor: pointer; }
      .cw-box { position: fixed; bottom: 80px; right: 20px; width: 320px; background: #fff; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,.2); display: none; flex-direction: column; }
      .cw-header { padding: 12px; background: #10b981; color: #fff; font-weight: bold; }
      .cw-messages { padding: 10px; height: 280px; overflow-y: auto; font-size: 14px; }
      .cw-input { display: flex; border-top: 1px solid #ddd; }
      .cw-input input { flex: 1; border: none; padding: 10px; }
      .cw-input button { background: #10b981; color: #fff; border: none; padding: 10px 14px; cursor: pointer; }
      .cw-user { text-align: right; margin: 6px 0; }
      .cw-bot { text-align: left; margin: 6px 0; color: #333; }
    </style>

    <div class="cw-btn">Chat</div>
    <div class="cw-box">
      <div class="cw-header">${config.branding?.name || "Chat Support"}</div>
      <div class="cw-messages"></div>
      <div class="cw-input">
        <input type="text" placeholder="Type here..." />
        <button>Send</button>
      </div>
    </div>
  `;

  document.body.appendChild(widget);

  const btn = widget.querySelector(".cw-btn");
  const box = widget.querySelector(".cw-box");
  const messages = widget.querySelector(".cw-messages");
  const input = widget.querySelector("input");
  const sendBtn = widget.querySelector("button");

  btn.onclick = () => {
    box.style.display = box.style.display === "flex" ? "none" : "flex";
    box.style.flexDirection = "column";
  };

  // ---------- Helpers ----------
  function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = type === "user" ? "cw-user" : "cw-bot";
    div.innerText = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function askNext() {
    if (step === "name") addMessage("Hi! What's your name?", "bot");
    if (step === "phone") addMessage("Please share your phone number 📞", "bot");
    if (step === "email") addMessage("Lastly, your email address 📧", "bot");
  }

  // ---------- Send to Webhook ----------
  async function sendToWebhook(message) {
    const payload = {
      sessionId,
      route,
      message,
      lead: leadData
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data?.reply) addMessage(data.reply, "bot");
  }

  // ---------- Handle Input ----------
  sendBtn.onclick = async () => {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    if (step === "name") {
      leadData.name = text;
      step = "phone";
      askNext();
      return;
    }

    if (step === "phone") {
      leadData.phone = text;
      step = "email";
      askNext();
      return;
    }

    if (step === "email") {
      leadData.email = text;
      step = "chat";
      addMessage("Thank you! How can I help you today?", "bot");
      await sendToWebhook("Lead captured");
      return;
    }

    await sendToWebhook(text);
  };

  // ---------- Start ----------
  askNext();
})();
