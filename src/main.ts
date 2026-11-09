import { Actor, HttpAgent } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { Principal } from "@icp-sdk/core/principal";

const ID = {
  mother: "45mjf-rqaaa-aaaaj-qsedq-cai",
  ledger: "56aad-fiaaa-aaaaj-qsefa-cai",
  icpLedger: "ryjl3-tyaaa-aaaaa-aaaba-cai",
  pikoPool: "iynjh-taaaa-aaaar-qcg7a-cai", // ICPSwap PIKO/ICP
  usdPool: "mohjv-bqaaa-aaaag-qjyia-cai", // ICPSwap ICP/ckUSDC
  miningPool: "feqm6-7aaaa-aaaap-quzsa-cai",
  place: "cpihg-xqaaa-aaaac-bf4ba-cai",
  blackhole: "e3mmv-5qaaa-aaaah-aadma-cai",
};

// Reference burn = B cycles/day, net change 2026-11-02..06 (never below idle burn), pikopool, pixel and index measured after their 2026-11-06 fixes. Only used until this
// browser has its own measurement (see measuredBurn).
const CANISTERS = [
  { g: "Core", n: "mother", id: ID.mother, b: 6 },
  { g: "Core", n: "ledger", id: ID.ledger, b: 57 },
  { g: "Core", n: "index", id: "ymzxo-vqaaa-aaaaj-qse3q-cai", b: 13.4 },
  { g: "Core", n: "miner frontend", id: "5xdl7-taaaa-aaaaj-qseeq-cai", b: 3.5 },
  { g: "Core", n: "landing", id: "7w27g-xiaaa-aaaaj-qseja-cai", b: 4.5 },
  { g: "Core", n: "pikopool", id: ID.miningPool, b: 10 },
  { g: "Games", n: "dice", id: "7yyso-myaaa-aaaaj-qseia-cai", b: 8 },
  { g: "Games", n: "dice frontend", id: "77zu2-baaaa-aaaaj-qseiq-cai", b: 3.5 },
  { g: "Games", n: "blackjack", id: "d76up-oaaaa-aaaai-ax4ia-cai", b: 22 },
  { g: "Games", n: "blackjack frontend", id: "bcd2h-5iaaa-aaaai-ax4hq-cai", b: 3.5 },
  { g: "Games", n: "poker", id: "25x4u-gqaaa-aaaac-qhbza-cai", b: 7.7 },
  { g: "Games", n: "poker frontend", id: "2uuxi-qyaaa-aaaac-qhbyq-cai", b: 3.5 },
  { g: "Apps", n: "pixel", id: ID.place, b: 14.3 },
  { g: "Apps", n: "pixel frontend", id: "cglm2-byaaa-aaaac-bf4aq-cai", b: 3.5 },
  { g: "Apps", n: "legacy", id: "vkxrn-3qaaa-aaaak-qzk6q-cai", b: 1 },
  { g: "Apps", n: "legacy frontend", id: "vnwxz-wiaaa-aaaak-qzk6a-cai", b: 3.5 },
  { g: "Apps", n: "monitor frontend", id: "k6tpq-iqaaa-aaaaa-qhpfq-cai", b: 3.5 },
];

// Idle burn in B/day, read from canister status on 2026-11-06. The freezing reserve is
// based on this, not on total burn, and the reader canister does not return it.
const IDLE: Record<string, number> = {
  [ID.mother]: 6, [ID.ledger]: 2.3, "ymzxo-vqaaa-aaaaj-qse3q-cai": 2.1, "5xdl7-taaaa-aaaaj-qseeq-cai": 3.5,
  "7w27g-xiaaa-aaaaj-qseja-cai": 3.5, [ID.miningPool]: 9.5, "7yyso-myaaa-aaaaj-qseia-cai": 6, "77zu2-baaaa-aaaaj-qseiq-cai": 3.5,
  "d76up-oaaaa-aaaai-ax4ia-cai": 7.7, "bcd2h-5iaaa-aaaai-ax4hq-cai": 3.5, "25x4u-gqaaa-aaaac-qhbza-cai": 7.7, "2uuxi-qyaaa-aaaac-qhbyq-cai": 3.5,
  [ID.place]: 7.7, "cglm2-byaaa-aaaac-bf4aq-cai": 3.5, "vkxrn-3qaaa-aaaak-qzk6q-cai": 1, "vnwxz-wiaaa-aaaak-qzk6a-cai": 3.5, "k6tpq-iqaaa-aaaaa-qhpfq-cai": 3.5,
};

