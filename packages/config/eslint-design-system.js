const COLOR_CLASS_PATTERN =
  /\b(?:bg|text|border|ring|from|to|via|hover:bg|hover:text|dark:bg|dark:text|dark:border|focus:ring)-(?:white|black|gray|slate|zinc|neutral|stone|indigo|emerald|red|green|blue|yellow|orange|purple|pink|rose|teal|cyan)(?:-[0-9]{2,3})?(?:\/[0-9]+)?\b/g

const ARBITRARY_SIZE_PATTERN =
  /\b(?:p|m|px|py|mx|my|gap|w|h|text|leading|top|left|right|bottom)-\[[0-9]+(?:px|rem|em)\]/g

const LOCAL_FORM_STYLE_NAMES = new Set([
  'inputClass',
  'selectClass',
  'labelClass',
  'errorClass',
  'INPUT_CLASS',
  'SELECT_CLASS',
  'LABEL_CLASS',
  'ERROR_CLASS',
])

const PRESENTATION_STYLE_KEYS = new Set([
  'color',
  'background',
  'backgroundColor',
  'borderColor',
  'boxShadow',
  'fontSize',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'gap',
])

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

function getJsxName(nameNode) {
  if (!nameNode) return null
  if (nameNode.type === 'JSXIdentifier') return nameNode.name
  return null
}

function getJsxAttribute(node, attributeName) {
  return node.attributes?.find(
    (attribute) =>
      attribute.type === 'JSXAttribute' &&
      attribute.name?.type === 'JSXIdentifier' &&
      attribute.name.name === attributeName
  )
}

function getStaticAttributeValue(attribute) {
  if (!attribute?.value) return null
  if (attribute.value.type === 'Literal') return attribute.value.value
  if (
    attribute.value.type === 'JSXExpressionContainer' &&
    attribute.value.expression?.type === 'Literal'
  ) {
    return attribute.value.expression.value
  }
  return null
}

function isAllowedNativeInput(node) {
  const type = String(getStaticAttributeValue(getJsxAttribute(node, 'type')) ?? 'text')
  return type === 'hidden' || type === 'file'
}

function isPresentationStyleAttribute(node) {
  const styleAttribute = getJsxAttribute(node, 'style')
  const expression = styleAttribute?.value?.expression
  if (!expression || expression.type !== 'ObjectExpression') return false

  return expression.properties.some((property) => {
    if (property.type !== 'Property') return false
    if (property.key.type === 'Identifier') return PRESENTATION_STYLE_KEYS.has(property.key.name)
    if (property.key.type === 'Literal') return PRESENTATION_STYLE_KEYS.has(String(property.key.value))
    return false
  })
}

