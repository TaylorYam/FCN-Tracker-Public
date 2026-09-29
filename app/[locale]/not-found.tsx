import Link from "next/link";
import { getMessages } from "@/lib/i18n/messages";

/**
 * not-found boundaries do not receive route params, so this page is
 * bilingual; "/" redirects to the visitor's language.
 */
export default function NotFound() {
  const en = getMessages("en");
  const zh = getMessages("zh-TW");
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col px-4 pt-10">
      <h1 className="text-xl font-semibold tracking-tight text-text-primary">
        {en.notFound.title} <span className="text-text-muted">·</span>{" "}
        <span lang="zh-Hant-TW">{zh.notFound.title}</span>
      </h1>
      <p className="mt-2 text-sm text-text-secondary">{en.notFound.text}</p>
      <p lang="zh-Hant-TW" className="mt-1 text-sm text-text-secondary">
        {zh.notFound.text}
      </p>
      <Link
        href="/"
        className="mt-5 inline-block self-start rounded-lg bg-bg-surface px-4 py-2 text-sm text-text-primary transition-colors hover:bg-bg-elevated"
      >
        {en.notFound.link} <span lang="zh-Hant-TW">/ {zh.notFound.link.replace("← ", "")}</span>
      </Link>
    </main>
  );
}
