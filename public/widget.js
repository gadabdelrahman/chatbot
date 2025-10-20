// public/widget.js
(function () {
  if (window.__chatbotLoaded) return;
  window.__chatbotLoaded = true;

  // derive backend base URL from this script's URL
  // if script is loaded from https://chatbot-ijwu.onrender.com/widget.js
  // baseUrl becomes https://chatbot-ijwu.onrender.com
  const thisScript = document.currentScript || (function(){
    // fallback: find last script tag with widget.js
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('widget.js') !== -1) return scripts[i];
    }
    return null;
  })();
  const scriptSrc = thisScript && thisScript.src ? thisScript.src : '';
  //const baseUrl = scriptSrc ? scriptSrc.replace(/\/widget\.js(\?.*)?$/,'') : '';

  // If baseUrl couldn't be resolved, you can set it manually here:
  const baseUrl = 'https://chatbot-ijwu.onrender.com';

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

  // Create iframe to load the chat UI
  const iframe = document.createElement('iframe');
  // default path to chat page — relative to backend base
  iframe.src = (baseUrl || '') + '/chat';
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

  // Accessibility: allow opening in new tab small link (optional)
  const openInTab = document.createElement('a');
  openInTab.href = iframe.src;
  openInTab.target = '_blank';
  openInTab.style.display = 'none';
  openInTab.textContent = 'Open chat';

  // Toggle behavior
  let visible = false;
  function show() {
    iframe.style.display = 'block';
    iframe.style.opacity = '1';
    visible = true;
  }
  function hide() {
    iframe.style.display = 'none';
    visible = false;
  }
  button.addEventListener('click', () => visible ? hide() : show());

  // Append to document
  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(button);
    document.body.appendChild(iframe);
    document.body.appendChild(openInTab);
  });

  // Auto-open welcome once per session (optional)
  try {
    const seen = sessionStorage.getItem('chatbot_seen_v1');
    if (!seen) {
      sessionStorage.setItem('chatbot_seen_v1', '1');
      // delay so it doesn't feel jarring
      setTimeout(() => { if (!visible) show(); }, 1200);
    }
  } catch (e) { /* ignore sessionStorage errors */ }

})();
