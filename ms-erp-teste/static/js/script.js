let vendedorAtual = null;
let listaViagensDisponiveis = [];
let pacoteSelecionado = null;
let listaClientesCache = [];
let clienteSelecionadoObjeto = null;
let listaAcompanhantes = [];
let idReservaAtual = null;
let codigoReservaAtual = "";

/* ================= LOGIN REAL NO BANCO ================= */
async function realizarLogin() {
  const inputEmail = document.getElementById('input-usuario').value.trim();
  const inputSenha = document.getElementById('input-senha').value.trim();

  if (!inputEmail || !inputSenha) {
    alert("Por favor, informe o e-mail e a senha do vendedor.");
    return;
  }

  try {
    const resposta = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inputEmail, senha: inputSenha })
    });

    const dados = await resposta.json();

    if (dados.sucesso) {
      vendedorAtual = dados.vendedor;
      trocarTela('tela-login', 'tela-principal');
      document.getElementById('titulo-vendedor').innerText = vendedorAtual.nome;
      document.getElementById('status-bar').innerText = `Conectado: ${vendedorAtual.nome} (${vendedorAtual.email})`;
    } else {
      alert(dados.mensagem);
    }
  } catch (erro) {
    alert("Erro ao conectar com o servidor: " + erro);
  }
}

function realizarLogout() {
  vendedorAtual = null;
  trocarTela('tela-principal', 'tela-login');
  document.getElementById('input-usuario').value = '';
  document.getElementById('input-senha').value = '';
  document.getElementById('status-bar').innerText = 'Aguardando autenticação';
}

async function trocarTela(idOrigem, idDestino) {
  document.getElementById(idOrigem).classList.add('hidden');
  document.getElementById(idDestino).classList.remove('hidden');

  if (idDestino === 'tela-consulta-exclusiva') {
    clienteSelecionadoObjeto = null;
    document.getElementById('input-busca-cliente').value = '';
    await carregarClientesDoBanco();
  }

  if (idDestino === 'tela-cadastro-exclusiva') {
    listaAcompanhantes = [];
    document.getElementById('cad-comp-nome').value = '';
    document.getElementById('cad-comp-cpf').value = '';
    document.getElementById('cad-comp-tel').value = '';
    renderizarAcompanhantes();
  }
}

/* ================= HISTÓRICO E CANCELAMENTO DE RESERVAS ================= */
async function abrirHistoricoReservas() {
  await trocarTela('tela-principal', 'tela-historico-reservas');
  await carregarHistoricoReservas();
}

async function carregarHistoricoReservas() {
  const tbody = document.getElementById('tabela-historico-reservas');
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Carregando reservas...</td></tr>`;

  try {
    const resposta = await fetch('/api/reservas');
    const reservas = await resposta.json();
    tbody.innerHTML = '';

    if (reservas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#777;">Nenhuma reserva registrada até o momento.</td></tr>`;
      return;
    }

    reservas.forEach(r => {
      const voucherTexto = r.cod_voucher ? r.cod_voucher : '-';
      const botaoCancelar = (r.status_reserva !== 'Cancelada')
        ? `<button type="button" class="btn-perigo" style="padding: 3px 8px; font-size: 12px;" onclick="cancelarReserva(${r.id_reserva}, '${r.codigo_reserva}')">Cancelar</button>`
        : `<span style="color:#888; font-size:12px;">Cancelada</span>`;

      tbody.innerHTML += `
        <tr>
          <td><strong>${r.codigo_reserva}</strong></td>
          <td>${r.comprador_nome}<br><small style="color:#666;">CPF: ${r.comprador_cpf}</small></td>
          <td>${r.pacote_nome}<br><small style="color:#666;">Saída: ${r.data_inicio}</small></td>
          <td>${r.quant_passageiros}</td>
          <td><strong>${r.status_reserva}</strong></td>
          <td>${voucherTexto}</td>
          <td>${botaoCancelar}</td>
        </tr>
      `;
    });
  } catch (erro) {
    alert("Erro ao carregar histórico de reservas: " + erro);
  }
}

