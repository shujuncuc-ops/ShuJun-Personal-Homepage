// 个人主页交互脚本
// 当前版本只保留必要的轻量交互，避免过度动画影响阅读。

(function () {
  function qs(selector) {
    return document.querySelector(selector);
  }
  function qsa(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  var copyBtn = qs('#copyEmailBtn');
  var emailText = qs('#emailText');

  if (copyBtn && emailText) {
    copyBtn.addEventListener('click', async function () {
      var text = (emailText.textContent || '').trim();
      if (!text) return;

      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = '已复制';
        setTimeout(function () {
          copyBtn.textContent = '复制邮箱';
        }, 1200);
      } catch (e) {
        copyBtn.textContent = '请手动复制';
        setTimeout(function () {
          copyBtn.textContent = '复制邮箱';
        }, 1200);
      }
    });
  }

  // ===== 顶部目录条高亮（点击/滚动都会更新） =====
  var toc = qs('.toc');
  var indicator = qs('.toc-indicator');
  var tocLinks = qsa('.toc a[href^="#"]');
  var sections = qsa('section.section[id]');

  function moveIndicatorTo(el) {
    if (!indicator || !toc || !el) return;
    var r = el.getBoundingClientRect();
    var tr = toc.getBoundingClientRect();
    var x = r.left - tr.left;
    indicator.style.width = r.width + 'px';
    indicator.style.transform = 'translateX(' + x + 'px)';
    indicator.style.opacity = '0.55';
  }

  function setActive(hash) {
    if (!hash) return;
    tocLinks.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === hash);
    });
    var active = tocLinks.find(function (a) { return a.getAttribute('href') === hash; });
    if (active) moveIndicatorTo(active);
  }

  // 点击时立即高亮
  tocLinks.forEach(function (a) {
    a.addEventListener('click', function () {
      setActive(a.getAttribute('href'));
    });
    a.addEventListener('mouseenter', function () {
      moveIndicatorTo(a);
    });
  });

  // 鼠标离开目录条时，回到当前激活项
  if (toc) {
    toc.addEventListener('mouseleave', function () {
      var active = tocLinks.find(function (a) { return a.classList.contains('active'); });
      if (active) moveIndicatorTo(active);
    });
  }

  // 首次加载：根据 URL hash 或默认第一个
  try {
    setActive(location.hash || (tocLinks[0] ? tocLinks[0].getAttribute('href') : ''));
  } catch (e) {}

  // 滚动时：用 IntersectionObserver 自动切换当前板块
  if ('IntersectionObserver' in window && sections.length) {
    var observer = new IntersectionObserver(function (entries) {
      // 找到当前“最接近顶部”的可见 section
      var visible = entries
        .filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      if (!visible.length) return;
      var id = visible[0].target.getAttribute('id');
      if (id) setActive('#' + id);
    }, {
      root: null,
      // 让标题刚出现在目录条下方时就算“进入视野”
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0.01
    });
    sections.forEach(function (sec) { observer.observe(sec); });
  }

  // ===== 爱好互动标签（本地计数版） =====
  var hobbyButtons = qsa('.hobby[data-hobby]');
  var hobbyStorageKey = 'personal_homepage_hobby_votes_v1';

  function getHobbyVotes() {
    try {
      return JSON.parse(localStorage.getItem(hobbyStorageKey) || '{}');
    } catch (e) {
      return {};
    }
  }

  function setHobbyVotes(data) {
    try {
      localStorage.setItem(hobbyStorageKey, JSON.stringify(data));
    } catch (e) {}
  }

  function renderHobbyVotes() {
    var votes = getHobbyVotes();
    hobbyButtons.forEach(function (btn) {
      var key = btn.getAttribute('data-hobby');
      var base = Number(btn.getAttribute('data-base') || '0');
      var liked = !!votes[key];
      var countEl = btn.querySelector('.count');
      if (countEl) countEl.textContent = String(base + (liked ? 1 : 0));
      btn.classList.toggle('active', liked);
      btn.setAttribute('aria-pressed', liked ? 'true' : 'false');
      btn.title = liked ? '你也喜欢这项爱好' : '点击表示你也喜欢';
    });
  }

  hobbyButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var votes = getHobbyVotes();
      var key = btn.getAttribute('data-hobby');
      votes[key] = !votes[key];
      setHobbyVotes(votes);
      renderHobbyVotes();
    });
  });

  renderHobbyVotes();
})();
