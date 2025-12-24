// Interactive Chat Widget for n8n (Phone Mandatory)
(function () {
    if (window.N8nChatWidgetLoaded) return;
    window.N8nChatWidgetLoaded = true;

    /* ---------------- FONT ---------------- */
    const fontElement = document.createElement('link');
    fontElement.rel = 'stylesheet';
    fontElement.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
    document.head.appendChild(fontElement);

    /* ---------------- STYLES ---------------- */
    const widgetStyles = document.createElement('style');
    widgetStyles.textContent = `
    .chat-assist-widget { font-family: 'Poppins', sans-serif; }
    .chat-window { position: fixed; bottom: 90px; right: 20px; width: 380px; height: 580px;
        background: #fff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,.2);
        display: none; flex-direction: column; overflow: hidden; z-index: 9999; }
    .chat-window.visible { display: flex; }
    .chat-header { padding: 16px; background: linear-gradient(135deg,#10b981,#059669);
        color: #fff; font-weight: 600; display:flex; justify-content:space-between; align-items:center; }
    .chat-close-btn { background:none;border:none;color:#fff;font-size:22px;cursor:pointer; }
    .chat-welcome, .user-registration { padding: 24px; text-align: center; }
    .chat-start-btn, .submit-registration {
        width:100%; padding:14px; border:none; border-radius:12px;
        background:linear-gradient(135deg,#10b981,#059669); color:#fff;
        font-weight:600; cursor:pointer;
    }
    .registration-form { display:flex; flex-direction:column; gap:12px; }
    .form-field { text-align:left; }
    .form-label { font-size:14px; font-weight:500; }
    .form-input { width:100%; padding:12px; border-radius:10px; border:1px solid #e5e7eb; }
    .form-input.error { border-color:#ef4444; }
    .error-text { font-size:12px; color:#ef4444; }
    .chat-body { display:none; flex-direction:column; height:100%; }
    .chat-body.active { display:flex; }
    .chat-messages { flex:1; padding:16px; overflow-y:auto; background:#f9fafb; }
    .chat-bubble { padding:12px 16px; border-radius:14px; max-width:80%; margin-bottom:10px; }
    .user-bubble { background:#10b981; color:#fff; align-self:flex-end; }
    .bot-bubble { background:#fff; border:1px solid #e5e7eb; }
    .chat-controls { display:flex; padding:12px; gap:10px; border-top:1px solid #eee; }
    .chat-textarea { flex:1; resize:none; padding:12px; border-radius:10px; border:1px solid #ddd; }
    .chat-submit { width:48px; border:none; border-radius:10px;
        background:linear-gradient(135deg,#10b981,#059669); color:#fff; cursor:pointer; }
    .chat-launcher {
        position:fixed; bottom:20px; right:20px;
        padding:14px 18px; border-radius:999px;
        background:linear-gradient(135deg,#10b981,#059669);
        color:#fff; border:none; cursor:pointer; font-weight:600;
    }
    `;
    document.head.appendChild(widgetStyles);

    /* ---------------- SETTINGS ---------------- */
    const settings = window.ChatWidgetConfig || {};
    if (!settings.webhook || !settings.webhook.url) {
        console.error("Webhook URL missing");
        return;
    }

    /* ---------------- DOM ---------------- */
    const widgetRoot = document.createElement('div');
    widgetRoot.className = 'chat-assist-widget';

    widgetRoot.innerHTML = `
    <div class="chat-window">
        <div class="chat-header">
            <span>${settings.branding?.name || 'Chat Support'}</span>
            <button class="chat-close-btn">×</button>
        </div>

        <div class="chat-welcome">
            <h2>${settings.branding?.welcomeText || 'Welcome 👋'}</h2>
            <button class="chat-start-btn">Start Chat</button>
        </div>

        <div class="user-registration">
            <h3>Please enter your details</h3>
            <form class="registration-form">
                <div class="form-field">
                    <label class="form-label">Name</label>
                    <input class="form-input" id="chat-name">
                    <div class="error-text" id="name-error"></div>
                </div>

                <div class="form-field">
                    <label class="form-label">Phone</label>
                    <input class="form-input" id="chat-phone">
                    <div class="error-text" id="phone-error"></div>
                </div>

                <div class="form-field">
                    <label class="form-label">Email</label>
                    <input class="form-input" id="chat-email">
                    <div class="error-text" id="email-error"></div>
                </div>

                <button class="submit-registration">Continue</button>
            </form>
        </div>

        <div class="chat-body">
            <div class="chat-messages"></div>
            <div class="chat-controls">
                <textarea class="chat-textarea" rows="1" placeholder="Type message..."></textarea>
                <button class="chat-submit">➤</button>
            </div>
        </div>
    </div>

    <button class="chat-launcher">Need help?</button>
    `;

    document.body.appendChild(widgetRoot);

    /* ---------------- ELEMENTS ---------------- */
    const chatWindow = widgetRoot.querySelector('.chat-window');
    const launcher = widgetRoot.querySelector('.chat-launcher');
    const closeBtn = widgetRoot.querySelector('.chat-close-btn');
    const startBtn = widgetRoot.querySelector('.chat-start-btn');
    const welcome = widgetRoot.querySelector('.chat-welcome');
    const registration = widgetRoot.querySelector('.user-registration');
    const chatBody = widgetRoot.querySelector('.chat-body');
    const messages = widgetRoot.querySelector('.chat-messages');
    const textarea = widgetRoot.querySelector('.chat-textarea');
    const sendBtn = widgetRoot.querySelector('.chat-submit');

    const nameInput = widgetRoot.querySelector('#chat-name');
    const phoneInput = widgetRoot.querySelector('#chat-phone');
    const emailInput = widgetRoot.querySelector('#chat-email');
    const nameError = widgetRoot.querySelector('#name-error');
    const phoneError = widgetRoot.querySelector('#phone-error');
    const emailError = widgetRoot.querySelector('#email-error');
    const form = widgetRoot.querySelector('.registration-form');

    /* ---------------- HELPERS ---------------- */
    const sessionId = crypto.randomUUID();
    const isValidPhone = p => /^[6-9]\d{9}$/.test(p);
    const isValidEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    function addMessage(text, type) {
        const div = document.createElement('div');
        div.className = `chat-bubble ${type === 'user' ? 'user-bubble' : 'bot-bubble'}`;
        div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    async function sendToWebhook(text, meta) {
        const res = await fetch(settings.webhook.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: "sendMessage",
                sessionId,
                route: settings.webhook.route,
                chatInput: text,
                metadata: meta
            })
        });
        const data = await res.json();
        addMessage(data.output || 'Thanks for your message!', 'bot');
    }

    /* ---------------- EVENTS ---------------- */
    launcher.onclick = () => chatWindow.classList.add('visible');
    closeBtn.onclick = () => chatWindow.classList.remove('visible');

    startBtn.onclick = () => {
        welcome.style.display = 'none';
        registration.style.display = 'block';
    };

    form.onsubmit = async e => {
        e.preventDefault();

        nameError.textContent = phoneError.textContent = emailError.textContent = '';
        nameInput.classList.remove('error');
        phoneInput.classList.remove('error');
        emailInput.classList.remove('error');

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();

        let ok = true;

        if (!name) { nameError.textContent = "Name required"; nameInput.classList.add('error'); ok = false; }
        if (!phone || !isValidPhone(phone)) { phoneError.textContent = "Valid phone required"; phoneInput.classList.add('error'); ok = false; }
        if (!email || !isValidEmail(email)) { emailError.textContent = "Valid email required"; emailInput.classList.add('error'); ok = false; }

        if (!ok) return;

        registration.style.display = 'none';
        chatBody.classList.add('active');

        addMessage(`Name: ${name}\nPhone: ${phone}\nEmail: ${email}`, 'user');

        await sendToWebhook("User registered", { name, phone, email });
    };

    sendBtn.onclick = async () => {
        const text = textarea.value.trim();
        if (!text) return;
        textarea.value = '';
        addMessage(text, 'user');
        await sendToWebhook(text, {
            name: nameInput.value,
            phone: phoneInput.value,
            email: emailInput.value
        });
    };

})();
