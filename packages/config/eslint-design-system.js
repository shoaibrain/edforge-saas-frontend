const COLOR_CLASS_PATTERN =
  /\b(?:bg|text|border|ring|from|to|via|hover:bg|hover:text|dark:bg|dark:text|dark:border|focus:ring)-(?:white|black|gray|slate|zinc|neutral|stone|indigo|emerald|red|green|blue|yellow|orange|purple|pink|rose|teal|cyan)(?:-[0-9]{2,3})?(?:\/[0-9]+)?\b/g

const ARBITRARY_SIZE_PATTERN =
  /\b(?:p|m|px|py|mx|my|gap|w|h|text|leading|top|left|right|bottom)-\[[0-9]+(?:px|rem|em)\]/g

function hasAllowComment(context, node, allowToken) {
  const sourceCode = context.sourceCode ?? context.getSourceCode()
  const comments = [
    ...sourceCode.getCommentsBefore(node),
    ...sourceCode.getCommentsInside(node),
  ]
  return comments.some((comment) => comment.value.includes(allowToken))
}

function reportMatches(context, node, value, pattern, messageId, allowToken) {
  if (hasAllowComment(context, node, allowToken)) return

  const uniqueMatches = [...new Set(value.match(pattern) ?? [])]
  for (const match of uniqueMatches) {
    context.report({
      node,
      messageId,
      data: { className: match, allowToken },
    })
  }
}

function inspectStringLikeNode(context, node, patterns) {
  if (node.type === 'Literal' && typeof node.value === 'string') {
    for (const pattern of patterns) {
      reportMatches(context, node, node.value, pattern.regex, pattern.messageId, pattern.allowToken)
    }
    return
  }

  if (node.type === 'TemplateElement') {
    for (const pattern of patterns) {
      reportMatches(context, node, node.value.raw, pattern.regex, pattern.messageId, pattern.allowToken)
    }
  }
}

const designSystemPlugin = {
  rules: {
    'no-hardcoded-colors': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Warn when app/UI code bypasses semantic color tokens with raw Tailwind palette utilities.',
        },
        messages: {
          hardcodedColor:
            'Design-system color bypass "{{className}}". Use semantic tokens or add {{allowToken}} with a justification.',
        },
        schema: [],
      },
      create(context) {
        return {
          Literal(node) {
            inspectStringLikeNode(context, node, [
              {
                regex: COLOR_CLASS_PATTERN,
                messageId: 'hardcodedColor',
                allowToken: 'allow-hardcoded-color',
              },
            ])
          },
          TemplateElement(node) {
            inspectStringLikeNode(context, node, [
              {
                regex: COLOR_CLASS_PATTERN,
                messageId: 'hardcodedColor',
                allowToken: 'allow-hardcoded-color',
              },
            ])
          },
        }
      },
    },
    'no-arbitrary-tailwind-values': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Warn when app/UI code bypasses the spacing/type scale with arbitrary Tailwind values.',
        },
        messages: {
          arbitraryValue:
            'Design-system scale bypass "{{className}}". Use a scale token/primitive or add {{allowToken}} with a justification.',
        },
        schema: [],
      },
      create(context) {
        return {
          Literal(node) {
            inspectStringLikeNode(context, node, [
              {
                regex: ARBITRARY_SIZE_PATTERN,
                messageId: 'arbitraryValue',
                allowToken: 'allow-arbitrary-spacing',
              },
            ])
          },
          TemplateElement(node) {
            inspectStringLikeNode(context, node, [
              {
                regex: ARBITRARY_SIZE_PATTERN,
                messageId: 'arbitraryValue',
                allowToken: 'allow-arbitrary-spacing',
              },
            ])
          },
        }
      },
    },
  },
}

export default {
  files: ['apps/**/*.{ts,tsx}', 'packages/ui/**/*.{ts,tsx}'],
  plugins: {
    'edforge-design-system': designSystemPlugin,
  },
  rules: {
    'edforge-design-system/no-hardcoded-colors': 'warn',
    'edforge-design-system/no-arbitrary-tailwind-values': 'warn',
  },
}
