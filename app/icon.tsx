import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const fontData = await fetch(
    new URL("./api/og/fonts/SourceSerif4-MediumItalic.woff", import.meta.url),
  ).then((r) => r.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a2a4f",
          borderRadius: 7,
          color: "#ffffff",
          fontFamily: '"Source Serif 4"',
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: 19,
          lineHeight: 1,
          fontFeatureSettings: '"ss01"',
        }}
      >
        π
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Source Serif 4",
          data: fontData,
          style: "italic",
          weight: 500,
        },
      ],
    },
  );
}
