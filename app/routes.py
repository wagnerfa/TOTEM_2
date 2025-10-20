import os
import uuid
import base64
from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, jsonify, send_file
from .models import Usuario
from . import db


FRAMES_FOLDER = os.path.join("app", "static", "frames")
RESULTS_FOLDER = os.path.join("app", "static", "results")
os.makedirs(RESULTS_FOLDER, exist_ok=True)

main = Blueprint('main', __name__)

@main.route("/")
def home():
    return render_template("home.html")

@main.route("/qr-code")
def qr_code():
    return render_template("qr-code.html")

@main.route("/associacao", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        try:
            novo_usuario = Usuario(
                nome=request.form["nome"],
                cpf=request.form["cpf"],
                data_nascimento=datetime.strptime(request.form["data_nascimento"], "%Y-%m-%d").date(),
                email=request.form["email"],
                celular=request.form["celular"],
                ppe=request.form["ppe"]
            )

            db.session.add(novo_usuario)
            db.session.commit()
            return redirect(url_for("main.sucesso"))

        except Exception as e:
            return f"Erro ao salvar: {e}"

    return render_template("associacao.html")

@main.route("/sucesso")
def sucesso():
    return "<h2>Dados enviados com sucesso!</h2><a href='/'>Voltar</a>"

@main.route('/photo')
def photo():
    frames = [f for f in os.listdir(FRAMES_FOLDER) if f.lower().endswith('.png')] if os.path.exists(FRAMES_FOLDER) else []
    return render_template('photo.html', frames=frames)

@main.route('/api/save-photo', methods=['POST'])
def save_photo():
    data = request.get_json()
    photo_data = data.get('photo')
    frame_name = data.get('frame')

    if not photo_data:
        return jsonify({'error': 'Nenhuma foto recebida'}), 400

    try:
        # Se for usar moldura
        if frame_name:
            frame_path = os.path.join(FRAMES_FOLDER, frame_name)
            if os.path.exists(frame_path):
                # photo_data = apply_frame_to_image(photo_data, frame_path)
                pass

        image_data = base64.b64decode(photo_data.split(',')[1])
        filename = f"photo_{uuid.uuid4()}.png"
        file_path = os.path.join(RESULTS_FOLDER, filename)

        with open(file_path, 'wb') as f:
            f.write(image_data)

        return jsonify({'filename': filename, 'url': f'/download/{filename}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/download/<filename>')
def download_file(filename):
    file_path = os.path.join(RESULTS_FOLDER, filename)

    if os.path.exists(file_path):
        return send_file(
            file_path,
            as_attachment=True,              
            download_name=filename,          
            mimetype="image/png"             
        )
    return "Arquivo não encontrado", 404


