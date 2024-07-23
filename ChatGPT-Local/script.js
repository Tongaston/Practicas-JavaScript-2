import { CreateWebWorkerMLCEngine } from 'https://esm.run/@mlc-ai/web-llm'

const $form = document.querySelector('form')
const $input = document.querySelector('input')
const $template = document.querySelector('#message-template')
const $messages = document.querySelector('ul')
const $container = document.querySelector('main')
const $button = document.querySelector('button')
const $loader = document.querySelector('.loader')
const $loading = document.querySelector('.loading')

let messages = []
let end = false

const SELECTED_MODEL = 'gemma-2b-it-q4f32_1-MLC'

const engine = await CreateWebWorkerMLCEngine(
  new Worker('./worker.js', { type: 'module' }),
  SELECTED_MODEL,
  {
    initProgressCallback: (info) => {
      $loader.textContent = `${info.text}`
      if (info.progress === 1 && !end) {
        end = true
        $loading?.parentNode?.removeChild($loading)
        $button.removeAttribute('disabled')
        addMessage(
          '¡Hola! Soy un ChatGPT que se ejecuta completamente en tu navegador. ¿En qué puedo ayudarte hoy?',
          'bot'
        )
        $input.focus()
      }
    },
  }
)

$form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const messageText = $input.value.trim()

  if (messageText !== '') {
    $input.value = ''
  }

  addMessage(messageText, 'user')
  $button.setAttribute('disabled', '')

  const userMessage = {
    role: 'user',
    content: messageText,
  }

  messages.push(userMessage)

  const chunks = await engine.chat.completions.create({
    messages,
    stream: true,
  })

  let reply = ''
  const $botMessage = addMessage('', 'bot')

  for await (const chunk of chunks) {
    const choice = chunk.choices[0]
    const content = choice.delta.content ?? ''
    reply += content
    $botMessage.textContent = reply
  }

  $button.removeAttribute('disabled')
  messages.push({
    role: 'assistant',
    content: reply,
  })
  $container.scrollTop = $container.scrollHeight
})

function addMessage(text, sender) {
  const clonedTemplate = $template.content.cloneNode(true)
  const $newMessage = clonedTemplate.querySelector('.message')

  const $who = $newMessage.querySelector('span')
  const $text = $newMessage.querySelector('p')

  $text.textContent = text
  $who.textContent = sender === 'bot' ? 'GPT' : 'Tú'

  $newMessage.classList.add(sender)

  $messages.appendChild($newMessage)

  $container.scrollTop = $container.scrollHeight

  return $text
}
