-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: db_agencia_viagens
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alocacao_veiculo`
--

DROP TABLE IF EXISTS `alocacao_veiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alocacao_veiculo` (
  `id_alocacao_veiculo` int NOT NULL AUTO_INCREMENT,
  `id_veiculo` int NOT NULL,
  `id_motorista` int NOT NULL,
  `id_viagem` int NOT NULL,
  PRIMARY KEY (`id_alocacao_veiculo`),
  KEY `fk_alocacao_veiculo_veiculo` (`id_veiculo`),
  KEY `fk_alocacao_veiculo_motorista` (`id_motorista`),
  KEY `fk_alocacao_veiculo_viagem` (`id_viagem`),
  CONSTRAINT `fk_alocacao_veiculo_motorista` FOREIGN KEY (`id_motorista`) REFERENCES `motorista` (`id_motorista`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_alocacao_veiculo_veiculo` FOREIGN KEY (`id_veiculo`) REFERENCES `veiculo` (`id_veiculo`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_alocacao_veiculo_viagem` FOREIGN KEY (`id_viagem`) REFERENCES `viagem` (`id_viagem`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alocacao_veiculo`
--

LOCK TABLES `alocacao_veiculo` WRITE;
/*!40000 ALTER TABLE `alocacao_veiculo` DISABLE KEYS */;
/*!40000 ALTER TABLE `alocacao_veiculo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `city_tour`
--

DROP TABLE IF EXISTS `city_tour`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `city_tour` (
  `id_city_tour` int NOT NULL AUTO_INCREMENT,
  `nome_tour` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao_roteiro` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_city_tour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `city_tour`
--

LOCK TABLES `city_tour` WRITE;
/*!40000 ALTER TABLE `city_tour` DISABLE KEYS */;
/*!40000 ALTER TABLE `city_tour` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cliente`
--

DROP TABLE IF EXISTS `cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cliente` (
  `id_cliente` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cpf` varchar(11) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `uk_cliente_cpf` (`cpf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cliente`
--

LOCK TABLES `cliente` WRITE;
/*!40000 ALTER TABLE `cliente` DISABLE KEYS */;
/*!40000 ALTER TABLE `cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `composicao_reserva`
--

DROP TABLE IF EXISTS `composicao_reserva`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `composicao_reserva` (
  `id_composicao_reserva` int NOT NULL AUTO_INCREMENT,
  `id_cliente` int NOT NULL,
  `id_reserva` int NOT NULL,
  PRIMARY KEY (`id_composicao_reserva`),
  KEY `fk_composicao_cliente` (`id_cliente`),
  KEY `fk_composicao_reserva` (`id_reserva`),
  CONSTRAINT `fk_composicao_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_composicao_reserva` FOREIGN KEY (`id_reserva`) REFERENCES `reserva` (`id_reserva`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `composicao_reserva`
--

LOCK TABLES `composicao_reserva` WRITE;
/*!40000 ALTER TABLE `composicao_reserva` DISABLE KEYS */;
/*!40000 ALTER TABLE `composicao_reserva` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `escala_guia`
--

DROP TABLE IF EXISTS `escala_guia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `escala_guia` (
  `id_escala_guia` int NOT NULL AUTO_INCREMENT,
  `data_escalacao` date NOT NULL,
  `observacao` longtext COLLATE utf8mb4_unicode_ci,
  `guia_id_guia` int NOT NULL,
  `id_city_tour` int NOT NULL,
  PRIMARY KEY (`id_escala_guia`),
  KEY `fk_escala_guia_guia` (`guia_id_guia`),
  KEY `fk_escala_guia_city_tour` (`id_city_tour`),
  CONSTRAINT `fk_escala_guia_city_tour` FOREIGN KEY (`id_city_tour`) REFERENCES `city_tour` (`id_city_tour`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_escala_guia_guia` FOREIGN KEY (`guia_id_guia`) REFERENCES `guia` (`id_guia`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `escala_guia`
--

LOCK TABLES `escala_guia` WRITE;
/*!40000 ALTER TABLE `escala_guia` DISABLE KEYS */;
/*!40000 ALTER TABLE `escala_guia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guia`
--

DROP TABLE IF EXISTS `guia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guia` (
  `id_guia` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cpf` varchar(11) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registro_cadastur` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_guia`),
  UNIQUE KEY `uk_guia_cpf` (`cpf`),
  UNIQUE KEY `uk_guia_cadastur` (`registro_cadastur`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guia`
--

LOCK TABLES `guia` WRITE;
/*!40000 ALTER TABLE `guia` DISABLE KEYS */;
/*!40000 ALTER TABLE `guia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hospedagem`
--

DROP TABLE IF EXISTS `hospedagem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hospedagem` (
  `id_hospedagem` int NOT NULL AUTO_INCREMENT,
  `tipo_acomodacao` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_hotel` int NOT NULL,
  PRIMARY KEY (`id_hospedagem`),
  KEY `fk_hospedagem_hotel` (`id_hotel`),
  CONSTRAINT `fk_hospedagem_hotel` FOREIGN KEY (`id_hotel`) REFERENCES `hotel` (`id_hotel`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hospedagem`
--

LOCK TABLES `hospedagem` WRITE;
/*!40000 ALTER TABLE `hospedagem` DISABLE KEYS */;
/*!40000 ALTER TABLE `hospedagem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hotel`
--

DROP TABLE IF EXISTS `hotel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotel` (
  `id_hotel` int NOT NULL AUTO_INCREMENT,
  `nome_fantasia` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnpj` varchar(14) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cidade` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_hotel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotel`
--

LOCK TABLES `hotel` WRITE;
/*!40000 ALTER TABLE `hotel` DISABLE KEYS */;
/*!40000 ALTER TABLE `hotel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `motorista`
--

DROP TABLE IF EXISTS `motorista`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `motorista` (
  `id_motorista` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cpf` varchar(11) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnh` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_motorista`),
  UNIQUE KEY `uk_motorista_cpf` (`cpf`),
  UNIQUE KEY `uk_motorista_cnh` (`cnh`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `motorista`
--

LOCK TABLES `motorista` WRITE;
/*!40000 ALTER TABLE `motorista` DISABLE KEYS */;
/*!40000 ALTER TABLE `motorista` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pacote`
--

DROP TABLE IF EXISTS `pacote`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pacote` (
  `id_pacote` int NOT NULL AUTO_INCREMENT,
  `nome_pacote` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_hospedagem` int NOT NULL,
  `id_city_tour` int NOT NULL,
  PRIMARY KEY (`id_pacote`),
  KEY `fk_pacote_hospedagem` (`id_hospedagem`),
  KEY `fk_pacote_city_tour` (`id_city_tour`),
  CONSTRAINT `fk_pacote_city_tour` FOREIGN KEY (`id_city_tour`) REFERENCES `city_tour` (`id_city_tour`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pacote_hospedagem` FOREIGN KEY (`id_hospedagem`) REFERENCES `hospedagem` (`id_hospedagem`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pacote`
--

LOCK TABLES `pacote` WRITE;
/*!40000 ALTER TABLE `pacote` DISABLE KEYS */;
/*!40000 ALTER TABLE `pacote` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reserva`
--

DROP TABLE IF EXISTS `reserva`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reserva` (
  `id_reserva` int NOT NULL AUTO_INCREMENT,
  `data_reserva` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `quant_passageiros` int NOT NULL,
  `status_reserva` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendente',
  `id_vendedor` int NOT NULL,
  `id_viagem` int NOT NULL,
  `id_cliente_comprador` int NOT NULL,
  PRIMARY KEY (`id_reserva`),
  KEY `fk_reserva_vendedor` (`id_vendedor`),
  KEY `fk_reserva_viagem` (`id_viagem`),
  KEY `fk_reserva_comprador` (`id_cliente_comprador`),
  CONSTRAINT `fk_reserva_comprador` FOREIGN KEY (`id_cliente_comprador`) REFERENCES `cliente` (`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_reserva_vendedor` FOREIGN KEY (`id_vendedor`) REFERENCES `vendedor` (`id_vendedor`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_reserva_viagem` FOREIGN KEY (`id_viagem`) REFERENCES `viagem` (`id_viagem`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reserva`
--

LOCK TABLES `reserva` WRITE;
/*!40000 ALTER TABLE `reserva` DISABLE KEYS */;
/*!40000 ALTER TABLE `reserva` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `veiculo`
--

DROP TABLE IF EXISTS `veiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `veiculo` (
  `id_veiculo` int NOT NULL AUTO_INCREMENT,
  `placa` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modelo` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacidade_maxima` int NOT NULL DEFAULT '40',
  PRIMARY KEY (`id_veiculo`),
  UNIQUE KEY `uk_veiculo_placa` (`placa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `veiculo`
--

LOCK TABLES `veiculo` WRITE;
/*!40000 ALTER TABLE `veiculo` DISABLE KEYS */;
/*!40000 ALTER TABLE `veiculo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendedor`
--

DROP TABLE IF EXISTS `vendedor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendedor` (
  `id_vendedor` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cpf` varchar(11) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativo` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_vendedor`),
  UNIQUE KEY `uk_vendedor_cpf` (`cpf`),
  UNIQUE KEY `uk_vendedor_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendedor`
--

LOCK TABLES `vendedor` WRITE;
/*!40000 ALTER TABLE `vendedor` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendedor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `viagem`
--

DROP TABLE IF EXISTS `viagem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `viagem` (
  `id_viagem` int NOT NULL AUTO_INCREMENT,
  `data_inicio` date NOT NULL,
  `data_fim` date NOT NULL,
  `horario_saida` datetime NOT NULL,
  `capacidade_total` int NOT NULL DEFAULT '0',
  `vagas_disponiveis` int NOT NULL DEFAULT '0',
  `id_pacote` int NOT NULL,
  PRIMARY KEY (`id_viagem`),
  KEY `fk_viagem_pacote` (`id_pacote`),
  CONSTRAINT `fk_viagem_pacote` FOREIGN KEY (`id_pacote`) REFERENCES `pacote` (`id_pacote`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `viagem`
--

LOCK TABLES `viagem` WRITE;
/*!40000 ALTER TABLE `viagem` DISABLE KEYS */;
/*!40000 ALTER TABLE `viagem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `voucher`
--

DROP TABLE IF EXISTS `voucher`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voucher` (
  `id_voucher` int NOT NULL AUTO_INCREMENT,
  `cod_voucher` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `instrucoes_embarque` tinytext COLLATE utf8mb4_unicode_ci,
  `id_reserva` int NOT NULL,
  `data_emissao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmado_vendedor` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Confirmado',
  PRIMARY KEY (`id_voucher`),
  UNIQUE KEY `uk_voucher_codigo` (`cod_voucher`),
  KEY `fk_voucher_reserva` (`id_reserva`),
  CONSTRAINT `fk_voucher_reserva` FOREIGN KEY (`id_reserva`) REFERENCES `reserva` (`id_reserva`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `voucher`
--

LOCK TABLES `voucher` WRITE;
/*!40000 ALTER TABLE `voucher` DISABLE KEYS */;
/*!40000 ALTER TABLE `voucher` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-16 17:47:11
