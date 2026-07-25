import { describe, expect, test } from "vitest";
import { hrefFor, isView, viewForTool, viewFromParam } from "./navigation";

describe("viewFromParam", () => {
  test("accepts a known view", () => {
    expect(viewFromParam("sos")).toBe("sos");
  });

  test("falls back to landing when the parameter is absent", () => {
    expect(viewFromParam(null)).toBe("landing");
  });

  test("falls back to landing rather than rendering a bogus view", () => {
    expect(viewFromParam("../../etc/passwd")).toBe("landing");
  });
});

describe("isView", () => {
  test("rejects a value that is not a real screen", () => {
    expect(isView("dashboard")).toBe(false);
  });

  test("rejects null", () => {
    expect(isView(null)).toBe(false);
  });
});

describe("hrefFor", () => {
  test("keeps landing at the bare root so the first entry is clean", () => {
    expect(hrefFor("landing")).toBe("/");
  });

  test("addresses every other view by query parameter", () => {
    expect(hrefFor("checkin")).toBe("/?v=checkin");
  });
});

describe("viewForTool", () => {
  test("routes a high-risk recommendation straight to SOS", () => {
    expect(viewForTool("sos")).toBe("sos");
  });

  test("sends the call-anchor recommendation somewhere with phone numbers", () => {
    expect(viewForTool("call-anchor")).toBe("helplines");
  });

  test("lands on home for a tool id the model invented", () => {
    expect(viewForTool("meditation")).toBe("home");
  });
});
