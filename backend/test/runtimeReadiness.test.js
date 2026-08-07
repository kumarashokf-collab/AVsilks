"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  spawnSync,
} = require("node:child_process");

const BACKEND_ROOT = path.resolve(
  __dirname,
  ".."
);

const PROJECT_ROOT = path.resolve(
  BACKEND_ROOT,
  ".."
);

function readProjectFile(relativePath) {
  return fs.readFileSync(
    path.join(
      PROJECT_ROOT,
      relativePath
    ),
    "utf8"
  );
}

function createLauncherFixture({
  reservedEnvironment = false,
} = {}) {
  const temporaryBase = (
    process.env.TMPDIR
    || os.tmpdir()
  );

  const fixtureRoot = fs.mkdtempSync(
    path.join(
      temporaryBase,
      "avsilks-runtime-readiness-"
    )
  );

  const projectRoot = path.join(
    fixtureRoot,
    "project"
  );

  const scriptsDirectory = path.join(
    projectRoot,
    "scripts"
  );

  const backendDirectory = path.join(
    projectRoot,
    "backend"
  );

  const sdkDirectory = path.join(
    backendDirectory,
    "node_modules",
    "firebase-functions",
    "lib",
    "bin"
  );

  const binaryDirectory = path.join(
    fixtureRoot,
    "bin"
  );

  const homeDirectory = path.join(
    fixtureRoot,
    "home"
  );

  fs.mkdirSync(
    scriptsDirectory,
    {
      recursive: true,
    }
  );

  fs.mkdirSync(
    sdkDirectory,
    {
      recursive: true,
    }
  );

  fs.mkdirSync(
    binaryDirectory,
    {
      recursive: true,
    }
  );

  fs.mkdirSync(
    homeDirectory,
    {
      recursive: true,
    }
  );

  const launcherSource = path.join(
    PROJECT_ROOT,
    "scripts",
    "termux-firebase-emulators.sh"
  );

  const launcherCopy = path.join(
    scriptsDirectory,
    "termux-firebase-emulators.sh"
  );

  fs.copyFileSync(
    launcherSource,
    launcherCopy
  );

  fs.chmodSync(
    launcherCopy,
    0o700
  );

  fs.writeFileSync(
    path.join(
      projectRoot,
      "firebase.json"
    ),
    "{}\n",
    "utf8"
  );

  fs.writeFileSync(
    path.join(
      backendDirectory,
      ".env.server.local"
    ),
    "PORT=8080\n",
    {
      encoding: "utf8",
      mode: 0o600,
    }
  );

  if (reservedEnvironment) {
    fs.writeFileSync(
      path.join(
        backendDirectory,
        ".env"
      ),
      "RESERVED=true\n",
      {
        encoding: "utf8",
        mode: 0o600,
      }
    );
  }

  const sdkTarget = path.join(
    sdkDirectory,
    "firebase-functions.js"
  );

  const sdkOriginal = (
    "#!/usr/bin/env node\n"
    + "\"use strict\";\n"
  );

  fs.writeFileSync(
    sdkTarget,
    sdkOriginal,
    {
      encoding: "utf8",
      mode: 0o700,
    }
  );

  const fakeNode = path.join(
    binaryDirectory,
    "node"
  );

  const fakeFirebase = path.join(
    binaryDirectory,
    "firebase"
  );

  fs.writeFileSync(
    fakeNode,
    "#!/bin/sh\nexit 0\n",
    {
      encoding: "utf8",
      mode: 0o700,
    }
  );

  fs.writeFileSync(
    fakeFirebase,
    "#!/bin/sh\nexit 0\n",
    {
      encoding: "utf8",
      mode: 0o700,
    }
  );

  return {
    fixtureRoot,
    launcherCopy,
    sdkTarget,
    sdkOriginal,
    binaryDirectory,
    homeDirectory,
  };
}

function runLauncherCheck(fixture) {
  return spawnSync(
    "bash",
    [
      fixture.launcherCopy,
      "check",
    ],
    {
      cwd: path.dirname(
        fixture.launcherCopy
      ),

      encoding: "utf8",

      env: {
        ...process.env,

        HOME:
          fixture.homeDirectory,

        PATH:
          fixture.binaryDirectory
          + path.delimiter
          + process.env.PATH,
      },
    }
  );
}

