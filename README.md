# AquaWatch — Protótipo clicável (Wear OS Concept)

Protótipo clicável do conceito **AquaWatch** para Wear OS, em HTML + CSS + JS puro,
pronto para publicar no **GitHub Pages**. O fluxo, os gestos (deslizar/tocar), os
tempos e as simulações de pagamento seguem exatamente a especificação do Figma.

> **PT** — Produto fictício. Este conceito não possui qualquer relação com a Aqua.
> Criado para fins de estudo em Wear OS. Caso necessário, será removido do case study.
> _AquaWatch Concept · Trícia Linewberg, UX Designer_
>
> **EN** — Fictional product. This concept has no relation to Aqua. Created for
> study purposes in Wear OS. If necessary, it will be removed from the case study.
> _AquaWatch Concept · Trícia Linewberg, UX Designer_

## Como rodar

Abra `index.html` em qualquer navegador, ou publique via GitHub Pages
(Settings → Pages → Branch `main` / pasta `/root`).

## Fluxo implementado

| Tela | Comportamento |
|------|----------------|
| **1 – Splash** | 2s → Tela 2 (fade) |
| **2 – Conexão** | círculo girando, 8s → Tela 3 (fade) |
| **3 – Saldo** | deslizar ← → Tela 5 · tocar → Tela 3.1 |
| **3.1 – Saldo (detalhe)** | tocar → Tela 3 |
| **5 – Histórico** | deslizar ← → Tela 4 · deslizar → → Tela 3 · deslizar ↑ → Tela 5.1 |
| **5.1 – Histórico (detalhe)** | deslizar ↓ → Tela 5 |
| **4 – Limite** | deslizar ← → Tela 8 · deslizar → → Tela 5 |
| **8 – Logout** | deslizar → → Tela 4 |

### Simulações de pagamento (na Tela 3 / Tela 6.2 — "encostar o relógio na máquina")
- **Aprovado:** Tela 6 → (1s) Tela 6.1 → (5s) Tela 6.2 (novo saldo)
- **Recusado:** Tela 7 → (1s) Tela 7.1 → (5s) Tela 3
- **Acima do limite:** Tela 9 → **Pay anyway** (segue para aprovado) ou **Cancel** (volta à Tela 3)

Os botões da "máquina de pagamento" ficam ativos apenas nas telas de saldo.

## Telas (imagens)

As telas são os PNGs exportados do Figma, na pasta [`/screens`](./screens).
Veja [`screens/README.md`](./screens/README.md) para os node-IDs e instruções de export.

## Estrutura

```
index.html   — marcação + crédito bilíngue
styles.css   — visual (relógio, transições, painel, crédito)
app.js       — máquina de estados do fluxo, gestos e simulações
screens/     — PNGs das 14 telas exportadas do Figma
```
