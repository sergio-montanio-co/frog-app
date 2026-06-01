import { Fragment } from 'react'
import { View } from 'react-native'
import { Text } from './Text'
import { cn } from '@/lib/cn'

// Subset markdown: **bold**, _italic_, líneas con "- "/"* " como bullets.
// No soportamos anidado (p. ej. **_x_**) ni multi-línea por marcador.

type InlineToken =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'italic'; value: string }

type Block =
  | { kind: 'paragraph'; tokens: InlineToken[] }
  | { kind: 'bullet'; tokens: InlineToken[] }
  | { kind: 'spacer' }

const BULLET_RE = /^[-*]\s+/
const MARKER_RE = /(\*\*|_)/

export function hasMarkdownMarkers(input: string): boolean {
  if (!input) return false
  if (/\*\*[^*\n]+\*\*/.test(input)) return true
  if (/_[^_\n]+_/.test(input)) return true
  return input.split('\n').some((line) => BULLET_RE.test(line))
}

function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  let buffer = ''
  let i = 0
  while (i < text.length) {
    if (text[i] === '*' && text[i + 1] === '*') {
      const close = text.indexOf('**', i + 2)
      if (close > i + 1) {
        if (buffer) {
          tokens.push({ kind: 'text', value: buffer })
          buffer = ''
        }
        tokens.push({ kind: 'bold', value: text.slice(i + 2, close) })
        i = close + 2
        continue
      }
    }
    if (text[i] === '_') {
      const close = text.indexOf('_', i + 1)
      if (close > i) {
        if (buffer) {
          tokens.push({ kind: 'text', value: buffer })
          buffer = ''
        }
        tokens.push({ kind: 'italic', value: text.slice(i + 1, close) })
        i = close + 1
        continue
      }
    }
    buffer += text[i]
    i++
  }
  if (buffer) tokens.push({ kind: 'text', value: buffer })
  return tokens
}

function parseBlocks(input: string): Block[] {
  const lines = input.split('\n')
  const blocks: Block[] = []
  for (const raw of lines) {
    if (raw.trim().length === 0) {
      blocks.push({ kind: 'spacer' })
      continue
    }
    const bulletMatch = raw.match(BULLET_RE)
    if (bulletMatch) {
      const rest = raw.slice(bulletMatch[0].length)
      blocks.push({ kind: 'bullet', tokens: tokenizeInline(rest) })
    } else {
      blocks.push({ kind: 'paragraph', tokens: tokenizeInline(raw) })
    }
  }
  return blocks
}

function renderTokens(tokens: InlineToken[]) {
  return tokens.map((tok, i) => {
    if (tok.kind === 'bold') {
      return (
        <Text key={i} className="font-semibold">
          {tok.value}
        </Text>
      )
    }
    if (tok.kind === 'italic') {
      return (
        <Text key={i} className="italic">
          {tok.value}
        </Text>
      )
    }
    return <Fragment key={i}>{tok.value}</Fragment>
  })
}

export type MarkdownTextProps = {
  value: string
  className?: string
}

export function MarkdownText({ value, className }: MarkdownTextProps) {
  const blocks = parseBlocks(value)
  return (
    <View className={cn('gap-1', className)}>
      {blocks.map((block, i) => {
        if (block.kind === 'spacer') {
          return <View key={i} className="h-2" />
        }
        if (block.kind === 'bullet') {
          return (
            <View key={i} className="flex-row gap-2 pl-1">
              <Text variant="body">•</Text>
              <Text variant="body" className="flex-1">
                {renderTokens(block.tokens)}
              </Text>
            </View>
          )
        }
        return (
          <Text key={i} variant="body">
            {renderTokens(block.tokens)}
          </Text>
        )
      })}
    </View>
  )
}
