from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # Configurações do banco
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///usuarios.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    # Registrar rotas
    from .routes import main
    app.register_blueprint(main)

    with app.app_context():
        db.create_all()

    return app
