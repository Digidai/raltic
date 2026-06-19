import type React from "react";

type JsonLdScriptProps = {
  data: Record<string, unknown>;
};

export function JsonLdScript({ data }: JsonLdScriptProps): React.ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