async function cancelarReserva(idReserva, codigoReserva) {
  if (!confirm(`Deseja realmente cancelar a reserva ${codigoReserva} e devolver as vagas para a viagem?`)) {
    return;
  }

  try {
    const resposta = await fetch(`/api/reservas/${idReserva}/cancelar`, {
      method: 'POST'
    });
    const dados = await resposta.json();

    if (dados.sucesso) {
      alert(dados.mensagem);
      await carregarHistoricoReservas();
    } else {
      alert(dados.mensagem);
    }
  } catch (erro) {
    alert("Erro ao cancelar reserva: " + erro);
  }
}

/* ================= MÓDULO GERENCIAL 1: PACOTES E VIAGENS ================= */
async function abrirGerenciaPacotes() {
  await trocarTela('tela-principal', 'tela-gerencia-pacotes');
  await carregarDadosGerenciaPacotes();
}

async function carregarDadosGerenciaPacotes() {
  try {
    const resposta = await fetch('/api/gerencia/dados-pacotes');
    const dados = await resposta.json();

    const selHosp = document.getElementById('ger-pac-hosp');
    selHosp.innerHTML = dados.hospedagens.map(h => `<option value="${h.id_hospedagem}">${h.label}</option>`).join('');

    const selTour = document.getElementById('ger-pac-tour');
    selTour.innerHTML = dados.tours.map(t => `<option value="${t.id_city_tour}">${t.nome_tour}</option>`).join('');

    const selPac = document.getElementById('ger-viag-pacote');
    selPac.innerHTML = dados.pacotes.map(p => `<option value="${p.id_pacote}">[ID ${p.id_pacote}] ${p.nome_pacote}</option>`).join('');

    const tbody = document.getElementById('tabela-gerencia-pacotes');
    if (dados.pacotes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#777;">Nenhum pacote cadastrado.</td></tr>`;
    } else {
      tbody.innerHTML = dados.pacotes.map(p => `
        <tr>
          <td>${p.id_pacote}</td>
          <td><strong>${p.nome_pacote}</strong><br><small style="color:#666;">${p.descricao || ''}</small></td>
          <td>${p.hospedagem}</td>
          <td>${p.nome_tour}</td>
        </tr>
      `).join('');
    }
  } catch (erro) {
    alert("Erro ao carregar dados de pacotes: " + erro);
  }
}

async function salvarNovoPacote() {
  const nome_pacote = document.getElementById('ger-pac-nome').value.trim();
  const id_hospedagem = document.getElementById('ger-pac-hosp').value;
  const id_city_tour = document.getElementById('ger-pac-tour').value;
  const descricao = document.getElementById('ger-pac-desc').value.trim();

  if (!nome_pacote || !id_hospedagem || !id_city_tour) {
    alert("Preencha o nome do pacote, hospedagem e city tour.");
    return;
  }

  try {
    const resposta = await fetch('/api/gerencia/pacotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome_pacote, id_hospedagem, id_city_tour, descricao })
    });
    const dados = await resposta.json();
    alert(dados.mensagem);
    if (dados.sucesso) {
      document.getElementById('ger-pac-nome').value = '';
      document.getElementById('ger-pac-desc').value = '';
      await carregarDadosGerenciaPacotes();
    }
  } catch (erro) {
    alert("Erro ao salvar pacote: " + erro);
  }
}

async function salvarNovaViagem() {
  const id_pacote = document.getElementById('ger-viag-pacote').value;
  const data_inicio = document.getElementById('ger-viag-inicio').value;
  const data_fim = document.getElementById('ger-viag-fim').value;
  const hora_saida = document.getElementById('ger-viag-hora').value;
  const capacidade_total = document.getElementById('ger-viag-vagas').value;

  if (!id_pacote || !data_inicio || !data_fim || !capacidade_total) {
    alert("Preencha todos os campos da nova viagem.");
    return;
  }

  try {
    const resposta = await fetch('/api/gerencia/viagens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_pacote, data_inicio, data_fim, hora_saida, capacidade_total })
    });
    const dados = await resposta.json();
    alert(dados.mensagem);
    if (dados.sucesso) {
      document.getElementById('ger-viag-inicio').value = '';
      document.getElementById('ger-viag-fim').value = '';
    }
  } catch (erro) {
    alert("Erro ao abrir viagem: " + erro);
  }
}

