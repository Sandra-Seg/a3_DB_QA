import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Slsql#0306",
        database="db_agencia_viagens"
    )
