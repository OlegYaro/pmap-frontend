import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { pickOption } from '../../test/select'
import { Checkbox } from './checkbox'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'

it('picks a select option with the keyboard', async () => {
  const onValueChange = vi.fn()
  render(
    <Select value="a" onValueChange={onValueChange}>
      <SelectTrigger aria-label="Letter">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">Alpha</SelectItem>
        <SelectItem value="b">Beta</SelectItem>
      </SelectContent>
    </Select>,
  )
  const trigger = screen.getByRole('combobox', { name: 'Letter' })
  expect(trigger).toHaveTextContent('Alpha')
  await pickOption(trigger, 'Beta')
  expect(onValueChange).toHaveBeenCalledWith('b')
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
})

it('toggles a checkbox on click', () => {
  render(<Checkbox aria-label="Clean" />)
  const checkbox = screen.getByRole('checkbox', { name: 'Clean' })
  expect(checkbox).toHaveAttribute('aria-checked', 'false')
  fireEvent.click(checkbox)
  expect(checkbox).toHaveAttribute('aria-checked', 'true')
})

it('opens popover content from its trigger', async () => {
  render(
    <Popover>
      <PopoverTrigger>Open</PopoverTrigger>
      <PopoverContent>Inside</PopoverContent>
    </Popover>,
  )
  expect(screen.queryByText('Inside')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Open' }))
  expect(await screen.findByText('Inside')).toBeInTheDocument()
})

it('renders table parts with their roles and no scroll wrapper', () => {
  const { container } = render(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Alpha</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  )
  const table = screen.getByRole('table')
  expect(table.parentElement).toBe(container)
  expect(screen.getAllByRole('rowgroup')).toHaveLength(2)
  expect(screen.getAllByRole('row')).toHaveLength(2)
  expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
  expect(screen.getByRole('cell', { name: 'Alpha' })).toBeInTheDocument()
})
