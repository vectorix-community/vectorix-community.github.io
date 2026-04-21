/* ============================================
   VECTORIX — app.js — Router, Cursor, Particles, Nav
   ============================================ */

'use strict';

/* ─── PARTICLE SYSTEM ─── */
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let W = canvas.width = window.innerWidth;
let H = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
});

const PARTICLES = [];
const NUM_PARTICLES = 80;

function createParticle() {
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 1.5 + 0.3,
    a: Math.random() * 0.5 + 0.1,
    color: Math.random() > 0.6 ? '#f5c400' : Math.random() > 0.5 ? '#00d4ff' : '#ffffff'
  };
}

for (let i = 0; i < NUM_PARTICLES; i++) {
  PARTICLES.push(createParticle());
}

function drawParticles() {
  ctx.clearRect(0, 0, W, H);

  for (let i = 0; i < PARTICLES.length; i++) {
    const p = PARTICLES[i];
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = W;
    if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H;
    if (p.y > H) p.y = 0;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.a;
    ctx.fill();
    ctx.globalAlpha = 1;

    for (let j = i + 1; j < PARTICLES.length; j++) {
      const q = PARTICLES[j];
      const dx = p.x - q.x, dy = p.y - q.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = (1 - dist / 120) * 0.08;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
  requestAnimationFrame(drawParticles);
}
drawParticles();

/* ─── CURSOR ─── */
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});

(function animateRing() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  cursorRing.style.left = rx + 'px';
  cursorRing.style.top  = ry + 'px';
  requestAnimationFrame(animateRing);
})();

document.addEventListener('mouseover', e => {
  const el = e.target.closest(
    'a, button, .proj-card, .team-card, .event-card, .blog-card, ' +
    '.domain-card, .role-card, .filter-btn, .blog-cat, .contact-link-row, ' +
    '.about-card, .why-card, .struct-card, .hero-badge'
  );
  if (el) {
    cursor.style.transform     = 'translate(-50%,-50%) scale(2)';
    cursorRing.style.transform = 'translate(-50%,-50%) scale(1.5)';
    cursorRing.style.opacity   = '1';
    cursorRing.style.borderColor = 'var(--accent)';
  } else {
    cursor.style.transform     = 'translate(-50%,-50%) scale(1)';
    cursorRing.style.transform = 'translate(-50%,-50%) scale(1)';
    cursorRing.style.opacity   = '0.5';
    cursorRing.style.borderColor = 'var(--accent3)';
  }
});

/* ─── SITE DATA — Pre-fetched immediately on script load ─── */
// Single shared promise — all callers await the same fetch, never double-fetch.
let siteData = null;
let siteDataPromise = null;

function fetchSiteData() {
  if (siteData) return Promise.resolve(siteData);
  if (siteDataPromise) return siteDataPromise;

  siteDataPromise = fetch('data/data.json')
    .then(res => {
      if (!res.ok) throw new Error('No data.json');
      return res.json();
    })
    .then(data => {
      siteData = data;
      return siteData;
    })
    .catch(() => {
      siteData = { team: [], projects: [], events: [], blog: [] };
      return siteData;
    });

  return siteDataPromise;
}

// Kick off the fetch RIGHT NOW — before the router even runs.
// By the time showPage() calls a loader, the JSON is already in-flight or done.
fetchSiteData();

/* ─── ROUTER ─── */
const pages    = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-links a[data-page]');

function showPage(id) {
  pages.forEach(p => {
    p.style.display = p.id === 'page-' + id ? 'block' : 'none';
  });
  navLinks.forEach(a => {
    a.classList.toggle('active', a.dataset.page === id);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  requestAnimationFrame(() => {
    const visible = document.getElementById('page-' + id);
    if (!visible) return;
    visible.querySelectorAll('.fade-in').forEach((el, i) => {
      el.classList.remove('visible');
      setTimeout(() => el.classList.add('visible'), 80 + i * 60);
    });
  });

  if (id === 'team')     loadTeamData();
  if (id === 'projects') loadProjectsData();
  if (id === 'events')   loadEventsData();
  if (id === 'blog')     loadBlogData();
}

navLinks.forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    showPage(a.dataset.page);
    history.pushState({}, '', '#' + a.dataset.page);
  });
});

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-goto]');
  if (btn) {
    e.preventDefault();
    showPage(btn.dataset.goto);
    history.pushState({}, '', '#' + btn.dataset.goto);
  }
});

