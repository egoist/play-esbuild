export const getMode = (filename: string) => {
  if (/\.(js|jsx|ts|tsx)$/.test(filename)) return "text/typescript-jsx"
  if (/\.json$/.test(filename)) return "application/json"
  if (/\.css$/.test(filename)) return "text/css"
}
