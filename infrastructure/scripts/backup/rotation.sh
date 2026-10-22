#!/usr/bin/env bash

set -Eeuo pipefail

usage() {
  echo "Usage: $0 <staging|production> [--dry-run|--apply]"
  exit 1
}

if [[ $# -lt 1 || $# -gt 2 ]]; then
  usage
fi

ENVIRONMENT="$1"
MODE="${2:---dry-run}"

case "$MODE" in
  --dry-run|--apply)
    ;;
  *)
    usage
    ;;
esac

BACKUP_KIND="${BACKUP_KIND:-postgres}"

case "$BACKUP_KIND" in
  postgres|keycloak)
    ;;
  *)
    echo "ERROR: Unsupported backup kind: $BACKUP_KIND" >&2
    exit 1
    ;;
esac

case "$ENVIRONMENT" in
  staging)
    DEFAULT_BACKUP_ROOT="/srv/kurvenfunk/staging/backups/${BACKUP_KIND}"
    ;;
  production)
    DEFAULT_BACKUP_ROOT="/srv/kurvenfunk/prod/backups/${BACKUP_KIND}"
    ;;
  *)
    usage
    ;;
esac

BACKUP_ROOT="${BACKUP_ROOT_OVERRIDE:-$DEFAULT_BACKUP_ROOT}"

RETAIN_DAILY="${RETAIN_DAILY:-7}"
RETAIN_WEEKLY="${RETAIN_WEEKLY:-4}"
RETAIN_MONTHLY="${RETAIN_MONTHLY:-6}"

if [[ ! "$RETAIN_DAILY" =~ ^[0-9]+$ ]] ||
   [[ ! "$RETAIN_WEEKLY" =~ ^[0-9]+$ ]] ||
   [[ ! "$RETAIN_MONTHLY" =~ ^[0-9]+$ ]]; then
  echo "ERROR: Retention values must be non-negative integers." >&2
  exit 1
fi

if [[ ! -d "$BACKUP_ROOT" ]]; then
  echo "ERROR: Backup directory does not exist: $BACKUP_ROOT" >&2
  exit 1
fi

declare -a BACKUPS=()
declare -A KEEP=()
declare -A REASONS=()
declare -A SEEN_DAYS=()
declare -A SEEN_WEEKS=()
declare -A SEEN_MONTHS=()

while IFS= read -r name; do
  [[ "$name" =~ ^[0-9]{8}-[0-9]{6}$ ]] || continue
  BACKUPS+=("$name")
done < <(
  find "$BACKUP_ROOT" \
    -mindepth 1 \
    -maxdepth 1 \
    -type d \
    -printf '%f\n' \
    | sort -r
)

mark_keep() {
  local backup="$1"
  local reason="$2"

  KEEP["$backup"]=1

  if [[ -n "${REASONS[$backup]:-}" ]]; then
    REASONS["$backup"]+=",${reason}"
  else
    REASONS["$backup"]="$reason"
  fi
}

daily_count=0
weekly_count=0
monthly_count=0

for backup in "${BACKUPS[@]}"; do
  date_compact="${backup:0:8}"
  day_key="$date_compact"
  month_key="${backup:0:6}"

  date_iso="${date_compact:0:4}-${date_compact:4:2}-${date_compact:6:2}"

  if ! week_key="$(date -d "$date_iso" '+%G-W%V' 2>/dev/null)"; then
    echo "ERROR: Invalid backup date in directory name: $backup" >&2
    exit 1
  fi

  if (( daily_count < RETAIN_DAILY )) &&
     [[ -z "${SEEN_DAYS[$day_key]:-}" ]]; then
    SEEN_DAYS["$day_key"]=1
    mark_keep "$backup" "daily"
    ((daily_count += 1))
  fi

  if (( weekly_count < RETAIN_WEEKLY )) &&
     [[ -z "${SEEN_WEEKS[$week_key]:-}" ]]; then
    SEEN_WEEKS["$week_key"]=1
    mark_keep "$backup" "weekly"
    ((weekly_count += 1))
  fi

  if (( monthly_count < RETAIN_MONTHLY )) &&
     [[ -z "${SEEN_MONTHS[$month_key]:-}" ]]; then
    SEEN_MONTHS["$month_key"]=1
    mark_keep "$backup" "monthly"
    ((monthly_count += 1))
  fi
done

echo "=== Backup Rotation ==="
echo "Backup kind:       $BACKUP_KIND"
echo "Environment:       $ENVIRONMENT"
echo "Backup root:       $BACKUP_ROOT"
echo "Mode:              $MODE"
echo "Retention daily:   $RETAIN_DAILY"
echo "Retention weekly:  $RETAIN_WEEKLY"
echo "Retention monthly: $RETAIN_MONTHLY"
echo

keep_count=0
delete_count=0

for backup in "${BACKUPS[@]}"; do
  if [[ -n "${KEEP[$backup]:-}" ]]; then
    printf 'KEEP    %s  [%s]\n' "$backup" "${REASONS[$backup]}"
    ((keep_count += 1))
  else
    printf 'DELETE  %s\n' "$backup"
    ((delete_count += 1))

    if [[ "$MODE" == "--apply" ]]; then
      rm -rf -- "$BACKUP_ROOT/$backup"
    fi
  fi
done

echo
echo "Managed backups: ${#BACKUPS[@]}"
echo "Kept:            $keep_count"
echo "Delete:          $delete_count"

if [[ "$MODE" == "--dry-run" ]]; then
  echo
  echo "Dry-run only. Nothing was deleted."
else
  echo
  echo "Rotation completed."
fi
