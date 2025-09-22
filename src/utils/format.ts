export const formatDate = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString();
};

export const truncate = (text: string, maxLength: number) => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
};
