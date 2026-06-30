import { ImageResponse } from "next/og";
import { getLogoData } from "@/app/lib/content";

export const runtime = "nodejs";

const SIZE = 256;

export async function GET() {
  const logo = await getLogoData();
  if (!logo) {
    return new Response(null, { status: 404 });
  }

  const dataUri = `data:${logo.mime};base64,${logo.data.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUri}
          width={SIZE}
          height={SIZE}
          style={{ width: SIZE, height: SIZE, objectFit: "cover" }}
          alt=""
        />
      </div>
    ),
    {
      width: SIZE,
      height: SIZE,
      headers: { "Cache-Control": "public, max-age=3600" },
    }
  );
}
