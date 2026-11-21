from flask import Flask, render_template, request, jsonify
from datetime import datetime
import random
from db_config import get_db_connection

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

# --- LOGIN DO VENDEDOR ---
@app.route("/api/login", methods=["POST"])
def login():
    dados = request.get_json()
    email = dados.get("email", "").strip()
    senha = dados.get("senha", "").strip()

    if not email or not senha:
        return jsonify({"sucesso": False, "mensagem": "Informe e-mail e senha."}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT id_vendedor, nome, email FROM vendedor WHERE email = %s AND senha_hash = %s AND ativo = 1",
        (email, senha)
    )
    vendedor = cursor.fetchone()
    cursor.close()
    conn.close()

    if vendedor:
        return jsonify({"sucesso": True, "vendedor": vendedor})
    else:
        return jsonify({"sucesso": False, "mensagem": "E-mail ou senha inválidos, ou vendedor inativo."}), 401

# --- LISTAR VIAGENS / PACOTES DISPONÍVEIS ---
@app.route("/api/viagens", methods=["GET"])
def listar_viagens():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT 
            v.id_viagem,
            DATE_FORMAT(v.data_inicio, '%d/%m/%Y') AS data_inicio,
            DATE_FORMAT(v.data_fim, '%d/%m/%Y') AS data_fim,
            DATE_FORMAT(v.horario_saida, '%H:%i hs') AS horario_saida,
            v.capacidade_total,
            v.vagas_disponiveis AS vagas,
            p.id_pacote AS id,
            p.nome_pacote AS nome,
            p.descricao,
            h.nome_fantasia AS hotel,
            ct.id_city_tour,
            ct.nome_tour AS tour
        FROM viagem v
        INNER JOIN pacote p ON v.id_pacote = p.id_pacote
        INNER JOIN hospedagem hosp ON p.id_hospedagem = hosp.id_hospedagem
        INNER JOIN hotel h ON hosp.id_hotel = h.id_hotel
        INNER JOIN city_tour ct ON p.id_city_tour = ct.id_city_tour
        ORDER BY v.data_inicio ASC
    """
    cursor.execute(query)
    viagens = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(viagens)

# --- LISTAR / BUSCAR CLIENTES ---
@app.route("/api/clientes", methods=["GET"])
def listar_clientes():
    busca = request.args.get("busca", "").strip()
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if busca:
        termo = f"%{busca}%"
        cursor.execute(
            "SELECT id_cliente AS id, nome, cpf, telefone AS tel FROM cliente WHERE nome LIKE %s OR cpf LIKE %s ORDER BY nome ASC",
            (termo, termo)
        )
    else:
        cursor.execute("SELECT id_cliente AS id, nome, cpf, telefone AS tel FROM cliente ORDER BY nome ASC")

    clientes = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(clientes)

# --- CADASTRAR NOVO CLIENTE COMPRADOR ---
@app.route("/api/clientes", methods=["POST"])
def cadastrar_cliente():
    dados = request.get_json()
    nome = dados.get("nome", "").strip()
    cpf = "".join(filter(str.isdigit, dados.get("cpf", "")))
    telefone = dados.get("telefone", "").strip()

    if not nome or len(cpf) != 11 or not telefone:
        return jsonify({
            "sucesso": False,
            "mensagem": "Preencha Nome, Telefone e um CPF válido com 11 números."
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "INSERT INTO cliente (nome, cpf, telefone) VALUES (%s, %s, %s)",
            (nome, cpf, telefone)
        )
        conn.commit()
        novo_id = cursor.lastrowid
        return jsonify({
            "sucesso": True,
            "cliente": {"id": novo_id, "nome": nome, "cpf": cpf, "tel": telefone}
        })
    except Exception as e:
        conn.rollback()
        if "uk_cliente_cpf" in str(e):
            return jsonify({"sucesso": False, "mensagem": "Já existe um cliente cadastrado com este CPF."}), 409
        return jsonify({"sucesso": False, "mensagem": f"Erro ao cadastrar cliente: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# --- LISTAR HISTÓRICO DE RESERVAS ---
@app.route("/api/reservas", methods=["GET"])
def listar_reservas():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT 
            r.id_reserva,
            CONCAT('#RES-', LPAD(r.id_reserva, 4, '0')) AS codigo_reserva,
            r.quant_passageiros,
            r.status_reserva,
            c.nome AS comprador_nome,
            c.cpf AS comprador_cpf,
            p.nome_pacote AS pacote_nome,
            DATE_FORMAT(v.data_inicio, '%d/%m/%Y') AS data_inicio,
            vend.nome AS vendedor_nome,
            vouc.cod_voucher
        FROM reserva r
        INNER JOIN cliente c ON r.id_cliente_comprador = c.id_cliente
        INNER JOIN viagem v ON r.id_viagem = v.id_viagem
        INNER JOIN pacote p ON v.id_pacote = p.id_pacote
        INNER JOIN vendedor vend ON r.id_vendedor = vend.id_vendedor
        LEFT JOIN voucher vouc ON r.id_reserva = vouc.id_reserva
        ORDER BY r.id_reserva DESC
    """
    cursor.execute(query)
    reservas = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(reservas)

