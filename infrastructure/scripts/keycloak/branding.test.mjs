import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../../../', import.meta.url);
const get = (path) => readFileSync(new URL(path, root), 'utf8');

test('DEV mounts a read-only theme without changing STAGING or PROD', () => {
  const dev = get('compose.dev.yml');
  const staging = get('compose.staging.yml');
  const prod = get('compose.prod.yml');
  const mount = './infrastructure/keycloak/themes/kurvenfunk:/opt/keycloak/themes/kurvenfunk:ro';

  assert.ok(dev.includes(mount));
  assert.ok(!staging.includes(mount));
  assert.ok(!prod.includes(mount));
});

test('theme inherits secure stock Keycloak screens, has local logo and icon', () => {
  const props = get('infrastructure/keycloak/themes/kurvenfunk/login/theme.properties');
  const styles = get(
    'infrastructure/keycloak/themes/kurvenfunk/login/resources/css/kurvenfunk.css',
  );
  const english = get('infrastructure/keycloak/themes/kurvenfunk/login/messages/messages_en.properties');
  const german = get('infrastructure/keycloak/themes/kurvenfunk/login/messages/messages_de.properties');

  assert.match(props, /^parent=keycloak\.v2$/m);
  assert.match(props, /^styles=css\/styles\.css css\/kurvenfunk\.css$/m);
  assert.match(english, /^loginTitleHtml=KURVENFUNK$/m);
  assert.match(german, /^loginTitleHtml=KURVENFUNK$/m);
  assert.match(styles, /kurvenfunk-mark\.svg/);
  assert.match(styles, /@media \(max-width: 600px\)/);
  assert.doesNotMatch(styles, /display:\s*none[^;]*;[^}]*form/iu);
});

test('activation uses existing DEV admin and changes only loginTheme', () => {
  const apply = get('infrastructure/scripts/keycloak/apply-dev-branding.sh');
  assert.match(apply, /KEYCLOAK_CONFIG_ADMIN_USERNAME/);
  assert.match(apply, /KEYCLOAK_CONFIG_ADMIN_PASSWORD/);
  assert.match(apply, /--server http:\/\/127\.0\.0\.1:8080/);
  assert.match(apply, /-s "loginTheme=kurvenfunk"/);
  assert.doesNotMatch(apply, /--force-recreate/);
  assert.doesNotMatch(apply, /smtpServer\s*=/);
});
