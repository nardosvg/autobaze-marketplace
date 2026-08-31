'use client';

import { FC, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { FieldError, FieldValues, FormProvider, useForm, useFormContext } from 'react-hook-form';

import { Button } from '@/components/atoms';
import { InteractiveStarRating } from '@/components/atoms/InteractiveStarRating/InteractiveStarRating';
import { createReview, Order } from '@/lib/data/reviews';
import { enviarFotosAvaliacao } from '@/lib/data/avaliacoes-fotos';
import { toast } from '@/lib/helpers/toast';
import { cn } from '@/lib/utils';

const MAX_FOTOS = 4;

// File -> base64 puro (sem prefixo data:)
const paraBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).replace(/^data:[^,]+,/, ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

import { ReviewFormData, reviewSchema } from './schema';

interface Props {
  handleClose?: () => void;
  seller: Order;
}

export const ReviewForm: React.FC<Props> = ({ ...props }) => {
  const methods = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      sellerId: '',
      rating: 0,
      opinion: ''
    }
  });

  return (
    <FormProvider {...methods}>
      <Form {...props} />
    </FormProvider>
  );
};

const Form: FC<Props> = ({ handleClose, seller }) => {
  const [error, setError] = useState<string>();
  const [fotos, setFotos] = useState<File[]>([]);
  const {
    watch,
    handleSubmit,
    register,
    setValue,
    formState: { errors }
  } = useFormContext();

  const submit = async (data: FieldValues) => {
    const body = {
      order_id: seller.id,
      rating: data.rating,
      reference: 'seller',
      reference_id: seller.seller.id,
      customer_note: data.opinion
    };

    const response = await createReview(body);

    if (response.error) {
      setError('error');
      return;
    }

    // Fotos: anexa na avaliacao recem-criada (modulo extras)
    const reviewId: string | undefined = response?.review?.id ?? response?.id;
    if (reviewId && fotos.length) {
      try {
        const payload = await Promise.all(
          fotos.slice(0, MAX_FOTOS).map(async file => ({
            nome: file.name,
            tipo: file.type,
            conteudo: await paraBase64(file)
          }))
        );
        const res = await enviarFotosAvaliacao(reviewId, payload);
        if (res.error) {
          toast.error({ title: 'Avaliação enviada, mas as fotos falharam', description: res.error });
        }
      } catch {
        toast.error({ title: 'Avaliação enviada, mas as fotos falharam' });
      }
    }

    setError('');
    handleClose && handleClose();
  };

  const lettersCount = watch('opinion')?.length;
  const rating = watch('rating');

  return (
    <form
      onSubmit={handleSubmit(submit)}
      data-testid="review-form"
    >
      <div className="space-y-4 px-4">
        <div className="items-top mb-4 grid max-w-full grid-cols-1 gap-4">
          <div>
            <label
              className="label-sm mb-2 block"
              data-testid="review-form-rating-label"
            >
              Nota
            </label>
            <InteractiveStarRating
              value={rating}
              onChange={value => setValue('rating', value)}
              error={!!errors.rating}
              data-testid="review-form-rating-input"
            />
            {errors.rating?.message && (
              <p
                className="label-sm mt-1 text-negative"
                data-testid="review-form-rating-error"
              >
                {(errors.rating as FieldError).message}
              </p>
            )}
          </div>

          <label className={cn('label-sm relative block')}>
            <p
              className={cn(error && 'text-negative')}
              data-testid="review-form-opinion-label"
            >
              Sua opinião
            </p>
            <textarea
              className={cn(
                'relative h-32 w-full rounded-sm border bg-component-secondary px-4 py-3 focus:border-primary focus:outline-none focus:ring-0',
                error && 'border-negative focus:border-negative'
              )}
              placeholder="Escreva sua opinião sobre esta loja..."
              data-testid="review-form-opinion-input"
              {...register('opinion')}
            />
            <div
              className={cn(
                'label-medium absolute right-4 text-secondary',
                errors.opinion?.message ? 'bottom-8' : 'bottom-3'
              )}
              data-testid="review-form-character-count"
            >
              {`${lettersCount} / 300`}
            </div>
            {errors.opinion?.message && (
              <p
                className="label-sm text-negative"
                data-testid="review-form-opinion-error"
              >
                {(errors.opinion as FieldError).message}
              </p>
            )}
          </label>
        </div>
        {error && (
          <p
            className="label-md text-negative"
            data-testid="review-form-error"
          >
            {error}
          </p>
        )}
        <div>
          <p className="label-sm mb-1">Fotos (opcional, até {MAX_FOTOS})</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="label-sm block w-full"
            data-testid="review-form-photos-input"
            onChange={e => {
              const arquivos = Array.from(e.target.files ?? []).slice(0, MAX_FOTOS);
              setFotos(arquivos);
            }}
          />
          {fotos.length > 0 && (
            <div className="mt-2 flex gap-2">
              {fotos.map(file => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={file.name}
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="h-14 w-14 rounded-sm border object-cover"
                />
              ))}
            </div>
          )}
        </div>
        <Button
          className="w-full"
          data-testid="review-form-submit-button"
        >
          Enviar avaliação
        </Button>
      </div>
    </form>
  );
};
