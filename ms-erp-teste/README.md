# ms-erp para Agência de Viagens
---
## Garantia da Qualidade e Testes Automatizados (Cypress + GitHub Actions)

O sistema conta com uma suíte automatizada de testes de **Caixa-Preta (E2E e API REST)** desenvolvida com **Cypress** e integrada ao **GitHub Actions** (`.github/workflows/testes_cypress.yml`), executada automaticamente a cada `push` ou `pull_request` na branch `main`.

### Cobertura dos Casos de Teste (`CT-01` a `CT-35`)

O plano de testes cobre **100% dos 35 casos de teste** mapeados nos 6 módulos do ERP (`casos_de_teste_erp_atualizado.xlsx`), atingindo **91,4% de aprovação funcional** em ambiente isolado com **MySQL 8.0** e **Python/Flask**:

| Módulo | Casos de Teste | Total | Aprovados | Pendentes (Infra) | % Aprovado |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Autenticação e Acesso** | `CT-01` a `CT-08` | 8 | 6 | 2 (`CT-07`, `CT-08`) | 75,0% |
| **2. Pacotes, Viagens e Frota** | `CT-09` a `CT-16` | 8 | 8 | 0 | 100,0% |
| **3. Clientes** | `CT-17` a `CT-21` | 5 | 5 | 0 | 100,0% |
| **4. Reservas e Overbooking** | `CT-22` a `CT-28` | 7 | 7 | 0 | 100,0% |
| **5. Voucher e Cancelamento** | `CT-29` a `CT-32` | 4 | 4 | 0 | 100,0% |
| **6. Relatórios e Não Funcionais** | `CT-33` a `CT-35` | 3 | 2 | 1 (`CT-35`) | 66,7% |
| **Total Geral** | **`CT-01` a `CT-35`** | **35** | **32** | **3** | **91,4%** |

> **Nota sobre os 3 casos pendentes (`it.skip`):**
> * **`CT-07` (RNF03):** Armazenamento de senhas com hash criptográfico (BCrypt/PBKDF2) no banco de dados.
> * **`CT-08` (RNF04):** Expiração automática de sessão por tempo de inatividade.
> * **`CT-35` (RNF05/RNF09):** Política externa de backup diário automatizado do servidor MySQL.

### Como Executar Localmente

1. Certifique-se de que o banco `db_agencia_viagens` está ativo e populado (`db_agencia_viagens.sql`).
2. Inicie o servidor backend Flask dentro da pasta `ms-erp-teste`:
   ```bash
   cd ms-erp-teste
   python app.py
