import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // 靜態匯出用一般 static file server（FastAPI StaticFiles）serve 時，需要 /calls/index.html
  // 這種路徑結構才能被自動解析，不然預設會生出 calls.html 這種平面檔名。
  trailingSlash: true,
};

export default nextConfig;
