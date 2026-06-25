# AquaWatch — Protótipo clicável (Wear OS)

Protótipo clicável do conceito **AquaWatch**, um case study de UX para Wear OS.
Feito em HTML, CSS e JavaScript puro, usando exatamente as telas desenhadas no Figma.

🔗 **Demo (GitHub Pages):** _habilite em Settings → Pages (veja abaixo)_

## Fluxo
- **Tela 1 — Splash** (2s) → **Tela 2 — Conexão** (anel girando, 8s) → **Tela 3 — Saldo**
- **Tela 3:** arraste para o lado → Histórico (5); toque → alterna saldo (3 ↔ 3.1)
- **Tela 5 — Histórico:** ← Limite (4) · → volta p/ Saldo (3) · ↑ Histórico (5.1)
- **Tela 4 — Limite:** ← Logout (8) · → volta p/ Histórico (5)
- **Tela 8 — Logout:** → volta p/ Limite (4); botão *Logout* reinicia o fluxo

## Simulações de pagamento (botões abaixo do relógio)
1. **Aprovado:** 6 → 6.1 (zoom) → 6.2 (novo saldo)
2. **Recusado:** 7 (tremor) → 7.1 → volta para a tela inicial
3. **Acima do limite:** 9 → tocar na face confirma a digital (aprova) ou *Cancel* (volta)

## Controles
- **Arraste** o relógio (← → ↑ ↓) ou use as **setas do teclado**
- **Toque/clique** no relógio = toque simples
- Botões do painel simulam o pagamento por NFC

## Publicar no GitHub Pages
1. Faça o merge desta branch na `main`.
2. Em **Settings → Pages**, selecione **Branch: `main`** e pasta **`/ (root)`**.
3. O site ficará disponível em `https://tricialinewberg.github.io/CaseStudyWearOS/`.

---
Produto fictício, sem relação com a Aqua. Criado para fins de estudo.
AquaWatch Concept · Trícia Linewberg, UX Designer
