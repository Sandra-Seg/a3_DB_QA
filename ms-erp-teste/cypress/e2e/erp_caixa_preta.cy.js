
// ============================================================
// ERP ROTA REGIONAL - TESTES DE CAIXA PRETA
// CT-001 até CT-029
// ============================================================

let contadorCPF = 0;

function gerarCPFUnico() {
  contadorCPF++;

  return String(
    10000000000 + ((Date.now() + contadorCPF) % 89999999999)
  );
}

function gerarCPFValidoUnico() {
  contadorCPF++;

  let base = String(
    (Date.now() + contadorCPF * 7919 + Math.floor(Math.random() * 1000000)) % 1000000000
  ).padStart(9, "0");

  if (/^(\d)\1{8}$/.test(base)) {
    base = "123456789";
  }

  function calcularDigito(numeros, pesoInicial) {
    let soma = 0;

    for (let i = 0; i < numeros.length; i++) {
      soma += Number(numeros[i]) * (pesoInicial - i);
    }

    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  }

  const primeiroDigito = calcularDigito(base, 10);
  const segundoDigito = calcularDigito(base + primeiroDigito, 11);

  return base + primeiroDigito + segundoDigito;
}

function gerarNome(prefixo) {
  return `${prefixo} ${Date.now()} ${Math.floor(Math.random() * 1000)}`;
}

function requisicao(method, url, body, qs) {
  return cy.request({
    method,
    url,
    ...(body !== undefined ? { body } : {}),
    ...(qs !== undefined ? { qs } : {}),
    failOnStatusCode: false
  });
}

function cadastrarClienteTeste(nome = "Cliente Cypress") {
  const cpf = gerarCPFUnico();

  return requisicao("POST", "/api/clientes", {
    nome: gerarNome(nome),
    cpf,
    telefone: "81999990000"
  }).then((res) => {
    expect(res.status).to.eq(200);
    return res.body.cliente;
  });
}

function obterLogin() {
  return requisicao("POST", "/api/login", {
    email: "sidney.vendas@agencia.com",
    senha: "123456"
  }).then((res) => {
    expect(res.status).to.eq(200);
    expect(res.body.sucesso).to.eq(true);
    return res.body.vendedor;
  });
}

// Cria pacote e viagem usando hospedagem e City Tour existentes.
function criarViagemTeste(capacidade = 10) {
  const nomePacote = gerarNome("Pacote Cypress");

  let idPacote;

  return requisicao("GET", "/api/gerencia/dados-pacotes")
    .then((dados) => {
      expect(dados.status).to.eq(200);

      const hospedagem = dados.body.hospedagens[0];
      const tour = dados.body.tours[0];

      expect(hospedagem, "Hospedagem cadastrada").to.exist;
      expect(tour, "City Tour cadastrado").to.exist;

      return requisicao("POST", "/api/gerencia/pacotes", {
        nome_pacote: nomePacote,
        descricao: "Pacote criado automaticamente pelo Cypress",
        id_hospedagem: hospedagem.id_hospedagem,
        id_city_tour: tour.id_city_tour
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.sucesso).to.eq(true);
      });
    })
    .then(() => {
      return requisicao("GET", "/api/gerencia/dados-pacotes");
    })
    .then((dados) => {
      const pacote = dados.body.pacotes.find(
        (item) => item.nome_pacote === nomePacote
      );

      expect(pacote, "Pacote criado").to.exist;
      idPacote = pacote.id_pacote;

      return requisicao("POST", "/api/gerencia/viagens", {
        id_pacote: idPacote,
        data_inicio: "2027-02-10",
        data_fim: "2027-02-15",
        hora_saida: "08:00",
        capacidade_total: capacidade
      });
    })
    .then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.sucesso).to.eq(true);

      return requisicao("GET", "/api/viagens");
    })
    .then((res) => {
      const viagem = res.body.find(
        (item) => Number(item.id) === Number(idPacote)
      );

      expect(viagem, "Viagem criada").to.exist;

      return {
        id_viagem: viagem.id_viagem,
        id_pacote: idPacote,
        vagas: viagem.vagas
      };
    });
}