/* ================= MÓDULO GERENCIAL 2: FROTA E GUIAS ================= */
async function abrirGerenciaLogistica() {
  await trocarTela('tela-principal', 'tela-gerencia-logistica');
  await carregarDadosLogistica();
}

async function carregarDadosLogistica() {
  try {
    const resposta = await fetch('/api/gerencia/logistica');
    const dados = await resposta.json();

    document.getElementById('log-viagem').innerHTML = dados.viagens.map(v => `<option value="${v.id_viagem}">${v.label}</option>`).join('');
    document.getElementById('log-veiculo').innerHTML = dados.veiculos.map(v => `<option value="${v.id_veiculo}">${v.label}</option>`).join('');
    document.getElementById('log-motorista').innerHTML = dados.motoristas.map(m => `<option value="${m.id_motorista}">${m.label}</option>`).join('');
    document.getElementById('log-guia').innerHTML = dados.guias.map(g => `<option value="${g.id_guia}">${g.label}</option>`).join('');
    document.getElementById('log-tour').innerHTML = dados.tours.map(t => `<option value="${t.id_city_tour}">${t.nome_tour}</option>`).join('');

    const tbodyFrota = document.getElementById('tabela-frota-alocada');
    tbodyFrota.innerHTML = dados.alocacoes_frota.length === 0
      ? `<tr><td colspan="3" style="text-align:center; color:#777;">Nenhuma alocação de veículo registrada.</td></tr>`
      : dados.alocacoes_frota.map(a => `<tr><td>${a.viagem}</td><td>${a.veiculo}</td><td>${a.motorista}</td></tr>`).join('');

    const tbodyGuias = document.getElementById('tabela-guias-escalados');
    tbodyGuias.innerHTML = dados.escalas_guias.length === 0
      ? `<tr><td colspan="4" style="text-align:center; color:#777;">Nenhuma escala de guia registrada.</td></tr>`
      : dados.escalas_guias.map(e => `<tr><td>${e.data_escalacao}</td><td>${e.guia}</td><td>${e.tour}</td><td>${e.observacao || '-'}</td></tr>`).join('');
  } catch (erro) {
    alert("Erro ao carregar dados logísticos: " + erro);
  }
}

async function salvarAlocacaoFrota() {
  const id_viagem = document.getElementById('log-viagem').value;
  const id_veiculo = document.getElementById('log-veiculo').value;
  const id_motorista = document.getElementById('log-motorista').value;

  try {
    const resposta = await fetch('/api/gerencia/alocar-frota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_viagem, id_veiculo, id_motorista })
    });
    const dados = await resposta.json();
    alert(dados.mensagem);
    if (dados.sucesso) await carregarDadosLogistica();
  } catch (erro) {
    alert("Erro ao alocar frota: " + erro);
  }
}

async function salvarEscalaGuia() {
  const id_guia = document.getElementById('log-guia').value;
  const id_city_tour = document.getElementById('log-tour').value;
  const data_escalacao = document.getElementById('log-data-guia').value;
  const observacao = document.getElementById('log-obs-guia').value.trim();

  if (!data_escalacao) {
    alert("Informe a data da escalação do guia.");
    return;
  }

  try {
    const resposta = await fetch('/api/gerencia/escalar-guia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_guia, id_city_tour, data_escalacao, observacao })
    });
    const dados = await resposta.json();
    alert(dados.mensagem);
    if (dados.sucesso) {
      document.getElementById('log-obs-guia').value = '';
      await carregarDadosLogistica();
    }
  } catch (erro) {
    alert("Erro ao escalar guia: " + erro);
  }
}

