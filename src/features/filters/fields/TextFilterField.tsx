import { useDraftFilters } from '../useDraftFilters'
import { TextInputField } from './TextInputField'
import { textDraft } from './parsers'

interface TextFilterFieldProps {
  filterKey: 'address' | 'city_name' | 'district_name'
  label: string
  helperText: string
}

const asText = (value: string) => value

/** A free-text filter that edits the draft; it is searched with the panel's Search button. */
export function TextFilterField({ filterKey, label, helperText }: TextFilterFieldProps) {
  const { filters, updateFilters } = useDraftFilters()
  return (
    <TextInputField
      label={label}
      value={filters[filterKey]}
      parse={textDraft}
      format={asText}
      helperText={helperText}
      onChange={(value) => updateFilters({ [filterKey]: value })}
    />
  )
}
