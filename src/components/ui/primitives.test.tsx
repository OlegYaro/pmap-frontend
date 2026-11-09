import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { pickOption } from '../../test/select'
import { Checkbox } from './checkbox'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

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

it('selects tabs by pointer and arrow keys, with labelled panels', async () => {
  render(
    <Tabs defaultValue="a">
      <TabsList aria-label="Sections">
        <TabsTrigger value="a">Alpha</TabsTrigger>
        <TabsTrigger value="b">Beta</TabsTrigger>
      </TabsList>
      <TabsContent value="a">First panel</TabsContent>
      <TabsContent value="b">Second panel</TabsContent>
    </Tabs>,
  )
  const alpha = screen.getByRole('tab', { name: 'Alpha' })
  const beta = screen.getByRole('tab', { name: 'Beta' })
  expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument()
  expect(alpha).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tabpanel', { name: 'Alpha' })).toHaveTextContent('First panel')

  act(() => alpha.focus())
  expect(alpha).toHaveAttribute('tabindex', '0')
  expect(beta).toHaveAttribute('tabindex', '-1')

  fireEvent.keyDown(alpha, { key: 'ArrowRight' })
  // Radix moves the focus on the next tick.
  await waitFor(() => expect(beta).toHaveFocus())
  expect(beta).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tabpanel', { name: 'Beta' })).toHaveTextContent('Second panel')
  expect(screen.queryByText('First panel')).not.toBeInTheDocument()

  fireEvent.keyDown(beta, { key: 'ArrowLeft' })
  await waitFor(() => expect(alpha).toHaveFocus())
  expect(alpha).toHaveAttribute('aria-selected', 'true')

  fireEvent.mouseDown(beta, { button: 0 })
  expect(beta).toHaveAttribute('aria-selected', 'true')
})