/* ================= MÓDULO GERENCIAL 3: RELATÓRIOS GERENCIAIS ================= */
async function abrirRelatoriosGerenciais() {
  await trocarTela('tela-principal', 'tela-relatorios');
  try {
    const resposta = await fetch('/api/gerencia/relatorios');
    const dados = await resposta.json();

    document.getElementById('kpi-pax-confirmados').innerText = dados.kpis.pax_confirmados;
    document.getElementById('kpi-pax-pendentes').innerText = dados.kpis.pax_pendentes;
    document.getElementById('kpi-reservas-confirmadas').innerText = dados.kpis.reservas_confirmadas;

    const tbodyOcup = document.getElementById('tabela-rel-ocupacao');
    tbodyOcup.innerHTML = dados.ocupacao_viagens.length === 0
      ? `<tr><td colspan="6" style="text-align:center; color:#777;">Nenhuma viagem cadastrada.</td></tr>`
      : dados.ocupacao_viagens.map(v => `
          <tr>
            <td>${v.id_viagem}</td>
            <td>${v.nome_pacote}</td>
            <td>${v.data_inicio}</td>
            <td>${v.ocupadas} / ${v.capacidade_total}</td>
            <td>${v.vagas_disponiveis}</td>
            <td><strong>${v.taxa_ocupacao}%</strong></td>
          </tr>
        `).join('');

    const tbodyVend = document.getElementById('tabela-rel-vendedores');
    tbodyVend.innerHTML = dados.desempenho_vendedores.map(v => `
      <tr>
        <td>${v.vendedor}</td>
        <td>${v.total_reservas}</td>
        <td><strong>${v.pax_confirmados}</strong></td>
        <td>${v.pax_pendentes}</td>
      </tr>
    `).join('');
  } catch (erro) {
    alert("Erro ao carregar relatórios: " + erro);
  }
}

/* ================= CARREGAR PACOTES/VIAGENS DO BANCO ================= */
async function abrirTelaPacotes() {
  await trocarTela('tela-principal', 'tela-pacotes');
  pacoteSelecionado = null;
  document.getElementById('btn-selecionar-pacote').disabled = true;
  document.getElementById('descricao-pacote-selecionado').innerText = "Carregando pacotes do banco...";

  try {
    const resposta = await fetch('/api/viagens');
    listaViagensDisponiveis = await resposta.json();
    document.getElementById('descricao-pacote-selecionado').innerText = "Nenhum pacote selecionado.";
    renderizarTabelaPacotesSelecao();
  } catch (erro) {
    alert("Erro ao buscar pacotes no banco de dados: " + erro);
  }
}

function renderizarTabelaPacotesSelecao() {
  const tbody = document.getElementById('lista-pacotes-tabela');
  tbody.innerHTML = '';

  listaViagensDisponiveis.forEach(v => {
    let selecionadaClass = (pacoteSelecionado && pacoteSelecionado.id_viagem === v.id_viagem) ? 'selecionado' : '';
    let esgotadoClass = (v.vagas === 0) ? 'esgotado' : '';
    let statusVagas = (v.vagas > 0) ? `${v.vagas} vagas` : 'ESGOTADO';

    tbody.innerHTML += `
      <tr class="${selecionadaClass} ${esgotadoClass}" onclick="marcarPacote(${v.id_viagem}, this)" style="cursor: pointer;">
        <td>${v.id}</td>
        <td>${v.nome} (${v.data_inicio})</td>
        <td>${v.hotel} / ${v.tour}</td>
        <td><strong>${statusVagas}</strong></td>
      </tr>
    `;
  });
}

function marcarPacote(idViagem, linhaElemento) {
  const btnSelecionar = document.getElementById('btn-selecionar-pacote');
  const viagem = listaViagensDisponiveis.find(v => v.id_viagem === idViagem);

  if (!viagem) return;

  document.getElementById('descricao-pacote-selecionado').innerText = viagem.descricao;

  if (viagem.vagas === 0) {
    alert("Atenção: Este pacote está com as vagas esgotadas e não pode ser selecionado.");
    pacoteSelecionado = null;
    btnSelecionar.disabled = true;
    return;
  }

  pacoteSelecionado = viagem;
  btnSelecionar.disabled = false;

  const linhas = document.querySelectorAll('#lista-pacotes-tabela tr');
  linhas.forEach(l => l.classList.remove('selecionado'));
  linhaElemento.classList.add('selecionado');
}

