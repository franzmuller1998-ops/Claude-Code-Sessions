"use client";

import { useState } from "react";

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 truncate rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
        {url}
      </code>
      <button
        onClick={copy}
        className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
      >
        {copied ? "Скопировано" : "Копировать"}
      </button>
    </div>
  );
}
