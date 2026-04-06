/* ══════════════════════════════════════════
   RAPIDO BIKE TAXI — JAVASCRIPT
   Navigation | Validation | Interactions
   ══════════════════════════════════════════ */

'use strict';

/* ─── State ─────────────────────────────── */
const state = {
  prevScreen: null,
  currentScreen: 'splash',
  selectedRide: 'bike',
  ridePrices: { bike: '₹49', auto: '₹79', cab: '₹149' },
  rideLabels: { bike: 'Bike', auto: 'Auto', cab: 'RapidoCab' },
  phone: '',
  countdownTimer: null,
  bookingTimer: null,
};

/* ─── Screen Navigation ─────────────────── */
function navigateTo(screenId) {
  const current = document.querySelector('.screen.active');
  const next = document.getElementById('screen-' + screenId);
  if (!next || current === next) return;

  state.prevScreen = state.currentScreen;
  state.currentScreen = screenId;

  current.classList.remove('active');
  current.classList.add('exit');
  setTimeout(() => current.classList.remove('exit'), 400);

  next.classList.add('active');

  // Sync bottom nav items
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.screen === screenId);
  });
}

function goBack() {
  if (state.prevScreen) navigateTo(state.prevScreen);
  else navigateTo('home');
}

/* ─── Bottom Nav Wiring ─────────────────── */
function wireNavBars() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.screen;
      if (!target) return;
      const screenMap = { home: 'home', rides: 'my-rides', profile: 'profile' };
      navigateTo(screenMap[target] || target);
    });
  });
}

/* ─── Splash → Login ────────────────────── */
function startSplash() {
  setTimeout(() => navigateTo('login'), 2300);
}

/* ─── Phone Validation ──────────────────── */
function validatePhone(val) {
  return /^[6-9]\d{9}$/.test(val);
}

function setupLogin() {
  const input  = document.getElementById('phone-input');
  const errMsg = document.getElementById('phone-error');
  const btnOtp = document.getElementById('btn-otp');

  // Live format – digits only
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '');
    if (errMsg.classList.contains('show') && validatePhone(input.value)) {
      errMsg.classList.remove('show');
    }
  });

  btnOtp.addEventListener('click', () => {
    const val = input.value.trim();
    if (!validatePhone(val)) {
      errMsg.classList.add('show');
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 600);
      return;
    }

    state.phone = val;
    errMsg.classList.remove('show');

    // Show OTP screen
    const display = document.getElementById('otp-number');
    display.textContent = `+91 ${val.slice(0, 5)} ${val.slice(5)}`;

    navigateTo('otp');
    startOtpCountdown();
    setTimeout(() => focusFirstOtp(), 400);
  });
}

/* ─── OTP Handling ──────────────────────── */
function setupOtp() {
  const boxes   = document.querySelectorAll('.otp-box');
  const btnVerify = document.getElementById('btn-verify');
  const resendBtn = document.getElementById('resend-btn');

  boxes.forEach((box, i) => {
    box.addEventListener('input', (e) => {
      box.value = box.value.replace(/\D/g, '');
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        boxes[i - 1].focus();
      }
    });
  });

  btnVerify.addEventListener('click', () => {
    // For demo: any 4-digit OTP passes
    const otp = Array.from(boxes).map(b => b.value).join('');
    if (otp.length < 4) {
      boxes.forEach(b => { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 500); });
      return;
    }

    btnVerify.innerHTML = '<div class="spinner"></div> Verifying…';
    btnVerify.disabled = true;

    setTimeout(() => {
      btnVerify.innerHTML = '<span>Verified!</span> <i class="fa-solid fa-check"></i>';
      setTimeout(() => {
        clearOtpBoxes(boxes);
        navigateTo('home');
        btnVerify.innerHTML = '<span>Verify &amp; Continue</span> <i class="fa-solid fa-check"></i>';
        btnVerify.disabled = false;
      }, 700);
    }, 1200);
  });

  resendBtn.addEventListener('click', () => {
    if (resendBtn.dataset.active === 'true') {
      clearOtpBoxes(boxes);
      startOtpCountdown();
    }
  });
}

function focusFirstOtp() {
  const first = document.querySelector('.otp-box');
  if (first) first.focus();
}

function clearOtpBoxes(boxes) {
  boxes.forEach(b => { b.value = ''; });
  boxes[0].focus();
}

function startOtpCountdown() {
  const countEl = document.getElementById('countdown');
  const btn = document.getElementById('resend-btn');
  let sec = 30;
  clearInterval(state.countdownTimer);
  btn.dataset.active = 'false';
  countEl.closest('.resend-txt').querySelector('.link-btn').style.opacity = '.5';

  state.countdownTimer = setInterval(() => {
    sec--;
    countEl.textContent = sec;
    if (sec <= 0) {
      clearInterval(state.countdownTimer);
      btn.dataset.active = 'true';
      btn.innerHTML = 'Resend OTP';
      btn.style.opacity = '1';
    }
  }, 1000);
}