function confirmarPacoteESeguir() {
  if (!pacoteSelecionado) {
    alert("Por favor, selecione um pacote válido.");
    return;
  }
  document.getElementById('info-pacote-escolhido').innerText = `Pacote Selecionado: [${pacoteSelecionado.id}] ${pacoteSelecionado.nome} (${pacoteSelecionado.data_inicio} a ${pacoteSelecionado.data_fim})`;
  trocarTela('tela-pacotes', 'tela-opcao-cliente');
}

/* ================= CONSULTA REAL DE CLIENTES ================= */
async function carregarClientesDoBanco(termoBusca = '') {
  try {
    const url = termoBusca ? `/api/clientes?busca=${encodeURIComponent(termoBusca)}` : '/api/clientes';
    const resposta = await fetch(url);
    listaClientesCache = await resposta.json();
    renderizarTabelaClientes(listaClientesCache);
  } catch (erro) {
    alert("Erro ao consultar clientes no banco: " + erro);
  }
}

function renderizarTabelaClientes(lista) {
  const tbody = document.getElementById('tabela-consulta-clientes');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#777;">Nenhum cliente encontrado.</td></tr>`;
    return;
  }

  lista.forEach(c => {
    let selecionadaClass = (clienteSelecionadoObjeto && clienteSelecionadoObjeto.id === c.id) ? 'selecionado' : '';
    tbody.innerHTML += `
      <tr class="${selecionadaClass}" onclick="marcarCliente(${c.id}, this)" style="cursor: pointer;">
        <td>${c.id}</td>
        <td>${c.nome}</td>
        <td>${c.cpf}</td>
        <td>${c.tel}</td>
      </tr>
    `;
  });
}

function marcarCliente(id, linhaElemento) {
  clienteSelecionadoObjeto = listaClientesCache.find(c => c.id === id);
  const linhas = document.querySelectorAll('#tabela-consulta-clientes tr');
  linhas.forEach(l => l.classList.remove('selecionado'));
  linhaElemento.classList.add('selecionado');
}

async function filtrarClientes() {
  const termo = document.getElementById('input-busca-cliente').value.trim();
  await carregarClientesDoBanco(termo);
}

function selecionarClienteConsultado() {
  if (!clienteSelecionadoObjeto) {
    alert("Por favor, clique em um cliente da lista para selecionar.");
    return;
  }
  
  listaAcompanhantes = [];
  document.getElementById('info-cliente-consultado-box').innerText = `${clienteSelecionadoObjeto.nome} (CPF: ${clienteSelecionadoObjeto.cpf})`;
  renderizarAcompanhantesConsulta();
  
  trocarTela('tela-consulta-exclusiva', 'tela-acompanhantes-consulta');
}

/* ================= INCLUSÃO DE ACOMPANHANTES (CLIENTE JÁ CADASTRADO) ================= */
function adicionarAcompanhanteConsulta() {
  const nome = document.getElementById('cons-pass-nome').value.trim();
  const cpf = document.getElementById('cons-pass-cpf').value.replace(/\D/g, '');

  if (!nome || cpf.length !== 11) {
    alert("Preencha o Nome e um CPF válido (11 números) do acompanhante.");
    return;
  }

  listaAcompanhantes.push({ nome, cpf });
  document.getElementById('cons-pass-nome').value = '';
  document.getElementById('cons-pass-cpf').value = '';

  renderizarAcompanhantesConsulta();
}

