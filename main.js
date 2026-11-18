/* 株式会社IRE 共通スクリプト：お問い合わせフォーム／固定CTAバー */
(function () {
  'use strict';

  /* ---- フォーム送信先の設定 ----
     Web3Forms を使う場合：https://web3forms.com で info@ire-saitama.jp 宛のアクセスキーを取得し、
       FORM_ENDPOINT = "https://api.web3forms.com/submit"
       FORM_ACCESS_KEY = "取得したキー"
     Formspree を使う場合：FORM_ENDPOINT = "https://formspree.io/f/xxxxxxxx"（キーは空のまま）
      */
  var FORM_ENDPOINT = 'https://api.web3forms.com/submit';
  var FORM_ACCESS_KEY = '4ddd2dea-ac98-4f46-829d-5132f27c04b4';
  var MAIL_TO = 'info@ire-saitama.jp';


  /* スマホ：日本語を文節（助詞・句読点）の切れ目だけで折り返す（文字の途中で切れないように） */
  (function () {
    if (!window.Intl || !Intl.Segmenter || !window.matchMedia) return;
    var mq = window.matchMedia('(max-width: 768px)');
    var done = false;
    var JA = /[぀-ヿ一-鿿]/;
    var PART = { 'は': 1, 'が': 1, 'を': 1, 'に': 1, 'で': 1, 'と': 1, 'の': 1, 'も': 1, 'へ': 1, 'や': 1, 'から': 1, 'まで': 1, 'より': 1, 'など': 1, 'だけ': 1, 'ので': 1 };
    var seg = new Intl.Segmenter('ja', { granularity: 'word' });
    function phrases(text) {
      var parts = Array.from(seg.segment(text)), out = [], cur = '';
      for (var i = 0; i < parts.length; i++) {
        var w = parts[i].segment, nx = parts[i + 1] ? parts[i + 1].segment : '';
        cur += w;
        var nxPart = PART[nx] || /^[、。，．！？」』）)]/.test(nx);
        var brk = false;
        if (/[、。，．！？]$/.test(w)) brk = !/^[」』）)]/.test(nx);
        else if (/[」』）)]$/.test(w)) brk = !nxPart;
        else if (/^[「『（(]$/.test(w)) brk = false;
        else if (PART[w]) brk = !nxPart && !/^[぀-ゟ]/.test(nx);  /* 次がひらがなならまだ語の途中（例：手が|けた） */
        if (brk) { out.push(cur); cur = ''; }
      }
      if (cur) out.push(cur);
      return out;
    }
    function apply() {
      if (done || !mq.matches) return;
      done = true;
      var skip = 'header,nav,footer,form,svg,script,style,textarea,select,.sticky-cta,.case-spec,.case-body h2,.qual,.ph';
      var blocks = document.querySelectorAll('h1,h2,h3,p,li,dd');
      for (var b = 0; b < blocks.length; b++) {
        if (blocks[b].closest(skip)) continue;
        var w = document.createTreeWalker(blocks[b], NodeFilter.SHOW_TEXT), nodes = [], n;
        while ((n = w.nextNode())) { if (JA.test(n.nodeValue) && !n.parentNode.closest(skip.replace(',.ph', ''))) nodes.push(n); }
        nodes.forEach(function (t) {
          var ph = phrases(t.nodeValue);
          if (ph.length < 2) return;
          var f = document.createDocumentFragment();
          ph.forEach(function (p) { var sp = document.createElement('span'); sp.className = 'ph'; sp.textContent = p; f.appendChild(sp); });
          t.parentNode.replaceChild(f, t);
        });
      }
    }
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
  })();

  var form = document.getElementById('inquiry-form');

  /* ヒーローのCTA：相談種別を自動選択してフォームへスクロール */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-type]') : null;
    if (!a || !form) return;
    var radios = form.querySelectorAll('input[name="ご相談内容"]');
    var i = parseInt(a.getAttribute('data-type'), 10);
    if (radios[i]) radios[i].checked = true;
  });

  /* 固定CTAバー：フォームが見えている間は隠す */
  var bar = document.getElementById('sticky-cta');
  var target = document.getElementById('inquiry');
  if (bar && target && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      bar.classList.toggle('is-hidden', en[0].isIntersecting);
    }, { threshold: 0.05 }).observe(target);
  }

  if (!form) return;

  /* 「その他のご相談」のときは物件情報（所在地・種類・築年数）を任意にする */
  var propIds = ['f-addr', 'f-type', 'f-age'];
  function syncRequired() {
    var sel = form.querySelector('input[name="ご相談内容"]:checked').value;
    var other = sel === 'その他のご相談';
    var guide = document.getElementById('area-guide');
    if (guide) guide.hidden = !(sel.indexOf('一棟アパート') === 0 || sel.indexOf('広い土地') === 0);
    propIds.forEach(function (id) {
      var el = document.getElementById(id);
      var badge = el.closest('.field').querySelector('label b');
      el.required = !other;
      if (badge) { badge.className = other ? 'opt' : 'req'; badge.textContent = other ? '任意' : '必須'; }
    });
  }
  form.addEventListener('change', function (e) {
    if (e.target && e.target.name === 'ご相談内容') syncRequired();
  });
  syncRequired();

  var errBox = document.getElementById('form-error');
  var done = document.getElementById('form-done');
  var btn = form.querySelector('.btn-submit');

  function showError(msg) { errBox.textContent = msg; errBox.hidden = false; }
  function showDone(text) {
    if (text) document.getElementById('form-done-text').innerHTML = text;
    form.hidden = true;
    form.previousElementSibling && (form.previousElementSibling.hidden = true);
    done.hidden = false;
    done.scrollIntoView({ behavior: 'smooth', block: 'center' });
    done.focus({ preventScroll: true });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errBox.hidden = true;

    if (!form.checkValidity()) {
      var bad = form.querySelector(':invalid');
      showError('未入力の必須項目、または同意チェックをご確認ください。');
      if (bad) bad.focus();
      return;
    }
    if (form.elements['botcheck'].value) return; /* bot対策 */

    /* Web3Forms へは英数字の項目名＋読みやすい本文(message)で送る（日本語の項目名は文字化けするため） */
    var fd = new FormData(form);
    var g = function (k) { return (fd.get(k) || '').toString().trim(); };
    var lines = [
      '■ご相談内容：' + g('ご相談内容'),
      '■物件の所在地：' + g('物件の所在地'),
      '■物件の種類：' + (g('物件の種類') || '（未選択）'),
      '■築年数：' + (g('築年数') || '（未選択）'),
      '■売却のご希望時期：' + (g('売却希望時期') || '（未選択）'),
      '■土地面積：' + (g('土地面積') ? g('土地面積') + g('土地面積の単位') : '（未記入）'),
      '■建物面積：' + (g('建物面積') ? g('建物面積') + g('建物面積の単位') : '（未記入）'),
      '■お名前：' + g('お名前'),
      '■メールアドレス：' + g('メールアドレス'),
      '■電話番号：' + (g('電話番号') || '（未記入）'),
      '■ご相談内容の詳細：',
      g('ご相談内容の詳細') || '（未記入）'
    ];
    var data = new FormData();
    data.append('access_key', FORM_ACCESS_KEY);
    data.append('subject', '【HP】無料査定・ご相談（' + g('物件の種類') + '／' + g('物件の所在地') + '）');
    data.append('from_name', '株式会社IRE ホームページ');
    data.append('name', g('お名前'));
    data.append('email', g('メールアドレス')); /* 返信先 */
    data.append('phone', g('電話番号'));
    data.append('message', lines.join('\n'));
    btn.disabled = true;
    var label = btn.innerHTML;
    btn.textContent = '送信中...';
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { 'Accept': 'application/json' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.success !== false, j: j }; }); })
      .then(function (res) {
        if (res.ok) { showDone(); }
        else { throw new Error('send failed'); }
      })
      .then(function () { clearTimeout(timer); }, function (e) { clearTimeout(timer); throw e; })
      .catch(function () {
        btn.disabled = false; btn.innerHTML = label;
        showError('送信に失敗しました。お手数ですが ' + MAIL_TO + ' までメールにてご連絡ください。');
      });
  });
})();
