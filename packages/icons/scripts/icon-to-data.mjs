// Turns one animate-ui icon module (as its registry serves it) into our data
// form: the icon's shapes as a node list and its animations as written, for
// `createIcon` to render. Strict on purpose — anything outside the template
// throws, so an upstream change can never be half-converted.
import ts from 'typescript'

const SVG_ATTRS = {
  xmlns: '"http://www.w3.org/2000/svg"',
  width: '{size}',
  height: '{size}',
  viewBox: '"0 0 24 24"',
  fill: '"none"',
  stroke: '"currentColor"',
  strokeWidth: '{2}',
  strokeLinecap: '"round"',
  strokeLinejoin: '"round"',
}
const TAGS = new Set(['path', 'line', 'circle', 'rect', 'g', 'polygon', 'polyline', 'ellipse'])

function fail(name, message) {
  throw new Error(`${name}: ${message}`)
}

function tagOf(element) {
  return element.tagName.getText()
}

function attrText(attr) {
  return attr.initializer ? attr.initializer.getText() : 'true'
}

// A JSX attribute value as JS source: "x" stays a string literal, {expr} its expression.
function valueSource(name, attr) {
  const init = attr.initializer
  if (!init)
    return 'true'
  if (ts.isStringLiteral(init))
    return JSON.stringify(init.text)
  if (ts.isJsxExpression(init) && init.expression)
    return init.expression.getText()
  return fail(name, `unsupported attribute value ${attr.getText()}`)
}

function nodeOf(name, element) {
  const opening = ts.isJsxElement(element) ? element.openingElement : element
  const raw = tagOf(opening)
  const motion = raw.startsWith('motion.')
  const tag = motion ? raw.slice('motion.'.length) : raw
  if (!TAGS.has(tag))
    fail(name, `unsupported element <${raw}>`)
  let variant = null
  let initial = null
  let animate = null
  const attrs = []
  for (const attr of opening.attributes.properties) {
    if (!ts.isJsxAttribute(attr))
      fail(name, `spread on <${raw}>`)
    const key = attr.name.getText()
    if (key === 'variants') {
      const m = /^\{variants\.(\w+)\}$/.exec(attrText(attr)) ?? /^\{variants\[['"]([\w-]+)['"]\]\}$/.exec(attrText(attr))
      if (!m)
        fail(name, `variants ${attrText(attr)}`)
      variant = m[1]
    }
    else if (key === 'initial') {
      initial = attrText(attr)
    }
    else if (key === 'animate') {
      animate = attrText(attr)
    }
    else {
      attrs.push(`${/^[A-Z_$][\w$]*$/i.test(key) ? key : JSON.stringify(key)}: ${valueSource(name, attr)}`)
    }
  }
  const driven = initial === '"initial"' && animate === '{controls}'
  const inherits = initial === null && animate === null
  if (!driven && !inherits)
    fail(name, `<${raw}> initial=${initial} animate=${animate}`)
  if (!motion && (variant !== null || driven))
    fail(name, `<${raw}> animates without being a motion element`)
  // null: a plain shape. 'key': driven by its own variants. { variants }: its
  // variants follow the parent's state. {}: a motion shape with no variants.
  const mode = !motion
    ? 'null'
    : driven
      ? (variant === null ? fail(name, `<${raw}> driven without variants`) : JSON.stringify(variant))
      : (variant === null ? '{}' : `{ variants: ${JSON.stringify(variant)} }`)
  const children = ts.isJsxElement(element) ? childrenOf(name, element) : []
  const parts = [JSON.stringify(tag), `{ ${attrs.join(', ')} }`, mode]
  if (children.length > 0)
    parts.push(`[${children.join(', ')}]`)
  return `[${parts.join(', ')}]`
}

function childrenOf(name, element) {
  const out = []
  for (const child of element.children) {
    if (ts.isJsxText(child)) {
      if (child.getText().trim() !== '')
        fail(name, 'text inside the svg')
      continue
    }
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      out.push(nodeOf(name, child))
      continue
    }
    fail(name, `unsupported child ${child.getText().slice(0, 40)}`)
  }
  return out
}

// Names the renderer provides; a data file never imports them.
const RENDERER_NAMES = new Set(['React', 'motion', 'getVariants', 'useAnimateIconContext', 'IconWrapper', 'IconPathStyle', 'pathClassName'])
// Names that are types wherever they come from.
const TYPE_NAMES = new Set(['Variants', 'Transition', 'IconProps', 'TargetAndTransition'])

export function iconToData(name, source) {
  const file = ts.createSourceFile(`${name}.tsx`, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let animations = null
  let svg = null
  let component = null
  let pathStyle = false
  const preamble = []
  const imported = new Map()
  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement)) {
      const from = statement.moduleSpecifier.text
      if (!['react', 'motion/react', '@animate-ui/react/icons'].includes(from))
        fail(name, `imports ${from}`)
      const bindings = statement.importClause?.namedBindings
      if (bindings && ts.isNamedImports(bindings)) {
        for (const spec of bindings.elements) {
          const typeOnly = statement.importClause.isTypeOnly || spec.isTypeOnly || TYPE_NAMES.has(spec.name.text)
          imported.set(spec.name.text, { from, typeOnly })
        }
      }
      continue
    }
    if (ts.isTypeAliasDeclaration(statement))
      continue
    if (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression) && statement.expression.text === 'use client')
      continue
    if (ts.isVariableStatement(statement)) {
      const [decl] = statement.declarationList.declarations
      if (decl.name.getText() === 'animations')
        animations = decl.initializer.getText()
      // A helper the animations are built from: kept as written.
      else preamble.push(statement.getText())
      continue
    }
    if (ts.isFunctionDeclaration(statement)) {
      const fn = statement.name.getText()
      if (fn === 'IconComponent') {
        const body = statement.body.statements
        const ret = body.at(-1)
        const head = body.slice(0, -1).map(s => s.getText().replace(/\s+/g, ' '))
        if (head.join(' | ') !== 'const { controls } = useAnimateIconContext(); | const variants = getVariants(animations);')
          fail(name, `IconComponent body: ${head.join(' | ')}`)
        let expr = ret.expression
        while (ts.isParenthesizedExpression(expr)) expr = expr.expression
        // <><IconPathStyle /><motion.svg className={[pathClassName, className]…}>
        if (ts.isJsxFragment(expr)) {
          const kids = expr.children.filter(c => !ts.isJsxText(c) || c.getText().trim() !== '')
          if (kids.length !== 2 || kids[0].getText() !== '<IconPathStyle />')
            fail(name, 'fragment other than IconPathStyle + svg')
          pathStyle = true
          expr = kids[1]
        }
        svg = expr
      }
      else if (statement.body.getText().replace(/\s+/g, ' ') === '{ return <IconWrapper icon={IconComponent} {...props} />; }') {
        component = fn
      }
      else {
        // A helper the animations call: kept as written.
        preamble.push(statement.getText())
      }
      continue
    }
    if (ts.isExportDeclaration(statement))
      continue
    fail(name, `unexpected statement ${statement.getText().slice(0, 60)}`)
  }
  if (!animations || !svg || !component)
    fail(name, 'missing animations, IconComponent or wrapper')
  if (!ts.isJsxElement(svg) || tagOf(svg.openingElement) !== 'motion.svg')
    fail(name, 'IconComponent does not return <motion.svg>')
  const seen = {}
  let svgOption = null
  for (const attr of svg.openingElement.attributes.properties) {
    if (ts.isJsxSpreadAttribute(attr)) {
      if (attr.expression.getText() !== 'props')
        fail(name, 'svg spreads something other than props')
      continue
    }
    const key = attr.name.getText()
    const text = attrText(attr)
    if (key === 'variants') {
      const m = /^\{variants\.(\w+)\}$/.exec(text)
      if (!m)
        fail(name, `svg variants ${text}`)
      svgOption = m[1]
    }
    else if (key === 'initial' || key === 'animate') {
      if (text !== (key === 'initial' ? '"initial"' : '{controls}'))
        fail(name, `svg ${key}=${text}`)
      svgOption ??= true
    }
    else if (key === 'className') {
      if (!pathStyle || text !== '{[pathClassName, className].filter(Boolean).join(\' \')}')
        fail(name, `svg className ${text}`)
    }
    else {
      seen[key] = text
    }
  }
  if (JSON.stringify(seen) !== JSON.stringify(SVG_ATTRS))
    fail(name, `svg attributes ${JSON.stringify(seen)}`)
  const nodes = childrenOf(name, svg)

  // Imports the kept text still needs (types, and helpers from motion).
  const body = [...preamble, animations].join('\n')
  const imports = {}
  for (const [id, { from, typeOnly }] of imported) {
    if (RENDERER_NAMES.has(id) || !new RegExp(`\\b${id}\\b`).test(body))
      continue
    imports[from] ??= []
    imports[from].push(typeOnly ? `type ${id}` : id)
  }
  const options = []
  if (svgOption !== null)
    options.push(`svg: ${svgOption === true ? 'true' : JSON.stringify(svgOption)}`)
  if (pathStyle)
    options.push('pathStyle: true')
  return { component, animations, nodes, preamble, imports, options }
}

