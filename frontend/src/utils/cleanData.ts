export default function cleanData<T>(obj: T): T {
  if (typeof obj === "string") {
    // Trim strings
    const trimmed = obj.trim();
    return (trimmed === "" ? undefined : trimmed) as unknown as T;
  } else if (Array.isArray(obj)) {
    return obj
      .map(item => cleanData(item))
      .filter(item => item !== undefined && item !== null && item !== "") as unknown as T;
  } else if (obj !== null && typeof obj === "object") {
    // Process objects
    const cleaned = Object.fromEntries(
      Object.entries(obj)
        .map(([key, value]) => [key, cleanData(value)])
        .filter(([_, value]) => value !== undefined && value !== null && value !== "")
    );
    return cleaned as T;
  }

  return obj;
}
