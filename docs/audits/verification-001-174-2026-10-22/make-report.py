from pathlib import Path
import json,csv,hashlib,re,collections,subprocess
out=Path(__file__).parent;root=Path('/workspace/kurvenfunk')
tasks=json.load(open('/workspace/kurvenfunk-audit/tasks.json'))[:174]
# Old inventory supplies candidate paths only. Assessments are separately authored from requirements and current code/probes.
inventory={x['id']:x for x in json.load(open('/workspace/kurvenfunk-audit/statusmatrix.json'))[:174]}
with open(root/'docs/audits/2026-10-22/statusmatrix.csv',encoding='utf-8-sig') as f:previous={int(x['ID']):x for x in csv.DictReader(f,delimiter=';')}
a={}
for line in (out/'assessments.tsv').read_text().splitlines():
 n,status,impl,gap,proof=line.split('|');a[int(n)]=dict(status=status,implemented=impl,missing_functionality=gap,missing_verification=proof)
assert sorted(a)==list(range(1,175))
integration=json.loads((out/'integration-results.json').read_text());assert len(integration)==20 and all(x['pass'] for x in integration)
# Index numbers are stable in the final harness. Positive functional probes and defect reproductions stay distinguished.
probe_map={30:[1,16],31:[17],32:[3],39:[14],41:[1],58:[3],60:[10],64:[6],69:[15],71:[8,9,13],72:[10],74:[11],80:[17,18],85:[1,15],86:[1,3],87:[2,12,16],88:[12,16],89:[19],93:[2,3],94:[3],96:[2],102:[4],103:[6],106:[6],107:[6],108:[7],131:[15],132:[15],136:[15],137:[15],138:[15],142:[15],143:[20],145:[17],147:[17],148:[17],149:[17],150:[17],151:[17],152:[17],153:[17],155:[17],159:[18],160:[17],162:[4,5,10],163:[9],165:[8],166:[13],167:[10],168:[12,19],169:[12,19],170:[11],171:[5],172:[10,15],173:[10]}
supp={39:['apps/api/src/modules/request-id-test/request-id-test.spec.ts'],60:['apps/api/src/modules/auth/account-status.guard.ts','apps/api/src/modules/permissions/permissions.service.ts'],75:['docs/database/moderation-card-model.md'],78:['apps/api/src/modules/audit/audit.module.ts'],83:['packages/database/prisma/seed.ts'],116:['packages/ui/src/index.ts'],172:['apps/api/src/modules/articles/article-editorial.guard.ts'],173:['apps/api/src/modules/auth/auth.guard.ts'],174:['apps/api/src/modules/notifications/notifications.module.ts','apps/api/src/modules/permissions/permissions.constants.ts']}
model_names={58:'User',59:'Profile',60:'UserStatus',61:'UserRole',62:'Club',63:'ClubAlias',64:'FanPreference',65:'Competition',66:'Season',67:'Match',68:'Standing',69:'Article',70:'Media',71:'Comment',72:'Reaction',73:'ForumCategory',74:'ModerationReport',75:'ModerationCard',76:'Sanction',77:'IPBlock',78:'AuditLog',79:'Notification',80:'Provider'}
manifest={};rows=[];rejected=[]
def reference(p,n):
 text=(root/p).read_text(errors='replace');lines=text.splitlines();anchor=1
 pattern=(r'^(?:model|enum) '+model_names[n]+r'\b') if p.endswith('schema.prisma') and n in model_names else r'^(?:export (?:class|function|const|interface)|model |enum |@Controller|@Module)'
 for i,l in enumerate(lines,1):
  if re.search(pattern,l):anchor=i;break
 manifest[p]={'sha256':hashlib.sha256((root/p).read_bytes()).hexdigest(),'lines':len(lines)}
 return {'path':p,'line':anchor}
