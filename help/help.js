/* FishView Watchlist — help page script.
   External file because Manifest V3 extension pages block inline scripts.
   - Copy SQL button
   - Theme: follows FishView's Day/Night choice (chrome.storage "fvTheme", read-only),
     otherwise the system setting. The toggle only changes this page view; nothing is saved. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  /* ---------- Theme ---------- */
  var toggle = document.getElementById('themeToggle');
  var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return mql && mql.matches ? 'dark' : 'light';
  }
  function paintToggle() {
    if (!toggle) return;
    var dark = currentTheme() === 'dark';
    toggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
    var label = toggle.querySelector('.theme-btn-label');
    if (label) label.textContent = dark ? 'Light mode' : 'Dark mode';
  }
  function applyTheme(t) {
    if (t === 'dark' || t === 'light') root.setAttribute('data-theme', t);
    paintToggle();
  }

  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('fvTheme', function (res) {
        if (res && (res.fvTheme === 'dark' || res.fvTheme === 'light')) applyTheme(res.fvTheme);
      });
    }
  } catch (e) { /* not running inside the extension; system theme is used */ }

  if (mql && mql.addEventListener) mql.addEventListener('change', paintToggle);
  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
    paintToggle();
  }

  /* ---------- Copy SQL ---------- */
  var btn = document.getElementById('copySqlBtn');
  var status = document.getElementById('copySqlStatus');

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function done(ok) {
    if (status) {
      status.textContent = ok
        ? 'Setup SQL copied. Now paste it into the Supabase SQL Editor and click Run.'
        : 'Could not copy automatically. Click inside the box, select all, and copy.';
    }
    if (ok && btn) {
      btn.textContent = 'Copied ✓';
      btn.classList.add('is-done');
      setTimeout(function () { btn.textContent = 'Copy SQL'; btn.classList.remove('is-done'); }, 2500);
    }
  }

  if (btn) {
    btn.hidden = false;
    btn.addEventListener('click', function () {
      var src = document.getElementById(btn.getAttribute('data-copy-target'));
      if (!src) return;
      var text = src.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
      } else {
        done(fallbackCopy(text));
      }
    });
  }
})();
