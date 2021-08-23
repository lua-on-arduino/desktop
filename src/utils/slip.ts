import { decodePacket, encodeMessage } from 'protocol-slip'

export const slipDecode = (buffer: Buffer) => decodePacket(buffer)

export const slipEncode = (buffer: Buffer): Buffer =>
  // `encodeMessage()` omits the beginning `0xc0` sign, but the arduino slip
  // implementation needs it. Both standards seem to be valid:
  // (https://de.wikipedia.org/wiki/Serial_Line_Internet_Protocol)
  Buffer.concat([Buffer.from([0xc0]), encodeMessage(buffer)])