function renderizarAcompanhantesConsulta() {
  const tbody = document.getElementById('tabela-acompanhantes-consulta');
  tbody.innerHTML = '';

  if (listaAcompanhantes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#777;">Nenhum acompanhante adicionado.</td></tr>`;
    return;
  }

  listaAcompanhantes.forEach((p, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${p.nome}</td>
        <td>${p.cpf}</td>
        <td><button type="button" class="btn-perigo" style="padding: 3px 8px; font-size: 12px;" onclick="removerAcompanhanteConsulta(${index})">Remover</button></td>
      </tr>
    `;
  });
}

function removerAcompanhanteConsulta(index) {
  listaAcompanhantes.splice(index, 1);
  renderizarAcompanhantesConsulta();
}

async function confirmarComAcompanhantesConsultados() {
  await registrarReservaNoBanco(clienteSelecionadoObjeto, listaAcompanhantes);
}

/* ================= CADASTRO REAL DE NOVO CLIENTE E ACOMPANHANTES ================= */
function adicionarAcompanhante() {
  const nome = document.getElementById('cad-pass-nome').value.trim();
  const cpf = document.getElementById('cad-pass-cpf').value.replace(/\D/g, '');

  if (!nome || cpf.length !== 11) {
    alert("Preencha o Nome e um CPF válido (11 números) do acompanhante.");
    return;
  }

  listaAcompanhantes.push({ nome, cpf });
  document.getElementById('cad-pass-nome').value = '';
  document.getElementById('cad-pass-cpf').value = '';

  renderizarAcompanhantes();
}

function renderizarAcompanhantes() {
  const tbody = document.getElementById('tabela-acompanhantes');
  tbody.innerHTML = '';
  
  if (listaAcompanhantes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#777;">Nenhum acompanhante adicionado.</td></tr>`;
    return;
  }

  listaAcompanhantes.forEach((p, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${p.nome}</td>
        <td>${p.cpf}</td>
        <td><button type="button" class="btn-perigo" style="padding: 3px 8px; font-size: 12px;" onclick="removerAcompanhante(${index})">Remover</button></td>
      </tr>
    `;
  });
}

function removerAcompanhante(index) {
  listaAcompanhantes.splice(index, 1);
  renderizarAcompanhantes();
}

async function salvarEGerarReserva() {
  const compNome = document.getElementById('cad-comp-nome').value.trim();
  const compCpf = document.getElementById('cad-comp-cpf').value.replace(/\D/g, '');
  const compTel = document.getElementById('cad-comp-tel').value.trim();

  if (!compNome || compCpf.length !== 11 || !compTel) {
    alert("Preencha Nome, Telefone e CPF (11 números) do Cliente Comprador.");
    return;
  }

  try {
    const resposta = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: compNome, cpf: compCpf, telefone: compTel })
    });

    const dados = await resposta.json();

    if (!dados.sucesso) {
      alert(dados.mensagem);
      return;
    }

    clienteSelecionadoObjeto = dados.cliente;
    await registrarReservaNoBanco(clienteSelecionadoObjeto, listaAcompanhantes);
  } catch (erro) {
    alert("Erro ao salvar cliente no banco: " + erro);
  }
}

/* ================= GRAVAR RESERVA REAL NO MYSQL ================= */
async function registrarReservaNoBanco(comprador, acompanhantes) {
  if (!vendedorAtual || !pacoteSelecionado || !comprador) {
    alert("Dados incompletos para gerar a reserva.");
    return;
  }

  try {
    const resposta = await fetch('/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_vendedor: vendedorAtual.id_vendedor,
        id_viagem: pacoteSelecionado.id_viagem,
        id_cliente_comprador: comprador.id,
        acompanhantes: acompanhantes
      })
    });

    const dados = await resposta.json();

    if (!dados.sucesso) {
      alert(dados.mensagem);
      return;
    }

    idReservaAtual = dados.id_reserva;
    codigoReservaAtual = dados.codigo_reserva;
    exibirResumoReserva(comprador.nome, comprador.cpf, acompanhantes);
  } catch (erro) {
    alert("Erro ao registrar reserva no banco: " + erro);
  }
}

/* ================= TELA DE RESUMO DA RESERVA ================= */
function exibirResumoReserva(compradorNome, compradorCpf, acompanhantes) {
  document.getElementById('res-codigo').innerText = codigoReservaAtual;
  document.getElementById('res-vendedor').innerText = vendedorAtual ? vendedorAtual.nome : "--";
  document.getElementById('res-comprador').innerText = `${compradorNome} (CPF: ${compradorCpf})`;

  if (pacoteSelecionado) {
    document.getElementById('res-pacote-id').innerText = pacoteSelecionado.id;
    document.getElementById('res-pacote-nome').innerText = pacoteSelecionado.nome;
    document.getElementById('res-pacote-hotel').innerText = pacoteSelecionado.hotel;
    document.getElementById('res-pacote-tour').innerText = pacoteSelecionado.tour;
  }

  const tbody = document.getElementById('res-tabela-passageiros');
  tbody.innerHTML = '';

  tbody.innerHTML += `
    <tr>
      <td><strong>Comprador</strong></td>
      <td>${compradorNome}</td>
      <td>${compradorCpf}</td>
    </tr>
  `;

  acompanhantes.forEach(a => {
    tbody.innerHTML += `
      <tr>
        <td>Acompanhante</td>
        <td>${a.nome}</td>
        <td>${a.cpf}</td>
      </tr>
    `;
  });

  document.getElementById('tela-cadastro-exclusiva').classList.add('hidden');
  document.getElementById('tela-consulta-exclusiva').classList.add('hidden');
  document.getElementById('tela-acompanhantes-consulta').classList.add('hidden');
  document.getElementById('tela-resumo-reserva').classList.remove('hidden');
}

/* ================= CONFIRMAR PAGAMENTO E EMITIR VOUCHER NO MYSQL ================= */
async function avancarParaVoucher() {
  if (!idReservaAtual) {
    alert("Nenhuma reserva ativa encontrada.");
    return;
  }

  try {
    const resposta = await fetch('/api/vouchers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_reserva: idReservaAtual,
        nome_vendedor: vendedorAtual ? vendedorAtual.nome : "Vendedor"
      })
    });

    const dados = await resposta.json();

    if (!dados.sucesso) {
      alert(dados.mensagem);
      return;
    }

    document.getElementById('vouc-codigo').innerText = dados.cod_voucher;
    document.getElementById('vouc-reserva').innerText = codigoReservaAtual;
    document.getElementById('vouc-data').innerText = dados.data_emissao;
    document.getElementById('vouc-status').innerText = dados.confirmado_vendedor;

    if (pacoteSelecionado) {
      document.getElementById('vouc-viagem-id').innerText = pacoteSelecionado.id_viagem;
      document.getElementById('vouc-viagem-datas').innerText = `${pacoteSelecionado.data_inicio} a ${pacoteSelecionado.data_fim}`;
      document.getElementById('vouc-viagem-saida').innerText = pacoteSelecionado.horario_saida;
      document.getElementById('vouc-pacote-detalhes').innerText = 
        `[ID ${pacoteSelecionado.id}] ${pacoteSelecionado.nome} | Hospedagem: ${pacoteSelecionado.hotel} | City Tour: ${pacoteSelecionado.tour}`;
    }

    const tbody = document.getElementById('vouc-tabela-passageiros');
    tbody.innerHTML = '';

    tbody.innerHTML += `
      <tr>
        <td>${clienteSelecionadoObjeto.nome} (Comprador)</td>
        <td>${clienteSelecionadoObjeto.cpf}</td>
      </tr>
    `;

    listaAcompanhantes.forEach(a => {
      tbody.innerHTML += `
        <tr>
          <td>${a.nome}</td>
          <td>${a.cpf}</td>
        </tr>
      `;
    });

    trocarTela('tela-resumo-reserva', 'tela-voucher');
  } catch (erro) {
    alert("Erro ao emitir voucher no banco: " + erro);
  }
}

function imprimirVoucher() {
  window.print();
}

function concluirEVoltarInicio() {
  listaAcompanhantes = [];
  pacoteSelecionado = null;
  clienteSelecionadoObjeto = null;
  idReservaAtual = null;
  codigoReservaAtual = "";
  
  document.getElementById('tela-resumo-reserva').classList.add('hidden');
  document.getElementById('tela-voucher').classList.add('hidden');
  document.getElementById('tela-principal').classList.remove('hidden');
}