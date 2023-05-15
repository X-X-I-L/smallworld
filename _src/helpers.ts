//https://stackoverflow.com/a/4878800
export function capitalize(str: string) {
  return str
    .toLowerCase()
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(" ");
}
