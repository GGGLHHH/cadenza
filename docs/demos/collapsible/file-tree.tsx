import type { ReactElement } from 'react'
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@gedatou/cadenza-ui'
import { IconChevronRight, IconFile, IconFolder, IconFolderOpen } from '@tabler/icons-react'

interface Node {
  name: string
  children?: Node[]
}

const TREE: Node[] = [
  {
    name: 'packages',
    children: [
      {
        name: 'ui',
        children: [
          {
            name: 'src',
            children: [
              { name: 'components', children: [{ name: 'collapsible.tsx' }, { name: 'button.tsx' }] },
              { name: 'index.ts' },
            ],
          },
          { name: 'package.json' },
        ],
      },
      { name: 'utils', children: [{ name: 'src', children: [{ name: 'index.ts' }] }] },
    ],
  },
  { name: 'README.md' },
]

// Nesting: every directory is an independent Collapsible, with the next
// level inside its panel. Each level tracks its own open state with nothing
// shared -- which is exactly what separates this from Accordion
export default function FileTreeDemo(): ReactElement {
  return (
    <div className="rounded-xl border p-2 text-sm inline-72">
      {TREE.map(node => <TreeNode key={node.name} node={node} />)}
    </div>
  )
}

function TreeNode({ node }: { node: Node }): ReactElement {
  if (node.children === undefined) {
    return (
      <div className="
        flex items-center gap-2 rounded-md px-2 py-1 text-muted-foreground
      "
      >
        <IconFile className="shrink-0 block-4 inline-4" />
        {node.name}
      </div>
    )
  }

  return (
    <Collapsible defaultOpen={node.name === 'packages'}>
      <CollapsibleTrigger className="
        group/trigger flex items-center gap-2 rounded-md px-2 py-1 text-start
        inline-full
        hover:bg-accent
      "
      >
        <IconChevronRight className="
          shrink-0 text-muted-foreground transition-transform block-4 inline-4
          group-data-panel-open/trigger:rotate-90
        "
        />
        <IconFolder className="
          shrink-0 block-4 inline-4
          group-data-panel-open/trigger:hidden
        "
        />
        <IconFolderOpen className="
          hidden shrink-0 block-4 inline-4
          group-data-panel-open/trigger:block
        "
        />
        {node.name}
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <div className="ms-4 border-s ps-2">
          {node.children.map(child => <TreeNode key={child.name} node={child} />)}
        </div>
      </CollapsiblePanel>
    </Collapsible>
  )
}