test(
  "keeps the Express app independent from the standalone listener",
  () => {
    const appSource = readProjectFile(
      "backend/app.js"
    );

    assert.match(
      appSource,
      /module\.exports\s*=\s*app/
    );

    assert.doesNotMatch(
      appSource,
      /\.listen\s*\(/
    );

    assert.doesNotMatch(
      appSource,
      /dotenv\.config\s*\(/
    );
  }
);

test(
  "loads the local server environment before importing the app",
  () => {
    const serverSource = readProjectFile(
      "backend/server.js"
    );

    const environmentPosition = (
      serverSource.indexOf(
        "dotenv.config"
      )
    );

    const appImportPosition = (
      serverSource.indexOf(
        'require("./app")'
      )
    );

    assert.ok(
      environmentPosition >= 0
    );

    assert.ok(
      appImportPosition
        > environmentPosition
    );

    assert.match(
      serverSource,
      /\.env\.server\.local/
    );

    assert.match(
      serverSource,
      /Number\.parseInt/
    );

    assert.match(
      serverSource,
      /parsedPort\s*<\s*1/
    );

    assert.match(
      serverSource,
      /parsedPort\s*>\s*65535/
    );

    assert.match(
      serverSource,
      /app\.listen\s*\(\s*parsedPort\s*,\s*"0\.0\.0\.0"/
    );
  }
);

test(
  "keeps package entry points separated for Functions and local server use",
  () => {
    const packageConfig = JSON.parse(
      readProjectFile(
        "backend/package.json"
      )
    );

    assert.equal(
      packageConfig.main,
      "functions.js"
    );

    assert.equal(
      packageConfig.scripts.start,
      "node server.js"
    );

    assert.equal(
      packageConfig.scripts.dev,
      "node server.js"
    );

    assert.equal(
      packageConfig.engines.node,
      "22"
    );
  }
);

test(
  "defines the complete isolated Firebase emulator contract",
  () => {
    const firebaseConfig = JSON.parse(
      readProjectFile(
        "firebase.json"
      )
    );

    assert.deepEqual(
      firebaseConfig.emulators,
      {
        auth: {
          port: 9099,
        },

        firestore: {
          port: 8080,
        },

        functions: {
          port: 5001,
        },

        hosting: {
          port: 5000,
        },

        ui: {
          enabled: false,
        },

        singleProjectMode: true,
      }
    );

    assert.equal(
      firebaseConfig.functions[0].source,
      "backend"
    );

    assert.equal(
      firebaseConfig.functions[0].codebase,
      "api"
    );

    assert.ok(
      firebaseConfig.functions[0].ignore.includes(
        ".env.*"
      )
    );

    assert.deepEqual(
      firebaseConfig.hosting.rewrites[0],
      {
        source: "/api/**",

        function: {
          functionId: "api",
          region: "asia-south1",
        },
      }
    );
  }
);

test(
  "contains the Termux launcher restoration and isolation safeguards",
  () => {
    const launcherSource = readProjectFile(
      "scripts/termux-firebase-emulators.sh"
    );

    assert.match(
      launcherSource,
      /^#!\/data\/data\/com\.termux\/files\/usr\/bin\/bash/
    );

    assert.match(
      launcherSource,
      /PROJECT_ID="demo-avsilks-local"/
    );

    assert.match(
      launcherSource,
      /EMULATOR_SET="auth,firestore,functions,hosting"/
    );

    assert.match(
      launcherSource,
      /LOCAL_SERVER_ENV=.*\.env\.server\.local/
    );

    assert.match(
      launcherSource,
      /RESERVED_FUNCTIONS_ENV=.*backend\/\.env/
    );

    assert.match(
      launcherSource,
      /FIRST_LINE.*#!\/usr\/bin\/env node/s
    );

    assert.match(
      launcherSource,
      /trap restore_and_exit EXIT/
    );

    assert.match(
      launcherSource,
      /cp -p "\$BACKUP" "\$SDK_TARGET"/
    );

    assert.match(
      launcherSource,
      /SDK restoration hash mismatch/
    );

    assert.match(
      launcherSource,
      /rm -rf "\$LOCK_DIR"/
    );

    assert.match(
      launcherSource,
      /--project "\$PROJECT_ID"/
    );

    assert.match(
      launcherSource,
      /--non-interactive/
    );
  }
);

test(
  "runs launcher check mode in an isolated fixture without modifying the SDK",
  () => {
    const fixture = createLauncherFixture();

    try {
      const result = runLauncherCheck(
        fixture
      );

      assert.equal(
        result.status,
        0,
        result.stderr
      );

      assert.match(
        result.stdout,
        /TERMUX_EMULATOR_LAUNCHER_CHECK=PASS/
      );

      assert.match(
        result.stdout,
        /PROJECT_ID=demo-avsilks-local/
      );

      assert.match(
        result.stdout,
        /BILLING_ENABLED=False/
      );

      assert.equal(
        fs.readFileSync(
          fixture.sdkTarget,
          "utf8"
        ),
        fixture.sdkOriginal
      );

      assert.equal(
        fs.existsSync(
          path.join(
            fixture.homeDirectory,
            ".cache",
            "avsilks-termux-emulators.lock"
          )
        ),
        false
      );
    } finally {
      fs.rmSync(
        fixture.fixtureRoot,
        {
          recursive: true,
          force: true,
        }
      );
    }
  }
);

test(
  "launcher check mode fails closed when reserved backend env exists",
  () => {
    const fixture = createLauncherFixture({
      reservedEnvironment: true,
    });

    try {
      const result = runLauncherCheck(
        fixture
      );

      assert.notEqual(
        result.status,
        0
      );

      assert.match(
        result.stderr,
        /reserved backend\/\.env must remain absent/
      );

      assert.equal(
        fs.readFileSync(
          fixture.sdkTarget,
          "utf8"
        ),
        fixture.sdkOriginal
      );
    } finally {
      fs.rmSync(
        fixture.fixtureRoot,
        {
          recursive: true,
          force: true,
        }
      );
    }
  }
);
