// ISAP 2027 site script: mobile menu, live key-date states, calendar tool, sign-up link.

// Paste the mailing-list sign-up link here once it exists, for example the
// MSU Listserv subscribe page or a Microsoft Forms link. Empty = "opens soon".
var SUBSCRIBE_URL = '';

var SITE = 'https://isap2027.msu.edu';
var VENUE = 'Kellogg Hotel & Conference Center, 219 S. Harrison Road, East Lansing, MI 48824';

// ---------- Mobile menu (without JavaScript the menu simply stays open) ----------
var btn = document.querySelector('.menu-btn');
var nav = document.getElementById('site-nav');
if (btn && nav) {
  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('open', !open);
  });
}

// ---------- Key-date states: close the breaker of every passed date, mark the next ----------
var now = new Date();
document.querySelectorAll('[data-dates]').forEach(function (list) {
  var next = null;
  list.querySelectorAll('[data-date]').forEach(function (item) {
    var end = new Date(item.getAttribute('data-date') + 'T23:59:59');
    if (end < now) item.classList.add('done');
    else if (!next) { next = item; item.classList.add('next'); }
  });
});

// ---------- Sign-up link ----------
document.querySelectorAll('[data-subscribe]').forEach(function (a) {
  if (SUBSCRIBE_URL) a.href = SUBSCRIBE_URL;
  else { a.textContent = 'Mailing list opens soon'; a.removeAttribute('href'); a.classList.add('off'); }
});

// ---------- Calendar tool (dates page) ----------
// Each row: data-cal="id" data-start="YYYY-MM-DD" (optional) data-date="YYYY-MM-DD" data-title="..."
function compact(d) { return d.replace(/-/g, ''); }
function dayAfter(d) {
  var t = new Date(d + 'T12:00:00Z');
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10);
}
function icsText(s) { return s.replace(/([\\,;])/g, '\\$1'); }

function readEvent(row) {
  var end = row.getAttribute('data-date');
  var isConf = row.hasAttribute('data-start');
  return {
    id: row.getAttribute('data-cal'),
    start: row.getAttribute('data-start') || end,
    end: end,
    title: 'ISAP 2027: ' + row.getAttribute('data-title'),
    where: isConf ? VENUE : '',
    remind: !isConf
  };
}

function vevent(e) {
  var lines = [
    'BEGIN:VEVENT',
    'UID:' + e.id + '@isap2027.msu.edu',
    'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
    'DTSTART;VALUE=DATE:' + compact(e.start),
    'DTEND;VALUE=DATE:' + compact(dayAfter(e.end)),
    'SUMMARY:' + icsText(e.title),
    'URL:' + SITE + '/dates/'
  ];
  if (e.where) lines.push('LOCATION:' + icsText(e.where));
  if (e.remind) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsText(e.title), 'TRIGGER:-P7D', 'END:VALARM');
  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

function downloadIcs(events, name) {
  var body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ISAP 2027//Key Dates//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:ISAP 2027']
    .concat(events.map(vevent), ['END:VCALENDAR']).join('\r\n');
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

var rows = Array.prototype.slice.call(document.querySelectorAll('[data-cal]'));
rows.forEach(function (row) {
  var e = readEvent(row);
  var q = encodeURIComponent;
  var cell = row.querySelector('td.cal');
  if (!cell) return;
  var google = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + q(e.title) +
    '&dates=' + compact(e.start) + '/' + compact(dayAfter(e.end)) +
    '&details=' + q(SITE + '/dates/') + (e.where ? '&location=' + q(e.where) : '');
  var outlook = 'https://outlook.office.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&allday=true' +
    '&subject=' + q(e.title) + '&startdt=' + e.start + '&enddt=' + dayAfter(e.end) +
    '&body=' + q(SITE + '/dates/') + (e.where ? '&location=' + q(e.where) : '');
  cell.innerHTML = '<a target="_blank" rel="noopener" href="' + google + '">Google</a>' +
    '<a target="_blank" rel="noopener" href="' + outlook + '">Outlook</a>' +
    '<a href="#" data-one>.ics</a>';
  cell.querySelector('[data-one]').addEventListener('click', function (ev) {
    ev.preventDefault();
    downloadIcs([e], 'isap2027-' + e.id + '.ics');
  });
});

var all = document.querySelector('[data-cal-all]');
if (all && rows.length) {
  all.addEventListener('click', function (ev) {
    ev.preventDefault();
    downloadIcs(rows.map(readEvent), 'isap2027-dates.ics');
  });
}

// Subscription keeps calendars in step with any deadline change. Calendar apps
// need the live web address, so the link is built from the current host.
var sub = document.querySelector('[data-cal-sub]');
if (sub && location.protocol.indexOf('http') === 0) {
  sub.href = 'webcal://' + location.host + location.pathname.replace(/dates\/.*$/, '') + 'assets/isap2027-dates.ics';
}
