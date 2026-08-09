# Kurvenfunk – File Permission Policy

## Purpose

This document defines the ownership and file permission policy for Kurvenfunk.

Goals:
- prevent unnecessary write access
- protect secrets
- separate source code from persistent data
- keep DEV, STAGING and PRODUCTION separated
- allow service-specific Docker ownership where required

## Repository

Repository: /home/ap/www/kurvenfunk
Default owner: ap:ap
Secrets must never be committed to Git.

## Environment files

.env.example: 0644
.env.dev: 0600
.env.staging: 0600
.env.prod: 0600
Owner: ap:ap

Only the owner may read or modify environment files containing secrets.

## Persistent storage

Base directory: /srv/kurvenfunk
Environments: dev, staging, prod
Base permissions: 0750
Initial owner: ap:ap

Users outside the owning user/group must not be able to access these directories.

## Service directories

Each environment contains:
- postgres
- redis
- meilisearch
- minio
- logs
- backups

Initial permissions: 0750
Initial owner: ap:ap

Service-specific directories may later receive different ownership when required by the UID/GID used inside a Docker container.
Ownership changes must be limited to the affected service directory.

## Permission rules

- persistent directories normally use 0750
- secret files use 0600
- public configuration templates may use 0644
- no Kurvenfunk secret may be world-readable
- no directory may be world-writable
- chmod 0777 must not be used to solve Docker permission problems
- Docker permission problems must be solved using correct UID/GID or service-specific ownership

## umask

The VPS currently uses umask 0002.
The primary group ap currently contains only the user ap.
Kurvenfunk secrets are nevertheless explicitly restricted to 0600.
The system-wide umask is not changed because other VPS applications may depend on it.

## DEV / STAGING / PRODUCTION

Persistent data from DEV, STAGING and PRODUCTION must remain separated.
Permission changes for one environment must not accidentally affect another environment.
Production secrets and data must never be made accessible to DEV or STAGING services.

## Verification

Check persistent storage permissions with:
find /srv/kurvenfunk -maxdepth 2 -printf "%M %u:%g %p\n"

Check environment files with:
find ~/www/kurvenfunk -maxdepth 1 -type f -name ".env*" -printf "%M %u:%g %p\n"

Check unauthorized access with:
sudo -u nobody ls /srv/kurvenfunk

The final command must fail with Permission denied.
