"""
Database Backup & Disaster Recovery Utility for MCPShield
Provides automated snapshotting, integrity checks, and restoration procedures.
"""

import os
import shutil
import sqlite3
import datetime
import argparse

BACKUP_DIR = os.path.join(os.path.dirname(__file__), "..", "backups")
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "mcpshield.db")

def create_backup():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(BACKUP_DIR, f"mcpshield_backup_{timestamp}.db")

    if not os.path.exists(DB_PATH):
        print(f"[!] Database file '{DB_PATH}' not found. Nothing to backup.")
        return None

    # SQLite online backup API for ACID consistency even while active
    src_conn = sqlite3.connect(DB_PATH)
    dst_conn = sqlite3.connect(backup_file)
    with dst_conn:
        src_conn.backup(dst_conn)
    dst_conn.close()
    src_conn.close()

    size_kb = round(os.path.getsize(backup_file) / 1024, 2)
    print(f"[+] Backup successfully generated: {backup_file} ({size_kb} KB)")
    return backup_file

def verify_backup(backup_file):
    if not os.path.exists(backup_file):
        print(f"[-] Backup file '{backup_file}' does not exist.")
        return False

    conn = sqlite3.connect(backup_file)
    cursor = conn.cursor()
    cursor.execute("PRAGMA integrity_check;")
    result = cursor.fetchone()[0]
    conn.close()

    if result == "ok":
        print(f"[+] Integrity check PASSED for: {backup_file}")
        return True
    else:
        print(f"[-] Integrity check FAILED: {result}")
        return False

def restore_backup(backup_file):
    if not os.path.exists(backup_file):
        print(f"[-] Cannot restore: '{backup_file}' not found.")
        return False

    if not verify_backup(backup_file):
        print("[-] Aborting restore: backup failed integrity validation.")
        return False

    # Create safety fallback of current state
    if os.path.exists(DB_PATH):
        safety_path = f"{DB_PATH}.pre_restore_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        shutil.copyfile(DB_PATH, safety_path)
        print(f"[*] Pre-restore snapshot created at: {safety_path}")

    shutil.copyfile(backup_file, DB_PATH)
    print(f"[+] Successfully restored database from: {backup_file}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MCPShield Database Backup & Restore")
    parser.add_argument("--backup", action="store_true", help="Create new verified snapshot")
    parser.add_argument("--restore", type=str, help="Restore database from snapshot path")
    parser.add_argument("--verify", type=str, help="Verify integrity of snapshot")

    args = parser.parse_args()

    if args.backup:
        b_file = create_backup()
        if b_file:
            verify_backup(b_file)
    elif args.restore:
        restore_backup(args.restore)
    elif args.verify:
        verify_backup(args.verify)
    else:
        # Default run backup & verify
        b_file = create_backup()
        if b_file:
            verify_backup(b_file)
