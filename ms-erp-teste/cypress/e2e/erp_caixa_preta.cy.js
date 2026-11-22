describe("Módulos 1, 2 e 3: Autenticação, Pacotes/Frota e Clientes (CT-01 a CT-21)", () => {

  const fazerLoginValido = () => {
    cy.visit("/");
    cy.get("#input-usuario").type("sidney.vendas@agencia.com");
    cy.get("#input-senha").type("123456");
    cy.contains("button", "Entrar").click();
    cy.get("#tela-principal").should("not.have.class", "hidden");
  };

  /* ================= MÓDULO 1: AUTENTICAÇÃO E ACESSO ================= */

  it("CT-01 - Login com credenciais válidas de vendedor ativo", () => {
    fazerLoginValido();
    cy.get("#titulo-vendedor").should("contain", "Sidney");
    cy.get("#status-bar").should("contain", "sidney.vendas@agencia.com");
  });

  it("CT-02 - Login com senha incorreta", () => {
    cy.visit("/");
    cy.on("window:alert", (msg) => {
      expect(msg).to.include("E-mail ou senha inválidos");
    });
    cy.get("#input-usuario").type("sidney.vendas@agencia.com");
    cy.get("#input-senha").type("senha_errada_123");
    cy.contains("button", "Entrar").click();
    cy.get("#tela-login").should("be.visible");
  });

  it("CT-03 - Login com e-mail inexistente", () => {
    cy.visit("/");
    cy.on("window:alert", (msg) => {
      expect(msg).to.include("E-mail ou senha inválidos");
    });
    cy.get("#input-usuario").type("naoexiste@agencia.com");
    cy.get("#input-senha").type("123456");
    cy.contains("button", "Entrar").click();
    cy.get("#tela-login").should("be.visible");
  });

  it("CT-04 - Login com campos obrigatórios em branco", () => {
    cy.visit("/");
    cy.on("window:alert", (msg) => {
      expect(msg).to.include("Por favor, informe o e-mail e a senha do vendedor.");
    });
    cy.contains("button", "Entrar").click();
    cy.get("#tela-login").should("be.visible");
  });

  it("CT-05 - Login de vendedor inativo", () => {
    cy.visit("/");
    cy.on("window:alert", (msg) => {
      expect(msg).to.include("inválidos");
    });
    cy.get("#input-usuario").type("inativo.vendas@agencia.com");
    cy.get("#input-senha").type("123456");
    cy.contains("button", "Entrar").click();
    cy.get("#tela-login").should("be.visible");
  });

  it("CT-06 - Logout manual do sistema", () => {
    fazerLoginValido();
    cy.contains("button", "Sair do Sistema").click();
    cy.get("#tela-login").should("not.have.class", "hidden");
    cy.get("#status-bar").should("contain", "Aguardando autenticação");
  });

  it.skip("CT-07 - Armazenamento seguro de senha no banco (RNF03 - Pendente hash BCrypt/PBKDF2)", () => {});

  it.skip("CT-08 - Logout automático por inatividade (RNF04 - Pendente timeout de sessão)", () => {});

  /* ================= MÓDULO 2: PACOTES, VIAGENS E FROTA ================= */

  it("CT-09 - Cadastro de pacote turístico completo", () => {
    fazerLoginValido();
    cy.contains("button", "Cadastro de Pacotes e Viagens").click();
    cy.get("#ger-pac-nome").type("Pacote Recife Histórico E2E");
    cy.get("#ger-pac-desc").type("Roteiro completo com hospedagem e passeio");
    cy.contains("button", "Salvar Pacote").click();
    cy.get("#tabela-gerencia-pacotes").should("contain", "Pacote Recife Histórico E2E");
  });

  it("CT-10 - Cadastro de pacote sem hospedagem ou city tour (campos obrigatórios)", () => {
    fazerLoginValido();
    cy.contains("button", "Cadastro de Pacotes e Viagens").click();
    cy.on("window:alert", (msg) => {
      expect(msg).to.include("Preencha o nome do pacote");
    });
    cy.get("#ger-pac-nome").clear();
    cy.contains("button", "Salvar Pacote").click();
  });

  it("CT-11 - Impossibilidade de venda avulsa ou alteração de pacote na venda", () => {
    fazerLoginValido();
    cy.contains("button", "Venda de Pacotes").click();
    cy.get("#tela-pacotes input").should("not.exist");
    cy.get("#btn-selecionar-pacote").should("be.disabled");
  });

  it("CT-12 - Abertura de nova data de saída (Viagem) válida", () => {
    fazerLoginValido();
    cy.contains("button", "Cadastro de Pacotes e Viagens").click();
    cy.get("#ger-viag-inicio").type("2026-11-10");
    cy.get("#ger-viag-fim").type("2026-11-15");
    cy.get("#ger-viag-hora").type("07:30");
    cy.get("#ger-viag-vagas").clear().type("40");
    cy.contains("button", "Abrir Data de Viagem").click();
  });

  it("CT-13 - Abertura de viagem com capacidade inválida (0 ou negativo)", () => {
    cy.request({
      method: "POST",
      url: "/api/gerencia/viagens",
      failOnStatusCode: false,
      body: {
        id_pacote: 1,
        data_inicio: "2026-11-20",
        data_fim: "2026-11-22",
        hora_saida: "08:00",
        capacidade_total: 0
      }
    }).then((resp) => {
      expect(resp.status).to.be.oneOf([200, 400]);
      if (resp.body && resp.body.sucesso !== undefined) {
        expect(resp.body.sucesso).to.eq(false);
      }
    });
  });

  it("CT-14 - Alocação de veículo e motorista em uma viagem", () => {
    fazerLoginValido();
    cy.contains("button", "Alocação de Frota e Guias").click();
    cy.get("#log-veiculo option").eq(0).then(($opt) => cy.get("#log-veiculo").select($opt.val()));
    cy.get("#log-motorista option").eq(0).then(($opt) => cy.get("#log-motorista").select($opt.val()));
    cy.contains("button", "Vincular Frota").click();
    cy.get("#tabela-frota-alocada").should("contain", "ABC1D01");
  });

  it("CT-15 - Alocação de múltiplos veículos até o limite da frota (3 / 120 vagas)", () => {
    fazerLoginValido();
    cy.contains("button", "Alocação de Frota e Guias").click();
    [1, 2, 3].forEach((idx) => {
      cy.get("#log-veiculo option").eq(idx).then(($opt) => cy.get("#log-veiculo").select($opt.val()));
      cy.get("#log-motorista option").eq(idx).then(($opt) => cy.get("#log-motorista").select($opt.val()));
      cy.contains("button", "Vincular Frota").click();
    });
    cy.get("#tabela-frota-alocada tr").should("have.length.at.least", 3);
  });

  it("CT-16 - Escalação de guia credenciado (CADASTUR) para City Tour", () => {
    fazerLoginValido();
    cy.contains("button", "Alocação de Frota e Guias").click();
    cy.get("#log-data-guia").type("2026-12-11");
    cy.get("#log-obs-guia").type("Recepção do hotel às 08h30");
    cy.contains("button", "Escalar Guia").click();
    cy.get("#tabela-guias-escalados").should("contain", "Mariana Guia Turística");
  });

  /* ================= MÓDULO 3: CLIENTES ================= */

  it("CT-17 - Cadastro de novo cliente comprador com dados válidos", () => {
    cy.request({
      method: "POST",
      url: "/api/clientes",
      body: {
        nome: "Fernanda Cliente Valida",
        cpf: "11122233344",
        telefone: "(81) 99111-2233"
      }
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.sucesso).to.eq(true);
    });
  });

  it("CT-18 - Bloqueio de cadastro com CPF duplicado", () => {
    cy.request({
      method: "POST",
      url: "/api/clientes",
      failOnStatusCode: false,
      body: {
        nome: "Fernanda Duplicada",
        cpf: "11122233344",
        telefone: "(81) 99111-9999"
      }
    }).then((resp) => {
      expect(resp.status).to.be.oneOf([200, 409]);
      expect(resp.body.sucesso).to.eq(false);
    });
  });

  it("CT-19 - Validação de CPF com menos de 11 dígitos ou campos vazios", () => {
    fazerLoginValido();
    cy.contains("button", "Venda de Pacotes").click();
    cy.get("#lista-pacotes-tabela tr").not(".esgotado").first().click();
    cy.get("#btn-selecionar-pacote").click();
    cy.contains("button", "Cadastrar Novo Cliente").click();

    cy.on("window:alert", (msg) => {
      expect(msg).to.include("CPF (11 números)");
    });
    cy.get("#cad-comp-nome").type("Cliente CPF Curto");
    cy.get("#cad-comp-cpf").type("1234567890");
    cy.get("#cad-comp-tel").type("(81) 99999-1234");
    cy.contains("button", "Salvar e Gerar Reserva").click();
    cy.get("#tela-cadastro-exclusiva").should("not.have.class", "hidden");
  });

  it("CT-20 - Consulta de cliente cadastrado por Nome ou CPF", () => {
    fazerLoginValido();
    cy.contains("button", "Venda de Pacotes").click();
    cy.get("#lista-pacotes-tabela tr").not(".esgotado").first().click();
    cy.get("#btn-selecionar-pacote").click();
    cy.contains("button", "Consultar Cliente Cadastrado").click();

    cy.get("#input-busca-cliente").type("Fernanda");
    cy.get("#tabela-consulta-clientes").should("contain", "Fernanda Cliente Valida");
  });

  it("CT-21 - Tentativa de avançar sem selecionar cliente na lista", () => {
    fazerLoginValido();
    cy.contains("button", "Venda de Pacotes").click();
    cy.get("#lista-pacotes-tabela tr").not(".esgotado").first().click();
    cy.get("#btn-selecionar-pacote").click();
    cy.contains("button", "Consultar Cliente Cadastrado").click();

    cy.on("window:alert", (msg) => {
      expect(msg).to.include("clique em um cliente da lista");
    });
    cy.contains("button", "Selecionar Cliente").click();
  });
});
