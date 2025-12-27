/*************************************************
 DQMS – CLEAN PATIENT PORTAL CORE (FIREBASE)
*************************************************/

import { firebaseEnqueuePatient } from "./firebase-queues.js";

/* ===============================
   MASTER DATA
=============================== */
const OPD_CLINICS = [
  { id: "GEN", name: "General Medicine" },
  { id: "CARD", name: "Cardiology" },
  { id: "ORTHO", name: "Orthopedics" },
  { id: "PED", name: "Pediatrics" },
  { id: "GYN", name: "Gynecology & Obstetrics" },
  { id: "NEURO", name: "Neurology" },
  { id: "DERM", name: "Dermatology" }
];

/* ===============================
   APP INIT
=============================== */
document.addEventListener("DOMContentLoaded", () => {

  /* SPLASH */
  const splash = document.getElementById("splash");
  const app = document.getElementById("app");
  const barFill = document.getElementById("barFill");
  const barPct = document.getElementById("barPct");

  let p = 0;
  const loader = setInterval(() => {
    p += 10;
    barFill.style.width = p + "%";
    barPct.textContent = p + "%";
    if (p >= 100) {
      clearInterval(loader);
      splash.remove();
      app.classList.remove("hidden");
    }
  }, 100);

  /* SERVICE SELECTION */
  const btnED = document.getElementById("btnED");
  const btnOPD = document.getElementById("btnOPD");
  const clinicSection = document.getElementById("clinicSection");
  const clinicSelect = document.getElementById("clinicSelect");

  let selectedDepartment = null;
  let selectedClinic = null;

  btnED.onclick = () => {
    selectedDepartment = "ED";
    selectedClinic = null;
    clinicSection.classList.add("hidden");
    alert("Emergency Department selected");
  };

  btnOPD.onclick = () => {
    selectedDepartment = "OPD";
    clinicSection.classList.remove("hidden");
  };

  OPD_CLINICS.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    clinicSelect.appendChild(opt);
  });

  clinicSelect.onchange = () => {
    selectedClinic = clinicSelect.value;
  };

  /* OTP (EmailJS) */
  const SERVICE_ID = "service_2exlbfa";
  const TEMPLATE_ID = "template_pm66rhz";

  let currentOTP = null;
  let otpTime = 0;

  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async function sendOTP(email) {
    currentOTP = generateOTP();
    otpTime = Date.now();
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, { email, otp: currentOTP });
  }

  function verifyOTP(input) {
    return (
      currentOTP &&
      Date.now() - otpTime < 120000 &&
      input === currentOTP
    );
  }

  /* FLOW */
  const startBtn = document.getElementById("startBtn");
  const otpSection = document.getElementById("otpSection");

  startBtn.onclick = () => {
    if (!selectedDepartment) {
      alert("Select hospital service first");
      return;
    }
    if (selectedDepartment === "OPD" && !selectedClinic) {
      alert("Select OPD clinic");
      return;
    }
    const phone = document.getElementById("apptPhone").value.trim();
    if (!/^\d{10}$/.test(phone)) {
      alert("Enter valid phone number");
      return;
    }
    otpSection.classList.remove("hidden");
  };

  document.getElementById("sendOtpBtn").onclick = async () => {
    const email = document.getElementById("apptEmail").value.trim();
    if (!email.includes("@")) {
      alert("Enter valid email");
      return;
    }
    await sendOTP(email);
    alert("OTP sent");
  };

  document.getElementById("verifyOtpBtn").onclick = async () => {
    const otp = document.getElementById("otpInput").value.trim();
    if (!verifyOTP(otp)) {
      alert("Invalid or expired OTP");
      return;
    }

    const phone = document.getElementById("apptPhone").value.trim();

    /* 🔑 QUEUE KEY — MUST MATCH ADMIN */
    const doctorId =
      selectedDepartment === "ED" ? "ED1" : "GEN1";

    const queueKey =
      selectedDepartment === "ED"
        ? `DQMS_QUEUE_ED_${doctorId}`
        : `DQMS_QUEUE_OPD_${selectedClinic}_${doctorId}`;

    /* 🔥 FIREBASE ENQUEUE (THE MISSING PIECE) */
    await firebaseEnqueuePatient(queueKey, {
      phone,
      name: document.getElementById("patientName").value.trim(),
      age: document.getElementById("patientAge").value,
      gender: document.getElementById("patientGender").value,
      priority: selectedDepartment === "ED" ? "Critical" : "Normal"
    });

    document.getElementById("success").classList.remove("hidden");

    document.getElementById("queueInfo").innerHTML = `
      Department: ${selectedDepartment}<br/>
      Clinic: ${selectedClinic || "—"}<br/>
      Status: Waiting
    `;
  };
});