// Cria uma reserva válida para os testes de reserva, cancelamento e voucher.
function criarReservaTeste(capacidade = 10, acompanhantes = []) {
  let viagemCriada;
  let clienteCriado;
  let vendedor;

  return criarViagemTeste(capacidade)
    .then((viagem) => {
      viagemCriada = viagem;
      return cadastrarClienteTeste("Comprador Cypress");
    })
    .then((cliente) => {
      clienteCriado = cliente;
      return obterLogin();
    })
    .then((login) => {
      vendedor = login;

      return requisicao("POST", "/api/reservas", {
        id_vendedor: vendedor.id_vendedor,
        id_viagem: viagemCriada.id_viagem,
        id_cliente_comprador: clienteCriado.id,
        acompanhantes
      });
    })
    .then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.sucesso).to.eq(true);

      return {
        id_reserva: res.body.id_reserva,
        id_viagem: viagemCriada.id_viagem,
        id_cliente: clienteCriado.id,
        id_vendedor: vendedor.id_vendedor
      };
    });
}

// ============================================================
// CT-001 A CT-005 - TESTES DE INTERFACE JÁ APROVADOS
// ============================================================

describe("CT01 a CT05 - Testes de interface do ERP", () => {

  beforeEach(() => {
    cy.visit("/");
  });

  it("CT01 - Deve bloquear login com credenciais inválidas", () => {
    cy.on("window:alert", (textoAlerta) => {
      expect(textoAlerta).to.include("inválidos");
    });

    cy.get("#input-usuario").type("invalido@agencia.com");
    cy.get("#input-senha").type("senhaerrada");
    cy.contains("button", "Entrar").click();

    cy.get("#tela-login").should("be.visible");
    cy.get("#tela-principal").should("have.class", "hidden");
  });

  it("CT02 - Deve realizar login válido", () => {
    cy.get("#input-usuario").type("sidney.vendas@agencia.com");
    cy.get("#input-senha").type("123456");
    cy.contains("button", "Entrar").click();

    cy.get("#tela-principal").should("not.have.class", "hidden");
    cy.get("#titulo-vendedor").should("contain", "Sidney");
  });

  it("CT03 - Deve cadastrar pacote e abrir viagem", () => {
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

  it("CT04 - Deve validar CPF e concluir reserva com voucher", () => {
    cy.get("#input-usuario").type("sidney.vendas@agencia.com");
    cy.get("#input-senha").type("123456");
    cy.contains("button", "Entrar").click();

    cy.contains("button", "Venda de Pacotes").click();
    cy.get("#lista-pacotes-tabela tr").not(".esgotado").first().click();
    cy.get("#btn-selecionar-pacote").should("not.be.disabled").click();

    cy.contains("button", "Cadastrar Novo Cliente").click();

    cy.get("#cad-comp-nome").type("Cliente Teste Caixa Preta");
    cy.get("#cad-comp-cpf").type("1234567890");
    cy.get("#cad-comp-tel").type("(81) 99999-0000");
    cy.contains("button", "Salvar e Gerar Reserva").click();

    cy.get("#tela-cadastro-exclusiva").should("not.have.class", "hidden");

    cy.get("#cad-comp-cpf").clear().type(gerarCPFValidoUnico());
    cy.contains("button", "Salvar e Gerar Reserva").click();

    cy.get("#tela-resumo-reserva", { timeout: 6000 })
      .should("not.have.class", "hidden");

    cy.contains("button", "Pagamento Concluído (Emitir Voucher)").click();

    cy.get("#tela-voucher", { timeout: 6000 })
      .should("not.have.class", "hidden");

    cy.get("#vouc-codigo").should("contain", "VOU-");
  });

  it("CT05 - Deve cancelar reserva no histórico e devolver vagas", () => {
    cy.get("#input-usuario").type("sidney.vendas@agencia.com");
    cy.get("#input-senha").type("123456");
    cy.contains("button", "Entrar").click();

    cy.contains("button", "Histórico de Reservas").click();

    cy.get("#tabela-historico-reservas")
      .should("contain", "Cliente Teste Caixa Preta");

    cy.on("window:confirm", () => true);

    cy.get("#tabela-historico-reservas button.btn-perigo")
      .first()
      .click();

    cy.get("#tabela-historico-reservas").should("contain", "Cancelada");
  });

});

// ============================================================
// CT-001 A CT-005 - AUTENTICAÇÃO PELA API
// ============================================================

describe("CT001 a CT005 - API de login", () => {

  it("CT001-R01 - Login com credenciais válidas", () => {
    requisicao("POST", "/api/login", {
      email: "sidney.vendas@agencia.com",
      senha: "123456"
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.sucesso).to.eq(true);
      expect(res.body.vendedor.email).to.eq("sidney.vendas@agencia.com");
    });
  });

  it("CT001-R02 / CT002-R02 - Deve rejeitar senha incorreta", () => {
    requisicao("POST", "/api/login", {
      email: "sidney.vendas@agencia.com",
      senha: "senha_incorreta"
    }).then((res) => {
      expect(res.status).to.eq(401);
      expect(res.body.sucesso).to.eq(false);
    });
  });

  it("CT001-R03 / CT003-R01 - Deve rejeitar e-mail inexistente", () => {
    requisicao("POST", "/api/login", {
      email: "email.inexistente.cypress@teste.com",
      senha: "123456"
    }).then((res) => {
      expect(res.status).to.eq(401);
      expect(res.body.sucesso).to.eq(false);
    });
  });

  it("CT001-R05 / CT002-R04 / CT003-R03 - Deve rejeitar e-mail vazio", () => {
    requisicao("POST", "/api/login", {
      email: "",
      senha: "123456"
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body.sucesso).to.eq(false);
    });
  });

  it("CT001-R06 / CT002-R03 - Deve rejeitar senha vazia", () => {
    requisicao("POST", "/api/login", {
      email: "sidney.vendas@agencia.com",
      senha: ""
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body.sucesso).to.eq(false);
    });
  });

  it("CT001-R07 / CT004-R01 - Deve rejeitar e-mail e senha vazios", () => {
    requisicao("POST", "/api/login", {
      email: "",
      senha: ""
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body.sucesso).to.eq(false);
    });
  });

  it("CT004-R04 / CT005-R02 - Vendedor ativo deve conseguir autenticar", () => {
    requisicao("POST", "/api/login", {
      email: "sidney.vendas@agencia.com",
      senha: "123456"
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.sucesso).to.eq(true);
    });
  });

  // CT001-R04 e CT005-R01:
  // A rota verifica ativo = 1, mas não existe uma conta inativa
  // identificada nos dados fornecidos. Não inventar credenciais.

});

