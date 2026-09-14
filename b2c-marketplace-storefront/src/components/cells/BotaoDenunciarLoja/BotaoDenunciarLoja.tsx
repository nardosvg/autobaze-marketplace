"use client"

import { useState } from "react"

import { Modal, ReportSellerForm } from "@/components/molecules"

// Link discreto "Denunciar loja" com a modal de denuncia (padrao ML: fica
// no canto do header da loja, sem botao grandao).
export const BotaoDenunciarLoja = () => {
  const [aberta, setAberta] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(true)}
        className="text-sm text-secondary underline-offset-2 hover:text-primary hover:underline"
        data-testid="report-seller-button"
      >
        Denunciar loja
      </button>
      {aberta && (
        <Modal heading="Denunciar loja" onClose={() => setAberta(false)}>
          <ReportSellerForm onClose={() => setAberta(false)} />
        </Modal>
      )}
    </>
  )
}
