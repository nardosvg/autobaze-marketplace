import Image from "next/image"

import { listSellers } from "@/lib/data/sellers"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

// "LOJAS OFICIAIS" do ML, com os sellers reais do marketplace.
export const MLLojas = async () => {
  const sellers = await listSellers(16)
  if (!sellers.length) return null

  return (
    <section className="container mx-auto w-full px-4 py-8 lg:px-8">
      <h2 className="mb-6 text-center text-lg font-bold uppercase tracking-wide text-neutral-800">
        Lojas oficiais
      </h2>
      <div className="flex justify-start gap-6 overflow-x-auto pb-2 lg:justify-center">
        {sellers.map((s) => (
          <LocalizedClientLink
            key={s.id}
            href={`/sellers/${s.handle}`}
            title={s.name}
            className="group flex w-[110px] shrink-0 flex-col items-center gap-2 text-center"
          >
            <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border bg-white shadow-sm transition-all group-hover:border-[#0F52FF] group-hover:shadow-md">
              {s.logo ? (
                <Image
                  src={decodeURIComponent(s.logo)}
                  alt={s.name}
                  width={96}
                  height={96}
                  className="h-full w-full object-contain p-3"
                />
              ) : (
                <span className="text-2xl font-black text-[#0F52FF]">
                  {s.name.charAt(0)}
                </span>
              )}
            </span>
            <span className="line-clamp-2 text-xs font-medium text-neutral-700">{s.name}</span>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}