/** The data module for one icon, ready to write as `<name>.ts`. */
export function iconDataFile(name, source) {
  const { component, animations, nodes, preamble, imports, options } = iconToData(name, source)
  // `InfinityIcon` is named so upstream to stay clear of the global `Infinity`.
  const exportName = component.endsWith('Icon') ? component : `${component}Icon`
  const importLines = Object.entries(imports).map(([from, ids]) => {
    const allTypes = ids.every(id => id.startsWith('type '))
    return allTypes
      ? `import type { ${ids.map(id => id.slice(5)).join(', ')} } from '${from}'`
      : `import { ${ids.join(', ')} } from '${from}'`
  })
  const text = [
    // A client module like the source: it calls createIcon at module scope,
    // which a server component could not.
    '\'use client\'',
    '',
    `// animate-ui's \`${name}\` icon (MIT + Commons Clause, see ANIMATE-UI-LICENSE.md), in`,
    '// cadenza-ui\'s data form: its shapes and animations, rendered by createIcon.',
    '// Generated by scripts/sync-animate-ui-icons.mjs — do not edit by hand.',
    `import type { IconProps } from '@animate-ui/react/icons'`,
    ...importLines,
    `import { createIcon } from '../create-icon'`,
    '',
    ...preamble.flatMap(p => [p, '']),
    `const animations = ${animations}`,
    '',
    `export type ${exportName}Props = IconProps<keyof typeof animations & string>`,
    '',
    `export const ${exportName} = /* @__PURE__ */ createIcon(${JSON.stringify(exportName)}, [`,
    ...nodes.map(n => `  ${n},`),
    `], animations${options.length > 0 ? `, { ${options.join(', ')} }` : ''})`,
    '',
  ].join('\n')
  return { exportName, text }
}
