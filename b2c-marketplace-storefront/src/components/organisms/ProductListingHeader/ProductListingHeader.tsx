'use client';

import { usePathname, useRouter } from 'next/navigation';

import { SelectField } from '@/components/molecules';

const selectOptions = [
  { label: 'Mais recentes', value: 'created_at' },
  { label: 'Menor preço', value: 'price_asc' },
  { label: 'Maior preço', value: 'price_desc' }
];

export const ProductListingHeader = ({ total }: { total: number }) => {
  const router = useRouter();
  const pathname = usePathname();

  const selectOptionHandler = (value: string) => {
    router.push(`${pathname}?sortBy=${value}`);
  };

  return (
    <div
      className="flex w-full items-center justify-between"
      data-testid="product-listing-header"
    >
      <div data-testid="product-listing-total">{total} {total === 1 ? 'anúncio' : 'anúncios'}</div>
      {/* <div className='hidden md:flex gap-2 items-center'>
        Ordenar por:{' '}
        <SelectField
          className='min-w-[200px]'
          options={selectOptions}
          selectOption={selectOptionHandler}
          data-testid="product-listing-sort-dropdown"
        />
      </div> */}
    </div>
  );
};
