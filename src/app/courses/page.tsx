import Image from "next/image";
import Link from "next/link";

type CourseCard = {
  id: string;
  title: string;
  description: string;
  cover: string;
  alt: string;
  imagePosition: "left" | "right";
};

const courses: CourseCard[] = [
  {
    id: "ysjrgj",
    title: "衍生金融工具",
    description:
      "系统覆盖远期、期货、期权、互换等主要衍生工具，帮助你理解定价逻辑、套利关系、风险管理方法与实际应用场景。",
    cover: "/course-covers/ysjrgj-cover.png",
    alt: "衍生金融工具课程配图",
    imagePosition: "left",
  },
  {
    id: "gdsyzq",
    title: "固定收益证券",
    description:
      "系统讲解债券定价、收益率、久期、凸性与利率期限结构，帮助你建立固定收益投资分析的核心知识框架。",
    cover: "/course-covers/gdsyzq-cover.png",
    alt: "固定收益证券课程配图",
    imagePosition: "right",
  },
  {
    id: "jrjlx",
    title: "金融计量学",
    description:
      "围绕 Stata、回归表、数据集结构与实证复现路径，帮助你建立金融计量学的考试复习和实证操作框架。",
    cover: "/course-covers/jrjlx-cover.png",
    alt: "金融计量学课程配图",
    imagePosition: "left",
  },
];

export default function CoursesPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-neutral-950">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-neutral-950">
            <span className="text-neutral-950">超级</span>
            <span className="text-red-600">阿水</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-neutral-700 sm:gap-8 sm:text-base">
            <Link href="/" className="transition-colors hover:text-red-600">
              首页
            </Link>
            <Link href="/courses" className="relative py-2 font-semibold text-red-600">
              课程
              <span className="absolute inset-x-0 -bottom-2 h-1 rounded-full bg-red-600" />
            </Link>
            <Link href="/#about" className="transition-colors hover:text-red-600">
              关于我们
            </Link>
          </nav>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-6 pt-12 text-center sm:px-6 sm:pt-16">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
          选择你的复习课程
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
          选择感兴趣的课程，进入结构化学习页面，按章节和知识模块系统复习核心内容。
        </p>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pb-16 sm:px-6 sm:pb-20">
        {courses.map((course) => (
          <article
            key={course.id}
            className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:border-red-200 hover:shadow-md"
          >
            <div className="grid gap-0 md:grid-cols-2 md:items-center">
              <div
                className={
                  course.imagePosition === "right"
                    ? "relative h-56 overflow-hidden bg-neutral-100 md:order-2 md:h-80"
                    : "relative h-56 overflow-hidden bg-neutral-100 md:h-80"
                }
              >
                <Image
                  src={course.cover}
                  alt={course.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>

              <div className="flex min-h-72 flex-col justify-center px-6 py-8 sm:px-10 md:px-12">
                <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                  {course.title}
                </h2>
                <p className="mt-5 max-w-xl text-base leading-8 text-neutral-600">
                  {course.description}
                </p>
                <div className="mt-8">
                  <Link
                    href={`/framework?course=${course.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 sm:w-auto"
                  >
                    进入学习
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-6 text-center text-sm text-neutral-500 sm:px-6">
          © 2024 超级阿水. 保留所有权利。
        </div>
      </footer>
    </main>
  );
}
