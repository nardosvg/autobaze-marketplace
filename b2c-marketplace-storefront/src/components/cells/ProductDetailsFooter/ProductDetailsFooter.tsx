import {
  ProductPostedDate,
  ProductReportButton,
  ProductTags,
} from '@/components/molecules';
import { HttpTypes } from '@medusajs/types';

export const ProductDetailsFooter = ({
  tags = [],
  posted,
}: {
  tags?: HttpTypes.StoreProductTag[];
  posted: HttpTypes.StoreProduct['created_at'];
}) => {
  return (
    <div className='mt-6 border-t pt-4'>
      <ProductTags tags={tags} />
      <div className='mt-2 flex items-center justify-between'>
        <ProductPostedDate posted={posted} />
        <ProductReportButton />
      </div>
    </div>
  );
};
