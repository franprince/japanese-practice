// The only part of Node's "path" that kuromoji's dictionary loader uses.
export function join(...parts: string[]): string {
  return parts.join('/').replace(/([^:/])\/{2,}/g, '$1/')
}

const path = { join }
export default path
