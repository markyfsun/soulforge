import { streamText } from 'ai'

// Load environment variables
// In production, these would be set automatically
const AI_MODEL = process.env.AI_MODEL || 'anthropic/claude-haiku-4.5'

console.log('Testing AI SDK with Vercel AI Gateway...')
console.log('Model:', AI_MODEL)

const result = await streamText({
  model: AI_MODEL, // Using string format - AI SDK will route through Vercel AI Gateway automatically
  messages: [
    { role: 'user', content: 'Hello! How are you? Please respond with a short greeting.' }
  ],
})

console.log('Stream result obtained, getting response...')

const stream = result.toTextStreamResponse()
const reader = stream.body.getReader()
const decoder = new TextDecoder()

let fullText = ''
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  const chunk = decoder.decode(value, { stream: true })
  fullText += chunk
  process.stdout.write(chunk)
}

console.log('\n--- Full response length:', fullText.length, '---')