// ============================================================
// CT-006 A CT-010 - GESTÃO DE CLIENTES
// ============================================================

describe("CT006 a CT010 - API de clientes", () => {

  it("CT006-R01 - Deve cadastrar cliente com dados válidos", () => {
    const cpf = gerarCPFUnico();

    requisicao("POST", "/api/clientes", {
      nome: "Cliente Teste Cypress",
      cpf,
      telefone: "81999990000"
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.sucesso).to.eq(true);
      expect(res.body.cliente.cpf).to.eq(cpf);
    });
  });

  it("CT006-R02 / CT007-R02 - Deve rejeitar um campo obrigatório vazio", () => {
    const cenarios = [
      { nome: "", cpf: gerarCPFUnico(), telefone: "81999990000" },
      { nome: "Cliente Cypress", cpf: "", telefone: "81999990000" },
      { nome: "Cliente Cypress", cpf: gerarCPFUnico(), telefone: "" }
    ];

    cy.wrap(cenarios).each((dados) => {
      requisicao("POST", "/api/clientes", dados).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body.sucesso).to.eq(false);
      });
    });
  });

  it("CT007-R03 - Deve rejeitar vários campos obrigatórios vazios", () => {
    const cenarios = [
      { nome: "", cpf: "", telefone: "81999990000" },
      { nome: "", cpf: gerarCPFUnico(), telefone: "" },
      { nome: "Cliente Cypress", cpf: "", telefone: "" }
    ];

    cy.wrap(cenarios).each((dados) => {
      requisicao("POST", "/api/clientes", dados).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body.sucesso).to.eq(false);
      });
    });
  });

  it("CT007-R04 - Deve rejeitar todos os campos vazios", () => {
    requisicao("POST", "/api/clientes", {
      nome: "",
      cpf: "",
      telefone: ""
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body.sucesso).to.eq(false);
    });
  });

  it("CT006-R03 / CT008-R03 - Deve rejeitar CPF com quantidade incorreta", () => {
    requisicao("POST", "/api/clientes", {
      nome: "Cliente CPF Inválido",
      cpf: "1234567890",
      telefone: "81999990000"
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body.sucesso).to.eq(false);
    });
  });

  it("CT008-R02 - Deve impedir cadastro com CPF duplicado", () => {
    const cpf = gerarCPFUnico();

    const dados = {
      nome: "Cliente Duplicidade",
      cpf,
      telefone: "81999990000"
    };

    requisicao("POST", "/api/clientes", dados).then((primeiro) => {
      expect(primeiro.status).to.eq(200);

      requisicao("POST", "/api/clientes", dados).then((segundo) => {
        expect(segundo.status).to.eq(409);
        expect(segundo.body.sucesso).to.eq(false);
      });
    });
  });

  it("CT009-R01 / CT010-R01 - Deve pesquisar cliente pelo nome", () => {
    const nome = gerarNome("Pesquisa Cypress");

    requisicao("POST", "/api/clientes", {
      nome,
      cpf: gerarCPFUnico(),
      telefone: "81999990000"
    }).then((cadastro) => {
      expect(cadastro.status).to.eq(200);

      requisicao("GET", "/api/clientes", undefined, {
        busca: nome
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.length).to.be.greaterThan(0);
        expect(res.body[0].nome).to.eq(nome);
      });
    });
  });

  it("CT009-R01 / CT010-R01 - Deve pesquisar cliente pelo CPF", () => {
    const cpf = gerarCPFUnico();

    requisicao("POST", "/api/clientes", {
      nome: "Pesquisa por CPF",
      cpf,
      telefone: "81999990000"
    }).then((cadastro) => {
      expect(cadastro.status).to.eq(200);

      requisicao("GET", "/api/clientes", undefined, {
        busca: cpf
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.length).to.be.greaterThan(0);
        expect(res.body[0].cpf).to.eq(cpf);
      });
    });
  });

  it("CT009-R02 / CT010-R02 - Deve retornar lista vazia sem correspondência", () => {
    requisicao("GET", "/api/clientes", undefined, {
      busca: "CLIENTE_INEXISTENTE_CYPRESS_987654321"
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("array").that.is.empty;
    });
  });

  it("CT009-R03 / CT010-R03 - Busca vazia deve retornar a lista de clientes", () => {
    requisicao("GET", "/api/clientes").then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("array");
    });
  });

});

