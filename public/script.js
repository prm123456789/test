// public/script.js

const form = document.getElementById("pairingForm");
const phoneInput = document.getElementById("phone");
const codeContainer = document.getElementById("codeContainer");
const pairingCodeEl = document.getElementById("pairingCode");
const copyButton = document.getElementById("copyButton");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const phone = phoneInput.value.trim();
  if (!phone) return;

  pairingCodeEl.textContent = "⏳ Génération...";
  codeContainer.classList.remove("hidden");

  try {
    const res = await fetch("/api/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();

    if (data.success) {
      pairingCodeEl.textContent = data.code;
    } else {
      pairingCodeEl.textContent = "❌ Erreur lors de la génération du code.";
    }
  } catch (err) {
    pairingCodeEl.textContent = "❌ Erreur serveur.";
  }
});

copyButton.addEventListener("click", () => {
  const code = pairingCodeEl.textContent;
  navigator.clipboard.writeText(code);
  copyButton.textContent = "✅ Copié !";
  setTimeout(() => {
    copyButton.textContent = "Copier le code";
  }, 1500);
});
