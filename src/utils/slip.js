// @ts-check

import { decodePacket } from 'protocol-slip'
export { encodeMessage as slipEncode } from 'protocol-slip'

/** @param {Buffer} buffer */
// @ts-ignore (`decodePacket` expects a BufferStreamList which doesn't seem to
// work. Just passing a Buffer works fine though)
export const slipDecode = buffer => decodePacket(buffer)