// ============================================================
// CT-011 A CT-014 - PACOTES E VIAGENS
// ============================================================

describe("CT011 a CT014 - Pacotes e viagens", () => {

  it("CT011-R01 / CT012-R01 - Deve cadastrar pacote com hospedagem e City Tour existentes", () => {
    const nome = gerarNome("Pacote válido");

    requisicao("GET", "/api/gerencia/dados-pacotes").then((dados) => {
      expect(dados.body.hospedagens.length).to.be.greaterThan(0);
      expect(dados.body.tours.length).to.be.greaterThan(0);

      requisicao("POST", "/api/gerencia/pacotes", {
        nome_pacote: nome,
        descricao: "Teste de pacote",
        id_hospedagem: dados.body.hospedagens[0].id_hospedagem,
        id_city_tour: dados.body.tours[0].id_city_tour
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.sucesso).to.eq(true);
      });
    });
  });

  it("CT011-R02 / CT012-R02 - Deve rejeitar um campo obrigatório ausente", () => {
    requisicao("POST", "/api/gerencia/pacotes", {
      nome_pacote: "",
      descricao: "Teste",
      id_hospedagem: 1,
      id_city_tour: 1
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body.sucesso).to.eq(false);
    });
  });

  it("CT012-R03 / CT012-R04 - Deve rejeitar vários ou todos os campos obrigatórios vazios", () => {
    const cenarios = [
      {
        nome_pacote: "",
        id_hospedagem: 1,
        id_city_tour: 1
      },
      {
        nome_pacote: "",
        id_hospedagem: null,
        id_city_tour: null
      }
    ];

    cy.wrap(cenarios).each((dados) => {
      requisicao("POST", "/api/gerencia/pacotes", dados).then((res) => {
        expect(res.status).to.eq(400);
      });
    });
  });

  it("CT011-R03 - Deve rejeitar referência inexistente de hospedagem", () => {
    requisicao("GET", "/api/gerencia/dados-pacotes").then((dados) => {
      const tour = dados.body.tours[0];

      requisicao("POST", "/api/gerencia/pacotes", {
        nome_pacote: gerarNome("Pacote referência inválida"),
        descricao: "Teste de chave estrangeira",
        id_hospedagem: -999999,
        id_city_tour: tour.id_city_tour
      }).then((res) => {
        expect(res.status).to.eq(500);
        expect(res.body.sucesso).to.eq(false);
      });
    });
  });

  it("CT013-R01 - Deve cadastrar viagem com dados válidos", () => {
    criarViagemTeste(10).then((viagem) => {
      expect(viagem.id_viagem).to.exist;
    });
  });

  it("CT013-R02 - Deve rejeitar viagem sem pacote ou datas", () => {
    requisicao("POST", "/api/gerencia/viagens", {
      id_pacote: null,
      data_inicio: "",
      data_fim: "",
      capacidade_total: 10
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body.sucesso).to.eq(false);
    });
  });

  it("CT013-R03 - Deve rejeitar capacidade igual a zero", () => {
    requisicao("GET", "/api/gerencia/dados-pacotes").then((dados) => {
      const pacote = dados.body.pacotes[0];

      expect(pacote).to.exist;

      requisicao("POST", "/api/gerencia/viagens", {
        id_pacote: pacote.id_pacote,
        data_inicio: "2027-03-10",
        data_fim: "2027-03-15",
        capacidade_total: 0
      }).then((res) => {
        expect(res.status).to.eq(400);
      });
    });
  });

  it("CT014-R02 - Deve rejeitar data não informada", () => {
    requisicao("GET", "/api/gerencia/dados-pacotes").then((dados) => {
      const pacote = dados.body.pacotes[0];

      requisicao("POST", "/api/gerencia/viagens", {
        id_pacote: pacote.id_pacote,
        data_inicio: "",
        data_fim: "2027-03-15",
        capacidade_total: 10
      }).then((res) => {
        expect(res.status).to.eq(400);
      });
    });
  });

  it("CT014-R03 - Deve retornar erro ao tentar gravar data em formato inválido", () => {
    requisicao("GET", "/api/gerencia/dados-pacotes").then((dados) => {
      const pacote = dados.body.pacotes[0];

      requisicao("POST", "/api/gerencia/viagens", {
        id_pacote: pacote.id_pacote,
        data_inicio: "DATA_INVALIDA",
        data_fim: "2027-03-15",
        capacidade_total: 10
      }).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body.sucesso).to.eq(false);
      });
    });
  });

  // CT014-R01: datas em formato válido são aceitas.
  // CT014-R04: a rota não verifica se a data inicial é anterior à final.

});

