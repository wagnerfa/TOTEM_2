from . import db

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    cpf = db.Column(db.String(14), nullable=False, unique=True)
    data_nascimento = db.Column(db.Date, nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    celular = db.Column(db.String(20), nullable=False)
    ppe = db.Column(db.String(3), nullable=False)  # "sim" ou "nao"

    def __repr__(self):
        return f'<Usuario {self.nome}>'