# --- CRIAR RESERVA, VINCULAR PASSAGEIROS E DAR BAIXA NAS VAGAS ---
@app.route("/api/reservas", methods=["POST"])
def criar_reserva():
    dados = request.get_json()
    id_vendedor = dados.get("id_vendedor")
    id_viagem = dados.get("id_viagem")
    id_cliente_comprador = dados.get("id_cliente_comprador")
    acompanhantes = dados.get("acompanhantes", [])

    quant_passageiros = 1 + len(acompanhantes)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT vagas_disponiveis FROM viagem WHERE id_viagem = %s FOR UPDATE", (id_viagem,))
        viagem = cursor.fetchone()

        if not viagem:
            conn.rollback()
            return jsonify({"sucesso": False, "mensagem": "Viagem não encontrada."}), 404

        if viagem["vagas_disponiveis"] < quant_passageiros:
            conn.rollback()
            return jsonify({
                "sucesso": False,
                "mensagem": f"Vagas insuficientes! Restam apenas {viagem['vagas_disponiveis']} vaga(s) para esta viagem."
            }), 400

        cursor.execute(
            """
            INSERT INTO reserva (quant_passageiros, status_reserva, id_vendedor, id_viagem, id_cliente_comprador)
            VALUES (%s, 'Pendente', %s, %s, %s)
            """,
            (quant_passageiros, id_vendedor, id_viagem, id_cliente_comprador)
        )
        id_reserva = cursor.lastrowid

        cursor.execute(
            "INSERT INTO composicao_reserva (id_cliente, id_reserva) VALUES (%s, %s)",
            (id_cliente_comprador, id_reserva)
        )

        for acomp in acompanhantes:
            nome_acomp = acomp.get("nome", "").strip()
            cpf_acomp = "".join(filter(str.isdigit, acomp.get("cpf", "")))

            cursor.execute("SELECT id_cliente FROM cliente WHERE cpf = %s", (cpf_acomp,))
            existente = cursor.fetchone()

            if existente:
                id_cliente_acomp = existente["id_cliente"]
            else:
                cursor.execute(
                    "INSERT INTO cliente (nome, cpf, telefone) VALUES (%s, %s, %s)",
                    (nome_acomp, cpf_acomp, "Não informado")
                )
                id_cliente_acomp = cursor.lastrowid

            cursor.execute(
                "INSERT INTO composicao_reserva (id_cliente, id_reserva) VALUES (%s, %s)",
                (id_cliente_acomp, id_reserva)
            )

        cursor.execute(
            "UPDATE viagem SET vagas_disponiveis = vagas_disponiveis - %s WHERE id_viagem = %s",
            (quant_passageiros, id_viagem)
        )

        conn.commit()
        return jsonify({
            "sucesso": True,
            "id_reserva": id_reserva,
            "codigo_reserva": f"#RES-{id_reserva:04d}"
        })

    except Exception as e:
        conn.rollback()
        return jsonify({"sucesso": False, "mensagem": f"Erro ao gravar reserva: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# --- CANCELAR RESERVA E ESTORNAR VAGAS ---
@app.route("/api/reservas/<int:id_reserva>/cancelar", methods=["POST"])
def cancelar_reserva(id_reserva):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT id_viagem, quant_passageiros, status_reserva FROM reserva WHERE id_reserva = %s FOR UPDATE",
            (id_reserva,)
        )
        reserva = cursor.fetchone()

        if not reserva:
            conn.rollback()
            return jsonify({"sucesso": False, "mensagem": "Reserva não encontrada."}), 404

        if reserva["status_reserva"] == "Cancelada":
            conn.rollback()
            return jsonify({"sucesso": False, "mensagem": "Esta reserva já está cancelada."}), 400

        cursor.execute(
            "UPDATE reserva SET status_reserva = 'Cancelada' WHERE id_reserva = %s",
            (id_reserva,)
        )

        cursor.execute(
            "UPDATE viagem SET vagas_disponiveis = vagas_disponiveis + %s WHERE id_viagem = %s",
            (reserva["quant_passageiros"], reserva["id_viagem"])
        )

        conn.commit()
        return jsonify({
            "sucesso": True,
            "mensagem": f"Reserva #RES-{id_reserva:04d} cancelada e {reserva['quant_passageiros']} vaga(s) devolvida(s) com sucesso!"
        })

    except Exception as e:
        conn.rollback()
        return jsonify({"sucesso": False, "mensagem": f"Erro ao cancelar reserva: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# --- CONFIRMAR PAGAMENTO E EMITIR VOUCHER ---
@app.route("/api/vouchers", methods=["POST"])
def emitir_voucher():
    dados = request.get_json()
    id_reserva = dados.get("id_reserva")
    nome_vendedor = dados.get("nome_vendedor", "Vendedor")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "UPDATE reserva SET status_reserva = 'Confirmada' WHERE id_reserva = %s",
            (id_reserva,)
        )

        cod_voucher = f"VOU-{id_reserva:03d}{random.randint(100, 999)}"
        instrucoes = "Apresentar voucher na sede da agência com 30min de antecedência."
        confirmacao = f"Confirmado por {nome_vendedor}"

        cursor.execute(
            """
            INSERT INTO voucher (cod_voucher, instrucoes_embarque, id_reserva, confirmado_vendedor)
            VALUES (%s, %s, %s, %s)
            """,
            (cod_voucher, instrucoes, id_reserva, confirmacao)
        )

        conn.commit()
        data_emissao = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

        return jsonify({
            "sucesso": True,
            "cod_voucher": cod_voucher,
            "data_emissao": data_emissao,
            "confirmado_vendedor": confirmacao
        })

    except Exception as e:
        conn.rollback()
        return jsonify({"sucesso": False, "mensagem": f"Erro ao emitir voucher: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# ==============================================================================
# MÓDULO GERENCIAL 1: CADASTRO DE PACOTES E VIAGENS
# ==============================================================================
@app.route("/api/gerencia/dados-pacotes", methods=["GET"])
def dados_pacotes():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT hosp.id_hospedagem, CONCAT(h.nome_fantasia, ' - ', hosp.tipo_acomodacao, ' (', h.cidade, ')') AS label
        FROM hospedagem hosp
        INNER JOIN hotel h ON hosp.id_hotel = h.id_hotel
        ORDER BY h.nome_fantasia ASC
    """)
    hospedagens = cursor.fetchall()

    cursor.execute("SELECT id_city_tour, nome_tour FROM city_tour ORDER BY nome_tour ASC")
    tours = cursor.fetchall()

    cursor.execute("""
        SELECT p.id_pacote, p.nome_pacote, p.descricao,
               CONCAT(h.nome_fantasia, ' (', hosp.tipo_acomodacao, ')') AS hospedagem,
               ct.nome_tour
        FROM pacote p
        INNER JOIN hospedagem hosp ON p.id_hospedagem = hosp.id_hospedagem
        INNER JOIN hotel h ON hosp.id_hotel = h.id_hotel
        INNER JOIN city_tour ct ON p.id_city_tour = ct.id_city_tour
        ORDER BY p.id_pacote DESC
    """)
    pacotes = cursor.fetchall()

    cursor.close()
    conn.close()
    return jsonify({"hospedagens": hospedagens, "tours": tours, "pacotes": pacotes})

@app.route("/api/gerencia/pacotes", methods=["POST"])
def criar_pacote():
    dados = request.get_json()
    nome = dados.get("nome_pacote", "").strip()
    descricao = dados.get("descricao", "").strip()
    id_hospedagem = dados.get("id_hospedagem")
    id_city_tour = dados.get("id_city_tour")

    if not nome or not id_hospedagem or not id_city_tour:
        return jsonify({"sucesso": False, "mensagem": "Preencha o nome do pacote, hospedagem e city tour."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO pacote (nome_pacote, descricao, id_hospedagem, id_city_tour) VALUES (%s, %s, %s, %s)",
            (nome, descricao, id_hospedagem, id_city_tour)
        )
        conn.commit()
        return jsonify({"sucesso": True, "mensagem": "Pacote turístico cadastrado com sucesso!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"sucesso": False, "mensagem": f"Erro ao cadastrar pacote: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route("/api/gerencia/viagens", methods=["POST"])
def criar_viagem():
    dados = request.get_json()
    id_pacote = dados.get("id_pacote")
    data_inicio = dados.get("data_inicio")
    data_fim = dados.get("data_fim")
    hora_saida = dados.get("hora_saida", "07:00")
    capacidade = int(dados.get("capacidade_total", 0))

    if not id_pacote or not data_inicio or not data_fim or capacidade <= 0:
        return jsonify({"sucesso": False, "mensagem": "Preencha pacote, datas e capacidade maior que zero."}), 400

    horario_saida_dt = f"{data_inicio} {hora_saida}:00"

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO viagem (data_inicio, data_fim, horario_saida, capacidade_total, vagas_disponiveis, id_pacote)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (data_inicio, data_fim, horario_saida_dt, capacidade, capacidade, id_pacote)
        )
        conn.commit()
        return jsonify({"sucesso": True, "mensagem": "Nova saída de viagem aberta com sucesso!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"sucesso": False, "mensagem": f"Erro ao abrir viagem: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# ==============================================================================
# MÓDULO GERENCIAL 2: ALOCAÇÃO DE FROTA E GUIAS
# ==============================================================================
@app.route("/api/gerencia/logistica", methods=["GET"])
def dados_logistica():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT v.id_viagem, CONCAT('[ID ', v.id_viagem, '] ', p.nome_pacote, ' - Saída: ', DATE_FORMAT(v.data_inicio, '%d/%m/%Y')) AS label
        FROM viagem v
        INNER JOIN pacote p ON v.id_pacote = p.id_pacote
        ORDER BY v.data_inicio DESC
    """)
    viagens = cursor.fetchall()

    cursor.execute("SELECT id_veiculo, CONCAT(modelo, ' - Placa: ', placa, ' (', capacidade_maxima, ' lug.)') AS label FROM veiculo ORDER BY modelo ASC")
    veiculos = cursor.fetchall()

    cursor.execute("SELECT id_motorista, CONCAT(nome, ' (CNH: ', cnh, ')') AS label FROM motorista ORDER BY nome ASC")
    motoristas = cursor.fetchall()

    cursor.execute("SELECT id_guia, CONCAT(nome, ' (Cadastur: ', registro_cadastur, ')') AS label FROM guia ORDER BY nome ASC")
    guias = cursor.fetchall()

    cursor.execute("SELECT id_city_tour, nome_tour FROM city_tour ORDER BY nome_tour ASC")
    tours = cursor.fetchall()

    cursor.execute("""
        SELECT av.id_alocacao_veiculo,
               CONCAT('[Viagem ', v.id_viagem, '] ', p.nome_pacote, ' (', DATE_FORMAT(v.data_inicio, '%d/%m/%Y'), ')') AS viagem,
               CONCAT(veic.modelo, ' (', veic.placa, ')') AS veiculo,
               mot.nome AS motorista
        FROM alocacao_veiculo av
        INNER JOIN viagem v ON av.id_viagem = v.id_viagem
        INNER JOIN pacote p ON v.id_pacote = p.id_pacote
        INNER JOIN veiculo veic ON av.id_veiculo = veic.id_veiculo
        INNER JOIN motorista mot ON av.id_motorista = mot.id_motorista
        ORDER BY av.id_alocacao_veiculo DESC
    """)
    alocacoes_frota = cursor.fetchall()

    cursor.execute("""
        SELECT eg.id_escala_guia,
               DATE_FORMAT(eg.data_escalacao, '%d/%m/%Y') AS data_escalacao,
               g.nome AS guia,
               ct.nome_tour AS tour,
               eg.observacao
        FROM escala_guia eg
        INNER JOIN guia g ON eg.guia_id_guia = g.id_guia
        INNER JOIN city_tour ct ON eg.id_city_tour = ct.id_city_tour
        ORDER BY eg.data_escalacao DESC
    """)
    escalas_guias = cursor.fetchall()

    cursor.close()
    conn.close()
    return jsonify({
        "viagens": viagens,
        "veiculos": veiculos,
        "motoristas": motoristas,
        "guias": guias,
        "tours": tours,
        "alocacoes_frota": alocacoes_frota,
        "escalas_guias": escalas_guias
    })

@app.route("/api/gerencia/alocar-frota", methods=["POST"])
def alocar_frota():
    dados = request.get_json()
    id_viagem = dados.get("id_viagem")
    id_veiculo = dados.get("id_veiculo")
    id_motorista = dados.get("id_motorista")

    if not id_viagem or not id_veiculo or not id_motorista:
        return jsonify({"sucesso": False, "mensagem": "Selecione viagem, veículo e motorista."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO alocacao_veiculo (id_veiculo, id_motorista, id_viagem) VALUES (%s, %s, %s)",
            (id_veiculo, id_motorista, id_viagem)
        )
        conn.commit()
        return jsonify({"sucesso": True, "mensagem": "Veículo e motorista alocados à viagem com sucesso!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"sucesso": False, "mensagem": f"Erro ao alocar frota: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route("/api/gerencia/escalar-guia", methods=["POST"])
def escalar_guia():
    dados = request.get_json()
    id_guia = dados.get("id_guia")
    id_city_tour = dados.get("id_city_tour")
    data_escalacao = dados.get("data_escalacao")
    observacao = dados.get("observacao", "").strip()

    if not id_guia or not id_city_tour or not data_escalacao:
        return jsonify({"sucesso": False, "mensagem": "Selecione guia, city tour e data da escalação."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO escala_guia (data_escalacao, observacao, guia_id_guia, id_city_tour) VALUES (%s, %s, %s, %s)",
            (data_escalacao, observacao, id_guia, id_city_tour)
        )
        conn.commit()
        return jsonify({"sucesso": True, "mensagem": "Guia escalado com sucesso!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"sucesso": False, "mensagem": f"Erro ao escalar guia: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# ==============================================================================
# MÓDULO GERENCIAL 3: RELATÓRIOS GERENCIAIS
# ==============================================================================
@app.route("/api/gerencia/relatorios", methods=["GET"])
def relatorios_gerenciais():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # KPIs Gerais
    cursor.execute("""
        SELECT 
            COALESCE(SUM(CASE WHEN status_reserva = 'Confirmada' THEN quant_passageiros ELSE 0 END), 0) AS pax_confirmados,
            COALESCE(SUM(CASE WHEN status_reserva = 'Pendente' THEN quant_passageiros ELSE 0 END), 0) AS pax_pendentes,
            COUNT(CASE WHEN status_reserva = 'Confirmada' THEN 1 END) AS reservas_confirmadas
        FROM reserva
    """)
    kpis = cursor.fetchone()

    # Taxa de Ocupação por Viagem
    cursor.execute("""
        SELECT 
            v.id_viagem,
            p.nome_pacote,
            DATE_FORMAT(v.data_inicio, '%d/%m/%Y') AS data_inicio,
            v.capacidade_total,
            (v.capacidade_total - v.vagas_disponiveis) AS ocupadas,
            v.vagas_disponiveis,
            CASE 
                WHEN v.capacidade_total > 0 THEN ROUND(((v.capacidade_total - v.vagas_disponiveis) / v.capacidade_total) * 100, 1)
                ELSE 0 
            END AS taxa_ocupacao
        FROM viagem v
        INNER JOIN pacote p ON v.id_pacote = p.id_pacote
        ORDER BY v.data_inicio ASC
    """)
    ocupacao_viagens = cursor.fetchall()

    # Desempenho por Vendedor
    cursor.execute("""
        SELECT 
            vend.nome AS vendedor,
            COUNT(r.id_reserva) AS total_reservas,
            COALESCE(SUM(CASE WHEN r.status_reserva = 'Confirmada' THEN r.quant_passageiros ELSE 0 END), 0) AS pax_confirmados,
            COALESCE(SUM(CASE WHEN r.status_reserva = 'Pendente' THEN r.quant_passageiros ELSE 0 END), 0) AS pax_pendentes
        FROM vendedor vend
        LEFT JOIN reserva r ON vend.id_vendedor = r.id_vendedor AND r.status_reserva != 'Cancelada'
        GROUP BY vend.id_vendedor, vend.nome
        ORDER BY pax_confirmados DESC
    """)
    desempenho_vendedores = cursor.fetchall()

    cursor.close()
    conn.close()
    return jsonify({
        "kpis": kpis,
        "ocupacao_viagens": ocupacao_viagens,
        "desempenho_vendedores": desempenho_vendedores
    })

if __name__ == "__main__":
    app.run(debug=True)