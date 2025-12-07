// assets/js/custom.js

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("feedbackForm");
  const resultsDiv = document.getElementById("form-results");
  const submitBtn = document.getElementById("feedbackSubmit");

  if (!form || !resultsDiv || !submitBtn) return;

  // Visi laukai
  const fields = {
    firstName: document.getElementById("firstName"),
    lastName: document.getElementById("lastName"),
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    address: document.getElementById("address"),
    q1: document.getElementById("q1"),
    q2: document.getElementById("q2"),
    q3: document.getElementById("q3"),
  };

  // Klaidos saugykla
  const errors = {
    firstName: "Privalomas laukas",
    lastName: "Privalomas laukas",
    email: "Privalomas laukas",
    phone: "Privalomas laukas",
    address: "Privalomas laukas",
    q1: "Privalomas laukas",
    q2: "Privalomas laukas",
    q3: "Privalomas laukas",
  };

  // Helperis HTML escapinimui
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ======= SĖKMĖS POPUPAS =======
  const popup = document.createElement("div");
  popup.id = "form-success-popup";
  popup.textContent = "Duomenys pateikti sėkmingai!";
  Object.assign(popup.style, {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    padding: "12px 18px",
    backgroundColor: "#16a34a",
    color: "#ffffff",
    borderRadius: "10px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
    fontFamily: "Mulish, system-ui, sans-serif",
    fontSize: "14px",
    opacity: "0",
    transform: "translateY(20px)",
    transition: "opacity 0.3s ease, transform 0.3s ease",
    zIndex: "99999",
  });
  document.body.appendChild(popup);

  function showSuccessPopup(message) {
    if (message) popup.textContent = message;
    popup.style.opacity = "1";
    popup.style.transform = "translateY(0)";
    setTimeout(() => {
      popup.style.opacity = "0";
      popup.style.transform = "translateY(20px)";
    }, 3000);
  }

  // ======= KLAIDŲ ATVAIZDAVIMAS =======
  function getFieldWrapper(input) {
    return (
      input.closest(".col-md-6") ||
      input.closest(".col-md-4") ||
      input.closest(".col-md-12") ||
      input.parentElement
    );
  }

  function setError(fieldName, message) {
    const input = fields[fieldName];
    const wrapper = getFieldWrapper(input);
    if (!wrapper) return;

    errors[fieldName] = message;

    input.classList.add("is-invalid");
    input.classList.remove("is-valid");

    let errorEl = wrapper.querySelector(".field-error");
    if (!errorEl) {
      errorEl = document.createElement("div");
      errorEl.className = "field-error";
      errorEl.style.color = "#f97373";
      errorEl.style.fontSize = "0.85rem";
      errorEl.style.marginTop = "4px";
      wrapper.appendChild(errorEl);
    }
    errorEl.textContent = message;

    updateSubmitState();
  }

  function clearError(fieldName) {
    const input = fields[fieldName];
    const wrapper = getFieldWrapper(input);
    if (!wrapper) return;

    errors[fieldName] = null;

    input.classList.remove("is-invalid");
    input.classList.add("is-valid");

    const errorEl = wrapper.querySelector(".field-error");
    if (errorEl) {
      errorEl.textContent = "";
    }

    updateSubmitState();
  }

  function updateSubmitState() {
    const hasErrors = Object.values(errors).some(
      (msg) => msg && msg.length > 0
    );
    submitBtn.disabled = hasErrors;
  }

  // ======= VALIDACIJOS FUNKCIJOS =======

  function validateFirstName() {
    const value = fields.firstName.value.trim();
    if (!value) {
      setError("firstName", "Vardas privalomas");
      return;
    }
    const re = /^[A-Za-zÀ-žĄąČčĘęĖėĮįŠšŲųŪūŽž\s-]+$/;
    if (!re.test(value)) {
      setError("firstName", "Vardas turi būti tik iš raidžių");
      return;
    }
    clearError("firstName");
  }

  function validateLastName() {
    const value = fields.lastName.value.trim();
    if (!value) {
      setError("lastName", "Pavardė privaloma");
      return;
    }
    const re = /^[A-Za-zÀ-žĄąČčĘęĖėĮįŠšŲųŪūŽž\s-]+$/;
    if (!re.test(value)) {
      setError("lastName", "Pavardė turi būti tik iš raidžių");
      return;
    }
    clearError("lastName");
  }

  function validateEmail() {
    const value = fields.email.value.trim();
    if (!value) {
      setError("email", "El. paštas privalomas");
      return;
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) {
      setError("email", "Neteisingas el. pašto formatas");
      return;
    }
    clearError("email");
  }

  function validateAddress() {
    const value = fields.address.value.trim();
    if (!value) {
      setError("address", "Adresas privalomas");
      return;
    }
    if (value.length < 5) {
      setError("address", "Adresas per trumpas");
      return;
    }
    clearError("address");
  }

  function validateRatingField(fieldName) {
    const input = fields[fieldName];
    const value = input.value.trim();
    if (!value) {
      setError(fieldName, "Įveskite vertinimą (1–10)");
      return;
    }
    const num = Number(value);
    if (isNaN(num) || num < 1 || num > 10) {
      setError(fieldName, "Vertinimas turi būti 1–10");
      return;
    }
    clearError(fieldName);
  }

  function validateQ1() {
    validateRatingField("q1");
  }
  function validateQ2() {
    validateRatingField("q2");
  }
  function validateQ3() {
    validateRatingField("q3");
  }

  // ======= TELEFONAS – FORMATAVIMAS TIK „BLUR“, ĮVESTI GALI NORMALIAI =======

  // normalizuoja ir apkarpo, grąžina objektą
  function normalizePhone(raw) {
    let digits = raw.replace(/\D/g, ""); // tik skaitmenys

    if (!digits) {
      return { ok: false, formatted: raw, message: "Telefono numeris privalomas" };
    }

    // jei prasideda 3706... paliekam 6...
    if (digits.startsWith("370")) {
      digits = digits.slice(3);
    }

    // jei prasideda 86 ar 8 – į 6...
    if (digits.startsWith("86")) {
      digits = "6" + digits.slice(2);
    } else if (digits.startsWith("8")) {
      digits = "6" + digits.slice(1);
    }

    if (!digits.startsWith("6")) {
      return {
        ok: false,
        formatted: raw,
        message: "Telefono numeris turi prasidėti 6",
      };
    }

    // reikia 8 skaitmenų: 6xx xxxxx
    if (digits.length < 8) {
      return {
        ok: false,
        formatted: raw,
        message: "Telefono numeris per trumpas (turi būti 8 skaitmenys po 6)",
      };
    }
    if (digits.length > 8) {
      digits = digits.slice(0, 8);
    }

    const part1 = digits.slice(0, 4); // 6xxx
    const part2 = digits.slice(4); // xxxxx

    const formatted = `+370 ${part1} ${part2}`;
    return { ok: true, formatted, message: "" };
  }

  function validatePhone() {
    const raw = fields.phone.value;
    const { ok, formatted, message } = normalizePhone(raw);

    if (!ok) {
      setError("phone", message);
      return;
    }

    // jei OK – užrašom gražiu formatu ir nuimam klaidą
    fields.phone.value = formatted;
    clearError("phone");
  }

  // ======= REAL-TIME EVENTAI =======

  // Visi, išskyrus telefoną
  fields.firstName.addEventListener("input", validateFirstName);
  fields.lastName.addEventListener("input", validateLastName);
  fields.email.addEventListener("input", validateEmail);
  fields.address.addEventListener("input", validateAddress);
  fields.q1.addEventListener("input", validateQ1);
  fields.q2.addEventListener("input", validateQ2);
  fields.q3.addEventListener("input", validateQ3);

  // Telefonas – žmogus rašo kaip nori, mes formatuojam tik kai išeina iš lauko
  fields.phone.addEventListener("blur", validatePhone);

  // Iniciali validacija (kad submit būtų disabled iš pradžių)
  function runInitialValidation() {
    validateFirstName();
    validateLastName();
    validateEmail();
    validateAddress();
    validateQ1();
    validateQ2();
    validateQ3();
    validatePhone();
  }
  runInitialValidation();

  // ======= FORMOS SUBMIT – PRIVALOMA UŽDUOTIS =======
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    // paskutinė patikra
    validateFirstName();
    validateLastName();
    validateEmail();
    validateAddress();
    validateQ1();
    validateQ2();
    validateQ3();
    validatePhone();

    const hasErrors = Object.values(errors).some(
      (msg) => msg && msg.length > 0
    );
    if (hasErrors) {
      showSuccessPopup("Pirmiausia ištaisykite klaidas formoje");
      return;
    }

    const firstName = fields.firstName.value.trim();
    const lastName = fields.lastName.value.trim();
    const email = fields.email.value.trim();
    const phone = fields.phone.value.trim();
    const address = fields.address.value.trim();

    const q1 = parseFloat(fields.q1.value);
    const q2 = parseFloat(fields.q2.value);
    const q3 = parseFloat(fields.q3.value);

    const formData = {
      firstName,
      lastName,
      email,
      phone,
      address,
      q1,
      q2,
      q3,
    };

    console.log("Kontaktų formos duomenys:", formData);

    const ratings = [q1, q2, q3].filter((n) => !isNaN(n));
    let avg = 0;
    if (ratings.length === 3) {
      avg = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
    }
    const avgText = `${firstName} ${lastName}: ${avg.toFixed(1)}`;

    resultsDiv.innerHTML = `
      <h4 class="mt-3">Suvesti duomenys</h4>
      <p><strong>Vardas:</strong> ${escapeHtml(firstName)}</p>
      <p><strong>Pavardė:</strong> ${escapeHtml(lastName)}</p>
      <p><strong>El. paštas:</strong> ${escapeHtml(email)}</p>
      <p><strong>Tel. numeris:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Adresas:</strong> ${escapeHtml(address)}</p>
      <p><strong>Klausimas 1:</strong> ${isNaN(q1) ? "-" : q1}</p>
      <p><strong>Klausimas 2:</strong> ${isNaN(q2) ? "-" : q2}</p>
      <p><strong>Klausimas 3:</strong> ${isNaN(q3) ? "-" : q3}</p>
      <p class="mt-2"><strong>Vidurkis:</strong> ${escapeHtml(avgText)}</p>
    `;

    showSuccessPopup("Duomenys pateikti sėkmingai!");
  });
});