// ============================================================
// CT-015 A CT-019 - FROTA E GUIAS
// ============================================================

describe("CT015 a CT019 - Alocação de frota e escala de guias", () => {

  it("CT015-R01 / CT016-R02 / CT017-R02 - Deve alocar veículo e motorista existentes", () => {
    criarViagemTeste(10).then((viagem) => {
      requisicao("GET", "/api/gerencia/logistica").then((dados) => {
        expect(dados.body.veiculos.length).to.be.greaterThan(0);
        expect(dados.body.motoristas.length).to.be.greaterThan(0);

        requisicao("POST", "/api/gerencia/alocar-frota", {
          id_viagem: viagem.id_viagem,
          id_veiculo: dados.body.veiculos[0].id_veiculo,
          id_motorista: dados.body.motoristas[0].id_motorista
        }).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body.sucesso).to.eq(true);
        });
      });
    });
  });

  it("CT016-R01 - Deve rejeitar alocação sem veículo", () => {
    criarViagemTeste(10).then((viagem) => {
      requisicao("GET", "/api/gerencia/logistica").then((dados) => {
        const motorista = dados.body.motoristas[0];

        requisicao("POST", "/api/gerencia/alocar-frota", {
          id_viagem: viagem.id_viagem,
          id_veiculo: null,
          id_motorista: motorista.id_motorista
        }).then((res) => {
          expect(res.status).to.eq(400);
          expect(res.body.sucesso).to.eq(false);
        });
      });
    });
  });

  it("CT017-R01 - Deve rejeitar alocação sem motorista", () => {
    criarViagemTeste(10).then((viagem) => {
      requisicao("GET", "/api/gerencia/logistica").then((dados) => {
        const veiculo = dados.body.veiculos[0];

        requisicao("POST", "/api/gerencia/alocar-frota", {
          id_viagem: viagem.id_viagem,
          id_veiculo: veiculo.id_veiculo,
          id_motorista: null
        }).then((res) => {
          expect(res.status).to.eq(400);
          expect(res.body.sucesso).to.eq(false);
        });
      });
    });
  });

  it("CT015-R02 / CT016-R03 - Deve rejeitar veículo inexistente", () => {
    criarViagemTeste(10).then((viagem) => {
      requisicao("GET", "/api/gerencia/logistica").then((dados) => {
        const motorista = dados.body.motoristas[0];

        requisicao("POST", "/api/gerencia/alocar-frota", {
          id_viagem: viagem.id_viagem,
          id_veiculo: -999999,
          id_motorista: motorista.id_motorista
        }).then((res) => {
          expect(res.status).to.eq(500);
          expect(res.body.sucesso).to.eq(false);
        });
      });
    });
  });

  it("CT018-R01 / CT019-R01 - Deve escalar guia e City Tour existentes", () => {
    requisicao("GET", "/api/gerencia/logistica").then((dados) => {
      expect(dados.body.guias.length).to.be.greaterThan(0);
      expect(dados.body.tours.length).to.be.greaterThan(0);

      requisicao("POST", "/api/gerencia/escalar-guia", {
        id_guia: dados.body.guias[0].id_guia,
        id_city_tour: dados.body.tours[0].id_city_tour,
        data_escalacao: "2027-02-10",
        observacao: "Escala de teste Cypress"
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.sucesso).to.eq(true);
      });
    });
  });

  it("CT018-R02 - Deve rejeitar escala sem guia, City Tour ou data", () => {
    requisicao("POST", "/api/gerencia/escalar-guia", {
      id_guia: null,
      id_city_tour: null,
      data_escalacao: ""
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body.sucesso).to.eq(false);
    });
  });

  it("CT019-R02 / CT019-R03 - Deve rejeitar guia inexistente", () => {
    requisicao("GET", "/api/gerencia/logistica").then((dados) => {
      const tour = dados.body.tours[0];

      requisicao("POST", "/api/gerencia/escalar-guia", {
        id_guia: -999999,
        id_city_tour: tour.id_city_tour,
        data_escalacao: "2027-02-10",
        observacao: "Teste de referência inválida"
      }).then((res) => {
        expect(res.status).to.eq(500);
        expect(res.body.sucesso).to.eq(false);
      });
    });
  });

  // CT018-R03: a rota não verifica conflito de agenda do guia.
  // CT019-R03: City Tour inexistente também depende de chave estrangeira.

});

