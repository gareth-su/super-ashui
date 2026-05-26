export type GeneratedCourse = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  category: string;
  generatedPath: string;
  defaultVariant: "sample" | "full";
  defaultLevel: "concise" | "detailed";
};

export const generatedCourses: GeneratedCourse[] = [
  {
    id: "ysjrgj",
    title: "衍生金融工具",
    shortTitle: "衍生品",
    description: "面向期末复习的衍生金融工具课程知识框架。",
    category: "金融学",
    generatedPath: "data/generated/ysjrgj",
    defaultVariant: "full",
    defaultLevel: "detailed",
  },
  {
    id: "gdsyzq",
    title: "固定收益证券",
    shortTitle: "固收",
    description: "面向期末复习的固定收益证券课程知识框架。",
    category: "金融学",
    generatedPath: "data/generated/gdsyzq",
    defaultVariant: "full",
    defaultLevel: "detailed",
  },
  {
    id: "jrjlx",
    title: "金融计量学",
    shortTitle: "金融计量学",
    description: "面向期末复习的金融计量学课程知识框架。",
    category: "金融学",
    generatedPath: "data/generated/jrjlx",
    defaultVariant: "full",
    defaultLevel: "detailed",
  },
];

export function getGeneratedCourseById(courseId: string): GeneratedCourse | undefined {
  return generatedCourses.find((c) => c.id === courseId);
}

export function getDefaultGeneratedCourse(): GeneratedCourse {
  return generatedCourses[0];
}

export function isValidGeneratedCourseId(courseId: string): boolean {
  return generatedCourses.some((c) => c.id === courseId);
}
