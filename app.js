/* ============================================================
   Unified Online Services Portal — shared client engine
   Pure vanilla. No backend. "Server" delays are faked with
   timers. State is held in sessionStorage so a tab reload
   keeps (most of) the journey.

   NOTE FOR PRESENTERS: friction is intentional. See README.md
   for the full map of planted pain points.
   ============================================================ */
(function (global) {
  "use strict";

  var STATE_KEY = "uosp.state.v1";
  var FLAG_KEY = "uosp.flags.v1";

  /* ---------------- state ---------------- */
  function loadState() {
    try { return JSON.parse(sessionStorage.getItem(STATE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveState(patch) {
    var s = loadState();
    for (var k in patch) { if (patch.hasOwnProperty(k)) s[k] = patch[k]; }
    sessionStorage.setItem(STATE_KEY, JSON.stringify(s));
    return s;
  }
  function loadFlags() {
    try { return JSON.parse(sessionStorage.getItem(FLAG_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function setFlag(k, v) {
    var f = loadFlags(); f[k] = v;
    sessionStorage.setItem(FLAG_KEY, JSON.stringify(f));
    return f;
  }

  /* ---------------- timing ---------------- */
  function delay(ms) {
    return new Promise(function (res) { setTimeout(res, ms); });
  }
  // jittered delay so "server" timing is never quite predictable
  function serverDelay(base, jitter) {
    var j = jitter || 0;
    return delay(base + Math.floor(Math.random() * j));
  }

  /* ---------------- overlay ("please wait") ---------------- */
  var overlaySteps = null;
  function ensureOverlay() {
    if (document.getElementById("bd-overlay")) return;
    var o = document.createElement("div");
    o.id = "bd-overlay";
    o.innerHTML =
      '<div class="box">' +
        '<div class="hd">Please Wait</div>' +
        '<div class="bd">' +
          '<div><span class="spinner"></span><span id="bd-ov-msg">Processing your request&hellip;</span></div>' +
          '<div class="sub" id="bd-ov-sub">Do not press Back or refresh this page.</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(o);
  }
  function showOverlay(msg, sub) {
    ensureOverlay();
    document.getElementById("bd-ov-msg").innerHTML = msg || "Processing your request&hellip;";
    document.getElementById("bd-ov-sub").innerHTML = sub || "Do not press Back or refresh this page.";
    document.getElementById("bd-overlay").style.display = "block";
  }
  function setOverlayMsg(msg) {
    var el = document.getElementById("bd-ov-msg");
    if (el) el.innerHTML = msg;
  }
  function hideOverlay() {
    var o = document.getElementById("bd-overlay");
    if (o) o.style.display = "none";
    if (overlaySteps) { clearInterval(overlaySteps); overlaySteps = null; }
  }
  // cycle through fake "server" sub-steps while waiting
  function cycleOverlay(messages, intervalMs) {
    var i = 0;
    showOverlay(messages[0]);
    overlaySteps = setInterval(function () {
      i = (i + 1) % messages.length;
      setOverlayMsg(messages[i]);
    }, intervalMs || 900);
  }

  /* ---------------- error messaging ---------------- */
  function showErrors(list) {
    var host = document.getElementById("formErrors");
    if (!host) return;
    if (!list || !list.length) { host.innerHTML = ""; return; }
    var html = '<div class="msg msg-err"><b>The form could not be processed.</b>' +
               ' Reference the items below and resubmit.<ul>';
    for (var i = 0; i < list.length; i++) html += "<li>" + list[i] + "</li>";
    html += "</ul></div>";
    host.innerHTML = html;
    // bank-portal classic: error block at the very top, so user must scroll up
    window.scrollTo(0, 0);
  }
  function clearFieldErr() {
    var els = document.querySelectorAll(".err-field");
    for (var i = 0; i < els.length; i++) els[i].classList.remove("err-field");
  }
  function markErr(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add("err-field");
  }

  /* ---------------- chrome (header/nav/progress/footer) ----------------
     Injected per page from a PAGE config object. The progress label and
     bar are INTENTIONALLY inconsistent with the real number of steps. */
  function buildChrome(cfg) {
    cfg = cfg || {};
    var navItems = ["Overview", "Accounts", "Applications", "Payments", "Support", "Locate Us"];
    var navHtml = navItems.map(function (n) {
      var on = (n === "Applications") ? ' class="on"' : "";
      return '<a href="#"' + on + '>' + n + "</a>";
    }).join("");

    var crumb = cfg.crumb || "Applications &raquo; New Request";

    var progressHtml = "";
    if (cfg.progressLabel) {
      progressHtml =
        '<div class="progress-wrap">' +
          '<div class="plabel">' + cfg.progressLabel + '</div>' +
          '<div class="pbar"><span style="width:' + (cfg.pct || 0) + '%"></span></div>' +
          '<div class="pticks">' + (cfg.ticks || "") + '</div>' +
        '</div>';
    }

    var header =
      '<div class="util-bar">' +
        'Text Size <a class="sz">A</a><a class="sz" style="font-size:11px">A</a>' +
        '<a class="sz" style="font-size:13px">A</a> &nbsp;|&nbsp; ' +
        '<a href="#">High Contrast</a> &nbsp;|&nbsp; <a href="#">Site Map</a> &nbsp;|&nbsp; ' +
        '<a href="#">Contact</a> &nbsp;|&nbsp; <a href="#" id="bd-logout">Logout</a>' +
      '</div>' +
      '<div class="masthead">' +
        '<div class="brand">' +
          '<span class="glyph">U</span><span class="name">UNIFIED FINANCIAL</span>' +
          '<span class="sub">Online Services Portal &mdash; Retail &amp; Commercial Division</span>' +
        '</div>' +
        '<div class="secure-flag"><span class="lock">&#128274; Secure</span><br>Session ID: ' +
          sessionId() + '</div>' +
      '</div>' +
      '<div class="nav">' + navHtml + '</div>' +
      '<div class="crumb">' + crumb + '</div>' +
      progressHtml;

    var holder = document.getElementById("chrome-header");
    if (holder) holder.innerHTML = header;

    // sidebar (unrelated cramped links — adds noise)
    var side = document.getElementById("chrome-sidebar");
    if (side) {
      side.innerHTML =
        '<h4>Quick Links</h4><ul>' +
          '<li><a href="#">Open an Account</a></li>' +
          '<li><a href="#">Rates &amp; Fees</a></li>' +
          '<li><a href="#">Branch Locator</a></li>' +
          '<li><a href="#">Forms Library</a></li>' +
          '<li><a href="#">Lost Card</a></li>' +
        '</ul>' +
        '<h4>This Application</h4><ul>' +
          '<li><a href="#" id="bd-save">Save &amp; Exit</a></li>' +
          '<li><a href="#" id="bd-restart">Start Over</a></li>' +
          '<li><a href="#">Print This Page</a></li>' +
          '<li><a href="#">FAQ (Ref. 4.2)</a></li>' +
        '</ul>' +
        '<div class="promo"><b>Notice:</b> For assistance call the Service Centre. ' +
          'Standard hold times may apply. Ref. code UOSP&#8209;0007.</div>';
    }

    var foot = document.getElementById("chrome-footer");
    if (foot) {
      foot.innerHTML =
        '<div class="badges">' +
          '<span class="badge">&#128274; 256-BIT TLS</span>' +
          '<span class="badge">VERIFIED PORTAL</span>' +
          '<span class="badge">REG. AUTH. #0042-AA</span>' +
          '<span class="badge">PCI-LIKE</span>' +
        '</div>' +
        '<a href="#">Privacy Statement</a> | <a href="#">Terms of Use</a> | ' +
        '<a href="#">Accessibility</a> | <a href="#">Security Centre</a> | ' +
        '<a href="#">Cookie Preferences</a>' +
        '<div class="legal">This portal is provided for demonstration purposes only and ' +
          'is not affiliated with any financial institution. No real banking is performed. ' +
          'All figures, identifiers and documents are simulated. &copy; ' +
          new Date().getFullYear() + ' Unified Financial (Demo). Unauthorized reproduction ' +
          'of this notice is mildly discouraged. Your interaction with this page may be ' +
          'measured for usability research.</div>';
    }

    wireChromeLinks();
    if (cfg.timeout !== false) scheduleTimeout(cfg.timeoutAfter || 35000);
  }

  function sessionId() {
    var f = loadFlags();
    if (!f.sid) {
      f.sid = "X" + Math.random().toString(36).slice(2, 8).toUpperCase();
      sessionStorage.setItem(FLAG_KEY, JSON.stringify(f));
    }
    return f.sid;
  }

  function wireChromeLinks() {
    var lo = document.getElementById("bd-logout");
    if (lo) lo.onclick = function (e) {
      e.preventDefault();
      if (confirm("Are you sure you wish to end your secure session? " +
                  "Unsaved progress may be lost.")) {
        // (does nothing useful — classic)
        alert("You have not been logged out. Please close all browser windows.");
      }
    };
    var rs = document.getElementById("bd-restart");
    if (rs) rs.onclick = function (e) {
      e.preventDefault();
      if (confirm("Start the application over from the beginning?")) {
        sessionStorage.removeItem(STATE_KEY);
        sessionStorage.removeItem(FLAG_KEY);
        location.href = "index.html";
      }
    };
    var sv = document.getElementById("bd-save");
    if (sv) sv.onclick = function (e) {
      e.preventDefault();
      showOverlay("Saving your progress&hellip;");
      serverDelay(1800, 1200).then(function () {
        hideOverlay();
        alert("Your progress has been saved.\n\nReference: " + sessionId() +
              "\nNote: saved applications expire after a period of inactivity.");
      });
    };
  }

  /* ---------------- session timeout modal ----------------
     Pops up mid-task to interrupt. Recoverable: "Continue". */
  var timeoutTimer = null, countdownTimer = null;
  function scheduleTimeout(after) {
    if (timeoutTimer) clearTimeout(timeoutTimer);
    timeoutTimer = setTimeout(showTimeout, after);
  }
  function ensureTimeoutEl() {
    if (document.getElementById("bd-timeout")) return;
    var t = document.createElement("div");
    t.id = "bd-timeout";
    t.innerHTML =
      '<div class="box">' +
        '<div class="hd">Session Inactivity Warning</div>' +
        '<div class="bd">' +
          'For your security, this session will expire in ' +
          '<span class="cd" id="bd-cd">20</span> seconds.<br><br>' +
          'Would you like to remain signed in?' +
          '<div style="text-align:right;margin-top:12px">' +
            '<button id="bd-stay" class="btn-primary">Continue Session</button> ' +
            '<button id="bd-end">Sign Out</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(t);
  }
  function showTimeout() {
    ensureTimeoutEl();
    var n = 20;
    var el = document.getElementById("bd-timeout");
    var cd = document.getElementById("bd-cd");
    cd.textContent = n;
    el.style.display = "block";
    countdownTimer = setInterval(function () {
      n--; cd.textContent = n;
      if (n <= 0) {
        clearInterval(countdownTimer);
        el.style.display = "none";
        // it doesn't actually sign you out — just re-arms. (planted)
        scheduleTimeout(45000);
      }
    }, 1000);
    document.getElementById("bd-stay").onclick = function () {
      clearInterval(countdownTimer);
      el.style.display = "none";
      // "Continue" itself takes a beat
      showOverlay("Re-validating session&hellip;");
      serverDelay(1400, 900).then(function () {
        hideOverlay();
        scheduleTimeout(45000);
      });
    };
    document.getElementById("bd-end").onclick = function () {
      clearInterval(countdownTimer);
      el.style.display = "none";
      scheduleTimeout(60000);
    };
  }

  /* ---------------- navigation with fake server round-trip ---------------- */
  function go(url, overlayMsg, base, jitter, cycle) {
    if (cycle) cycleOverlay(cycle, 1000);
    else showOverlay(overlayMsg || "Processing&hellip;");
    serverDelay(base || 1800, jitter || 1200).then(function () {
      location.href = url;
    });
  }

  /* ---------------- captcha ---------------- */
  function makeCaptcha() {
    // ambiguous on purpose: mixed case, includes lookalikes
    var src = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    var s = "";
    for (var i = 0; i < 5; i++) s += src.charAt(Math.floor(Math.random() * src.length));
    return s;
  }

  /* expose */
  global.UOSP = {
    loadState: loadState,
    saveState: saveState,
    loadFlags: loadFlags,
    setFlag: setFlag,
    delay: delay,
    serverDelay: serverDelay,
    showOverlay: showOverlay,
    setOverlayMsg: setOverlayMsg,
    hideOverlay: hideOverlay,
    cycleOverlay: cycleOverlay,
    showErrors: showErrors,
    clearFieldErr: clearFieldErr,
    markErr: markErr,
    buildChrome: buildChrome,
    go: go,
    makeCaptcha: makeCaptcha,
    sessionId: sessionId
  };
})(window);