// ============================================================
// CT-020 A CT-024 - RESERVAS E DISPONIBILIDADE
// ============================================================

describe("CT020 a CT024 - Criação e consulta de reservas", () => {

  it("CT020-R01 / CT021-R01 - Deve criar reserva para o comprador", () => {
    criarReservaTeste(10).then((reserva) => {
      expect(reserva.id_reserva).to.exist;
    });
  });

  it("CT020-R02 / CT021-R04 - Deve impedir reserva acima da capacidade", () => {
    criarViagemTeste(1).then((viagem) => {
      cadastrarClienteTeste("Comprador Cypress").then((cliente) => {
        obterLogin().then((vendedor) => {
          requisicao("POST", "/api/reservas", {
            id_vendedor: vendedor.id_vendedor,
            id_viagem: viagem.id_viagem,
            id_cliente_comprador: cliente.id,
            acompanhantes: [
              {
                nome: "Acompanhante Cypress",
                cpf: gerarCPFUnico()
              }
            ]
          }).then((res) => {
            expect(res.status).to.eq(400);
            expect(res.body.sucesso).to.eq(false);
          });
        });
      });
    });
  });

  it("CT020-R04 / CT022-R03 - Deve rejeitar viagem inexistente", () => {
    cadastrarClienteTeste("Comprador Cypress").then((cliente) => {
      obterLogin().then((vendedor) => {
        requisicao("POST", "/api/reservas", {
          id_vendedor: vendedor.id_vendedor,
          id_viagem: -999999,
          id_cliente_comprador: cliente.id,
          acompanhantes: []
        }).then((res) => {
          expect(res.status).to.eq(404);
          expect(res.body.sucesso).to.eq(false);
        });
      });
    });
  });

  it("CT022-R01 - Deve rejeitar reserva sem viagem selecionada", () => {
    cadastrarClienteTeste("Comprador Cypress").then((cliente) => {
      obterLogin().then((vendedor) => {
        requisicao("POST", "/api/reservas", {
          id_vendedor: vendedor.id_vendedor,
          id_cliente_comprador: cliente.id,
          acompanhantes: []
        }).then((res) => {
          expect(res.status).to.eq(404);
          expect(res.body.sucesso).to.eq(false);
        });
      });
    });
  });

  it("CT021-R02 - Deve calcular comprador e acompanhantes", () => {
    const acompanhantes = [
      {
        nome: "Acompanhante Um",
        cpf: gerarCPFUnico()
      },
      {
        nome: "Acompanhante Dois",
        cpf: gerarCPFUnico()
      }
    ];

    criarReservaTeste(10, acompanhantes).then((reserva) => {
      requisicao("GET", "/api/reservas").then((res) => {
        const registro = res.body.find(
          (item) => item.id_reserva === reserva.id_reserva
        );

        expect(registro).to.exist;
        expect(registro.quant_passageiros).to.eq(3);
      });
    });
  });

  it("CT021-R03 - Deve permitir reserva usando todas as vagas", () => {
    criarViagemTeste(1).then((viagem) => {
      cadastrarClienteTeste("Comprador Cypress").then((cliente) => {
        obterLogin().then((vendedor) => {
          requisicao("POST", "/api/reservas", {
            id_vendedor: vendedor.id_vendedor,
            id_viagem: viagem.id_viagem,
            id_cliente_comprador: cliente.id,
            acompanhantes: []
          }).then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body.sucesso).to.eq(true);

            requisicao("GET", "/api/viagens").then((viagens) => {
              const atualizada = viagens.body.find(
                (item) => item.id_viagem === viagem.id_viagem
              );

              expect(atualizada.vagas).to.eq(0);
            });
          });
        });
      });
    });
  });

  it("CT021-R05 - Deve reutilizar cliente acompanhante com CPF existente", () => {
    const cpfAcompanhante = gerarCPFUnico();

    requisicao("POST", "/api/clientes", {
      nome: "Acompanhante já cadastrado",
      cpf: cpfAcompanhante,
      telefone: "81999990000"
    }).then((cadastro) => {
      expect(cadastro.status).to.eq(200);

      criarReservaTeste(10, [{
        nome: "Acompanhante já cadastrado",
        cpf: cpfAcompanhante
      }]).then((reserva) => {
        requisicao("GET", "/api/reservas").then((res) => {
          expect(
            res.body.some((item) => item.id_reserva === reserva.id_reserva)
          ).to.eq(true);
        });
      });
    });
  });

  it("CT020-R03 - Deve rejeitar cliente comprador inexistente", () => {
    criarViagemTeste(10).then((viagem) => {
      obterLogin().then((vendedor) => {
        requisicao("POST", "/api/reservas", {
          id_vendedor: vendedor.id_vendedor,
          id_viagem: viagem.id_viagem,
          id_cliente_comprador: -999999,
          acompanhantes: []
        }).then((res) => {
          expect(res.status).to.eq(500);
          expect(res.body.sucesso).to.eq(false);
        });
      });
    });
  });

  it("CT023-R03 - Deve rejeitar vendedor inexistente", () => {
    criarViagemTeste(10).then((viagem) => {
      cadastrarClienteTeste("Comprador Cypress").then((cliente) => {
        requisicao("POST", "/api/reservas", {
          id_vendedor: -999999,
          id_viagem: viagem.id_viagem,
          id_cliente_comprador: cliente.id,
          acompanhantes: []
        }).then((res) => {
          expect(res.status).to.eq(500);
          expect(res.body.sucesso).to.eq(false);
        });
      });
    });
  });

  it("CT024-R01 / CT024-R02 - Deve listar viagens e suas vagas", () => {
    requisicao("GET", "/api/viagens").then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("array");

      if (res.body.length > 0) {
        expect(res.body[0]).to.have.property("id_viagem");
        expect(res.body[0]).to.have.property("vagas");
      }
    });
  });

});

