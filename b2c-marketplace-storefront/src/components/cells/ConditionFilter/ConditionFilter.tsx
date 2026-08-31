"use client"

import { Accordion, FilterCheckboxOption } from "@/components/molecules"
import useFilters from "@/hooks/useFilters"

const filters = [
  { label: "Novo", amount: 78 },
  { label: "Novo", amount: 40 },
  { label: "Usado - Excelente", amount: 7 },
  { label: "Usado - Bom", amount: 16 },
  { label: "Usado - Razoável", amount: 0 },
]

export const ConditionFilter = () => {
  const { updateFilters, isFilterActive } = useFilters("condition")

  const selectHandler = (option: string) => {
    updateFilters(option)
  }

  return (
    <Accordion heading="Condição" data-testid="filter-condition">
      <ul className="px-4" data-testid="filter-condition-options">
        {filters.map(({ label, amount }) => (
          <li key={label} className="mb-4">
            <FilterCheckboxOption
              checked={isFilterActive(label)}
              disabled={Boolean(!amount)}
              onCheck={selectHandler}
              label={label}
              amount={amount}
              data-testid={`filter-condition-checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`}
            />
          </li>
        ))}
      </ul>
    </Accordion>
  )
}
