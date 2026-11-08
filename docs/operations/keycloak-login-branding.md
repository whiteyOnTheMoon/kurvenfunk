# KURVENFUNK – Keycloak Login-Branding (DEV)

This login theme is scoped to the customer-facing **kurvenfunk** realm.
The Keycloak admin UI (master realm) is not customized.

- Keycloak: pinned to `26.6.3` in `compose.yml`
- Parent theme: `keycloak.v2`; stock login, registration, verification,
  reset, required-action and OIDC/PKCE templates are **inherited unchanged**
- Branding: `KURVENFUNK` instead of Keycloak logo, KF mark, lime accent,
  accessible controls, mobile layouts and a local favicon
- No external CSS, fonts, tracking, inline JavaScript or login template overrides
- Email/SMPP/OAuth credentials and registration settings are not changed
- Only `compose.dev.yml` mounts this theme read-only

## Deploy / activation

The regular `develop` pipeline deploys the read-only theme files to the
DEV Keycloak container. The one-shot workflow job
`Apply branded DEV Keycloak login theme` runs **only** when the merge
commit includes `[auth-dev-branding-apply]` and the regular DEV deploy
has passed. It authenticates using the existing private Keycloak
configuration admin credentials over stdin, updates only
`realms/kurvenfunk.loginTheme`, reads it back, and checks the public
discovery endpoint. Any activation failure attempts to restore the
prior `loginTheme` without changing other realm fields.

### Manual rollback on DEV

Under `Realm settings → Themes → Login theme`, choose the previous theme
(usually `keycloak.v2`) and save. Changing the realm theme does **not**
require deleting users or rolling back database migrations.

## Browser acceptance (after activation)

In a fresh private browser session on `dev.kurvenfunk.at`:

1. Open login, confirm KURVENFUNK heading and favicon, mobile and desktop.
2. Create a disposable account, complete verification email and return.
3. Test forgot password/reset and retry sign in.
4. Check validation errors, expired links, social sign-in if configured,
   and accessibility of keyboard navigation and focused inputs.
5. Verify existing Microsoft 365 XOAUTH2 sender remains unchanged.

Do not validate by replaying live users or testing aggressive login limits.
STAGING/PROD remain untouched until separately reviewed.
