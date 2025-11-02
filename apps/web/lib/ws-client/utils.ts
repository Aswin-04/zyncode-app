export const isBinary = (message: unknown): message is Blob => {
  return (
    typeof message === "object" &&
    Object.prototype.toString.call(message) === "[object Blob]" &&
    message instanceof Blob
  );
};
