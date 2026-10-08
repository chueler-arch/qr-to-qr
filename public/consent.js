(function () {
  'use strict';
  const KEY = 'qrtoqr-consent-v1';
  const VERSION = 1;
  const read = () => { try { const value = JSON.parse(localStorage.getItem(KEY) || 'null'); return value?.version === VERSION ? value : null; } catch { return null; } };
  const write = (choices) => { const value = { version: VERSION, analytics: choices.analytics === true, advertising: choices.advertising === true, updatedAt: new Date().toISOString() }; localStorage.setItem(KEY, JSON.stringify(value)); apply(value, 'update'); window.dispatchEvent(new CustomEvent('qrtoqr-consent-change', { detail: value })); return value; };
  function apply(value = read(), command = 'default') {
    const analytics = value?.analytics === true ? 'granted' : 'denied';
    const advertising = value?.advertising === true ? 'granted' : 'denied';
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', command, { analytics_storage: analytics, ad_storage: advertising, ad_user_data: advertising, ad_personalization: advertising, wait_for_update: 500 });
  }
  const english = () => localStorage.getItem('qrtoqr-language') === 'en';
  function bannerText() { return english() ? { title:'Your privacy choices', body:'QRtoQR uses required browser storage for app settings. Optional analytics and advertising technologies remain off unless you allow them.', accept:'Allow optional use', reject:'Reject optional use', settings:'Settings' } : { title:'プライバシー設定', body:'QRtoQRはアプリ設定の保存に必要なブラウザストレージを使用します。アクセス解析・広告などの任意機能は、同意されるまで無効です。', accept:'任意項目を許可', reject:'任意項目を拒否', settings:'設定を確認' }; }
  function addStyles() { if (document.getElementById('qrConsentStyles')) return; const style=document.createElement('style'); style.id='qrConsentStyles'; style.textContent='.qr-consent-banner{position:fixed;z-index:10000;left:16px;right:16px;bottom:16px;max-width:760px;margin:auto;padding:18px;border:1px solid #cad6e5;border-radius:18px;background:#fff;color:#08111f;box-shadow:0 18px 55px rgba(8,17,31,.25);font-family:Inter,"Noto Sans JP",system-ui,sans-serif}.qr-consent-banner strong{display:block;font-size:1rem}.qr-consent-banner p{margin:5px 0 14px;color:#536174;font-size:.82rem;line-height:1.6}.qr-consent-actions{display:flex;flex-wrap:wrap;gap:8px}.qr-consent-actions button,.qr-consent-actions a{min-height:42px;padding:9px 14px;border-radius:999px;border:1px solid #c9d4e2;background:#fff;color:#08111f;font-weight:800;text-decoration:none;cursor:pointer}.qr-consent-actions .primary{border-color:#147fce;background:#147fce;color:#fff}@media(max-width:520px){.qr-consent-banner{left:10px;right:10px;bottom:10px}.qr-consent-actions>*{flex:1 1 100%}}'; document.head.append(style); }
  function showBanner() { if (read() || document.querySelector('.qr-consent-banner')) return; addStyles(); const t=bannerText(); const box=document.createElement('aside'); box.className='qr-consent-banner'; box.setAttribute('role','dialog'); box.setAttribute('aria-label',t.title); box.innerHTML=`<strong>${t.title}</strong><p>${t.body}</p><div class="qr-consent-actions"><button class="primary" data-consent="accept" type="button">${t.accept}</button><button data-consent="reject" type="button">${t.reject}</button><a href="privacy-settings.html">${t.settings}</a></div>`; box.addEventListener('click',(event)=>{ const choice=event.target?.dataset?.consent; if (!choice) return; write({ analytics: choice === 'accept', advertising: choice === 'accept' }); box.remove(); }); document.body.append(box); }
  apply();
  document.addEventListener('DOMContentLoaded', showBanner);
  document.addEventListener('qrtoqr-language-change', () => { const banner=document.querySelector('.qr-consent-banner'); if (banner) { banner.remove(); showBanner(); } });
  window.QRtoQRConsent = { read, save: write, showBanner, clear: () => localStorage.removeItem(KEY), key: KEY };
}());