for task in tasks:
 n=task['id'];r={**task,**a[n]};candidates=inventory[n]['files']+supp.get(n,[])
 files=[];tests=[]
 for p in dict.fromkeys(candidates+inventory[n]['tests']):
  if not (root/p).is_file():rejected.append({'id':n,'path':p});continue
  dest=tests if '.spec.' in p else files;dest.append(reference(p,n))
 r.update(files=files,tests=tests,probes=[{'index':i,**integration[i-1]} for i in probe_map.get(n,[])],previous_status=previous[n]['Status'])
 r['change_reason']='Unveränderte Einstufung; neue Belege/Lücken stehen separat.' if r['status']==r['previous_status'] else {
  42:'Aufgabe verlangt Queue-Definition, keine Consumer aller zukünftigen Features; registrierte Namen erfüllen diesen Scope.',
  55:'Aufgabe verlangt Backupstrategie, nicht deren späteren Restore. Das vorhandene Strategiedokument deckt den Scope ab.',
  60:'Enum plus zentrale Statusberücksichtigung jetzt real HTTP-verifiziert; Vergabe/Revoke gehören zu anderen Aufgaben.',
  78:'Der Wortlaut verlangt nachvollziehbares Speichern kritischer Aktionen; vorhandenes Modell allein erfüllt diesen Verhaltensanteil nicht.',
  83:'Frische Seed-Ausführung belegt alle geforderten Testdaten; produktive Testdatenbereinigung ist kein Kriterium von 083.',
  172:'Zentraler Permissionkern tatsächlich implementiert; auch ArticleEditorialGuard delegiert an ihn. Fehlende Forum-/Kartenfeatures nicht als fehlender Kern doppelt zählen.',
  173:'Zentraler Guard real geprüft. Sessionrevoke/Onboarding sind andere Anforderungen, nicht zusätzliche Guard-Kriterien.',
  174:'Kein ausführbarer Featureanteil vorhanden: Vorbereitendes Modell/Permission rechtfertigen kein PARTIAL der Kartenvergabe.'
 }.get(n,'Aktuelle Anforderungs-/Nachweisbewertung; siehe Implementierung und getrennte Lücken.')
 rows.append(r)
