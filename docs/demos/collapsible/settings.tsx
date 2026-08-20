import type { ReactElement } from 'react'
import { Button, Collapsible, CollapsiblePanel, CollapsibleTrigger, Field, FieldLabel, Switch } from '@gedatou/cadenza-ui'
import { IconChevronDown } from '@tabler/icons-react'

// Fold away rarely-changed advanced options: frequent items stay put, the
// trigger is followed by one panel. Put the padding on elements inside the
// panel -- padding on the panel itself gets squashed by the height animation
export default function SettingsDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4 inline-80">
      <Field className="flex flex-row items-center justify-between gap-4">
        <FieldLabel htmlFor="settings-notify">Desktop notifications</FieldLabel>
        <Switch defaultChecked id="settings-notify" />
      </Field>

      <Collapsible className="flex flex-col">
        <CollapsibleTrigger
          className="group/trigger -mx-2 justify-between"
          render={<Button size="sm" variant="ghost" />}
        >
          Advanced options
          <IconChevronDown className="
            transition-transform
            group-data-panel-open/trigger:rotate-180
          "
          />
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <div className="flex flex-col gap-4 pbs-4">
            <Field className="flex flex-row items-center justify-between gap-4">
              <FieldLabel htmlFor="settings-beta">Join the beta channel</FieldLabel>
              <Switch id="settings-beta" />
            </Field>
            <Field className="flex flex-row items-center justify-between gap-4">
              <FieldLabel htmlFor="settings-telemetry">Send anonymous usage data</FieldLabel>
              <Switch id="settings-telemetry" />
            </Field>
          </div>
        </CollapsiblePanel>
      </Collapsible>
    </div>
  )
}
