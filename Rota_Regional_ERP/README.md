# Rota Regional ERP — protótipo funcional

## Como executar
1. Extraia `Rota_Regional_ERP.zip`.
2. Abra `index.html` em um navegador moderno (Chrome, Edge ou Firefox).
3. Entre com:
   - E-mail: `vendedor@rotaregional.com`
   - Senha: `123456`

Não precisa instalar nada nem usar servidor para a demonstração básica.

## Funcionalidades
- Login de demonstração e navegação entre módulos.
- Painel com indicadores.
- Cadastro, edição, pesquisa e exclusão protegida de clientes.
- Validação de CPF e consentimento LGPD no cadastro.
- Cadastro e ativação/desativação de pacotes.
- Gestão de viagens, guias, veículos e capacidade.
- Criação de reservas com validação de vagas para evitar overbooking.
- Simulação de pagamento aprovado ou recusado.
- Reserva confirmada somente quando o pagamento é aprovado; recusas ficam pendentes.
- Cancelamento de reservas e liberação das vagas.
- Visualização e impressão de voucher/comprovante após confirmação.
- Cadastro de frota e verificação da capacidade do veículo ao cadastrar viagem.
- Relatórios e exportação em JSON/CSV.
- Dados persistidos no `localStorage` do navegador.

## Regras e limitações
Este é um protótipo acadêmico. A autenticação é demonstrativa, os dados ficam no navegador e o pagamento é simulado. Não use dados pessoais reais. Para produção, seria necessário backend, autenticação segura, banco de dados, autorização por perfil, auditoria, proteção de dados e integração com um provedor de pagamento.
