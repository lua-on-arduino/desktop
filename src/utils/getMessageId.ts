let messageId = -1

/**
 * Create a 16bit message id.
 */
export const getMessageId = () => {
  messageId++
  if (messageId > 65535) messageId = 0
  return messageId
}
