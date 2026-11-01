/**
 * NIRMAAN Forensic Engine — API Integration Client
 * Connects frontend UI to FastAPI backend endpoints.
 */

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export async function checkSystemHealth() {
  const res = await fetch(`${API_BASE}/`);
  if (!res.ok) throw new Error(`Health check failed with status ${res.status}`);
  return res.json();
}

export async function traceWallet({
  seed_address,
  chain = null,
  max_depth = 4,
  min_usd_value = 50.0,
  case_metadata = null
}) {
  const payload = {
    seed_address: seed_address.trim(),
    chain: chain || undefined,
    max_depth: Number(max_depth),
    min_usd_value: Number(min_usd_value),
    case_metadata: case_metadata || {
      fir_number: "FIR-DEFAULT/2026",
      police_station: "Cyber Crime Police Station",
      investigating_officer: "Investigating Officer",
      complainant_name: "Complainant",
      loss_amount_inr: 0.0
    }
  };

  const res = await fetch(`${API_BASE}/api/trace`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error?.message || errorData.detail || `Trace request failed with status ${res.status}`;
    const details = errorData.error?.details ? ` (${typeof errorData.error.details === 'object' ? JSON.stringify(errorData.error.details) : errorData.error.details})` : '';
    throw new Error(`${message}${details}`);
  }

  return res.json();
}

export async function parseNcrpText(complaintText) {
  const res = await fetch(`${API_BASE}/api/ncrp/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: complaintText })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error?.message || errorData.detail || `NCRP parsing failed with status ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}

export async function fetchVasps() {
  const res = await fetch(`${API_BASE}/api/vasps`);
  if (!res.ok) throw new Error(`Failed to fetch VASPs: ${res.status}`);
  return res.json();
}

export async function fetchCases() {
  const res = await fetch(`${API_BASE}/api/cases`);
  if (!res.ok) throw new Error(`Failed to fetch cases: ${res.status}`);
  return res.json();
}

export async function fetchCaseById(caseId) {
  const res = await fetch(`${API_BASE}/api/cases/${caseId}`);
  if (!res.ok) throw new Error(`Failed to fetch case ${caseId}: ${res.status}`);
  return res.json();
}

export async function createCase(caseData) {
  const res = await fetch(`${API_BASE}/api/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(caseData)
  });

  if (!res.ok) throw new Error(`Failed to create case: ${res.status}`);
  return res.json();
}

export function getDossierDownloadUrl(caseId) {
  return `${API_BASE}/api/cases/${caseId}/dossier`;
}

export function getBundleDownloadUrl(caseId) {
  return `${API_BASE}/api/cases/${caseId}/bundle`;
}

export function getStrReportUrl(caseId) {
  return `${API_BASE}/api/cases/${caseId}/str`;
}
