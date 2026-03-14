/* =========================================================
   APRON BAY SERVICE
   Handles lifecycle + block API communication
========================================================= */

const BASE_URL = "http://localhost:5000/api/aocc";

/* =========================================================
   LIFECYCLE EVENTS
========================================================= */
export async function sendLifecycleEvent(
  bayId: string,
  flightNumber: string | undefined,
  event: "ON_BLOCK" | "PUSHBACK_READY" | "OFF_BLOCK"
) {
  if (!flightNumber) {
    throw new Error("Flight number missing for lifecycle event");
  }

  let endpoint = "";

  if (event === "ON_BLOCK") {
    endpoint = `${BASE_URL}/bays/${bayId}/on-block`;
  } else if (event === "PUSHBACK_READY") {
    endpoint = `${BASE_URL}/bays/${bayId}/pushback`;
  } else if (event === "OFF_BLOCK") {
    endpoint = `${BASE_URL}/bays/${bayId}/off-block`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Lifecycle update failed");
  }

  return data;
}

/* =========================================================
   BLOCK / UNBLOCK BAY
========================================================= */
export async function toggleBlockBay(bayId: string, block: boolean) {

  const endpoint = block
    ? `${BASE_URL}/bays/${bayId}/block`
    : `${BASE_URL}/bays/${bayId}/unblock`;

  const response = await fetch(endpoint, {
    method: "POST",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Block update failed");
  }

  return data;
}