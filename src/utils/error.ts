export const handleError = (err: unknown, message: string): void => {
  console.error(err);
  alert(message);
};
