import { fireEvent, screen } from '@testing-library/react'

/** Opens a Radix select with the keyboard and picks the option named `optionName` with Enter. */
export async function pickOption(trigger: HTMLElement, optionName: string | RegExp) {
  fireEvent.keyDown(trigger, { key: 'Enter' })
  const option = await screen.findByRole('option', { name: optionName })
  fireEvent.keyDown(option, { key: 'Enter' })
}