const agent = HttpAgent.createSync({ host: "https://icp-api.io" });
const make = <T = any>(id: string, idl: IDL.InterfaceFactory) => Actor.createActor<T>(idl, { agent, canisterId: id }) as any;

const motherIdl: IDL.InterfaceFactory = ({ IDL }) => {
  const Stats = IDL.Record({
    height: IDL.Nat, totalMinted: IDL.Nat, difficultyBits: IDL.Nat, blocksUntilRetarget: IDL.Nat,
    nextHalvingHeight: IDL.Nat, currentReward: IDL.Nat, miningFeeE8s: IDL.Nat, maxSupply: IDL.Nat,
    totalIcpBurnedE8s: IDL.Nat, totalIcpConvertedToCyclesE8s: IDL.Nat, totalIcpFeesCollectedE8s: IDL.Nat,
  });
  const Block = IDL.Record({ height: IDL.Nat, miner: IDL.Principal, timestamp: IDL.Int });
  return IDL.Service({
    getStats: IDL.Func([], [Stats], ["query"]),
    getRecentBlocks: IDL.Func([], [IDL.Vec(Block)], ["query"]),
    getMinerCount: IDL.Func([], [IDL.Nat], ["query"]),
    getTotalPendingRewards: IDL.Func([], [IDL.Nat], ["query"]),
    cyclesBalance: IDL.Func([], [IDL.Nat], ["query"]),
  });
};
const ledgerIdl: IDL.InterfaceFactory = ({ IDL }) => IDL.Service({
  icrc1_total_supply: IDL.Func([], [IDL.Nat], ["query"]),
  icrc1_balance_of: IDL.Func([IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) })], [IDL.Nat], ["query"]),
});
const swapIdl: IDL.InterfaceFactory = ({ IDL }) => IDL.Service({
  metadata: IDL.Func([], [IDL.Variant({ ok: IDL.Record({ sqrtPriceX96: IDL.Nat }), err: IDL.Reserved })], ["query"]),
});
const miningPoolIdl: IDL.InterfaceFactory = ({ IDL }) => IDL.Service({
  getPoolStats: IDL.Func([], [IDL.Record({ blocksWon: IDL.Nat, activeMinersNow: IDL.Nat, totalPikoDistributed: IDL.Nat })], ["query"]),
});
const placeIdl: IDL.InterfaceFactory = ({ IDL }) => IDL.Service({
  getStats: IDL.Func([], [IDL.Record({ totalBurnedPiko: IDL.Nat, totalAdBurnedE8s: IDL.Nat })], ["query"]),
});
const blackholeIdl: IDL.InterfaceFactory = ({ IDL }) => {
  const Status = IDL.Record({
    cycles: IDL.Nat, memory_size: IDL.Nat,
    status: IDL.Variant({ running: IDL.Null, stopping: IDL.Null, stopped: IDL.Null }),
    settings: IDL.Record({ controllers: IDL.Vec(IDL.Principal), freezing_threshold: IDL.Nat }),
  });
  return IDL.Service({ canister_status: IDL.Func([IDL.Record({ canister_id: IDL.Principal })], [Status], []) });
};

const mother = make(ID.mother, motherIdl);
const piko = make(ID.ledger, ledgerIdl);
const icp = make(ID.icpLedger, ledgerIdl);
const blackhole = make(ID.blackhole, blackholeIdl);

