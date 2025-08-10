"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { config } from '@/lib/config'

export function SettingsDialog() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>Configurações</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-lg rounded-lg border bg-background p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Configurações (MVP)</h2>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Fechar">✕</Button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">Modelo</div>
                <div className="font-medium">{config.model}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Chave da IA</div>
                <div className="font-medium">Verificação não realizada no cliente. Configure a variável OPENAI_API_KEY no servidor/.env.</div>
              </div>
              <div>
                <div className="text-muted-foreground">Tema padrão</div>
                <div className="font-medium">Controlado pelo seletor de tema (claro/escuro) na barra superior.</div>
              </div>
              <div>
                <div className="text-muted-foreground">Histórico local</div>
                <div className="font-medium">Armazenamento em localStorage para itens de histórico/favoritos.</div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 