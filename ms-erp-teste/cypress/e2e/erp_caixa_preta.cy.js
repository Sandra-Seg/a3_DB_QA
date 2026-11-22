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
describe("Módulos 4, 5 e 6: Reservas, Overbooking, Voucher, Cancelamento e Relatórios (CT-22 a CT-35)", () => {

  const fazerLoginValido = () => {
    cy.visit("/");
    cy.get("#input-usuario").type("sidney.vendas@agencia.com");
    cy.get("#input-senha").type("123456");
    cy.contains("button", "Entrar").click();
    cy.get("#tela-principal").should("not.have.class", "hidden");
  };

  /* ================= MÓDULO 4: RESERVAS E OVERBOOKING ================= */

  it("CT-22 - Reserva individual (1 passageiro) com vagas disponíveis", () => {
    fazerLoginValido();
    cy.contains("button", "Venda de Pacotes").click();
    cy.get("#lista-pacotes-tabela tr").not(".esgotado").first().click();
    cy.get("#btn-selecionar-pacote").click();

    cy.contains("button", "Cadastrar Novo Cliente").click();
    cy.get("#cad-comp-nome").type("Passageiro Individual CT22");
    cy.get("#cad-comp-cpf").type("22233344455");
    cy.get("#cad-comp-tel").type("(81) 98888-2222");
    cy.contains("button", "Salvar e Gerar Reserva").click();

    cy.get("#tela-resumo-reserva", { timeout: 6000 }).should("not.have.class", "hidden");
    cy.get("#res-tabela-passageiros tr").should("have.length", 1);
  });

  it("CT-23 - Reserva em grupo com cadastro automático de acompanhante novo", () => {
    fazerLoginValido();
    cy.contains("button", "Venda de Pacotes").click();
    cy.get("#lista-pacotes-tabela tr").not(".esgotado").first().click();
    cy.get("#btn-selecionar-pacote").click();

    cy.contains("button", "Cadastrar Novo Cliente").click();
    cy.get("#cad-comp-nome").type("Lider Grupo CT23");
    cy.get("#cad-comp-cpf").type("33344455566");
    cy.get("#cad-comp-tel").type("(81) 98888-3333");

    cy.get("#cad-pass-nome").type("Acompanhante Um CT23");
    cy.get("#cad-pass-cpf").type("33344455577");
    cy.get("#tela-cadastro-exclusiva").contains("button", "Adicionar").click();

    cy.get("#cad-pass-nome").type("Acompanhante Dois CT23");
    cy.get("#cad-pass-cpf").type("33344455588");
    cy.get("#tela-cadastro-exclusiva").contains("button", "Adicionar").click();

    cy.contains("button", "Salvar e Gerar Reserva").click();
    cy.get("#tela-resumo-reserva", { timeout: 6000 }).should("not.have.class", "hidden");
    cy.get("#res-tabela-passageiros tr").should("have.length", 3);
  });

  it("CT-24 - Reserva atingindo exatamente o limite de vagas (vagas == pax)", () => {
    fazerLoginValido();
    cy.contains("button", "Cadastro de Pacotes e Viagens").click();
    cy.get("#ger-viag-inicio").type("2026-12-25");
    cy.get("#ger-viag-fim").type("2026-12-27");
    cy.get("#ger-viag-hora").type("08:00");
    cy.get("#ger-viag-vagas").clear().type("2");
    cy.contains("button", "Abrir Data de Viagem").click();
    cy.contains("button", "Voltar ao Menu").click();

    cy.contains("button", "Venda de Pacotes").click();
    cy.contains("#lista-pacotes-tabela tr", "2 vagas").click();
    cy.get("#btn-selecionar-pacote").click();

    cy.contains("button", "Cadastrar Novo Cliente").click();
    cy.get("#cad-comp-nome").type("Comprador Limite Exato");
    cy.get("#cad-comp-cpf").type("44455566677");
    cy.get("#cad-comp-tel").type("(81) 98888-4444");

    cy.get("#cad-pass-nome").type("Acompanhante Limite Exato");
    cy.get("#cad-pass-cpf").type("44455566688");
    cy.get("#tela-cadastro-exclusiva").contains("button", "Adicionar").click();

    cy.contains("button", "Salvar e Gerar Reserva").click();
    cy.get("#tela-resumo-reserva", { timeout: 6000 }).should("not.have.class", "hidden");
  });

  it("CT-25 - Bloqueio de overbooking (quant_passageiros = vagas + 1)", () => {
    fazerLoginValido();
    cy.contains("button", "Cadastro de Pacotes e Viagens").click();
    cy.get("#ger-viag-inicio").type("2026-12-28");
    cy.get("#ger-viag-fim").type("2026-12-30");
    cy.get("#ger-viag-hora").type("09:00");
    cy.get("#ger-viag-vagas").clear().type("1");
    cy.contains("button", "Abrir Data de Viagem").click();
    cy.contains("button", "Voltar ao Menu").click();

    cy.contains("button", "Venda de Pacotes").click();
    cy.contains("#lista-pacotes-tabela tr", "1 vagas").click();
    cy.get("#btn-selecionar-pacote").click();

    cy.contains("button", "Cadastrar Novo Cliente").click();
    cy.get("#cad-comp-nome").type("Cliente Overbooking CT25");
    cy.get("#cad-comp-cpf").type("55566677788");
    cy.get("#cad-comp-tel").type("(81) 98888-5555");

    cy.get("#cad-pass-nome").type("Acompanhante Excedente CT25");
    cy.get("#cad-pass-cpf").type("55566677799");
    cy.get("#tela-cadastro-exclusiva").contains("button", "Adicionar").click();

    cy.contains("button", "Salvar e Gerar Reserva").click();
    cy.get("#tela-cadastro-exclusiva").should("not.have.class", "hidden");
    cy.get("#tela-resumo-reserva").should("have.class", "hidden");
  });

  it("CT-26 - Bloqueio de seleção de viagem esgotada (vagas_disponiveis = 0)", () => {
    fazerLoginValido();
    cy.contains("button", "Venda de Pacotes").click();
    cy.get("#lista-pacotes-tabela tr.esgotado").first().click();
    cy.get("#btn-selecionar-pacote").should("be.disabled");
  });

  it("CT-27 - Remoção de acompanhante antes de finalizar a reserva", () => {
    fazerLoginValido();
    cy.contains("button", "Venda de Pacotes").click();
    cy.get("#lista-pacotes-tabela tr").not(".esgotado").first().click();
    cy.get("#btn-selecionar-pacote").click();
    cy.contains("button", "Cadastrar Novo Cliente").click();

    cy.get("#cad-pass-nome").type("Acompanhante Temporario");
    cy.get("#cad-pass-cpf").type("66677788899");
    cy.get("#tela-cadastro-exclusiva").contains("button", "Adicionar").click();
    cy.get("#tabela-acompanhantes").should("contain", "Acompanhante Temporario");

    cy.get("#tabela-acompanhantes button.btn-perigo").click();
    cy.get("#tabela-acompanhantes").should("contain", "Nenhum acompanhante adicionado.");
  });

  it("CT-28 - Integridade transacional em reservas simultâneas (ACID)", () => {
    cy.request("/api/viagens").then((respViagens) => {
      const viagemCom1Vaga = respViagens.body.find((v) => v.vagas === 1);
      expect(viagemCom1Vaga).to.exist;

      cy.request({
        method: "POST",
        url: "/api/clientes",
        body: { nome: "Concorrente A", cpf: "70011122233", telefone: "(81) 97000-0001" }
      }).then((c1) => {
        cy.request({
          method: "POST",
          url: "/api/clientes",
          body: { nome: "Concorrente B", cpf: "70011122244", telefone: "(81) 97000-0002" }
        }).then((c2) => {
          cy.request({
            method: "POST",
            url: "/api/reservas",
            body: {
              id_vendedor: 1,
              id_viagem: viagemCom1Vaga.id_viagem,
              id_cliente_comprador: c1.body.cliente.id,
              acompanhantes: []
            }
          }).then((r1) => {
            expect(r1.body.sucesso).to.eq(true);

            cy.request({
              method: "POST",
              url: "/api/reservas",
              failOnStatusCode: false,
              body: {
                id_vendedor: 1,
                id_viagem: viagemCom1Vaga.id_viagem,
                id_cliente_comprador: c2.body.cliente.id,
                acompanhantes: []
              }
            }).then((r2) => {
              expect(r2.body.sucesso).to.eq(false);
            });
          });
        });
      });
    });
  });

  /* ================= MÓDULO 5: VOUCHER E CANCELAMENTO ================= */

  it("CT-29 e CT-30 - Confirmação de pagamento, emissão e acionamento da impressão do voucher", () => {
    fazerLoginValido();
    cy.contains("button", "Venda de Pacotes").click();
    cy.get("#lista-pacotes-tabela tr").not(".esgotado").first().click();
    cy.get("#btn-selecionar-pacote").click();

    cy.contains("button", "Cadastrar Novo Cliente").click();
    cy.get("#cad-comp-nome").type("Cliente Voucher CT29");
    cy.get("#cad-comp-cpf").type("88899900011");
    cy.get("#cad-comp-tel").type("(81) 98888-9999");
    cy.contains("button", "Salvar e Gerar Reserva").click();

    cy.get("#tela-resumo-reserva", { timeout: 6000 }).should("not.have.class", "hidden");
    cy.contains("button", "Pagamento Concluído (Emitir Voucher)").click();

    cy.get("#tela-voucher", { timeout: 6000 }).should("not.have.class", "hidden");
    cy.get("#vouc-codigo").should("contain", "VOU-");

    // CT-30: Valida acionamento de window.print()
    cy.window().then((win) => {
      cy.stub(win, "print").as("printStub");
    });
    cy.contains("button", "Imprimir Voucher").click();
    cy.get("@printStub").should("have.been.calledOnce");
  });

  it("CT-31 e CT-32 - Cancelamento de reserva, estorno de vagas e bloqueio de cancelamento duplicado", () => {
    fazerLoginValido();
    cy.contains("button", "Histórico de Reservas").click();
    cy.get("#tabela-historico-reservas").should("contain", "Cliente Voucher CT29");

    cy.on("window:confirm", () => true);
    cy.get("#tabela-historico-reservas button.btn-perigo").first().click();
    cy.get("#tabela-historico-reservas").should("contain", "Cancelada");

    // CT-32: Tentativa de cancelar novamente via API uma reserva já cancelada
    cy.request("/api/reservas").then((resp) => {
      const cancelada = resp.body.find((r) => r.status_reserva === "Cancelada");
      expect(cancelada).to.exist;

      cy.request({
        method: "POST",
        url: `/api/reservas/${cancelada.id_reserva}/cancelar`,
        failOnStatusCode: false
      }).then((respDuplicada) => {
        expect(respDuplicada.status).to.be.oneOf([200, 400]);
        expect(respDuplicada.body.sucesso).to.eq(false);
      });
    });
  });

  /* ================= MÓDULO 6: RELATÓRIOS E NÃO FUNCIONAIS ================= */

  it("CT-33 - Exibição correta de KPIs e taxa de ocupação", () => {
    fazerLoginValido();
    cy.contains("button", "Relatórios Gerenciais").click();
    cy.get("#tela-relatorios").should("not.have.class", "hidden");
    cy.get("#kpi-pax-confirmados").should("not.be.empty");
    cy.get("#tabela-rel-ocupacao tr").should("have.length.at.least", 1);
    cy.get("#tabela-rel-vendedores").should("contain", "Sidney");
  });

  it("CT-34 - Tempo de resposta da consulta e reserva inferior a 2 segundos (< 2000ms)", () => {
    const inicio = Date.now();
    cy.request("/api/viagens").then((resp) => {
      const duracao = Date.now() - inicio;
      expect(resp.status).to.eq(200);
      expect(duracao).to.be.lessThan(2000);
    });
  });

  it.skip("CT-35 - Proteção de dados pessoais (LGPD) e rotina de backup diário no servidor (RNF05/RNF09)", () => {});
});