function routeFromHash() {
  const hash = location.hash.replace('#', '') || 'home';
  showPage(hash);
}
window.addEventListener('popstate', routeFromHash);
routeFromHash();

/* ─── INTERSECTION OBSERVER ─── */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });

document.querySelectorAll('#page-home .fade-in').forEach(el => observer.observe(el));

/* ─── STAT COUNTER ANIMATION ─── */
function animateCounters() {
  document.querySelectorAll('.stat-num[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    const suffix = el.dataset.suffix || '+';
    let start = 0;
    const duration = 1800;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + (progress >= 1 ? suffix : '');
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

setTimeout(animateCounters, 600);

/* ─── PROJECTS FILTER ─── */
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.filter;
    document.querySelectorAll('.proj-card').forEach(card => {
      const match = cat === 'all' || card.dataset.cat === cat;
      card.classList.toggle('hidden', !match);
    });
  });
});

/* ─── BLOG SEARCH · SORT · FILTER ─── */
function initBlogControls() {
  const searchInput  = document.getElementById('blogSearchInput');
  const searchClear  = document.getElementById('blogSearchClear');
  const sortSelect   = document.getElementById('blogSortSelect');
  const noResults    = document.getElementById('blogNoResults');
  const catsRow      = document.getElementById('blogCatsRow');

  if (!searchInput) return;   // blog page not in DOM yet

  let currentCat = 'all';

  function applyFilters() {
    const query = (searchInput.value || '').toLowerCase().trim();
    const sort  = sortSelect ? sortSelect.value : 'newest';
    const cards = Array.from(document.querySelectorAll('#blog-grid-container .blog-card'));

    // Filter visibility
    let visible = 0;
    cards.forEach(card => {
      const matchCat  = currentCat === 'all' || (card.dataset.cat || '') === currentCat;
      const matchText = !query ||
        (card.dataset.title || '').toLowerCase().includes(query) ||
        (card.dataset.desc  || '').toLowerCase().includes(query);
      const show = matchCat && matchText;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';

    // Sort visible cards in-place inside the grid
    const grid = document.getElementById('blog-grid-container');
    if (!grid) return;
    const visibleCards = cards
      .filter(c => c.style.display !== 'none')
      .sort((a, b) => {
        const da = a.dataset.date || '';
        const db = b.dataset.date || '';
        return sort === 'newest' ? db.localeCompare(da) : da.localeCompare(db);
      });
    visibleCards.forEach(c => grid.appendChild(c));

    // Toggle clear button
    if (searchClear) searchClear.style.display = query ? 'flex' : 'none';
  }

  // Category buttons
  if (catsRow) {
    catsRow.querySelectorAll('.blog-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        catsRow.querySelectorAll('.blog-cat').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCat = btn.dataset.cat || 'all';
        applyFilters();
      });
    });
  }

  // Search input
  searchInput.addEventListener('input', applyFilters);

  // Clear button
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.style.display = 'none';
      applyFilters();
    });
  }

  // Sort dropdown
  if (sortSelect) sortSelect.addEventListener('change', applyFilters);

  // Run once to apply default sort (newest-first)
  applyFilters();
}

// Boot on page load for static cards; dynamic cards call this again after inject
document.addEventListener('DOMContentLoaded', initBlogControls);

/* ─── FORMS ─── */

/* joinForm — UI feedback only (no backend needed) */
function setupForm(formId, successLabel) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    const orig = btn.textContent;
    btn.textContent = successLabel + ' ✓';
    btn.style.background = '#00f5a0';
    btn.style.color = '#000';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
      btn.style.color = '';
      form.reset();
    }, 3000);
  });
}
setupForm('joinForm', 'Application Submitted');

/* ─── CONTACT FORM → GOOGLE FORMS ─── */
/*
 * Google Form: "Contact US"
 * View URL:  https://docs.google.com/forms/d/e/1FAIpQLSeyHoUr_PuCJTCMstOoYLX3FgV19RaDZFQvWqwNsphISjFjEw/viewform
 */
