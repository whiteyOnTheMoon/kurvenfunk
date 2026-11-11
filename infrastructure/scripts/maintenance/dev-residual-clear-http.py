#!/usr/bin/env python3
"""Delete only DEV Meilisearch documents and Mailpit messages, preserving settings."""
import json
import subprocess
import sys
import time
import urllib.parse
import urllib.request

if len(sys.argv) != 2 or sys.argv[1] != "CLEAR_DEV_ONLY_RESIDUAL_DATA":
    raise SystemExit("ERROR: HTTP_CLEANUP_NOT_AUTHORIZED")

compose = ["docker", "compose", "-p", "kurvenfunk-dev", "--env-file", ".env.dev",
           "-f", "compose.yml", "-f", "compose.dev.yml"]
key = subprocess.check_output(
    compose + ["exec", "-T", "meilisearch", "printenv", "MEILI_MASTER_KEY"],
    stderr=subprocess.DEVNULL, timeout=20).decode().strip()
if not key:
    raise SystemExit("ERROR: MEILISEARCH_KEY_NOT_CONFIGURED")

def meili(path, method="GET"):
    req = urllib.request.Request(
        "http://127.0.0.1:3103" + path,
        headers={"Authorization": "Bearer " + key}, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)

stats = meili("/stats")
indexes = stats.get("indexes")
if not isinstance(indexes, dict):
    raise SystemExit("ERROR: INVALID_MEILI_STATS")
deleted = 0
for uid, entry in indexes.items():
    count = entry.get("numberOfDocuments")
    if not isinstance(count, int) or count < 0:
        raise SystemExit("ERROR: INVALID_MEILI_DOCUMENT_COUNT")
    if not count:
        continue
    path = "/indexes/" + urllib.parse.quote(uid, safe="") + "/documents"
    task = meili(path, "DELETE")
    task_id = task.get("taskUid")
    if not isinstance(task_id, int):
        raise SystemExit("ERROR: MEILI_DELETION_TASK_MISSING")
    for _ in range(180):
        result = meili("/tasks/" + str(task_id))
        status = result.get("status")
        if status == "succeeded":
            break
        if status in ("failed", "canceled"):
            raise SystemExit("ERROR: MEILI_DOCUMENT_DELETE_FAILED")
        time.sleep(1)
    else:
        raise SystemExit("ERROR: MEILI_DOCUMENT_DELETE_TIMEOUT")
    deleted += count
post = meili("/stats").get("indexes")
if not isinstance(post, dict) or any(d.get("numberOfDocuments") != 0 for d in post.values()):
    raise SystemExit("ERROR: MEILI_DOCUMENTS_REMAIN")
print("DEV_MEILI_DOCUMENTS_REMOVED=" + str(deleted))
print("DEV_MEILI_DOCUMENTS_EMPTY=YES")

mail = "http://127.0.0.1:3107"
def mail_total():
    with urllib.request.urlopen(mail + "/api/v1/messages?limit=1", timeout=30) as resp:
        count = json.load(resp).get("total")
    if type(count) is not int or count < 0:
        raise SystemExit("ERROR: MAILPIT_COUNT_INVALID")
    return count

before = mail_total()
if before:
    # Mailpit supports an empty IDs array for deleting all stored messages.
    payload = json.dumps({"IDs": []}).encode()
    req = urllib.request.Request(
        mail + "/api/v1/messages", method="DELETE", data=payload,
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        if resp.status != 200:
            raise SystemExit("ERROR: MAILPIT_DELETE_FAILED")
after = mail_total()
if after:
    raise SystemExit("ERROR: MAILPIT_MESSAGES_REMAIN")
print("DEV_MAILPIT_MESSAGES_REMOVED=" + str(before))
print("DEV_MAILPIT_MESSAGES_EMPTY=YES")
