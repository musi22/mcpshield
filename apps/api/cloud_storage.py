"""
Cloud Object Storage Service for MCPShield.
Integrates with Cloudflare R2 ($0 egress fees, 10GB free/mo) and AWS S3 / MinIO.
Ensures zero persistent reliance on local disk for logs, scan outputs, and compliance reports.
"""

import os
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any

logger = logging.getLogger("mcpshield.storage")

# Cloudflare R2 or AWS S3 configuration
R2_ACCOUNT_ID = os.environ.get("CLOUDFLARE_R2_ACCOUNT_ID", "").strip()
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID") or os.environ.get("AWS_ACCESS_KEY_ID", "").strip()
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY") or os.environ.get("AWS_SECRET_ACCESS_KEY", "").strip()
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME") or os.environ.get("S3_BUCKET_NAME", "mcpshield-vault").strip()
R2_CUSTOM_ENDPOINT = os.environ.get("S3_ENDPOINT_URL", "").strip()

if not R2_CUSTOM_ENDPOINT and R2_ACCOUNT_ID:
    R2_CUSTOM_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"


class CloudStorageService:
    """
    Cloud Object Storage Service managing audit chains, scan artifacts, and exports in cloud buckets.
    """

    def __init__(self):
        self._s3_client = None
        self._is_connected = False
        self._init_client()

    def _init_client(self):
        if R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY:
            try:
                import boto3
                from botocore.config import Config

                config = Config(
                    retries={"max_attempts": 3, "mode": "standard"},
                    signature_version="s3v4"
                )
                self._s3_client = boto3.client(
                    "s3",
                    endpoint_url=R2_CUSTOM_ENDPOINT if R2_CUSTOM_ENDPOINT else None,
                    aws_access_key_id=R2_ACCESS_KEY_ID,
                    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
                    region_name=os.environ.get("AWS_REGION", "auto"),
                    config=config
                )
                self._is_connected = True
                logger.info(f"Cloud Object Storage initialized: bucket={R2_BUCKET_NAME}")
            except Exception as e:
                logger.warning(f"Could not connect to Cloud Storage: {str(e)}")
                self._s3_client = None
                self._is_connected = False
        else:
            self._is_connected = False

    def is_configured(self) -> bool:
        return self._is_connected and self._s3_client is not None

    def get_storage_status(self) -> Dict[str, Any]:
        if self._is_connected:
            provider = "Cloudflare R2 ($0 Egress)" if "r2.cloudflarestorage" in R2_CUSTOM_ENDPOINT else "AWS S3 / Compatible"
            return {
                "status": "connected",
                "provider": provider,
                "bucket": R2_BUCKET_NAME,
                "endpoint": R2_CUSTOM_ENDPOINT[:32] + "..." if len(R2_CUSTOM_ENDPOINT) > 32 else R2_CUSTOM_ENDPOINT,
                "zero_egress_fee": "Cloudflare R2" in provider,
                "free_tier": "10 GB Storage / Month",
                "cost": "$0.00 / month"
            }
        else:
            return {
                "status": "ready_for_credentials",
                "provider": "Cloudflare R2 / AWS S3",
                "bucket": R2_BUCKET_NAME,
                "message": "Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY to enable automatic cloud bucket sync.",
                "zero_egress_fee": True,
                "free_tier": "10 GB Storage / Month",
                "cost": "$0.00 / month"
            }

    async def upload_audit_archive(self, workspace_slug: str, archive_id: str, events: list) -> Dict[str, Any]:
        """Archives cryptographic audit logs to cloud storage without touching local disk."""
        key = f"audit_archives/{workspace_slug}/{archive_id}.json.gz"
        payload_str = json.dumps({
            "workspace": workspace_slug,
            "archive_id": archive_id,
            "exported_at": datetime.utcnow().isoformat(),
            "event_count": len(events),
            "events": events
        }, indent=2)

        if self.is_configured():
            try:
                self._s3_client.put_object(
                    Bucket=R2_BUCKET_NAME,
                    Key=key,
                    Body=payload_str.encode("utf-8"),
                    ContentType="application/json",
                    Metadata={"workspace": workspace_slug, "archive_id": archive_id}
                )
                return {
                    "stored_in_cloud": True,
                    "provider": "Cloudflare R2 / S3",
                    "bucket": R2_BUCKET_NAME,
                    "key": key,
                    "size_bytes": len(payload_str)
                }
            except Exception as e:
                logger.error(f"Failed to upload audit archive to cloud: {e}")
                return {"stored_in_cloud": False, "error": str(e)}

        return {
            "stored_in_cloud": False,
            "key": key,
            "size_bytes": len(payload_str),
            "notice": "Cloud credentials not configured. Configure R2_ACCESS_KEY_ID for automatic cloud upload."
        }

    async def upload_scan_report(self, workspace_slug: str, scan_id: str, report_data: dict) -> Dict[str, Any]:
        """Stores scanner SARIF/JSON artifacts into Cloudflare R2 / S3."""
        key = f"scan_reports/{workspace_slug}/{scan_id}.json"
        body = json.dumps(report_data, indent=2).encode("utf-8")

        if self.is_configured():
            try:
                self._s3_client.put_object(
                    Bucket=R2_BUCKET_NAME,
                    Key=key,
                    Body=body,
                    ContentType="application/json"
                )
                return {
                    "stored_in_cloud": True,
                    "bucket": R2_BUCKET_NAME,
                    "key": key,
                    "size_bytes": len(body)
                }
            except Exception as e:
                logger.error(f"Failed to upload scan report to cloud: {e}")
                return {"stored_in_cloud": False, "error": str(e)}

        return {
            "stored_in_cloud": False,
            "key": key,
            "size_bytes": len(body),
            "notice": "Cloud credentials not configured."
        }


# Global singleton instance
cloud_storage = CloudStorageService()