/* ─── Home Screen Interactions ──────────── */
function setupHome() {
  // Book Ride button
  document.getElementById('btn-book').addEventListener('click', () => {
    const pickup = document.getElementById('pickup-input').value.trim();
    const drop   = document.getElementById('drop-input').value.trim();

    if (!drop) {
      document.getElementById('drop-input').focus();
      shakeElement(document.querySelector('.location-card'));
      return;
    }

    // Sync route summary
    document.getElementById('rs-pickup').textContent = pickup || 'Current Location';
    document.getElementById('rs-drop').textContent   = drop;

    navigateTo('rides-option');
  });

  // Swap button
  document.getElementById('swap-btn').addEventListener('click', () => {
    const p = document.getElementById('pickup-input');
    const d = document.getElementById('drop-input');
    [p.value, d.value] = [d.value, p.value];
  });
}

/* ─── Quick Fill Destination ────────────── */
function fillDrop(place) {
  document.getElementById('drop-input').value = place + ', Hyderabad';
}

/* ─── Ride Selection ────────────────────── */
function selectRide(card) {
  // Deselect all
  document.querySelectorAll('.ride-card').forEach(c => c.classList.remove('selected'));

  // Select clicked
  card.classList.add('selected');
  state.selectedRide = card.dataset.ride;

  // Update confirm button text + fare
  const label = state.rideLabels[state.selectedRide];
  const price = state.ridePrices[state.selectedRide];
  document.getElementById('btn-confirm').innerHTML =
    `<span>Confirm ${label}</span><i class="fa-solid fa-arrow-right"></i>`;
  document.getElementById('fare-val').textContent = price;

  // Pulse animation
  card.style.transform = 'scale(0.97)';
  setTimeout(() => card.style.transform = '', 150);
}

/* ─── Confirm Booking ───────────────────── */
function setupConfirm() {
  document.getElementById('btn-confirm').addEventListener('click', () => {
    const btn = document.getElementById('btn-confirm');
    btn.innerHTML = '<div class="spinner"></div> Booking…';
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = '<span>Ride Booked!</span> <i class="fa-solid fa-check"></i>';

      setTimeout(() => {
        // Sync fare
        document.getElementById('conf-fare').textContent = state.ridePrices[state.selectedRide];
        navigateTo('confirm');
        startBookingAnimation();

        btn.innerHTML = `<span>Confirm ${state.rideLabels[state.selectedRide]}</span><i class="fa-solid fa-arrow-right"></i>`;
        btn.disabled = false;
      }, 600);
    }, 1500);
  });
}

/* ─── Booking Progress Animation ────────── */
function startBookingAnimation() {
  // Reset steps
  ['step-1','step-2','step-3','step-4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.className = 'step'; }
  });

  const titleEl = document.getElementById('status-title');
  const subEl   = document.getElementById('status-sub');

  const steps = [
    { delay: 0,    step: 'step-1', done: [],         active: 'step-1', title: 'Finding you a ride…', sub: 'Connecting with nearby captains' },
    { delay: 1500, step: 'step-1', done: ['step-1'],  active: 'step-2', title: 'Captain found! 🎉',    sub: 'Ravi Kumar is on his way' },
    { delay: 3500, step: 'step-2', done: ['step-1','step-2'], active: 'step-3', title: 'Captain is on the way', sub: 'Arriving in ~4 minutes' },
  ];

  steps.forEach(({ delay, done, active, title, sub }) => {
    setTimeout(() => {
      done.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.className = 'step done';
      });
      const activeEl = document.getElementById(active);
      if (activeEl) activeEl.className = 'step active';
      if (titleEl) titleEl.textContent = title;
      if (subEl)   subEl.textContent   = sub;
    }, delay);
  });
}

/* ─── Utility: Shake ────────────────────── */
function shakeElement(el) {
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shake .5s ease';
  setTimeout(() => el.style.animation = '', 500);
}

/* ─── Menu item ripple ──────────────────── */
function setupMenuItems() {
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function (e) {
      const ripple = document.createElement('div');
      ripple.className = 'menu-ripple';
      const rect = this.getBoundingClientRect();
      ripple.style.cssText = `
        position:absolute; border-radius:50%;
        background:rgba(255,215,0,.35);
        width:100px; height:100px;
        left:${e.clientX - rect.left - 50}px;
        top:${e.clientY - rect.top - 50}px;
        transform:scale(0); animation:rippleIn .5s ease forwards;
        pointer-events:none;
      `;
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    });
  });
}

/* ─── CSS Animations (injected) ─────────── */
function injectCssAnimations() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%      { transform: translateX(-8px); }
      40%      { transform: translateX(8px); }
      60%      { transform: translateX(-6px); }
      80%      { transform: translateX(6px); }
    }
    @keyframes rippleIn {
      to { transform: scale(4); opacity: 0; }
    }
    .otp-box.shake, .phone-field.shake {
      animation: shake .5s ease !important;
      border-color: #ef4444 !important;
    }
  `;
  document.head.appendChild(style);
}

/* ─── Init ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  injectCssAnimations();
  wireNavBars();
  startSplash();
  setupLogin();
  setupOtp();
  setupHome();
  setupConfirm();
  setupMenuItems();

  // Pre-select bike card on options screen
  const bikeCard = document.querySelector('.ride-card[data-ride="bike"]');
  if (bikeCard) bikeCard.classList.add('selected');
});