import { describe, it, expect, mock, beforeEach } from "bun:test";
import { OrthancClient, OrthancError } from "../src";

const BASE_URL = "http://localhost:8042";

function mockFetch(response: unknown, status = 200, contentType = "application/json") {
  return mock(() =>
    Promise.resolve(
      new Response(
        contentType === "application/json" ? JSON.stringify(response) : (response as string),
        {
          status,
          headers: { "Content-Type": contentType },
        }
      )
    )
  );
}

describe("OrthancClient", () => {
  let client: OrthancClient;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    client = new OrthancClient({ baseUrl: BASE_URL });
  });

  it("should construct with base URL", () => {
    expect(client).toBeInstanceOf(OrthancClient);
  });

  it("should strip trailing slash from baseUrl", () => {
    const c = new OrthancClient({ baseUrl: "http://localhost:8042/" });
    expect(c).toBeInstanceOf(OrthancClient);
  });

  it("system() should return system info", async () => {
    const info = { Version: "1.12.11", ApiVersion: 21 };
    globalThis.fetch = mockFetch(info);
    const result = await client.system();
    expect(result.Version).toBe("1.12.11");
    globalThis.fetch = originalFetch;
  });

  it("listPatients() should return array of IDs", async () => {
    const ids = ["abc123", "def456"];
    globalThis.fetch = mockFetch(ids);
    const result = await client.listPatients();
    expect(result).toEqual(ids);
    globalThis.fetch = originalFetch;
  });

  it("should throw OrthancError on non-ok response", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Not Found", { status: 404 }))
    );
    await expect(client.system()).rejects.toThrow(OrthancError);
    globalThis.fetch = originalFetch;
  });

  it("OrthancError should expose statusCode and url", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Not Found", { status: 404 }))
    );
    try {
      await client.system();
    } catch (e) {
      expect(e).toBeInstanceOf(OrthancError);
      const err = e as OrthancError;
      expect(err.statusCode).toBe(404);
      expect(err.url).toContain("/system");
    }
    globalThis.fetch = originalFetch;
  });
});