counts=collections.Counter(r['status'] for r in rows);oldcounts=collections.Counter(r['previous_status'] for r in rows)
(out/'statusmatrix.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
(out/'evidence-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(out/'discarded-inventory-paths.json').write_text(json.dumps(rejected,ensure_ascii=False,indent=2))
(out/'counts.json').write_text(json.dumps({'current':counts,'previous_001_174':oldcounts},indent=2))
fields=['ID','Aufgabe','Phase','Status','Implementiert','Fehlende Funktion','Fehlender Nachweis','Dateien','Tests vorhanden und ausgeführt','Lokale Integrationsproben','Vorher','Abweichung','Originalanforderung']
with open(out/'statusmatrix.csv','w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f,delimiter=';');w.writerow(fields)
 for r in rows:w.writerow([f"{r['id']:03}",r['title'],r['phase'],r['status'],r['implemented'],r['missing_functionality'],r['missing_verification'],'; '.join(f"{x['path']}:{x['line']}" for x in r['files']),'; '.join(x['path'] for x in r['tests']) or 'Keine spezifischen Repositorytests','; '.join(f"I{x['index']:02}: {x['name']}" for x in r['probes']),r['previous_status'],r['change_reason'],r['requirements']])
def link(x):return f"[{x['path']}:{x['line']}]({root/x['path']}:{x['line']})"
lines=['# Statusmatrix 001–174 – unabhängige Entwicklungsverifikation','', 'Zur Freigabe. `develop` @ `17693e9ca3e51d8b13161be90a47a7d3491ad164`. Stand 22.10.2026 UTC.','', '**Bewertungsregeln:** DONE erfüllt den konkreten Aufgabenscope mit technischem Nachweis. Modell-/Vertrags-/Dokumentaufgaben werden in ihrem engen Scope beurteilt; DONE eines Modells bedeutet keine fertige Fachfunktion. Bei vertikalen Features gelten zusätzlich Fehler/Permissions/UI/Loading/Empty/Error/Mobile/Staging/Dokumentation der Masterplan-DoD. Fehlende Browser-/Stagingabnahme verhindert deren DONE; sie wird nicht als bewiesener fehlender Code ausgegeben. PARTIAL umfasst vorhandene ausführbare Teilfunktion oder vorbereitete, aber nicht abgenommene Konfiguration. TODO bedeutet kein ausführbarer Featureanteil; UNKNOWN bedeutet unprüfbarer tatsächlicher Zustand. BLOCKED wäre eine konkrete Abhängigkeit, die die Arbeit verhindert; hier ist kein kompletter Auftrag ausschließlich extern blockiert.','', f'**Verteilung:** {dict(counts)}. Keine gewichtete Fortschrittsquote.','', 'Tests unter „Repositorytests“ wurden in den jeweils vollständigen API-/Worker-/Validation-/Webläufen ausgeführt; Dateinamen „integration“ implizieren keine echten Infrastrukturzugriffe. Mehrere Tests mocken DB/JWT. I01–I20 sind die zusätzlich außerhalb des Repositorys ausgeführten, isolierten Prüfgruppen; Details und Grenzen in [PRUEFUNGEN.md](PRUEFUNGEN.md). Drei davon reproduzieren Defekte und sind keine bestandenen Produktabnahmen. Globale Gates/Builds ersetzen keine fachlichen Einzeltests.','', '| ID | Aufgabe | Status | Funktion/Implementierung | Fehlende Funktion | Fehlender Nachweis |','|---|---|---|---|---|---|']
for r in rows:lines.append('| '+ ' | '.join([f"[{r['id']:03}](#task-{r['id']:03})",r['title'],r['status'],r['implemented'],r['missing_functionality'],r['missing_verification']])+' |')
for r in rows:
 n=r['id'];lines += ['',f'<a id="task-{n:03}"></a>',f"## {n:03} – {r['title']} — {r['status']}",'',f"Phase {r['phase']}: {r['phase_title']}",'','### Originalanforderung aus dem Masterplan','', '```text',r['requirements'].strip(),'```','', '**Implementiert/nachgewiesen:** '+r['implemented'],'','**Fehlende Funktion:** '+r['missing_functionality'],'','**Fehlender Nachweis:** '+r['missing_verification'],'','**Aktuelle Code-/Konfigurationsbelege:**','']
 lines += ['- '+link(x) for x in r['files']]
 lines += ['','**Repositorytests (passend zum Bereich, kein pauschaler Vollabnahmenachweis):**','']
 lines += ['- '+link(x) for x in r['tests']] or ['Keine spezifischen Repositorytests vorhanden.']
 if r['probes']:lines+=['','**Zusätzliche echte lokale Prüfgruppen:** '+ '; '.join(f"I{x['index']:02} {x['name']}" for x in r['probes'])+'.']
 lines+=['',f"**Vergleich:** vorher {r['previous_status']} → jetzt {r['status']}. {r['change_reason']}"]
(out/'STATUSMATRIX.md').write_text('\n'.join(lines)+'\n')
diff=['# Vergleich mit dem archivierten Audit','', 'Vorher: `cabf1477136e0a4c8951655a11cf122cd834617e`. Jetzt: `17693e9ca3e51d8b13161be90a47a7d3491ad164`. Vergleich ausschließlich der ersten 174 Zeilen, nicht der damaligen 334er-Gesamtsumme.','', f'Vorher {dict(oldcounts)}, jetzt {dict(counts)}.','', '| Aufgabe | Vorher | Jetzt | Begründung |','|---|---|---|---|']
for r in rows:
 if r['status']!=r['previous_status']:diff.append(f"| {r['id']:03} {r['title']} | {r['previous_status']} | {r['status']} | {r['change_reason']} |")
diff+=['','Unveränderte Statuswerte bedeuten keine ungeprüfte Übernahme: Bewertungen wurden separat aus Originalanforderungen, aktuellem Quellstand und frischen Läufen formuliert. Das alte Dateiinventar wurde als Suchindex genutzt, reale Dateipfade wurden erneut geprüft und gehasht; nicht existierende Inventareinträge wurden verworfen. Die alten Klassifikationen wurden erst danach verglichen.','', 'Die wesentlichen zusätzlichen Nachweise: echter JWT/JWKS-Pfad einschließlich Ablauf/Issuer/Audience/Signatur, realer User-Sync, Completion/Preferencewechsel, SQL-Cursor, Redis-Duplikat/Cooldown, Communitystatus, CRUD/Revisionen, echte BullMQ-Fakepipeline, realer Scheduled-Publishübergang. Diese verkleinern Nachweislücken, ersetzen aber keine Mobile-/Staging-/IdP-/Browserabnahme.','', 'Bisherige F02 ist im Code durch gemergten PR #7 behoben: opt-in nur development und nur lokaler Peer ohne Proxyheader; 22 zusätzliche APItests ergeben 439 statt 417. Der deaktivierte Pfad liefert in neuer HTTP-Probe 404.','', 'Bisherige F04/F08 sind nun zusätzlich lokal reproduziert: Vor-Onboarding-Kommentar 201 sowie Reviewentscheidung ohne Artikelerzeugung. F03 bleibt reproduziert: API-E2E scheitert am ESM-Export, 0 Tests. Webtestlücke bleibt 28 statt 50. Produktionsdependency-Audit weiterhin 6 critical/18 high/12 moderate/2 low. Registry-Advisories sind keine bestätigten Exploits.','', 'Offene Fix-PRs #10 (Dependencies), #11 (API-E2E) und #12 (Webtestauswahl) werden nicht als develop-Implementierung angerechnet.','', 'Präzisierungen gegenüber bisherigen pauschalen Lücken: 123/124 verlangen Darstellung/Highlight, nicht bereits den späteren Sportsimport oder die Tabellenberechnung. 170 verlangt Reportgründe, nicht das vollständige spätere Moderationsdashboard. 118 verlangt ausdrücklich Mockdaten; die gleichen Mocks sind erst bei der echten Start-/Vereinsseite (114/121) eine Integrationslücke. 100 delegiert Reset an Keycloak; fehlender Livebeweis ist kein Beleg einer nicht vorhandenen Resetfunktion. 172 besitzt bereits einen zentral delegierenden Editorialguard; eine pauschale Behauptung manueller Rollenchecks wäre falsch.','']
(out/'VERGLEICH.md').write_text('\n'.join(diff))
print(json.dumps({'counts':counts,'old':oldcounts,'files':len(manifest),'discarded_paths':len(rejected)},ensure_ascii=False))
