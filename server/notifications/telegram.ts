type SendTelegramMessageProps = {
  text: string
}

export async function sendTelegramMessage({
  text,
}: SendTelegramMessageProps) {
  const botToken =
    process.env.TELEGRAM_BOT_TOKEN

  const chatId =
    process.env.TELEGRAM_ORDER_CHAT_ID

  if (!botToken) {
    throw new Error(
      'TELEGRAM_BOT_TOKEN is not configured',
    )
  }

  if (!chatId) {
    throw new Error(
      'TELEGRAM_ORDER_CHAT_ID is not configured',
    )
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    },
  )

  const result = await response.json()

  if (
    !response.ok ||
    result.ok !== true
  ) {
    throw new Error(
      result.description ??
      'Unable to send Telegram notification',
    )
  }

  return result
}