(function initContactForm() {
  const FORM_ACTION = 
    'https://docs.google.com/forms/d/e/1FAIpQLSeyHoUr_PuCJTCMstOoYLX3FgV19RaDZFQvWqwNsphISjFjEw/formResponse';

  const FIELDS = {
    name:    'entry.572839741',   // NAME field
    email:   'entry.152200560',   // EMAIL field
    subject: 'entry.121283095',   // SUBJECT field
    message: 'entry.1845541589',  // MESSAGE field
  };

  const form = document.getElementById('contactForm');
  if (!form) return;

  /* Hidden iframe target — lets us POST without navigating the page */
  let iframe = document.getElementById('_gf_iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.name = '_gf_iframe';
    iframe.id   = '_gf_iframe';
    iframe.style.cssText = 'display:none;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const nameVal    = (form.querySelector('[name="name"]')    || form.querySelector('#name'))?.value.trim()    ?? '';
    const emailVal   = (form.querySelector('[name="email"]')   || form.querySelector('#email'))?.value.trim()   ?? '';
    const subjectVal = (form.querySelector('[name="subject"]') || form.querySelector('#subject'))?.value.trim() ?? '';
    const messageVal = (form.querySelector('[name="message"]') || form.querySelector('#message'))?.value.trim() ?? '';
    const btn        = form.querySelector('.form-submit');

    /* Basic validation */
    if (!nameVal || !emailVal || !messageVal) {
      btn.textContent      = '⚠ Fill required fields';
      btn.style.background = '#ff4444';
      btn.style.color      = '#fff';
      setTimeout(() => {
        btn.textContent      = 'Send Message →';
        btn.style.background = '';
        btn.style.color      = '';
      }, 2500);
      return;
    }

    btn.textContent      = 'Sending…';
    btn.style.background = '#0a1018';
    btn.style.color      = 'var(--accent3, #00d4ff)';
    btn.disabled         = true;

    /* Build a temporary form that targets the hidden iframe */
    const ghost = document.createElement('form');
    ghost.method  = 'POST';
    ghost.action  = FORM_ACTION;
    ghost.target  = '_gf_iframe';
    ghost.style.display = 'none';

    const pairs = [
      [FIELDS.name,    nameVal],
      [FIELDS.email,   emailVal],
      [FIELDS.subject, subjectVal],
      [FIELDS.message, messageVal],
    ];

    pairs.forEach(([entryId, val]) => {
      const inp  = document.createElement('input');
      inp.type  = 'hidden';
      inp.name  = entryId;
      inp.value = val;
      ghost.appendChild(inp);
    });

    document.body.appendChild(ghost);
    ghost.submit();
    document.body.removeChild(ghost);

    /* Google Forms with mode=no-cors doesn't fire load on iframe reliably,
       so we treat submission as success after a short delay */
    setTimeout(() => {
      btn.textContent      = 'Message Sent ✓';
      btn.style.background = '#00f5a0';
      btn.style.color      = '#050a0e';
      form.reset();
      setTimeout(() => {
        btn.textContent      = 'Send Message →';
        btn.style.background = '';
        btn.style.color      = '';
        btn.disabled         = false;
      }, 3500);
    }, 1200);
  });
})();
/* ─── THEME TOGGLE ─── */
const themeBtn  = document.getElementById('themeToggle');
const logoImg   = document.getElementById('logoImg');
const heroLogo  = document.querySelector('.main-logo');
const heroLogoo  = document.querySelector('.main-logoo');
const themeLabel = themeBtn ? themeBtn.querySelector('.theme-label') : null;

function applyTheme(mode) {
  if (mode === 'light') {
    document.body.classList.add('light-mode');
    if (logoImg)  logoImg.src = 'images/White_Full.png';
    if (heroLogo) heroLogo.src = 'images/Logo_white.png';
    if (heroLogoo) heroLogoo.src = 'images/vivek_white.PNG';
    if (themeLabel) themeLabel.textContent = 'Dark';
  } else {
    document.body.classList.remove('light-mode');
    if (logoImg)  logoImg.src = 'images/Black_Full.png';
    if (heroLogo) heroLogo.src = 'images/Logo_black.png';
    if (heroLogoo) heroLogoo.src = 'images/vivek_black.PNG';
    if (themeLabel) themeLabel.textContent = 'Light';
  }
  localStorage.setItem('vx-theme', mode);
}

applyTheme(localStorage.getItem('vx-theme') || 'dark');

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const next = document.body.classList.contains('light-mode') ? 'darki' : 'light';
    applyTheme(next);
  });
}

