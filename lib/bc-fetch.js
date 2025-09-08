import https from "https";

const agent = new https.Agent({ keepAlive: true, maxSockets: 50 });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function jitter(ms) { return Math.max(0, ms * (0.5 + Math.random())); }

export async function bcFetch(url, {
  method = "GET",
  headers = {},
  body,
  maxRetries = 5,
  baseDelay = 300, // ms
  timeoutMs = 15000
} = {}) {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt++;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers,
        body,
        // node-fetch ignores agent unless passed explicitly
        agent,
        signal: ctrl.signal,
      });
      clearTimeout(t);

      // Respect BC rate-limit headers
      const left = Number(res.headers.get("X-Rate-Limit-Requests-Left"));
      const resetMs = Number(res.headers.get("X-Rate-Limit-Time-Reset-Ms"));
      if (!isNaN(left) && left <= 2 && !isNaN(resetMs)) {
        await sleep(resetMs); // cool off until the window resets
      }

      if (res.status === 429) {
        // Too Many Requests
        const retryAfter = Number(res.headers.get("Retry-After")) || (resetMs || 1000) / 1000;
        if (attempt <= maxRetries) {
          await sleep(jitter((retryAfter || 1) * 1000));
          continue;
        }
      }

      if (res.status >= 500) {
        // Transient server errors like "Overloaded"
        if (attempt <= maxRetries) {
          const delay = jitter(baseDelay * 2 ** (attempt - 1));
          await sleep(delay);
          continue;
        }
      }

      // Non-OK but not retriable — surface useful message
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const msg = text || `${res.status} ${res.statusText}`;
        const err = new Error(msg);
        err.status = res.status;
        throw err;
      }

      // OK
      const contentType = res.headers.get("content-type") || "";
      return contentType.includes("application/json") ? res.json() : res.text();

    } catch (err) {
      clearTimeout(t);
      // Retry on aborts/network for a few attempts
      const retriable = err.name === "AbortError" || err.code === "ECONNRESET" || err.code === "ETIMEDOUT";
      if (retriable && attempt <= maxRetries) {
        const delay = jitter(baseDelay * 2 ** (attempt - 1));
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
}