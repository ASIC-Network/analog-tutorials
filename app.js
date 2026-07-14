/* =========================================================
   CONFIG: edit these two strings per repo, nothing else
   ========================================================= */
const CONFIG = {
  title: "Analog Tutorials",                                     // EDIT: "Analog Tutorials" / "Digital Tutorials"
  repo:  "https://github.com/ASIC-Network/analog-tutorials",     // EDIT: this repo's github url
  mainSite: "https://asicnetwork.net",
  branch: "main",
  pagesDir: "Pages",
  maxPages: 60
};

/* ---------- dom refs + boilerplate ---------- */
const $id = s => document.getElementById(s);
const content = $id("content"), pageNav = $id("page-nav"), pager = $id("pager"),
      metaEl = $id("doc-meta"), tocNav = $id("toc-nav"), tocBox = $id("toc"),
      tbTitle = $id("tb-title");

document.title = CONFIG.title + " \u00b7 ASIC Network";
$id("brand-sub").textContent = CONFIG.title;
$id("nav-home").href = CONFIG.mainSite;
$id("nav-main").href = CONFIG.mainSite;
$id("nav-repo").href = CONFIG.repo;
$id("f-repo").href = CONFIG.repo;

/* scroll progress */
(function(){
  const bar = $id("progress");
  function upd(){
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? h.scrollTop / max : 0) + ")";
  }
  addEventListener("scroll", upd, { passive: true });
  addEventListener("resize", upd);
  upd();
})();

/* drawer */
(function(){
  const body = document.body;
  $id("drawer-btn").addEventListener("click", () => body.classList.toggle("drawer-open"));
  $id("backdrop").addEventListener("click", () => body.classList.remove("drawer-open"));
  pageNav.addEventListener("click", e => { if (e.target.closest("a")) body.classList.remove("drawer-open"); });
})();

/* =========================================================
   markdown renderer
   headers, emphasis, code, lists, tasks, tables, quotes,
   images, links, hr. raw HTML is escaped, comments stripped.
   ========================================================= */
