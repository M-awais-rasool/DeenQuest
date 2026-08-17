export const CERTIFICATE_COMPONENT = "CertificateComponent";

interface HasComponent {
  component: string;
}

export function certificateLessonIndex(lessons: HasComponent[]): number {
  return lessons.findIndex((l) => l.component === CERTIFICATE_COMPONENT);
}

export function playableLessonCount(lessons: HasComponent[]): number {
  const certIndex = certificateLessonIndex(lessons);
  return certIndex === -1 ? lessons.length : certIndex;
}
