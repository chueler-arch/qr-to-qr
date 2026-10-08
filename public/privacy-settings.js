(function () {
  'use strict';
  const analytics = document.getElementById('analyticsConsent');
  const advertising = document.getElementById('advertisingConsent');
  const status = document.getElementById('consentStatus');
  const english = () => localStorage.getItem('qrtoqr-language') === 'en';
  function load() { const saved=window.QRtoQRConsent.read(); analytics.checked=saved?.analytics === true; advertising.checked=saved?.advertising === true; }
  function message(ja,en) { status.textContent=english()?en:ja; }
  document.getElementById('saveConsentBtn').addEventListener('click',()=>{ window.QRtoQRConsent.save({ analytics:analytics.checked, advertising:advertising.checked }); message('選択内容を保存しました。','Your choices have been saved.'); });
  document.getElementById('rejectConsentBtn').addEventListener('click',()=>{ analytics.checked=false; advertising.checked=false; window.QRtoQRConsent.save({ analytics:false, advertising:false }); message('任意項目を拒否しました。','Optional use has been rejected.'); });
  document.getElementById('clearSitePreferencesBtn').addEventListener('click',()=>{ const wasEnglish=english(); const consentKey=window.QRtoQRConsent.key; Object.keys(localStorage).filter((key)=>key.startsWith('qrtoqr')||key===consentKey).forEach((key)=>localStorage.removeItem(key)); sessionStorage.clear(); analytics.checked=false; advertising.checked=false; status.textContent=wasEnglish?'Saved QRtoQR settings have been deleted from this browser.':'このブラウザに保存されたQRtoQRの設定を削除しました。'; });
  window.addEventListener('qrtoqr-consent-change',load); load();
}());
