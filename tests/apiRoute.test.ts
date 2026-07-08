import { describe, expect, it } from "vitest";
import { POST } from "../app/api/agent/route";

describe("agent API route", () => {
  it("returns validation error for invalid request body", async () => {
    const response = await POST(
      new Request("http://localhost/api/agent", {
        method: "POST",
        body: JSON.stringify({ message: "" })
      })
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error.errorCategory).toBe("validation");
  });
});