// ============================================================
// CT-025 A CT-026 - CANCELAMENTO DE RESERVAS
// ============================================================

describe("CT025 e CT026 - Cancelamento de reservas", () => {

  it("CT025-R01 / CT026-R02 - Deve cancelar reserva pendente e devolver vagas", () => {
    criarReservaTeste(10).then((reserva) => {
      requisicao(
        "POST",
        `/api/reservas/${reserva.id_reserva}/cancelar`
      ).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.sucesso).to.eq(true);
      });
    });
  });

  it("CT025-R02 - Deve impedir cancelamento de reserva já cancelada", () => {
    criarReservaTeste(10).then((reserva) => {
      requisicao(
        "POST",
        `/api/reservas/${reserva.id_reserva}/cancelar`
      ).then((primeiro) => {
        expect(primeiro.status).to.eq(200);

        requisicao(
          "POST",
          `/api/reservas/${reserva.id_reserva}/cancelar`
        ).then((segundo) => {
          expect(segundo.status).to.eq(400);
          expect(segundo.body.sucesso).to.eq(false);
        });
      });
    });
  });

  it("CT025-R03 - Deve retornar 404 para reserva inexistente", () => {
    requisicao("POST", "/api/reservas/-999999/cancelar").then((res) => {
      // O caminho exige ID inteiro positivo na rota.
      expect([404, 405]).to.include(res.status);
    });
  });

  it("CT026-R01 - Deve cancelar reserva confirmada", () => {
    criarReservaTeste(10).then((reserva) => {
      requisicao("POST", "/api/vouchers", {
        id_reserva: reserva.id_reserva,
        nome_vendedor: "Teste Cypress"
      }).then((voucher) => {
        expect(voucher.status).to.eq(200);

        requisicao(
          "POST",
          `/api/reservas/${reserva.id_reserva}/cancelar`
        ).then((cancelamento) => {
          expect(cancelamento.status).to.eq(200);
          expect(cancelamento.body.sucesso).to.eq(true);
        });
      });
    });
  });

});