const designSystemPlugin = {
  rules: {
    'no-hardcoded-colors': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Disallow app/UI code bypassing semantic color tokens with raw Tailwind palette utilities.',
        },
        messages: {
          hardcodedColor:
            'Design-system color bypass "{{className}}". Use semantic tokens (for example state.warning.fg, state.danger.*, action.primary.*, text.*) or add {{allowToken}} with a justification. See docs/design-system/README.md#token-taxonomy.',
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
          description: 'Disallow app/UI code bypassing the spacing/type scale with arbitrary Tailwind values.',
        },
        messages: {
          arbitraryValue:
            'Design-system scale bypass "{{className}}". Use a scale token/primitive (for example Text variant="caption" instead of text-[11px]) or add {{allowToken}} with a justification. See docs/design-system/README.md#adding-a-component.',
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
    'prefer-ui-select': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer the EdForge Select primitive instead of product-facing native select controls.',
        },
        messages: {
          preferSelect:
            'Use <Select> from @edforge/ui/forms instead of native <select>. See docs/design-system/forms.md#select. Add allow-native-form-control with a reason only for platform/third-party constraints.',
        },
        schema: [],
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (hasAllowComment(context, node, 'allow-native-form-control')) return
            if (getJsxName(node.name) === 'select') {
              context.report({ node, messageId: 'preferSelect' })
            }
          },
        }
      },
    },
    'prefer-ui-form-controls': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer shared EdForge form primitives for product-facing controls.',
        },
        messages: {
          preferInput:
            'Use <Input>, <Textarea>, <Checkbox>, <RadioGroup>, or <Switch> from @edforge/ui/forms instead of styling a native {{controlName}}. See docs/design-system/forms.md.',
        },
        schema: [],
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (hasAllowComment(context, node, 'allow-native-form-control')) return
            const controlName = getJsxName(node.name)
            if (controlName === 'textarea') {
              context.report({ node, messageId: 'preferInput', data: { controlName: '<textarea>' } })
            }
            if (controlName === 'input' && !isAllowedNativeInput(node)) {
              context.report({ node, messageId: 'preferInput', data: { controlName: '<input>' } })
            }
          },
        }
      },
    },
    'no-local-form-style-constants': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Disallow local form style constants that duplicate shared Field/Input/Select grammar.',
        },
        messages: {
          localFormStyle:
            'Use Field/Input/Select primitives instead of local "{{name}}" form class constants. See docs/design-system/forms.md#migration-requirements.',
        },
        schema: [],
      },
      create(context) {
        return {
          VariableDeclarator(node) {
            if (node.id.type === 'Identifier' && LOCAL_FORM_STYLE_NAMES.has(node.id.name)) {
              context.report({ node: node.id, messageId: 'localFormStyle', data: { name: node.id.name } })
            }
          },
        }
      },
    },
    'no-presentation-style-objects': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Disallow inline presentation style objects in product UI.',
        },
        messages: {
          presentationStyle:
            'Avoid inline presentation styles for color/spacing/shadow/type. Use tokens/primitives or add allow-presentation-style with a reason for dynamic visualizations.',
        },
        schema: [],
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (hasAllowComment(context, node, 'allow-presentation-style')) return
            if (isPresentationStyleAttribute(node)) {
              context.report({ node, messageId: 'presentationStyle' })
            }
          },
        }
      },
    },
  },
}

const pluginConfig = {
  plugins: {
    'edforge-design-system': designSystemPlugin,
  },
}

export default [
  {
    ...pluginConfig,
    files: ['apps/**/*.{ts,tsx}', 'packages/ui/**/*.{ts,tsx}'],
    rules: {
      'edforge-design-system/no-hardcoded-colors': 'error',
      'edforge-design-system/no-arbitrary-tailwind-values': 'error',
      'edforge-design-system/prefer-ui-select': 'warn',
      'edforge-design-system/prefer-ui-form-controls': 'warn',
      'edforge-design-system/no-local-form-style-constants': 'warn',
      'edforge-design-system/no-presentation-style-objects': 'warn',
    },
  },
  {
    // Epic T exit gate. Settings + onboarding are fully migrated off native
    // <select> and local form-style constants, so these two rules are hard
    // errors on that path — a regression now fails CI instead of adding a
    // warning. The input/style sweeps (prefer-ui-form-controls /
    // no-presentation-style-objects) stay warnings until those migrations land.
    ...pluginConfig,
    files: [
      'apps/shell/src/pages/settings/**/*.{ts,tsx}',
      'apps/shell/src/components/settings/**/*.{ts,tsx}',
      'apps/shell/src/components/onboarding/**/*.{ts,tsx}',
    ],
    rules: {
      'edforge-design-system/prefer-ui-select': 'error',
      'edforge-design-system/no-local-form-style-constants': 'error',
    },
  },
  {
    ...pluginConfig,
    files: ['packages/forms/**/*.{ts,tsx}', 'packages/wizard/**/*.{ts,tsx}'],
  rules: {
      'edforge-design-system/no-hardcoded-colors': 'warn',
      'edforge-design-system/no-arbitrary-tailwind-values': 'warn',
      'edforge-design-system/prefer-ui-select': 'warn',
      'edforge-design-system/prefer-ui-form-controls': 'warn',
      'edforge-design-system/no-local-form-style-constants': 'warn',
      'edforge-design-system/no-presentation-style-objects': 'warn',
    },
  },
]
