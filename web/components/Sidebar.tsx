"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "管線健康" },
  { href: "/calls", label: "決策稽核鏈" },
  { href: "/rules", label: "規則驗證 / Regime" },
  { href: "/graph", label: "供應鏈圖" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-title">stock_agent</div>
      <nav>
        {NAV_ITEMS.map((item) => {
          // trailingSlash:true 讓靜態匯出的路徑都帶斜線，這裡正規化後再比對，
          // /calls 底下的 /calls/detail 也要能讓 "決策稽核鏈" 保持醒目。
          const normalized = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
          const isActive =
            item.href === "/"
              ? normalized === "/"
              : normalized === item.href || normalized.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? "sidebar-link active" : "sidebar-link"}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="sidebar-note">唯讀 · 本機測試中</p>
    </aside>
  );
}