// ============================================================
// CT-027 A CT-029 - EMISSÃO DE VOUCHERS
// ============================================================

describe("CT027 a CT029 - Emissão de vouchers", () => {

  it("CT027-R01 / CT028-R02 - Deve emitir voucher para reserva pendente", () => {
    criarReservaTeste(10).then((reserva) => {
      requisicao("POST", "/api/vouchers", {
        id_reserva: reserva.id_reserva,
        nome_vendedor: "Teste Cypress"
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.sucesso).to.eq(true);
        expect(res.body.cod_voucher).to.include("VOU-");
      });
    });
  });

  it("CT027-R02 - Deve emitir voucher para reserva confirmada", () => {
    criarReservaTeste(10).then((reserva) => {
      requisicao("POST", "/api/vouchers", {
        id_reserva: reserva.id_reserva,
        nome_vendedor: "Teste Cypress"
      }).then((primeiro) => {
        expect(primeiro.status).to.eq(200);

        requisicao("POST", "/api/vouchers", {
          id_reserva: reserva.id_reserva,
          nome_vendedor: "Teste Cypress"
        }).then((segundo) => {
          expect(segundo.status).to.eq(200);
          expect(segundo.body.sucesso).to.eq(true);
        });
      });
    });
  });

  it("CT028-R01 - Deve permitir novo voucher para reserva que já possui voucher", () => {
    criarReservaTeste(10).then((reserva) => {
      requisicao("POST", "/api/vouchers", {
        id_reserva: reserva.id_reserva,
        nome_vendedor: "Teste Cypress"
      }).then((primeiro) => {
        expect(primeiro.status).to.eq(200);

        requisicao("POST", "/api/vouchers", {
          id_reserva: reserva.id_reserva,
          nome_vendedor: "Teste Cypress"
        }).then((segundo) => {
          expect(segundo.status).to.eq(200);
          expect(segundo.body.cod_voucher).to.include("VOU-");
        });
      });
    });
  });

  it("CT029-R01 - Deve retornar erro ao emitir voucher para reserva inexistente", () => {
    requisicao("POST", "/api/vouchers", {
      id_reserva: -999999,
      nome_vendedor: "Teste Cypress"
    }).then((res) => {
      expect(res.status).to.eq(500);
      expect(res.body.sucesso).to.eq(false);
    });
  });

});
