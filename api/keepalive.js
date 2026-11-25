// RSLC — күнделікті «ояту»: Supabase тегін жобалары 7 күн белсенділіксіз тоқтап қалмауы үшін.
// Vercel Cron күнде шақырады (vercel.json → crons). Деректерді оқымайды, тек жеңіл сұраныс жібереді.
const TARGETS = [
  { name: "ybraiym-library + RSLC", url: "https://yzfnxfkjncmeuejzjsbp.supabase.co/rest/v1/rpc/stgn_ping", key: "sb_publishable_PjCCzbNBoaTr2CTo7eqFsA__2Bn3O-9", schema: "stgn" },
  { name: "geoatlas (ҰБТ)", url: "https://dbwttnavvzwlwhnmnmyp.supabase.co/rest/v1/rpc/keepalive_ping", key: "sb_publishable_c8mkbv7_b6HSenJfhzeQXQ_lAtgDllM" }
];

async function ping(t) {
  const started = Date.now();
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const headers = { apikey: t.key, "Content-Type": "application/json" };
      if (t.schema) headers["Content-Profile"] = t.schema;
      const r = await fetch(t.url, { method: "POST", headers, body: "{}", signal: AbortSignal.timeout(15000) });
      if (r.ok) return { name: t.name, ok: true, status: r.status, attempt, ms: Date.now() - started };
      if (attempt === 3) return { name: t.name, ok: false, status: r.status, body: (await r.text()).slice(0, 200) };
    } catch (e) {
      if (attempt === 3) return { name: t.name, ok: false, error: String(e && e.message || e) };
    }
    await new Promise(res => setTimeout(res, 2000 * attempt));
  }
}

module.exports = async (req, res) => {
  const results = await Promise.all(TARGETS.map(ping));
  const ok = results.every(r => r.ok);
  if (!ok) console.error("keepalive failed", JSON.stringify(results));
  res.setHeader("Cache-Control", "no-store");
  res.status(ok ? 200 : 502).json({ ok, at: new Date().toISOString(), results });
};
