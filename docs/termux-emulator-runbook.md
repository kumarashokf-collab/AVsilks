# AV Silks 2 — Termux Firebase Emulator Runbook

## Purpose

This runbook documents the approved local Firebase Emulator workflow for AV Silks 2 on Android Termux.

It is for local development and testing only.

## Prerequisites

Required:

- Termux
- Node.js
- Java
- Firebase CLI
- Backend dependencies installed
- `frontend/dist` available
- `backend/.env.server.local` available
- `scripts/termux-firebase-emulators.sh` available

## Safety Rules

The launcher uses only:

`demo-avsilks-local`

It does not:

- deploy Firebase Functions
- deploy Firebase Hosting
- deploy Firestore rules
- enable billing
- modify the production Firebase project
- print local secret values

`backend/.env.server.local` must remain Git ignored and untracked.

`backend/.env` must remain absent.

## Launcher Self-Check

From the repository root:

`./scripts/termux-firebase-emulators.sh check`

Expected result includes:

`TERMUX_EMULATOR_LAUNCHER_CHECK=PASS`

## Start Local Emulators

Run:

`./scripts/termux-firebase-emulators.sh start`

Wait for:

`All emulators ready!`

## Local Emulator Ports

- Hosting: `127.0.0.1:5000`
- Functions: `127.0.0.1:5001`
- Firestore: `127.0.0.1:8080`
- Authentication: `127.0.0.1:9099`
- Emulator Hub: `127.0.0.1:4400`
- Reserved control port: `127.0.0.1:4500`
- Firestore WebSocket: `127.0.0.1:9150`

Local website:

`http://127.0.0.1:5000`

## Clean Shutdown

Press `Ctrl+C` once.

Wait for all Firebase emulators to stop and for the normal Termux prompt to return.

Successful SDK restoration must include:

`SDK_TARGET_RESTORED_EXACTLY=True`

## Termux Firebase Functions Compatibility

On this Termux environment, the Firebase Functions SDK executable uses:

`#!/usr/bin/env node`

That shebang produced:

`env: ‘node’: Permission denied`

The approved launcher temporarily uses the absolute Termux Node executable while the local emulator is running.

The launcher:

1. backs up the original SDK file
2. records its SHA-256 hash and mode
3. applies the temporary Termux-compatible shebang
4. starts the local Firebase Emulator Suite
5. restores the original SDK file on shutdown
6. verifies the restored SHA-256 hash

The SDK file remains inside `backend/node_modules` and is not committed to Git.

## Troubleshooting

If this appears:

`STOP: reserved backend/.env must remain absent`

do not print the file contents. Confirm why `backend/.env` exists before changing anything.

If this appears:

`STOP: backend/.env.server.local is missing`

restore the approved local environment file from the secure local source.

If this appears:

`STOP: firebase-functions SDK binary is missing`

verify backend dependencies. Do not update Firebase SDK versions during this unrelated emulator fix.

If another launcher is already running, stop that launcher cleanly before starting a second one.

Do not broadly change Termux or Android system file permissions to fix emulator issues.

## Production Exclusion

This launcher is not a production deployment mechanism.

Local emulator success does not mean production deployment is complete.

Production still requires:

Tests → Security Review → Documentation → Git Commit → Push → Pull Request → Merge → Explicit Deployment Approval → Coordinated Deployment → Live Smoke Tests → Rollback Verification → Stable Tag
