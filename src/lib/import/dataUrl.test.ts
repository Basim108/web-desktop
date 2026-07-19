import { describe, expect, it } from "vitest";
import { blobToDataUrl, dataUrlToBlob } from "./dataUrl";

// "PNG" as base64 is a convenient, valid base64 payload for decode assertions.
const PNG_BASE64 = btoa("PNG");

describe("dataUrlToBlob", () => {
  it("decodes a base64 image data URL into a Blob carrying its MIME type", async () => {
    const blob = dataUrlToBlob(`data:image/png;base64,${PNG_BASE64}`);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob?.type).toBe("image/png");
    expect(await blob?.text()).toBe("PNG");
  });

  it("returns undefined for a non-data-URL string", () => {
    expect(dataUrlToBlob("https://example.com/icon.png")).toBeUndefined();
  });

  it("returns undefined for a data URL that is not base64-encoded", () => {
    expect(dataUrlToBlob("data:text/plain,hello")).toBeUndefined();
  });

  it("returns undefined for garbage / invalid base64", () => {
    expect(dataUrlToBlob("data:image/png;base64,@@@not-base64@@@")).toBe(
      undefined,
    );
  });

  it("returns undefined for an empty string", () => {
    expect(dataUrlToBlob("")).toBeUndefined();
  });
});

describe("blobToDataUrl", () => {
  it("encodes a Blob as a base64 data URL preserving its MIME type", async () => {
    const blob = new Blob(["PNG"], { type: "image/png" });
    expect(await blobToDataUrl(blob)).toBe(
      `data:image/png;base64,${PNG_BASE64}`,
    );
  });

  it("falls back to application/octet-stream for a typeless Blob", async () => {
    const blob = new Blob(["PNG"]);
    expect(await blobToDataUrl(blob)).toBe(
      `data:application/octet-stream;base64,${PNG_BASE64}`,
    );
  });

  it("round-trips bytes through dataUrlToBlob unchanged", async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0x10]);
    const original = new Blob([bytes], { type: "image/webp" });

    const restored = dataUrlToBlob(await blobToDataUrl(original));

    expect(restored?.type).toBe("image/webp");
    expect(new Uint8Array(await restored!.arrayBuffer())).toEqual(bytes);
  });
});
