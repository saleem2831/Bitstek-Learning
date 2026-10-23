/** Count lessons defensively. Populated Course documents often omit modules. */
export function countLessons(modules) {
  if (!Array.isArray(modules)) return 0;
  return modules.reduce((count, module) => {
    const lessons = module?.lessons;
    return count + (Array.isArray(lessons) ? lessons.length : 0);
  }, 0);
}
