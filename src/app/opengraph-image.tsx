import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Electionful - SPP 2 Voting Platform";
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1a1a1a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <span style={{ fontSize: "48px" }}>📊</span>
          <h1
            style={{
              fontSize: "72px",
              fontWeight: "bold",
              color: "#ffffff",
              margin: 0,
              lineHeight: 1,
            }}
          >
            Electionful
          </h1>
        </div>
        <p
          style={{
            fontSize: "32px",
            color: "#9ca3af",
            margin: 0,
            textAlign: "center",
          }}
        >
          SPP 2 Voting Platform
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
