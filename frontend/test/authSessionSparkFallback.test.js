import test from "node:test";
import assert from "node:assert/strict";

import {
  fetchTrustedAuthSession,
} from "../src/services/authSession.js";

function createUser() {
  return {
    uid:
      "admin-user-001",

    async getIdToken() {
      return "test-id-token";
    },
  };
}

test(
  "uses the protected backend trusted session when JSON API is available",
  async () => {
    let roleFallbackCalled =
      false;

    const session =
      await fetchTrustedAuthSession(
        createUser(),
        {
          async fetchImpl() {
            return {
              ok: true,
              status: 200,

              headers: {
                get() {
                  return "application/json";
                },
              },

              async json() {
                return {
                  success: true,
                  data: {
                    uid:
                      "admin-user-001",
                    role:
                      "owner",
                  },
                };
              },
            };
          },

          async readOwnRole() {
            roleFallbackCalled =
              true;

            return "admin";
          },
        }
      );

    assert.deepEqual(
      session,
      {
        uid:
          "admin-user-001",
        role:
          "owner",
      }
    );

    assert.equal(
      roleFallbackCalled,
      false
    );

    assert.equal(
      Object.isFrozen(
        session
      ),
      true
    );
  }
);

test(
  "uses own Firestore role only when Spark Hosting returns SPA HTML",
  async () => {
    let roleUid = null;

    const session =
      await fetchTrustedAuthSession(
        createUser(),
        {
          async fetchImpl() {
            return {
              ok: true,
              status: 200,

              headers: {
                get(name) {
                  return name ===
                    "content-type"
                    ? "text/html; charset=utf-8"
                    : "";
                },
              },

              async json() {
                throw new Error(
                  "HTML is not JSON"
                );
              },
            };
          },

          async readOwnRole(uid) {
            roleUid = uid;
            return "admin";
          },
        }
      );

    assert.equal(
      roleUid,
      "admin-user-001"
    );

    assert.deepEqual(
      session,
      {
        uid:
          "admin-user-001",
        role:
          "admin",
      }
    );
  }
);

test(
  "never falls back around an explicit backend authentication denial",
  async () => {
    let roleFallbackCalled =
      false;

    await assert.rejects(
      () =>
        fetchTrustedAuthSession(
          createUser(),
          {
            async fetchImpl() {
              return {
                ok: false,
                status: 401,

                headers: {
                  get() {
                    return "application/json";
                  },
                },

                async json() {
                  return {
                    success: false,
                    code:
                      "AUTHENTICATION_REQUIRED",
                  };
                },
              };
            },

            async readOwnRole() {
              roleFallbackCalled =
                true;

              return "owner";
            },
          }
        ),
      (error) =>
        error.code ===
        "AUTHENTICATION_REQUIRED"
    );

    assert.equal(
      roleFallbackCalled,
      false
    );
  }
);

test(
  "fails closed when the Spark own-role document is missing or invalid",
  async () => {
    for (const role of [
      null,
      "",
      "forged-admin",
    ]) {
      await assert.rejects(
        () =>
          fetchTrustedAuthSession(
            createUser(),
            {
              async fetchImpl() {
                return {
                  ok: true,
                  status: 200,

                  headers: {
                    get() {
                      return "text/html";
                    },
                  },

                  async json() {
                    throw new Error(
                      "HTML response"
                    );
                  },
                };
              },

              async readOwnRole() {
                return role;
              },
            }
          ),
        (error) =>
          error.code ===
          "INVALID_TRUSTED_SESSION"
      );
    }
  }
);
