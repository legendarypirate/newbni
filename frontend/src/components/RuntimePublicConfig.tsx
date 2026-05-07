/**
 * Server component that injects runtime configuration (notably the public
 * backend API URL) into the browser as `window.__BUSY_PUBLIC_CONFIG__`.
 *
 * Why this matters:
 *
 *   `process.env.NEXT_PUBLIC_*` references inside *client* code are inlined
 *   into the JS bundle at **build time**. If you change `.env` after building
 *   and just restart the server, the browser still loads the old, baked-in
 *   URL.
 *
 *   Server components, in contrast, evaluate `process.env` at **request
 *   time**. So we render the env value into HTML on every request and the
 *   client picks it up before any of our `apiBase()` calls run.
 *
 * Mount this near the top of `<body>` in `app/layout.tsx`, *before* any
 * client component that fetches the backend.
 */
export default function RuntimePublicConfig() {
  const publicApiUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  // JSON.stringify (rather than naive interpolation) prevents script
  // injection if the env value ever contains quotes / `</script>`.
  const cfg = JSON.stringify({ publicApiUrl });
  return (
    <script
      // Inline = runs synchronously during HTML parse, before any other
      // bundle JS executes.
      dangerouslySetInnerHTML={{ __html: `window.__BUSY_PUBLIC_CONFIG__=${cfg};` }}
    />
  );
}
