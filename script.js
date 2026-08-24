const EVENT_CONFIG = {
  title: "A Baby Shower for Our Little One",
  summary: "Join us for a soft afternoon baby shower in Stockholm. Exact time and location will be shared with confirmed guests.",
  date: "Saturday, 3 October 2026",
  time: "Lunch and afternoon",
  locationName: "Stockholm",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Stockholm",
  rsvpEndpoint: "https://script.google.com/macros/s/AKfycbyeAZEJr-qUx0cG6pnVY7UZbmtad7Ec69uf_wNm5FeOtCCmFutx1hmxhHUZ10ha7niqBg/exec",
  statsEndpoint: "https://script.google.com/macros/s/AKfycbyeAZEJr-qUx0cG6pnVY7UZbmtad7Ec69uf_wNm5FeOtCCmFutx1hmxhHUZ10ha7niqBg/exec",
  localStorageKey: "baby-shower-rsvps"
};

const sampleResponses = [
  { name: "Demo Guest", status: "yes", guests: 2, children: 0, dietary: "Vegetarian", message: "So excited!", createdAt: "2026-08-23T10:00:00.000Z" },
  { name: "Sample Family", status: "maybe", guests: 3, children: 1, dietary: "", message: "", createdAt: "2026-08-23T10:10:00.000Z" }
];

document.addEventListener("DOMContentLoaded", () => {
  applyEventConfig();
  wireRsvpForm();
  wireConfirmationModal();

  if (document.body.classList.contains("stats-page")) {
    renderStats();
  }
});

function applyEventConfig() {
  setText("event-title", EVENT_CONFIG.title);
  setText("event-summary", EVENT_CONFIG.summary);
  setText("event-date", EVENT_CONFIG.date);
  setText("event-time", EVENT_CONFIG.time);
  setText("event-location", EVENT_CONFIG.locationName);

  const mapsLink = document.getElementById("maps-link");
  if (mapsLink) mapsLink.href = EVENT_CONFIG.mapsUrl;
}

function wireRsvpForm() {
  const form = document.getElementById("rsvp");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.getElementById("form-status");
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.guests = Number(payload.guests || 1);
    payload.children = Number(payload.children || 0);
    payload.createdAt = new Date().toISOString();

    try {
      if (EVENT_CONFIG.rsvpEndpoint) {
        await fetch(EVENT_CONFIG.rsvpEndpoint, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        });
      } else {
        saveLocalResponse(payload);
      }

      form.reset();
      status.textContent = "Thank you. Your RSVP has been saved.";
      showConfirmationModal();
    } catch (error) {
      status.textContent = "Something went wrong. Please try again or message the host.";
    }
  });
}

function wireConfirmationModal() {
  const modal = document.getElementById("confirmation-modal");
  if (!modal) return;

  modal.querySelectorAll("[data-close-confirmation]").forEach((element) => {
    element.addEventListener("click", hideConfirmationModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      hideConfirmationModal();
    }
  });
}

function showConfirmationModal() {
  const modal = document.getElementById("confirmation-modal");
  if (!modal) return;

  modal.hidden = false;
  const button = modal.querySelector("button");
  if (button) button.focus();
}

function hideConfirmationModal() {
  const modal = document.getElementById("confirmation-modal");
  if (!modal) return;

  modal.hidden = true;
  const form = document.getElementById("rsvp");
  const firstInput = form && form.querySelector("input, textarea, button");
  if (firstInput) firstInput.focus();
}

async function renderStats() {
  const responses = await loadResponses();
  const counts = responses.reduce((totals, response) => {
    const status = response.status || "maybe";
    totals[status] = (totals[status] || 0) + 1;
    if (status === "yes") {
      totals.guests += Number(response.guests || 0);
      totals.children += Number(response.children || 0);
    }
    return totals;
  }, { yes: 0, maybe: 0, no: 0, guests: 0, children: 0 });

  setText("metric-yes", counts.yes);
  setText("metric-maybe", counts.maybe);
  setText("metric-no", counts.no);
  setText("metric-guests", counts.guests + counts.children);

  const totalResponses = Math.max(responses.length, 1);
  updateBar("yes", counts.yes, totalResponses);
  updateBar("maybe", counts.maybe, totalResponses);
  updateBar("no", counts.no, totalResponses);
  renderTable(responses);
  wireCsvDownload(responses);

  if (EVENT_CONFIG.statsEndpoint) {
    setText("stats-source", "Showing live RSVP stats from the configured endpoint.");
  }
}

async function loadResponses() {
  if (EVENT_CONFIG.statsEndpoint) {
    return loadJsonp(EVENT_CONFIG.statsEndpoint);
  }

  const saved = JSON.parse(localStorage.getItem(EVENT_CONFIG.localStorageKey) || "[]");
  return [...sampleResponses, ...saved];
}

function saveLocalResponse(payload) {
  const saved = JSON.parse(localStorage.getItem(EVENT_CONFIG.localStorageKey) || "[]");
  saved.push(payload);
  localStorage.setItem(EVENT_CONFIG.localStorageKey, JSON.stringify(saved));
}

function loadJsonp(endpoint) {
  return new Promise((resolve, reject) => {
    const callbackName = `rsvpStats${Date.now()}`;
    const url = new URL(endpoint);
    url.searchParams.set("callback", callbackName);

    const script = document.createElement("script");
    window[callbackName] = (data) => {
      delete window[callbackName];
      script.remove();
      resolve(Array.isArray(data) ? data : []);
    };
    script.onerror = () => {
      delete window[callbackName];
      script.remove();
      reject(new Error("Unable to load stats"));
    };
    script.src = url.toString();
    document.body.appendChild(script);
  });
}

function updateBar(key, count, total) {
  const percent = Math.round((count / total) * 100);
  const bar = document.getElementById(`bar-${key}`);
  if (bar) bar.style.width = `${percent}%`;
  setText(`bar-${key}-label`, `${percent}%`);
}

function renderTable(responses) {
  const table = document.getElementById("responses-table");
  if (!table) return;

  table.innerHTML = responses.map((response) => `
    <tr>
      <td>${escapeHtml(response.name || "")}</td>
      <td>${escapeHtml(formatStatus(response.status))}</td>
      <td>${Number(response.guests || 0)}</td>
      <td>${Number(response.children || 0)}</td>
      <td>${escapeHtml(formatDate(response.createdAt))}</td>
    </tr>
  `).join("");
}

function wireCsvDownload(responses) {
  const button = document.getElementById("download-csv");
  if (!button) return;

  button.addEventListener("click", () => {
    const rows = [
      ["name", "status", "guests", "children", "createdAt"],
      ...responses.map((response) => [
        response.name,
        response.status,
        response.guests,
        response.children,
        response.createdAt
      ])
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "baby-shower-rsvps.csv";
    link.click();
    URL.revokeObjectURL(url);
  });
}

function csvCell(value = "") {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function formatStatus(status = "") {
  return ({ yes: "Attending", maybe: "Maybe", no: "Declined" })[status] || status;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
