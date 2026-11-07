# Phase 20.181 – IP Hashing (keyed pseudonymization)

**Scope:** Task 181 only. This change introduces an injectable HMAC service, not an
IP-blocking or rate-limiting enforcement layer. Tasks 182–185 remain separate and
must not be enabled until the origin's trusted proxy chain has been verified.

## Algorithm and data handling

- Validate a single IP address with Node's IP parser. Reject comma-separated
  addresses, ports, zone identifiers, arbitrary HTTP header strings and malformed
  input. The service does **not** read \`X-Forwarded-For\`, \`CF-Connecting-IP\`, or
  Express \`request.ip\`.
- Canonicalize IPv6 with the WHATWG URL parser (lowercase, compress, strip
  brackets). Canonicalize IPv4-mapped IPv6 to the corresponding IPv4 address, so
  \`::ffff:203.0.113.22\` and \`203.0.113.22\` produce identical pseudonyms.
- Produce \`HMAC-SHA-256(secret, "kurvenfunk:ip:" + version + ":" + canonicalIP)\`
  with a domain separator. Return only \`{ipHash, hashKeyVersion}\`.
- Never persist the raw address. When future IPBlock storage is implemented,
  store the HMAC and version as a pair. Pseudonyms remain personal data and must
  be protected by access controls and retention limits.
- Invalid or missing keys **fail closed** with a generic 503 response when
  hashing is requested. Never fall back to unsalted SHA-256.

## Configuration

API environment, per environment and **never in Git**:

- \`IP_HASH_HMAC_SECRET\`: an unpadded base64url encoding of at least 32 random
  bytes. Generate with a cryptographically secure RNG and protect the result
  as a secret; do not paste the value into terminals with shell tracing, logs,
  PR comments or support messages.
- \`IP_HASH_KEY_VERSION\`: \`v1\`, \`v2\`, etc. Default: \`v1\`.
- \`IP_HASH_PREVIOUS_KEYS_JSON\`: optional JSON object mapping up to four
  previous versions to their base64url secrets, e.g. an object with an old
  \`v1\` entry when the current version is \`v2\`. The current version must not
  also appear in the previous-key map.

When \`IP_HASH_HMAC_SECRET\` is unset, the API still starts normally while
Tasks 182–185 are disabled. No raw client IP is collected or hashed
automatically by Task 181; this avoids giving an unverified HTTP proxy header
false authority.

## Rotation and backwards matching

1. Retain the old active key and its version securely.
2. Set a freshly generated key and **increment the version** in the next
   deployment. Supply the retained key via \`IP_HASH_PREVIOUS_KEYS_JSON\`.
3. New IP blocks are created with \`hash()\`, which uses only the current key.
4. Existing blocks are checked against all \`candidateHashes()\`, matching
   both \`ipHash\` and \`hashKeyVersion\` (the active version first).
5. Only remove a previous key after all associated active IP blocks have
   expired or been migrated, and document the removal. It is not possible
   to reverse an HMAC to recover the original address for migration.

If the current secret is replaced **without** advancing the version, old
matching becomes impossible. Treat version and secret changes as a coordinated
operation; rotate only after retention and rollback plans are approved.

## Trust boundary / follow-up tasks

The DEV API currently exposes a loopback-bound host port in addition to the
Cloudflare Tunnel. Do not infer that the presence of a \`CF-Connecting-IP\`
header proves Cloudflare origin. A direct origin request could supply the same
header if the trusted proxy chain is misconfigured. Only Tasks 182–185 may add
request-address extraction after verifying source identity, tunnel routing,
header sanitization, proxy configuration and Redis failure handling.

The draft IP-protection PR #28 contains a different implementation and **must
not be merged unchanged** over Task 181. Update it to use
\`IpIdentityService.hash()\` and \`candidateHashes()\`, and independently
review its IP guards, rate limits, ingress and permissions.

## Acceptance

- API unit tests: HMAC, canonical IPv4/IPv6, mapped addresses, invalid input,
  version domain separation, key change and bounded multi-key rotation.
- API service/module integration and entire repository CI.
- One-time **DEV-only smoke test** after deployment, using random keys and
  synthetic documentation addresses in memory; no existing account, IP block,
  database record, live client IP, or permanent environment secret is altered.
- STAGING and PROD remain unchanged.