const e8 = (n: bigint) => Number(n) / 1e8;
const balance = (l: any, owner: string): Promise<bigint> => l.icrc1_balance_of({ owner: Principal.fromText(owner), subaccount: [] });
async function swapPrice(id: string): Promise<number> {
  const r = await make(id, swapIdl).metadata();
  if (!("ok" in r)) throw new Error("pool");
  const s = Number(r.ok.sqrtPriceX96) / 2 ** 96;
  return s * s;
}

// ICPSwap's own market data: the price icptokens.net and ICPSwap display. Off-chain,
// so the pool's on-chain spot price takes over if this API ever disappears.
const ICPSWAP_API = `https://api.icpswap.com/info/token/${ID.ledger}`;
async function loadMarket(): Promise<{ usd: number; change24h: number | null; volume24h: number | null }> {
  const r = await fetch(ICPSWAP_API, { signal: AbortSignal.timeout(8000) });
  const d = (await r.json()).data;
  const usdPrice = Number(d?.price);
  if (!(usdPrice > 0)) throw new Error("no price");
  const num = (x: unknown) => (x == null || !Number.isFinite(Number(x)) ? null : Number(x));
  return { usd: usdPrice, change24h: num(d.priceChange24H), volume24h: num(d.volumeUSD24H) };
}