/* ─── MOBILE NAV ─── */
const hamburger   = document.getElementById('navHamburger');
const mobileNav   = document.getElementById('navMobile');
const mobileLinks = document.querySelectorAll('[data-mobile-page]');

function closeMobileNav() {
  if (!hamburger || !mobileNav) return;
  hamburger.classList.remove('open');
  mobileNav.classList.remove('open');
}

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.contains('open');
    isOpen ? closeMobileNav() : (hamburger.classList.add('open'), mobileNav.classList.add('open'));
  });
}

mobileLinks.forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const page = a.dataset.mobilePage;
    showPage(page);
    history.pushState({}, '', '#' + page);
    closeMobileNav();
    mobileLinks.forEach(l => l.classList.toggle('active', l.dataset.mobilePage === page));
  });
});

document.addEventListener('click', e => {
  if (mobileNav && mobileNav.classList.contains('open')) {
    if (!mobileNav.contains(e.target) && !hamburger.contains(e.target)) closeMobileNav();
  }
});

/* ─── DYNAMIC DATA LOADERS ─── */

async function loadTeamData() {
  const data = await fetchSiteData();
  if (!data.team || !data.team.length) return;
  const container = document.getElementById('team-grid-container');
  if (!container) return;

  container.innerHTML = data.team.map(m => `
    <div class="team-card">
      <div class="team-avatar" style="background:rgba(245,196,0,0.08);border-color:var(--border)">
        ${m.photo ? `<img src="${m.photo}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : m.initials || '?'}
      </div>
      <div class="team-name">${m.name}</div>
      <div class="team-role">${m.role}</div>
      <p class="team-bio">${m.bio || ''}</p>
      <div class="team-socials">
        ${m.linkedin ? `<a href="${m.linkedin}" target="_blank" class="team-social">in</a>` : ''}
        ${m.github   ? `<a href="${m.github}"   target="_blank" class="team-social">⌥</a>` : ''}
      </div>
    </div>
  `).join('') + `
    <div class="team-card team-card-join">
      <div class="team-avatar">+</div>
      <div class="team-name">You?</div>
      <div class="team-role">Open Position</div>
      <p class="team-bio">We're growing. Join VECTORIX and take on a leadership role in shaping the future of student tech communities.</p>
      <div class="team-socials"><a href="https://docs.google.com/forms/d/e/1FAIpQLSdb0X8_PF63QvWqsXMFJOyutPwHua_Xyey9260pZ6Fm5bfKAA/viewform?usp=header" target="_blank" class="team-social">→</a></div>
    </div>
  `;
}

async function loadProjectsData() {
  const data = await fetchSiteData();
  if (!data.projects || !data.projects.length) return;
  const container = document.getElementById('projects-grid-container');
  if (!container) return;

  container.innerHTML = data.projects.map((p, i) => `
    <div class="proj-card" data-cat="${p.cat}">
      <div class="proj-num">PROJ · ${String(i + 1).padStart(3, '0')}</div>
      <div class="proj-icon-area">${p.icon || '💡'}</div>
      <div class="proj-name">${p.name}</div>
      <p class="proj-desc">${p.desc || ''}</p>
      <div class="proj-stack">
        ${p.tech ? p.tech.split(',').map(t => `<span class="proj-tech">${t.trim()}</span>`).join('') : ''}
      </div>
      <div class="proj-btns">
        ${p.link   ? `<a href="${p.link}"   target="_blank" class="proj-btn-sm">View Project →</a>` : ''}
        ${p.github ? `<a href="${p.github}" target="_blank" class="proj-btn-sm">GitHub ⌥</a>`      : ''}
      </div>
    </div>
  `).join('');

  // Re-bind filter after dynamic render
  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      document.querySelectorAll('.proj-card').forEach(card => {
        card.classList.toggle('hidden', cat !== 'all' && card.dataset.cat !== cat);
      });
    };
  });
}

async function loadEventsData() {
  const data = await fetchSiteData();
  if (!data.events || !data.events.length) return;
  const container = document.getElementById('events-grid-container');
  if (!container) return;

  container.innerHTML = data.events.map(ev => `
    <div class="event-card ${ev.featured ? 'featured' : ''}">
      <div class="event-status ${ev.status === 'past' ? 'past' : 'upcoming'}">${ev.status === 'past' ? 'Past' : 'Upcoming'}</div>
      <div class="event-title">${ev.title}</div>
      <p class="event-desc">${ev.desc || ''}</p>
      ${ev.photo ? `<img src="${ev.photo}" style="width:100%;margin:1rem 0;border:1px solid var(--border);max-height:200px;object-fit:cover;" alt="${ev.title}">` : ''}
      <div class="event-meta">
        <div class="event-meta-item"><span>📅</span> ${ev.date || 'TBD'}</div>
        ${ev.mode   ? `<div class="event-meta-item"><span>🌐</span> ${ev.mode}</div>`   : ''}
        ${ev.detail ? `<div class="event-meta-item"><span>📌</span> ${ev.detail}</div>` : ''}
      </div>
      ${ev.status !== 'past' ? `<div class="event-btns">
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSdb0X8_PF63QvWqsXMFJOyutPwHua_Xyey9260pZ6Fm5bfKAA/viewform?usp=header" target="_blank" class="btn-primary btn-glow" style="font-size:11px;padding:10px 18px;">Register →</a>
      </div>` : ''}
    </div>
  `).join('');
}

async function loadBlogData() {
  const data = await fetchSiteData();
  if (!data.blog || !data.blog.length) return;
  const container = document.getElementById('blog-grid-container');
  if (!container) return;

  // Sort newest-first by default (uses dateSort field if present, else raw date string)
  const sorted = [...data.blog].sort((a, b) => {
    const da = a.dateSort || a.date || '';
    const db = b.dateSort || b.date || '';
    return db.localeCompare(da);
  });

  container.innerHTML = sorted.map(b => {
    const safeData = JSON.stringify(b).replace(/"/g, '&quot;');
    const dateKey  = (b.dateSort || b.date || '').replace(/[^0-9]/g, '');
    const titleLow = (b.title || '').toLowerCase();
    const descLow  = (b.desc  || '').toLowerCase();
    const catVal   = b.cat || 'General';
    return `
    <div class="blog-card"
         data-date="${dateKey}"
         data-cat="${catVal}"
         data-title="${titleLow}"
         data-desc="${descLow}"
         onclick="openBlogModal(${safeData})">
      ${b.photo ? `<img src="${b.photo}" style="width:100%;margin-bottom:1rem;border:1px solid var(--border);max-height:180px;object-fit:cover;" alt="${b.title}">` : ''}
      <span class="blog-cat-tag">${catVal}</span>
      <div class="blog-title">${b.title}</div>
      <p class="blog-desc">${b.desc || ''}</p>
      <div class="blog-meta">VECTORIX · ${b.date || '2025'} · ${b.readTime || '5 min read'}</div>
    </div>`;
  }).join('');

  // Re-initialise search/filter/sort after dynamic cards are injected
  initBlogControls();
}

/* ── Blog Modal ── */
function openBlogModal(blog) {
  const modal = document.getElementById('blog-modal');
  if (!modal) return;

  // Populate fields
  document.getElementById('modal-cat').textContent = blog.cat || 'General';
  document.getElementById('modal-title').textContent = blog.title || '';
  document.getElementById('modal-meta').textContent =
    'VECTORIX · ' + (blog.date || '2025') + ' · ' + (blog.readTime || '5 min read');

  // Image
  const imgWrap = document.getElementById('modal-image-wrap');
  const img = document.getElementById('modal-image');
  if (blog.photo) {
    img.src = blog.photo;
    img.alt = blog.title || '';
    imgWrap.style.display = 'block';
  } else {
    imgWrap.style.display = 'none';
    img.src = '';
  }

  // Content — use full `content` field if present, otherwise build from desc
  const contentEl = document.getElementById('modal-content');
  if (blog.content) {
    contentEl.innerHTML = blog.content;
  } else if (blog.desc) {
    contentEl.innerHTML = '<p>' + blog.desc + '</p>';
  } else {
    contentEl.innerHTML = '';
  }

  // External link
  const linkWrap = document.getElementById('modal-link-wrap');
  const link = document.getElementById('modal-link');
  if (blog.link) {
    link.href = blog.link;
    linkWrap.style.display = 'block';
  } else {
    linkWrap.style.display = 'none';
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeBlogModal() {
  const modal = document.getElementById('blog-modal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeBlogModal();
});

