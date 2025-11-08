// public/widget.js
(function () {
  // Prevent multiple initializations
  if (window.__chatbotLoaded) return;
  window.__chatbotLoaded = true;

  const baseUrl = 'https://chatbot-ijwu.onrender.com';

  function createWidget() {
    // Only create button if it doesn't exist
    if (!document.getElementById('chat-toggle')) {
      // Create floating button
      const button = document.createElement('button');
      button.id = 'chat-toggle';
      button.innerText = '💬';
      Object.assign(button.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '64px',
        height: '64px',
        background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
        border: 'none',
        borderRadius: '50%',
        color: 'white',
        fontSize: '28px',
        cursor: 'pointer',
        boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
        zIndex: '99999',
        transition: 'transform .2s ease',
      });
      button.addEventListener('mouseenter', () => button.style.transform = 'scale(1.05)');
      button.addEventListener('mouseleave', () => button.style.transform = 'scale(1)');

      // Create iframe for chat UI
      if (!document.getElementById('chat-iframe')) {
        const iframe = document.createElement('iframe');
        iframe.id = 'chat-iframe';
        iframe.src = baseUrl + '/chat?hideToggle=true'; // prevent iframe toggle
        Object.assign(iframe.style, {
          position: 'fixed',
          bottom: '100px',
          right: '24px',
          width: '420px',
          height: '600px',
          border: 'none',
          borderRadius: '20px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
          display: 'none',
          zIndex: '99998',
          transition: 'opacity .2s ease, transform .2s ease',
          background: 'transparent',
        });
        document.body.appendChild(iframe);

        // Accessibility: optional link to open chat in new tab
        if (!document.getElementById('chat-open-tab')) {
          const openInTab = document.createElement('a');
          openInTab.id = 'chat-open-tab';
          openInTab.href = iframe.src;
          openInTab.target = '_blank';
          openInTab.style.display = 'none';
          openInTab.textContent = 'Open chat';
          document.body.appendChild(openInTab);
        }

        // Toggle behavior
        let visible = false;
        function show() { iframe.style.display = 'block'; visible = true; }
        function hide() { iframe.style.display = 'none'; visible = false; }
        button.addEventListener('click', () => visible ? hide() : show());

        // Auto-open welcome once per session (optional)
        try {
          const seen = sessionStorage.getItem('chatbot_seen_v1');
          if (!seen) {
            sessionStorage.setItem('chatbot_seen_v1', '1');
            setTimeout(() => { if (!visible) show(); }, 1200);
          }
        } catch (e) { /* ignore sessionStorage errors */ }
      }

      document.body.appendChild(button);
    }
  }

  // Run immediately if DOM loaded, otherwise wait for DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

})();