const safe = async <T,>(p: Promise<T>): Promise<T | null> => { try { return await p; } catch { return null; } };
const fr = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", maximumFractionDigits: n < 1 ? 6 : n < 100 ? 2 : 0 });
// Prices under a dollar keep 4 significant digits, like the exchanges show them.
const price = (n: number) => n >= 1 ? usd(n) : n.toLocaleString("en-US", { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", minimumSignificantDigits: 4, maximumSignificantDigits: 4 });
const dash = "–";
const opt = <T,>(v: T | null | undefined, f: (x: T) => string) => (v == null ? dash : f(v));
function hashrate(h: number) {
  const units = ["H/s", "kH/s", "MH/s", "GH/s", "TH/s"];
  let i = 0;
  while (h >= 1000 && i < units.length - 1) { h /= 1000; i++; }
  return `${fr(h, h < 10 ? 1 : 0)} ${units[i]}`;
}
function ago(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60000));
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ${m % 60}m ago`;
  return `${Math.floor(m / 1440)}d ${Math.floor(m / 60) % 24}h ago`;
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

// ---- market + mining + bankrolls (all queries) ----
async function loadOverview() {
  const [stats, blocks, miners, pending, supply, mCycles, pikoIcp, icpUsd, poolStats, placeStats, lpPiko, lpIcp, market] = await Promise.all([
    safe(mother.getStats()), safe(mother.getRecentBlocks()), safe(mother.getMinerCount()), safe(mother.getTotalPendingRewards()),
    safe(piko.icrc1_total_supply()), safe(mother.cyclesBalance()), safe(swapPrice(ID.pikoPool)), safe(swapPrice(ID.usdPool)),
    safe(make(ID.miningPool, miningPoolIdl).getPoolStats()), safe(make(ID.place, placeIdl).getStats()),
    safe(balance(piko, ID.pikoPool)), safe(balance(icp, ID.pikoPool)), safe(loadMarket()),
  ]);
  const banks = await Promise.all(
    [["Dice", "7yyso-myaaa-aaaaj-qseia-cai"], ["Blackjack", "d76up-oaaaa-aaaai-ax4ia-cai"]]
      .map(async ([name, id]) => ({ name, piko: await safe(balance(piko, id)), icp: await safe(balance(icp, id)) })),
  );
  return { stats, blocks, miners, pending, supply, mCycles, pikoIcp, icpUsd: icpUsd == null ? null : icpUsd * 100, poolStats, placeStats, lpPiko, lpIcp, market, banks };
}

function renderOverview(o: Awaited<ReturnType<typeof loadOverview>>) {
  const s = o.stats as any;
  const spotUsd = o.pikoIcp != null && o.icpUsd != null ? o.pikoIcp * o.icpUsd : null;
  const m = o.market;
  const priceUsd = m?.usd ?? spotUsd;
  const priceIcp = priceUsd != null && o.icpUsd ? priceUsd / o.icpUsd : o.pikoIcp;
  const supply = o.supply != null ? e8(o.supply as bigint) : null;
  const blocks = ((o.blocks as any[]) ?? []).slice().sort((a, b) => Number(a.height - b.height));
  const times = blocks.map((b) => Number(b.timestamp) / 1e6);
  const last = times.at(-1);
  // Mining comes in bursts, so one long average would mean little: show the last
  // 24 h and the pace of the latest blocks separately.
  const expected = s ? 2 ** Number(s.difficultyBits) : null;
  const blocks24h = times.filter((t) => Date.now() - t < 864e5).length;
  const hr24h = expected != null ? (blocks24h * expected) / 86400 : null;
  const burst = times.slice(-6);
  const burstSec = burst.length === 6 ? (burst[5] - burst[0]) / 1000 : 0;
  const hrBurst = expected != null && burstSec > 0 ? (5 * expected) / burstSec : null;
  const byMiner = new Map<string, number>();
  blocks.forEach((b) => { const k = b.miner.toText(); byMiner.set(k, (byMiner.get(k) ?? 0) + 1); });
  const topShare = blocks.length ? Math.max(...byMiner.values()) / blocks.length : null;
  const fee = s ? e8(s.miningFeeE8s) : null;
  const reward = s ? e8(s.currentReward) : null;
  // PIKO still owed to miners is minted on the books but not yet on the ledger.
  const pending = o.pending != null ? e8(o.pending as bigint) : null;
  const minted = s ? e8(s.totalMinted) : null;
  const maxSupply = s ? e8(s.maxSupply) : null;
  const burned = minted != null && supply != null && pending != null ? minted - supply - pending : null;
  const place = o.placeStats as any;
  const adsBurned = place ? e8(place.totalBurnedPiko) + e8(place.totalAdBurnedE8s) : null;
  const pool = o.poolStats as any;
  const change = m?.change24h;
  const changeHtml = change == null ? "" : `<span class="${change >= 0 ? "up" : "down"}">${change >= 0 ? "+" : ""}${fr(change, 1)} %</span> in 24 h`;
  const tile = (label: string, value: string) => `<div class="tile"><span class="label">${label}</span><b>${value}</b></div>`;
  const bar = (label: string, right: string, pct: number) => `<div class="bar"><div><span>${label}</span><span>${right}</span></div><div class="track"><div class="fill" style="width:${Math.min(100, Math.max(0, pct)).toFixed(2)}%"></div></div></div>`;
  const pikoIco = `<img class="ico" src="/piko-logo.svg" alt="">`;
  const icpIco = `<img class="ico" src="/icp-logo.svg" alt="">`;
  const short = (t: string) => `${t.slice(0, 5)}…${t.slice(-3)}`;
  const untilRetarget = s ? Number(s.blocksUntilRetarget) : null;

  const live = s ? `Block #${fr(Number(s.height))} live` : "Network unreachable";
  const kpis = `<div class="kpis">
    <div class="kpi lead"><span class="label">PIKO price</span><p class="value">${opt(priceUsd, price)}</p><p class="kpi-sub">${changeHtml || (priceIcp != null ? fr(priceIcp, 6) + " ICP" : dash)}</p></div>
    <div class="kpi"><span class="label">Hashrate, 24 h</span><p class="value">${opt(hr24h, hashrate)}</p><p class="kpi-sub">${blocks.length ? fr(blocks24h) + " blocks in 24 h" : dash}</p></div>
    <div class="kpi"><span class="label">PIKO burned</span><p class="value">${opt(burned, (x) => "🔥 " + fr(x))}</p><p class="kpi-sub">${opt(adsBurned, (x) => fr(x))} by Pixel</p></div>
    <div class="kpi"><span class="label">Market cap</span><p class="value">${priceUsd != null && supply != null ? usd(priceUsd * supply) : dash}</p><p class="kpi-sub">${opt(supply, (x) => fr(x))} PIKO in circulation</p></div>
  </div>`;

  const mining = `<section class="card"><h2>Mining</h2><div class="body">
    <div class="tiles">
      ${tile("Height", s ? fr(Number(s.height)) : dash)}
      ${tile("Difficulty", s ? s.difficultyBits + " bits" : dash)}
      ${tile("Last block", last ? ago(Date.now() - last) : dash)}
      ${tile("Pace, last 5 blocks", opt(hrBurst, hashrate))}
      ${tile("Reward", reward != null ? `${pikoIco}${fr(reward)} PIKO` : dash)}
      ${tile("Fee per proof", fee != null ? `${icpIco}${fr(fee, 2)} ICP` : dash)}
      ${tile("Miners", opt(o.miners as bigint | null, (x) => "⛏️ " + fr(Number(x))))}
      ${tile(`Top miner, ${blocks.length} blocks`, topShare != null ? fr(topShare * 100) + " %" : dash)}
      ${tile("PikoPool", pool ? `${pool.activeMinersNow} active · ${pool.blocksWon} blocks` : dash)}
    </div>
    <dl><dt>Next halving</dt><dd>${s ? "block " + fr(Number(s.nextHalvingHeight)) : dash}</dd>
    <dt>ICP spent mining (real-time)</dt><dd>${s ? fr(e8(s.totalIcpFeesCollectedE8s), 8) + icpIco : dash}</dd>
    <dt>ICP burned by mining</dt><dd>${s ? fr(e8(s.totalIcpBurnedE8s), 2) + icpIco : dash}</dd>
    <dt>ICP converted to cycles</dt><dd>${s ? fr(e8(s.totalIcpConvertedToCyclesE8s), 2) + icpIco : dash}</dd></dl>
    ${untilRetarget != null ? bar("Until next retarget", `${untilRetarget} block(s)`, ((10 - untilRetarget) / 10) * 100) : ""}
    <p class="note">Hashrate is estimated from the current difficulty and the time between blocks. Mining comes in bursts, which is why the two figures differ.</p>
  </div></section>`;

  const market = `<section class="card"><h2>Market</h2><div class="body"><dl>
    <dt>ICP</dt><dd>${opt(o.icpUsd, (x) => usd(x) + icpIco)}</dd>
  </dl><p class="note">${m ? "Price from ICPSwap, the same one icptokens.net shows." : "ICPSwap is not responding: price read on-chain from the pool."}</p></div></section>`;

  const supplyCard = `<section class="card"><h2>Supply and burn</h2><div class="body"><dl>
    <dt>In circulation</dt><dd>${opt(supply, (x) => fr(x) + pikoIco)}</dd>
    <dt>Burned</dt><dd>${opt(burned, (x) => fr(x) + pikoIco + " 🔥")}</dd>
    <dt>Max supply</dt><dd>${opt(maxSupply, (x) => fr(x) + pikoIco)}</dd>
  </dl>${minted != null && maxSupply ? bar("Supply mined", `${fr((minted / maxSupply) * 100, 2)} %`, (minted / maxSupply) * 100) : ""}</div></section>`;

  const banks = `<section class="card"><h2>Bankrolls</h2><div class="body"><dl>${o.banks.map((b) => `<dt>${esc(b.name)}</dt><dd>${opt(b.piko, (x) => fr(e8(x)) + " PIKO" + pikoIco)}${b.icp && b.icp > 0n ? `<br>${fr(e8(b.icp), 2)} ICP` : ""}</dd>`).join("")}</dl></div></section>`;

  const recent = blocks.slice(-8).reverse();
  const blocksCard = `<section class="card"><h2>Latest blocks</h2><div class="body"><div class="tablewrap"><table>
    <thead><tr><th>Block</th><th>Miner</th><th>When</th></tr></thead>
    <tbody>${recent.map((b) => `<tr><td>${fr(Number(b.height))}</td><td>${esc(short(b.miner.toText()))}</td><td>${ago(Date.now() - Number(b.timestamp) / 1e6)}</td></tr>`).join("")}</tbody>
  </table></div></div></section>`;

  return { live, kpis, mining, side: market + supplyCard + banks + blocksCard };
}