/*__MD_START__*/
var MD_BASE = "";
function setMdBase(b){ MD_BASE = b || ""; }
function absUrl(u){ return /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(u) ? u : MD_BASE + u; }
var slugCounts = Object.create(null);
function resetSlugs(){ slugCounts = Object.create(null); }
var ESC_MAP = {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};
function escHtml(s){ return String(s).replace(/[&<>"']/g, function(m){ return ESC_MAP[m]; }); }
function slug(text){
  var s = text.toLowerCase().replace(/`/g,"").replace(/[^a-z0-9\u00c0-\u024f]+/g,"-").replace(/^-+|-+$/g,"") || "section";
  var n = slugCounts[s] || 0; slugCounts[s] = n + 1;
  return n ? s + "-" + n : s;
}
function emphasize(s){
  s = s.replace(/\*\*\*([^*]+)\*\*\*/g,"<strong><em>$1</em></strong>");
  s = s.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
  s = s.replace(/(^|[^\w*])\*([^*\n]+)\*(?![\w*])/g,"$1<em>$2</em>");
  s = s.replace(/(^|[^\w_])_([^_\n]+)_(?![\w_])/g,"$1<em>$2</em>");
  s = s.replace(/~~([^~]+)~~/g,"<del>$1</del>");
  return s;
}
function inline(raw){
  var stash = [];
  function keep(h){ stash.push(h); return "\u0001" + (stash.length - 1) + "\u0001"; }
  var s = escHtml(raw);
  s = s.replace(/`([^`]+)`/g, function(m,c){ return keep("<code>" + c + "</code>"); });
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, function(m,alt,src){
    return keep('<img src="' + absUrl(src) + '" alt="' + alt + '" loading="lazy">');
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, function(m,t,u){
    var pm = u.match(/^page[_-]?(\d+)\.md$/i);
    var href = pm ? "#page_" + pm[1] : absUrl(u);
    var ext = /^https?:/i.test(href);
    return keep('<a href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + emphasize(t) + "</a>");
  });
  s = emphasize(s);
  s = s.replace(/\u0001(\d+)\u0001/g, function(m,i){ return stash[+i]; });
  return s;
}
function splitRow(row){
  var r = row.trim();
  if (r.charAt(0) === "|") r = r.slice(1);
  if (r.charAt(r.length - 1) === "|") r = r.slice(0, -1);
  return r.split("|").map(function(c){ return c.trim(); });
}
function buildList(items){
  var html = "", stack = [], prev = -1;
  items.forEach(function(it){
    var lvl = Math.min(5, Math.floor(it.ind / 2));
    if (lvl > prev){
      for (var k = prev; k < lvl; k++){ html += it.ord ? "<ol>" : "<ul>"; stack.push(it.ord); }
    } else {
      html += "</li>";
      for (var k2 = lvl; k2 < prev; k2++){ html += (stack.pop() ? "</ol>" : "</ul>") + "</li>"; }
      if (stack.length && stack[stack.length - 1] !== it.ord){
        html += stack.pop() ? "</ol>" : "</ul>";
        html += it.ord ? "<ol>" : "<ul>";
        stack.push(it.ord);
      }
    }
    var t = it.txt.join(" ");
    var task = t.match(/^\[([ xX])\]\s+(.*)$/);
    html += task
      ? '<li class="task"><input type="checkbox" disabled' + (/x/i.test(task[1]) ? " checked" : "") + "><span>" + inline(task[2]) + "</span>"
      : "<li>" + inline(t);
    prev = lvl;
  });
  html += "</li>";
  while (stack.length){ html += stack.pop() ? "</ol>" : "</ul>"; if (stack.length) html += "</li>"; }
  return html;
}
function mdToHtml(src){
  src = String(src).replace(/^\uFEFF/,"").replace(/\r\n?/g,"\n").replace(/\t/g,"  ").replace(/<!--[\s\S]*?-->/g,"");
  var lines = src.split("\n"), out = [], para = [], i = 0;
  function flush(){ if (para.length){ out.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; } }
  while (i < lines.length){
    var line = lines[i];

    var fence = line.match(/^\s*```(.*)$/);
    if (fence){
      flush();
      var lang = fence[1].trim(), buf = []; i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])){ buf.push(lines[i]); i++; }
      i++;
      out.push('<figure class="codeblock"><figcaption><span class="dot"></span><span class="lang">' + escHtml(lang || "code")
        + '</span><button type="button" class="copy">copy</button></figcaption><pre><code>' + escHtml(buf.join("\n")) + "</code></pre></figure>");
      continue;
    }

    if (/^\s*$/.test(line)){ flush(); i++; continue; }

    var h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h){
      flush();
      var lvl = h[1].length, txt = h[2].replace(/\s+#+\s*$/,"").trim(), hid = slug(txt);
      out.push("<h" + lvl + ' id="' + hid + '">' + inline(txt) + '<a class="hlink" href="#' + hid + '" aria-hidden="true">#</a></h' + lvl + ">");
      i++; continue;
    }

    /* table before hr so |---|---| separators are not eaten */
    if (line.indexOf("|") !== -1 && i + 1 < lines.length && lines[i+1].indexOf("|") !== -1
        && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i+1]) && lines[i+1].indexOf("-") !== -1){
      flush();
      var head = splitRow(line);
      var aligns = splitRow(lines[i+1]).map(function(c){
        var al = /^:/.test(c), ar = /:$/.test(c);
        return al && ar ? "center" : ar ? "right" : "";
      });
      i += 2;
      var rows = [];
      while (i < lines.length && lines[i].indexOf("|") !== -1 && !/^\s*$/.test(lines[i])){ rows.push(splitRow(lines[i])); i++; }
      var alAttr = function(k){ return aligns[k] ? ' style="text-align:' + aligns[k] + '"' : ""; };
      out.push('<div class="tablewrap"><table><thead><tr>'
        + head.map(function(c,k){ return "<th" + alAttr(k) + ">" + inline(c) + "</th>"; }).join("")
        + "</tr></thead><tbody>"
        + rows.map(function(r){ return "<tr>" + head.map(function(_,k){ return "<td" + alAttr(k) + ">" + inline(r[k] || "") + "</td>"; }).join("") + "</tr>"; }).join("")
        + "</tbody></table></div>");
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)){ flush(); out.push("<hr>"); i++; continue; }

    if (/^\s*>/.test(line)){
      flush();
      var qbuf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])){ qbuf.push(lines[i].replace(/^\s*>\s?/,"")); i++; }
      out.push("<blockquote>" + mdToHtml(qbuf.join("\n")) + "</blockquote>");
      continue;
    }

    var isLi = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
    if (isLi){
      flush();
      var items = [];
      while (i < lines.length){
        var m = lines[i].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
        if (m){ items.push({ ind: m[1].length, ord: /^\d/.test(m[2]), txt: [m[3]] }); i++; }
        else if (/^\s*$/.test(lines[i])){
          if (i + 1 < lines.length && /^(\s*)([-*+]|\d+[.)])\s+/.test(lines[i+1])) i++;
          else break;
        }
        else if (/^\s{2,}\S/.test(lines[i]) && items.length){ items[items.length - 1].txt.push(lines[i].trim()); i++; }
        else break;
      }
      out.push(buildList(items));
      continue;
    }

    var img = line.match(/^\s*!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)\s*$/);
    if (img){
      flush();
      var cap = img[3] || img[1];
      out.push('<figure class="img"><img src="' + escHtml(absUrl(img[2])) + '" alt="' + escHtml(img[1]) + '" loading="lazy">'
        + (cap ? "<figcaption>" + escHtml(cap) + "</figcaption>" : "") + "</figure>");
      i++; continue;
    }

    para.push(line.trim()); i++;
  }
  flush();
  return out.join("\n");
}
/*__MD_END__*/

/* ---------- page discovery ---------- */
const PDIR = CONFIG.pagesDir ? CONFIG.pagesDir.replace(/\/+$/, "") + "/" : "";
setMdBase(PDIR);
function titleOf(src, n){
  var m = String(src).replace(/\r/g,"").match(/^#\s+(.+)$/m);
  return m ? m[1].replace(/\s+#+\s*$/,"").trim() : "Page " + n;
}
async function discoverPages(){
  const pages = [];
  const B = 6;
  for (let s = 1; s <= CONFIG.maxPages; s += B){
    const ns = [];
    for (let k = 0; k < B && s + k <= CONFIG.maxPages; k++) ns.push(s + k);
    const got = await Promise.all(ns.map(n =>
      fetch(PDIR + "page_" + n + ".md", { cache: "no-store" })
        .then(r => r.ok ? r.text() : null)
        .catch(() => null)));
    let gap = false;
    got.forEach((txt, k) => {
      if (gap) return;
      if (txt == null){ gap = true; return; }
      pages.push({ n: ns[k], src: txt, title: titleOf(txt, ns[k]) });
    });
    if (gap) break;
  }
  return pages;
}

/* ---------- rendering ---------- */
let PAGES = [];
const pad = n => String(n).padStart(2, "0");

function renderNav(active){
  pageNav.innerHTML = PAGES.map((p, k) =>
    '<a href="#page_' + p.n + '"' + (k === active ? ' class="active"' : '') + '>'
    + '<span class="pn">' + pad(p.n) + '</span><span>' + escHtml(p.title) + '</span></a>').join("");
}
function renderPager(k){
  const prev = PAGES[k - 1], next = PAGES[k + 1];
  pager.innerHTML =
    (prev ? '<a class="pg prev" href="#page_' + prev.n + '"><span>&larr; Previous</span><b>' + escHtml(prev.title) + "</b></a>" : "<span></span>")
    + (next ? '<a class="pg next" href="#page_' + next.n + '"><span>Next &rarr;</span><b>' + escHtml(next.title) + "</b></a>" : "<span></span>");
}
let spy = null;
function buildToc(){
  const hs = Array.from(content.querySelectorAll("h2, h3"));
  tocBox.style.display = hs.length ? "" : "none";
  tocNav.innerHTML = hs.map(h => {
    const c = h.cloneNode(true);
    const a = c.querySelector(".hlink"); if (a) a.remove();
    return '<a class="t-' + h.tagName.toLowerCase() + '" href="#' + h.id + '">' + escHtml(c.textContent.trim()) + "</a>";
  }).join("");
  if (spy) spy.disconnect();
  if (!("IntersectionObserver" in window) || !hs.length) return;
  const links = tocNav.querySelectorAll("a");
  spy = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting){
        links.forEach(l => l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id));
      }
    });
  }, { rootMargin: "-80px 0px -70% 0px" });
  hs.forEach(h => spy.observe(h));
}
function bindCopy(){
  content.querySelectorAll(".codeblock .copy").forEach(btn => {
    btn.addEventListener("click", () => {
      const code = btn.closest(".codeblock").querySelector("code").textContent;
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = "copied";
          setTimeout(() => { btn.textContent = "copy"; }, 1400);
        });
      }
    });
  });
}
function renderPage(k){
  const p = PAGES[k];
  resetSlugs();
  content.innerHTML = mdToHtml(p.src);
  document.title = p.title + " \u00b7 " + CONFIG.title;
  tbTitle.textContent = p.title;
  metaEl.style.display = "";
  metaEl.innerHTML = '<span class="pgno">Page ' + pad(p.n) + " / " + pad(PAGES[PAGES.length - 1].n) + "</span>"
    + '<a class="edit" target="_blank" rel="noopener" href="' + CONFIG.repo + "/edit/" + CONFIG.branch + "/" + PDIR + "page_" + p.n + '.md">edit this page on github &nearr;</a>';
  renderNav(k); renderPager(k); buildToc(); bindCopy();
  try { window.scrollTo(0, 0); } catch (e) {}
}
function renderEmpty(){
  const isFile = location.protocol === "file:";
  pageNav.innerHTML = "";
  metaEl.style.display = "none";
  tocBox.style.display = "none";
  tbTitle.textContent = "No pages";
  content.innerHTML = '<div class="state-card"><h2>No pages found</h2>'
    + "<p>This site renders <code>pages/page_1.md</code>, <code>pages/page_2.md</code>, &hellip; Add <code>pages/page_1.md</code> (copy <code>pages/TEMPLATE.md</code>) and reload. Numbering must be sequential with no gaps.</p>"
    + (isFile ? "<p>You opened this file directly. <code>fetch()</code> needs a server: run <code>python3 -m http.server</code> in this folder and open <code>http://localhost:8000</code>.</p>" : "")
    + "</div>";
}

/* ---------- routing ---------- */
function idxFromHash(){
  const m = location.hash.match(/^#page[_-](\d+)$/i);
  if (!m) return 0;
  const k = PAGES.findIndex(p => p.n === +m[1]);
  return k >= 0 ? k : 0;
}
addEventListener("hashchange", () => {
  const m = location.hash.match(/^#page[_-](\d+)$/i);
  if (m && PAGES.length){
    const k = PAGES.findIndex(p => p.n === +m[1]);
    if (k >= 0) renderPage(k);
  }
  /* any other hash is an in-page anchor; the browser handles it */
});

(async function init(){
  PAGES = await discoverPages();
  if (!PAGES.length){ renderEmpty(); return; }
  renderPage(idxFromHash());
  if (location.hash && !/^#page[_-]\d+$/i.test(location.hash)){
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el && el.scrollIntoView) el.scrollIntoView();
  }
})();
