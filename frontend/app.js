import { CONTRACT_ADDRESS, READ_RPC, ABI } from "./config.js";

const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111
const $ = (id) => document.getElementById(id);

let account = null;
let readContract = null;   // read-only (public RPC)
let writeContract = null;  // signer-connected (MetaMask)

function setStatus(msg, type = "") {
  const el = $("status");
  el.textContent = msg;
  el.className = type;
}

function errMsg(e) {
  return e?.reason || e?.shortMessage || e?.info?.error?.message || e?.message || "Unknown error";
}

function initReadOnly() {
  if (CONTRACT_ADDRESS.startsWith("PASTE")) {
    setStatus("Set CONTRACT_ADDRESS in config.js first.", "err");
    return false;
  }
  const provider = new ethers.JsonRpcProvider(READ_RPC);
  readContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  return true;
}

async function connect() {
  if (!window.ethereum) return setStatus("MetaMask not found. Please install it.", "err");
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    account = await signer.getAddress();
    writeContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    $("account").textContent = account.slice(0, 6) + "…" + account.slice(-4);
    $("connectBtn").textContent = "Connected";
    setStatus("Wallet connected on Sepolia.", "ok");
    await loadItems();
  } catch (e) {
    setStatus("Connect failed: " + errMsg(e), "err");
  }
}

async function submitReport() {
  if (!writeContract) return setStatus("Connect MetaMask first.", "err");
  const name = $("name").value.trim();
  const desc = $("desc").value.trim();
  const loc = $("loc").value.trim();
  const isFound = $("kind").value === "found";
  if (!name) return setStatus("Item name cannot be empty.", "err");
  if (!desc) return setStatus("Description cannot be empty.", "err");

  $("submitBtn").disabled = true;
  try {
    setStatus("Confirm the transaction in MetaMask…");
    const tx = await writeContract.reportItem(name, desc, loc, isFound);
    setStatus("Waiting for confirmation…");
    await tx.wait();
    setStatus("Report recorded on-chain ✔", "ok");
    $("name").value = $("desc").value = $("loc").value = "";
    await loadItems();
  } catch (e) {
    setStatus("Failed: " + errMsg(e), "err");
  } finally {
    $("submitBtn").disabled = false;
  }
}

async function markRecovered(id) {
  if (!writeContract) return setStatus("Connect MetaMask first.", "err");
  try {
    setStatus("Confirm the transaction in MetaMask…");
    const tx = await writeContract.markRecovered(id);
    await tx.wait();
    setStatus("Marked as recovered ✔", "ok");
    await loadItems();
  } catch (e) {
    setStatus("Failed: " + errMsg(e), "err");
  }
}

function renderItem(it) {
  const div = document.createElement("div");
  div.className = "item" + (it.recovered ? " done" : "");

  const title = document.createElement("strong");
  title.textContent = `#${it.id} ${it.name}`;

  const badge = document.createElement("span");
  badge.className = "badge " + (it.isFound ? "found" : "lost");
  badge.textContent = it.isFound ? "FOUND" : "LOST";

  const desc = document.createElement("p");
  desc.textContent = it.description;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent =
    `📍 ${it.location || "n/a"} · ${new Date(Number(it.timestamp) * 1000).toLocaleString()} · by ${it.reporter}`;

  div.append(badge, title, desc, meta);

  if (it.recovered) {
    const r = document.createElement("span");
    r.className = "badge rec";
    r.textContent = "RECOVERED";
    div.append(r);
  } else if (account && it.reporter.toLowerCase() === account.toLowerCase()) {
    const b = document.createElement("button");
    b.textContent = "Mark as recovered";
    b.onclick = () => markRecovered(it.id);
    div.append(b);
  }
  return div;
}

async function loadItems() {
  if (!readContract && !initReadOnly()) return;
  try {
    const items = await readContract.getAllItems();
    const list = $("items");
    list.replaceChildren();
    if (items.length === 0) list.textContent = "No reports yet.";
    [...items].reverse().forEach((it) => list.append(renderItem(it)));
  } catch (e) {
    setStatus("Could not load items: " + errMsg(e), "err");
  }
}

$("connectBtn").onclick = connect;
$("submitBtn").onclick = submitReport;
$("refreshBtn").onclick = loadItems;
if (window.ethereum) {
  window.ethereum.on?.("accountsChanged", () => location.reload());
  window.ethereum.on?.("chainChanged", () => location.reload());
}
loadItems();
