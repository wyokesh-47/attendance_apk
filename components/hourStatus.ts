export function getHourPresentation(marked: number, total: number, submitted: boolean) {
  return {
    complete: total > 0 && marked === total,
    submitted,
  };
}

export function resolveHourSubmission(cloudBacked: boolean, cloudSubmitted: boolean, localSubmitted: boolean): boolean {
  return cloudBacked ? cloudSubmitted : localSubmitted;
}
