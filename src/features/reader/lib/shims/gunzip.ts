import { gunzipSync } from 'fflate'

// Stands in for zlibjs's Gunzip. Some servers send .gz files with
// "Content-Encoding: gzip", so the browser hands over bytes that are already
// inflated; those are passed through unchanged.
class Gunzip {
  private data: Uint8Array
  constructor(data: Uint8Array) {
    this.data = data
  }
  decompress(): Uint8Array {
    const d = this.data
    return d[0] === 0x1f && d[1] === 0x8b ? gunzipSync(d) : d
  }
}

export const Zlib = { Gunzip }
const zlibjs = { Zlib }
export default zlibjs
