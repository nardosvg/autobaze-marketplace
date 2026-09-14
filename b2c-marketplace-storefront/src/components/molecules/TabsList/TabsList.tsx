import { TabsTrigger } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

export const TabsList = ({
  list,
  activeTab,
  "data-testid": dataTestId,
}: {
  // value: chave de comparacao com activeTab (permite label traduzido)
  list: { label: string; link: string; value?: string }[]
  activeTab: string
  "data-testid"?: string
}) => {
  return (
    <div className="flex gap-4 w-full" data-testid={dataTestId ?? 'tabs-list'}>
      {list.map(({ label, link, value }) => (
        <LocalizedClientLink key={label} href={link}>
          <TabsTrigger isActive={activeTab === (value ?? label.toLowerCase())}>
            {label}
          </TabsTrigger>
        </LocalizedClientLink>
      ))}
    </div>
  )
}
