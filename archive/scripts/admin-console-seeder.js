// admin-console-seeder.js
// Browser-console helper to ensure rounds exist for the admin console
// Usage: Open your admin page (e.g. http://localhost:3000/admin), open DevTools -> Console,
// paste the contents of this file and press Enter. The script will set a temporary admin cookie
// and create QUIZ, VOTING and FINAL rounds if they are missing.

(async function restoreRounds() {
  // Set admin cookie so server accepts admin POSTs (expires in 1 day)
  document.cookie = "admin-auth=true; path=/; max-age=" + (60*60*24);

  const roundsToEnsure = [
    { name: "QUIZ", day: 1, description: "Quiz round" },
    { name: "VOTING", day: 1, description: "Voting round" },
    { name: "FINAL", day: 2, description: "Final round" }
  ];

  function log(...args) { console.log("[round-seeder]", ...args); }
  function errorLog(...args) { console.error("[round-seeder]", ...args); }

  async function fetchRounds() {
    const res = await fetch("/api/rounds");
    if (!res.ok) throw new Error("Failed to fetch rounds: " + res.status);
    return res.json();
  }

  async function createRound(r) {
    const res = await fetch("/api/rounds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(r),
      credentials: "include" // include cookies
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`POST /api/rounds failed (${res.status}): ${body.error || JSON.stringify(body)}`);
    }
    return body;
  }

  try {
    log("Checking existing rounds...");
    const existing = await fetchRounds();
    const existingNames = new Set((existing || []).map(r => String(r.name).toUpperCase()));
    log("Existing rounds:", existingNames.size ? Array.from(existingNames).join(", ") : "(none)");

    for (const r of roundsToEnsure) {
      const name = String(r.name).toUpperCase();
      if (existingNames.has(name)) {
        log(`Skipping ${name} — already exists`);
        continue;
      }
      log(`Creating round ${name} (day ${r.day})...`);
      try {
        const created = await createRound(r);
        log(`Created ${name}:`, created);
      } catch (err) {
        errorLog(`Failed to create ${name}:`, err.message || err);
      }
    }

    log("Done. If QUIZ is created you won't be able to activate it if there are fewer than 15 questions (server enforces that).");
    log("If you want the quiz to be activatable, run the question seeder or add questions first.");
  } catch (err) {
    errorLog("Unexpected error:", err.message || err);
  }
})();

// End of admin-console-seeder.js
