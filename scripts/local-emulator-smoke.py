#!/usr/bin/env python3

import http.client
import json
import socket
import sys

HOST = "127.0.0.1"

PROJECT_ID = "demo-avsilks-local"

AUTH_PORT = 9099
FIRESTORE_PORT = 8080
FUNCTIONS_PORT = 5001
HOSTING_PORT = 5000

FUNCTION_PATH = (
    "/"
    + PROJECT_ID
    + "/asia-south1/api"
    + "/api/health"
)

HOSTING_HEALTH_PATH = "/api/health"

def fail(marker, detail=""):
    print(marker)

    if detail:
        print(
            "LOCAL_EMULATOR_SMOKE_DETAIL="
            + detail[:300]
        )

    print(
        "LOCAL_EMULATOR_SMOKE_GATE=FAIL"
    )

    raise SystemExit(1)

def tcp_probe(port):
    try:
        with socket.create_connection(
            (HOST, port),
            timeout=5,
        ):
            return
    except OSError as exc:
        fail(
            "LOCAL_EMULATOR_TCP_GATE=FAIL",
            f"port={port} type={type(exc).__name__}",
        )

def http_json(port, path):
    connection = http.client.HTTPConnection(
        HOST,
        port,
        timeout=10,
    )

    try:
        connection.request(
            "GET",
            path,
            headers={
                "Host": f"{HOST}:{port}",
                "Accept": "application/json",
            },
        )

        response = connection.getresponse()

        body = response.read().decode(
            "utf-8",
            errors="replace",
        )

        return (
            response.status,
            body,
        )

    finally:
        connection.close()

def require_health(port, path, marker):
    try:
        status, body = http_json(
            port,
            path,
        )
    except Exception as exc:
        fail(
            marker.replace(
                "=PASS",
                "=FAIL",
            ),
            type(exc).__name__,
        )

    if status != 200:
        fail(
            marker.replace(
                "=PASS",
                "=FAIL",
            ),
            f"http_status={status}",
        )

    try:
        payload = json.loads(
            body
        )
    except Exception:
        fail(
            marker.replace(
                "=PASS",
                "=FAIL",
            ),
            "response_not_json",
        )

    if not (
        payload.get("success") is True
        and payload.get("status") == "Active"
    ):
        fail(
            marker.replace(
                "=PASS",
                "=FAIL",
            ),
            "unexpected_health_payload",
        )

    print(marker)

print("LOCAL_EMULATOR_SMOKE_BEGIN")
print(
    "LOCAL_EMULATOR_PROJECT="
    + PROJECT_ID
)

tcp_probe(
    AUTH_PORT
)

print(
    "LOCAL_EMULATOR_AUTH_SMOKE_GATE=PASS"
)

tcp_probe(
    FIRESTORE_PORT
)

print(
    "LOCAL_EMULATOR_FIRESTORE_SMOKE_GATE=PASS"
)

require_health(
    FUNCTIONS_PORT,
    FUNCTION_PATH,
    "LOCAL_EMULATOR_FUNCTIONS_SMOKE_GATE=PASS",
)

require_health(
    HOSTING_PORT,
    HOSTING_HEALTH_PATH,
    "LOCAL_EMULATOR_HOSTING_SMOKE_GATE=PASS",
)

print(
    "LOCAL_EMULATOR_LOCALHOST_ONLY_GATE=PASS"
)
print(
    "PRODUCTION_PROJECT_ACCESS_STATUS=NOT_ATTEMPTED"
)
print(
    "PRODUCTION_SECRET_VALUES_STATUS=NOT_ACCESSED"
)
print(
    "CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
)
print(
    "FIREBASE_DEPLOY_STATUS=NOT_ATTEMPTED"
)
print(
    "LOCAL_EMULATOR_SMOKE_GATE=PASS"
)
