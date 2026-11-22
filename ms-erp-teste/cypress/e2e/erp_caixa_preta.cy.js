describe("Testes de Caixa Preta - ERP Agência de Viagens (MS Soluções)", () => {

  beforeEach(() => {
    cy.visit("/");
  });

  it("CT01 - Deve bloquear login com credenciais inválidas (Particionamento de Equivalência)", () => {
    cy.on("window:alert", (textoAlerta) => {
      expect(textoAlerta).to.include("inválidos");
    });

    cy.get("#input-usuario").type("invalido@agencia.com");
    cy.get("#input-senha").type("senhaerrada");
    cy.contains("button", "Entrar").click();

    cy.get("#tela-login").should("be.visible");
    cy.get("#tela-principal").should("have.class", "hidden");
  });

  it("CT02 - Deve realizar login válido e exibir os módulos operacionais e gerenciais", () => {
    cy.get("#input-usuario").type("sidney.vendas@agencia.com");
    cy.get("#input-senha").type("123456");
    cy.contains("button", "Entrar").click();

    cy.get("#tela-principal").should("not.have.class", "hidden");
    cy.get("#titulo-vendedor").should("contain", "Sidney");
  });

  it("CT03 - Deve cadastrar novo pacote e abrir saída com controle de vagas", () => {
    cy.get("#input-usuario").type("sidney.vendas@agencia.com");
    cy.get("#input-senha").type("123456");
    cy.contains("button", "Entrar").click();

    cy.contains("button", "Cadastro de Pacotes e Viagens").click();
    cy.get("#tela-gerencia-pacotes").should("not.have.class", "hidden");

    cy.get("#ger-pac-nome").type("Roteiro Teste Cypress");
    cy.get("#ger-pac-desc").type("Pacote gerado via teste automatizado E2E");
    cy.contains("button", "Salvar Pacote").click();

    cy.get("#ger-viag-inicio").type("2026-12-10");
    cy.get("#ger-viag-fim").type("2026-12-15");
    cy.get("#ger-viag-hora").type("08:00");
    cy.get("#ger-viag-vagas").clear().type("10");
    cy.contains("button", "Abrir Data de Viagem").click();
  });

  it("CT04 - Deve validar regra de negócio de CPF e concluir reserva com emissão de voucher", () => {
    cy.get("#input-usuario").type("sidney.vendas@agencia.com");
    cy.get("#input-senha").type("123456");
    cy.contains("button", "Entrar").click();

    cy.contains("button", "Venda de Pacotes").click();
    cy.get("#lista-pacotes-tabela tr").not(".esgotado").first().click();
    cy.get("#btn-selecionar-pacote").should("not.be.disabled").click();

    cy.contains("button", "Cadastrar Novo Cliente").click();

    // Valor Limite Inválido: CPF com 10 dígitos
    cy.get("#cad-comp-nome").type("Cliente Teste Caixa Preta");
    cy.get("#cad-comp-cpf").type("1234567890");
    cy.get("#cad-comp-tel").type("(81) 99999-0000");
    cy.contains("button", "Salvar e Gerar Reserva").click();
    cy.get("#tela-cadastro-exclusiva").should("not.have.class", "hidden");

    // Valor Limite Válido: CPF com 11 dígitos
    cy.get("#cad-comp-cpf").clear().type("99988877766");
    cy.contains("button", "Salvar e Gerar Reserva").click();

    // Resumo da Reserva e Emissão de Voucher
    cy.get("#tela-resumo-reserva", { timeout: 6000 }).should("not.have.class", "hidden");
    cy.contains("button", "Pagamento Concluído (Emitir Voucher)").click();

    cy.get("#tela-voucher", { timeout: 6000 }).should("not.have.class", "hidden");
    cy.get("#vouc-codigo").should("contain", "VOU-");
  });

  it("CT05 - Deve cancelar reserva no histórico e estornar vagas", () => {
    cy.get("#input-usuario").type("sidney.vendas@agencia.com");
    cy.get("#input-senha").type("123456");
    cy.contains("button", "Entrar").click();

    cy.contains("button", "Histórico de Reservas").click();
    cy.get("#tabela-historico-reservas").should("contain", "Cliente Teste Caixa Preta");

    cy.on("window:confirm", () => true);
    cy.get("#tabela-historico-reservas button.btn-perigo").first().click();

    cy.get("#tabela-historico-reservas").should("contain", "Cancelada");
  });

  it("CT06 - Deve bloquear reserva acima da capacidade disponível (Prevenção de Overbooking)", () => {
    cy.get("#input-usuario").type("sidney.vendas@agencia.com");
    cy.get("#input-senha").type("123456");
    cy.contains("button", "Entrar").click();

    // Abre uma saída com apenas 1 vaga disponível
    cy.contains("button", "Cadastro de Pacotes e Viagens").click();
    cy.get("#ger-viag-inicio").type("2026-12-20");
    cy.get("#ger-viag-fim").type("2026-12-22");
    cy.get("#ger-viag-hora").type("09:00");
    cy.get("#ger-viag-vagas").clear().type("1");
    cy.contains("button", "Abrir Data de Viagem").click();

    cy.contains("button", "Voltar ao Menu").click();

    // Seleciona a viagem com 1 vaga e tenta reservar 2 passageiros (comprador + 1 acompanhante)
    cy.contains("button", "Venda de Pacotes").click();
    cy.contains("#lista-pacotes-tabela tr", "1 vagas").click();
    cy.get("#btn-selecionar-pacote").should("not.be.disabled").click();

    cy.contains("button", "Cadastrar Novo Cliente").click();
    cy.get("#cad-comp-nome").type("Cliente Overbooking");
    cy.get("#cad-comp-cpf").type("88877766655");
    cy.get("#cad-comp-tel").type("(81) 98888-1111");

    cy.get("#cad-pass-nome").type("Acompanhante Excedente");
    cy.get("#cad-pass-cpf").type("77766655544");
    cy.contains("button", "Adicionar").click();

    cy.contains("button", "Salvar e Gerar Reserva").click();

    // Deve permanecer na tela de cadastro e não avançar para o resumo
    cy.get("#tela-cadastro-exclusiva").should("not.have.class", "hidden");
    cy.get("#tela-resumo-reserva").should("have.class", "hidden");
  });

  it("CT07 - Deve bloquear alocação acima de 3 micro-ônibus na mesma viagem (Limite de Frota)", () => {
    cy.get("#input-usuario").type("sidney.vendas@agencia.com");
    cy.get("#input-senha").type("123456");
    cy.contains("button", "Entrar").click();

    cy.contains("button", "Alocação de Frota e Guias").click();
    cy.get("#tela-gerencia-logistica").should("not.have.class", "hidden");

    // Vincula os 3 veículos permitidos na primeira viagem
    const indices = [0, 1, 2];
    indices.forEach((idx) => {
      cy.get("#log-veiculo option").eq(idx).then(($opt) => {
        cy.get("#log-veiculo").select($opt.val());
      });
      cy.get("#log-motorista option").eq(idx).then(($opt) => {
        cy.get("#log-motorista").select($opt.val());
      });
      cy.contains("button", "Vincular Frota").click();
    });

    // Tenta vincular o 4º veículo (deve ser bloqueado pelo limite de 3 veículos)
    cy.get("#log-veiculo option").eq(3).then(($opt) => {
      cy.get("#log-veiculo").select($opt.val());
    });
    cy.get("#log-motorista option").eq(3).then(($opt) => {
      cy.get("#log-motorista").select($opt.val());
    });
    cy.contains("button", "Vincular Frota").click();

    // Garante que apenas 3 veículos ficaram alocados na tabela
    cy.get("#tabela-frota-alocada tr").should("have.length", 3);
  });
});
