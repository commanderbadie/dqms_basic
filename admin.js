/*************************************
 DQMS – ADMIN PANEL (STABLE + PRIORITY + COLORS)
*************************************/

import {
  listenQueue,
  firebaseCallNext,
  firebaseUpdatePatientPriority
} from "./firebase-queues.js";

/* ===============================
   UI ELEMENTS
=============================== */
const tableBody = document.getElementById("queueTable");
const loadBtn = document.getElementById("loadBtn");
const callNextBtn = document.getElementById("callNextBtn");

let currentQueueKey = null;

/* ===============================
   LOAD QUEUE (MATCH FIREBASE)
=============================== */
loadBtn.addEventListener("click", () => {
  // 🔥 MUST MATCH EXISTING FIREBASE NODE
  currentQueueKey = "DQMS_QUEUE_OPD_GEN_GEN1";

  console.log("ADMIN LISTENING TO:", currentQueueKey);

  listenQueue(currentQueueKey, renderQueue);
});

/* ===============================
   RENDER QUEUE
=============================== */
function renderQueue(queue) {
  tableBody.innerHTML = "";

  if (!queue || queue.length === 0) {
    tableBody.innerHTML =
      `<tr><td colspan="6">No patients</td></tr>`;
    return;
  }

  queue.forEach((p, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.name || "-"}</td>
      <td>${p.phone}</td>
      <td class="${p.priority}">${p.priority}</td>
      <td>${p.status}</td>
      <td>
        <button data-phone="${p.phone}" data-priority="Normal">N</button>
        <button data-phone="${p.phone}" data-priority="Moderate">M</button>
        <button data-phone="${p.phone}" data-priority="Critical">C</button>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

/* ===============================
   PRIORITY HANDLER
=============================== */
tableBody.addEventListener("click", async (e) => {
  const btn = e.target;
  const phone = btn.dataset.phone;
  const priority = btn.dataset.priority;

  if (!phone || !priority || !currentQueueKey) return;

  await firebaseUpdatePatientPriority(
    currentQueueKey,
    phone,
    priority
  );
});

/* ===============================
   CALL NEXT
=============================== */
callNextBtn.addEventListener("click", async () => {
  if (!currentQueueKey) {
    alert("Load queue first");
    return;
  }

  const next = await firebaseCallNext(currentQueueKey);

  if (!next) {
    alert("No waiting patients");
  }
});
