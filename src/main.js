const calendarEl = document.getElementById("calendar");
const clockEl = document.getElementById("clock");

const locale = navigator.language || "en-US";

function firstDayOfWeek() {
  // Intl.Locale weekInfo returns 1 (Mon) .. 7 (Sun); convert to JS 0 (Sun) .. 6 (Sat).
  try {
    const loc = new Intl.Locale(locale);
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info?.firstDay) return info.firstDay % 7;
  } catch {}
  return 0;
}

function weekendDays() {
  try {
    const loc = new Intl.Locale(locale);
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info?.weekend) return info.weekend.map((d) => d % 7);
  } catch {}
  return [0, 6];
}

const weekStart = firstDayOfWeek();
const weekend = weekendDays();

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderCalendar(now) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const frag = document.createDocumentFragment();

  const title = el("div", "cal-title");
  title.append(
    new Intl.DateTimeFormat(locale, { month: "long" }).format(now),
    el("span", "year", String(year)),
  );
  frag.append(title);

  const dowFmt = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  // 2023-01-01 was a Sunday.
  for (let i = 0; i < 7; i++) {
    const dow = (weekStart + i) % 7;
    frag.append(el("div", "cal-dow", dowFmt.format(new Date(2023, 0, 1 + dow))));
  }

  const first = new Date(year, month, 1);
  const offset = (first.getDay() - weekStart + 7) % 7;
  // Always render 6 weeks so the layout never jumps between months.
  for (let i = 0; i < 42; i++) {
    const date = new Date(year, month, 1 - offset + i);
    const cell = el("div", "cal-day", String(date.getDate()));
    if (date.getMonth() !== month) cell.classList.add("other");
    else if (date.getDate() === today) cell.classList.add("today");
    else if (weekend.includes(date.getDay())) cell.classList.add("weekend");
    frag.append(cell);
  }

  calendarEl.replaceChildren(frag);
}

const timeFmt = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });

function renderClock(now) {
  const parts = timeFmt.formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour");
  const minute = get("minute");
  const period = get("dayPeriod");

  const frag = document.createDocumentFragment();
  frag.append(hour, el("span", "colon", ":"), minute);
  if (period) frag.append(el("span", "period", period));
  clockEl.classList.toggle("has-period", !!period);
  clockEl.replaceChildren(frag);
  clockEl.dateTime = now.toISOString();
}

let lastDay = null;

function render() {
  const now = new Date();
  renderClock(now);
  const dayKey = now.toDateString();
  if (dayKey !== lastDay) {
    lastDay = dayKey;
    renderCalendar(now);
  }
  return now;
}

function tick() {
  const now = render();
  // Schedule the next update just after the start of the next minute.
  setTimeout(tick, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
}

tick();

// Timers can be throttled while hidden; refresh immediately when visible again.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) render();
});

// Up/Down arrow keys swap the order of the calendar and clock.
const ambientEl = document.querySelector(".ambient");
const SWAP_KEY = "ambient:swapped";

function setSwapped(swapped) {
  ambientEl.classList.toggle("swapped", swapped);
  try {
    localStorage.setItem(SWAP_KEY, swapped ? "1" : "0");
  } catch {}
}

try {
  ambientEl.classList.toggle("swapped", localStorage.getItem(SWAP_KEY) === "1");
} catch {}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    setSwapped(!ambientEl.classList.contains("swapped"));
  }
});
