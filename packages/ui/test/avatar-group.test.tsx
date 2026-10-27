import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarGroupTooltip } from '../src/components/avatar'

function Group() {
  return (
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>AL</AvatarFallback>
        <AvatarGroupTooltip>Ada Lovelace</AvatarGroupTooltip>
      </Avatar>
      <Avatar>
        <AvatarFallback>GH</AvatarFallback>
        <AvatarGroupTooltip>Grace Hopper</AvatarGroupTooltip>
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
  )
}

it('wraps every child in its own rising container, later ones on top', () => {
  render(<Group />)
  const group = document.querySelector<HTMLElement>('[data-slot="avatar-group"]')
  const containers = [...(group?.children ?? [])] as HTMLElement[]
  expect(containers).toHaveLength(3)
  expect(containers.map(container => container.style.zIndex)).toEqual(['0', '1', '2'])
  // The vendored look reaches the avatars through the containers.
  expect(group?.className).toContain('**:data-[slot=avatar]:ring-2')
})

it('shows the name of the avatar under the pointer, and only then', async () => {
  render(<Group />)
  expect(screen.queryByText('Ada Lovelace')).toBeNull()
  await userEvent.hover(screen.getByText('GH'))
  expect(await screen.findByText('Grace Hopper')).not.toBeNull()
  expect(screen.queryByText('Ada Lovelace')).toBeNull()
})
