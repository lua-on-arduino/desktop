// @ts-check

import { decodePacket, encodeMessage } from 'protocol-slip'

/** @param {Buffer} buffer */
// @ts-ignore (`decodePacket` expects a BufferStreamList which doesn't seem to
// work. Just passing a Buffer works fine though)
export const slipDecode = buffer => decodePacket(buffer)

/**
 * @param {Buffer} buffer
 * @returns {Buffer}
 */
export const slipEncode = buffer =>
  // `encodeMessage()` omits the beginning `0xc0` sign, but the arduino slip
  // implementation needs it. Both standards seem to be valid:
  // (https://de.wikipedia.org/wiki/Serial_Line_Internet_Protocol)
  Buffer.concat([Buffer.from([0xc0]), encodeMessage(buffer)])
