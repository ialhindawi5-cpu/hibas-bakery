// Emits a schema.org JSON-LD block for Google's rich results.
//
// The payload is built server-side from our own settings, and JSON.stringify
// can't produce a "</script>" sequence except inside a string value — which we
// escape below — so this cannot break out of the script tag.
export default function JsonLd({ data }: { data: unknown }) {
  if (!data) return null;
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}
