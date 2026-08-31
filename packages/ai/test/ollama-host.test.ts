// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ollamaHostAllowed } from '../src/server/ollama-host'

describe('ollamaHostAllowed', () => {
  it('allows loopback and the private ranges', () => {
    for (const host of ['http://localhost:11434', 'http://127.0.0.1:11434/', 'http://[::1]:11434', 'http://10.0.0.5:11434', 'http://192.168.1.7:11434', 'http://172.16.0.1', 'http://172.31.255.254'])
      expect([host, ollamaHostAllowed(host)]).toEqual([host, true])
  })

  it('rejects a hostname that merely starts like a private address', () => {
    // The whole point: these are ordinary domains their owner can point anywhere.
    // A `startsWith('10.')` test on the hostname hands the allowlist to them.
    for (const host of ['http://10.attacker.com', 'http://192.168.evil.example', 'http://172.16.attacker.test', 'http://127.0.0.1.attacker.com'])
      expect([host, ollamaHostAllowed(host)]).toEqual([host, false])
  })

  it('rejects public addresses, link-local metadata and non-http schemes', () => {
    for (const host of ['http://169.254.169.254/latest/meta-data', 'http://8.8.8.8', 'https://api.example.com', 'file:///etc/passwd', 'not a url', 'http://172.32.0.1', 'http://999.0.0.1'])
      expect([host, ollamaHostAllowed(host)]).toEqual([host, false])
  })

  it('an explicit allowlist replaces the default and matches exactly', () => {
    const allow = ['ollama.internal:11434']
    expect(ollamaHostAllowed('http://ollama.internal:11434', allow)).toBe(true)
    expect(ollamaHostAllowed('http://ollama.internal.attacker.com:11434', allow)).toBe(false)
    // The default ranges no longer apply once the deployer names their own hosts.
    expect(ollamaHostAllowed('http://127.0.0.1:11434', allow)).toBe(false)
  })
})
