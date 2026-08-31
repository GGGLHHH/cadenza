/**
 * `x-byok-ollama` carries a host URL, not a key: every handler that hands it to
 * `fetch` has to check it first, or it is a server-side request forgery hole.
 *
 * It lives in its own file so the check cannot drift between callers again —
 * the chat handler had one while the catalog handler's `discoverModels` path
 * did not, and the only thing recording that dependency was a comment in
 * `providers/ollama.ts` saying the chat handler had already checked.
 */

/**
 * Loopback and RFC 1918, decided by parsing the address.
 *
 * Prefix-matching the hostname does not work: `10.attacker.com` starts with
 * `10.` and is an ordinary domain that resolves wherever its owner points it,
 * so a string test hands the allowlist to the attacker.
 */
function isPrivateHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '[::1]')
    return true
  const parts = hostname.split('.')
  if (parts.length !== 4 || parts.some(p => !/^\d{1,3}$/.test(p)))
    return false
  const [a = -1, b = -1] = parts.map(Number)
  if (a > 255 || b > 255)
    return false
  return a === 127 || a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31)
}

/**
 * Whether `host` — the raw `x-byok-ollama` value — may be fetched.
 *
 * `allow` is the deployer's own list (`ollamaHosts`), matched exactly against
 * `host` or `hostname`. Without one, only loopback and the private ranges pass.
 */
export function ollamaHostAllowed(host: string, allow?: readonly string[]): boolean {
  let url: URL
  try {
    url = new URL(host)
  }
  catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    return false
  return allow ? allow.some(a => url.host === a || url.hostname === a) : isPrivateHost(url.hostname)
}
