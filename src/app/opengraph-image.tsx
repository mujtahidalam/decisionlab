import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#f7f7f4",
          color: "#111110",
        }}
      >
        <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: "#1f5fbf" }}>DecisionLens</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2 }}>{siteConfig.tagline}</div>
          <div style={{ marginTop: 24, fontSize: 32, color: "#52514e" }}>
            Transparent models · Scenario analysis · Sensitivity analysis
          </div>
        </div>
      </div>
    ),
    size,
  );
}