// ---- canister cycles (update calls via the blackhole canister) ----
type Status = { cycles: number; controllers: string[]; running: boolean; freeze: number };
const STORE = "piko-monitor-snap";
function readSnap(): { at: number; c: Record<string, number> } | null {
  try { return JSON.parse(localStorage.getItem(STORE) ?? "null"); } catch { return null; }
}
function writeSnap(s: { at: number; c: Record<string, number> }) {
  try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* optional */ }
}
const SNAP_MIN_MS = 6 * 3600e3;
function measuredBurn(id: string, now: number, cycles: number): number | null {
  const snap = readSnap();
  if (!snap || now - snap.at < SNAP_MIN_MS || snap.c[id] == null) return null;
  const perDay = (snap.c[id] - cycles) / ((now - snap.at) / 864e5);
  return perDay > 0 ? perDay : null; // a top-up since the snapshot says nothing about burn
}

async function loadStatuses(): Promise<Map<string, Status>> {
  const out = new Map<string, Status>();
  let next = 0;
  const worker = async () => {
    while (next < CANISTERS.length) {
      const c = CANISTERS[next++];
      const r: any = await safe(blackhole.canister_status({ canister_id: Principal.fromText(c.id) }));
      if (r) out.set(c.id, { cycles: Number(r.cycles), controllers: r.settings.controllers.map((p: Principal) => p.toText()), running: "running" in r.status, freeze: Number(r.settings.freezing_threshold) });
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  const now = Date.now();
  const snap = readSnap();
  if (out.size && (!snap || now - snap.at >= SNAP_MIN_MS * 2)) writeSnap({ at: now, c: Object.fromEntries([...out].map(([k, v]) => [k, v.cycles])) });
  return out;
}

const openIds = new Set<string>();
let copiedId: string | null = null;

function renderCanisters(st: Map<string, Status>, motherCycles: bigint | null) {
  const now = Date.now();
  let group = "";
  let total = 0;
  const rows = CANISTERS.map((c) => {
    const s = st.get(c.id);
    const cycles = s?.cycles ?? (c.id === ID.mother && motherCycles != null ? Number(motherCycles) : null);
    if (cycles != null) total += cycles;
    // mother sends its surplus to the other canisters, so a drop in its balance is not burn.
    const measured = cycles != null && c.id !== ID.mother ? measuredBurn(c.id, now, cycles) : null;
    const burn = measured ?? c.b * 1e9;
    // A canister freezes before it empties, with a reserve of freeze-threshold seconds of idle burn.
    const reserve = (IDLE[c.id] * 1e9 * (s?.freeze ?? 2592000)) / 86400;
    const days = cycles != null ? Math.max(0, (cycles - reserve) / burn) : null;
    const cls = days == null ? "" : days < 30 ? "bad" : days < 90 ? "warn" : "good";
    const autonomous = s ? (s.controllers.length === 1 && s.controllers[0] === ID.blackhole) || s.controllers.length === 0 : null;
    const head = c.g !== group ? ((group = c.g), `<tr class="group"><td colspan="5">${c.g}</td></tr>`) : "";
    return `${head}<tr>
      <td><button class="cname" type="button" data-toggle="${c.id}" aria-expanded="${openIds.has(c.id)}">${esc(c.n)}</button> ${s && !s.running ? '<span class="bad">stopped</span>' : ""}</td>
      <td>${cycles != null ? fr(cycles / 1e12, 2) + " T" : dash}</td>
      <td class="hide-sm">${fr(burn / 1e9, burn < 1e10 ? 1 : 0)} B/d</td>
      <td class="${cls}">${days == null ? dash : days > 3650 ? "> 10 yrs" : fr(days) + " d"}</td>
      <td class="hide-sm">${autonomous == null ? dash : autonomous ? "Blackholed" : "Controlled"}</td>
    </tr>${openIds.has(c.id) ? `<tr class="idrow"><td colspan="5"><code>${c.id}</code> <button class="copy" type="button" data-copy="${c.id}">${copiedId === c.id ? "Copied" : "Copy"}</button></td></tr>` : ""}`;
  }).join("");
  // mother exposes its own balance, so it stays readable without the blackhole.
  const missing = CANISTERS.length - st.size - (!st.has(ID.mother) && motherCycles != null ? 1 : 0);
  return `<section class="card"><h2>Canisters and cycles</h2><div class="body">
    <div class="tiles"><div class="tile"><span class="label">Cycles read</span><b>${fr(total / 1e12, 1)} T</b></div><div class="tile"><span class="label">Canisters read</span><b>${fr(CANISTERS.length - missing)} / ${fr(CANISTERS.length)}</b></div></div>
    <div class="tablewrap"><table>
      <thead><tr><th>Canister</th><th>Cycles</th><th class="hide-sm">Burn</th><th>Runway</th><th class="hide-sm">Control</th></tr></thead>
      <tbody>${rows}</tbody></table></div>
    <p class="note">Click a canister to get its ID, for example to top it up. Runway: days until the canister freezes. Burn is measured in this browser when possible (never for mother, which also sends cycles to the other canisters), otherwise a 4-day reading from November 2026, net of any top-ups received in that period. Future top-ups, such as those from mother, are not counted.${missing ? ` ${missing} canister(s) unreadable: the public reader canister <code>${ID.blackhole}</code> is not yet one of their controllers.` : ""}</p>
  </div></section>`;
}

// ---- wiring ----
const app = document.getElementById("app")!;
const updated = document.getElementById("updated")!;
const btn = document.getElementById("refresh") as HTMLButtonElement;
const live = document.getElementById("live")!;
let overview: ReturnType<typeof renderOverview> | null = null;
let statuses = new Map<string, Status>();
let motherCycles: bigint | null = null;
let statusAt = 0;
const draw = () => {
  if (!overview) return;
  live.textContent = overview.live;
  app.innerHTML = `${overview.kpis}<div class="layout"><div class="col">${overview.mining}${renderCanisters(statuses, motherCycles)}</div><div class="col">${overview.side}</div></div>`;
};

async function refresh(withStatus: boolean) {
  btn.disabled = true;
  try {
    const o = await loadOverview();
    motherCycles = o.mCycles as bigint | null;
    overview = renderOverview(o);
    draw();
    if (withStatus) { statuses = await loadStatuses(); statusAt = Date.now(); draw(); }
    updated.textContent = `Updated at ${new Date().toLocaleTimeString("en-US")}.`;
  } finally { btn.disabled = false; }
}
// Delegated because every refresh rebuilds the table; openIds keeps rows open across redraws.
app.addEventListener("click", async (e) => {
  const el = e.target as HTMLElement;
  const toggle = el.closest<HTMLElement>("[data-toggle]")?.dataset.toggle;
  const copy = el.closest<HTMLElement>("[data-copy]")?.dataset.copy;
  if (toggle) {
    if (!openIds.delete(toggle)) openIds.add(toggle);
  } else if (copy) {
    try { await navigator.clipboard.writeText(copy); copiedId = copy; } catch { return; }
  } else return;
  draw();
});
btn.addEventListener("click", () => refresh(true));
refresh(true);
setInterval(() => { if (!document.hidden) refresh(Date.now() - statusAt > 15 * 60e3); }, 60e3);
