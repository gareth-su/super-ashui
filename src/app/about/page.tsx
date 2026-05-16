import Link from "next/link";
import { landingPreface } from "@/content/landing-preface";

type PrefaceBlock = (typeof landingPreface)[number];

function renderBlock(block: PrefaceBlock, index: number) {
  switch (block.type) {
    case "heading":
      return (
        <p key={`${block.type}-${index}`} className="text-sm font-semibold text-neutral-950">
          {block.text}
        </p>
      );
    case "paragraph":
      return (
        <p key={`${block.type}-${index}`} className="text-sm leading-7 text-neutral-700">
          {block.text}
        </p>
      );
    case "bullets":
      return (
        <ul key={`${block.type}-${index}`} className="space-y-2 pl-5 text-sm leading-7 text-neutral-700 list-disc">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "numbered":
      return (
        <ol key={`${block.type}-${index}`} className="space-y-3 pl-5 text-sm leading-7 text-neutral-700 list-decimal">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    default:
      return null;
  }
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#fafafa] text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
          <Link href="/" className="text-xl font-black tracking-tight">
            <span className="text-neutral-950">超级</span>
            <span className="text-red-600">阿水</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-500 md:flex">
            <Link href="/" className="transition-colors hover:text-neutral-950">
              首页
            </Link>
            <Link href="/courses" className="transition-colors hover:text-neutral-950">
              课程
            </Link>
            <Link href="/about" className="text-neutral-950">
              关于我们
              <span className="mt-1 block h-0.5 rounded-full bg-red-600" />
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-neutral-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
          <div className="space-y-4">
            {landingPreface.map((block, index) => renderBlock(block, index))}
          </div>
        </div>
      </section>
    </main>
  );
}
