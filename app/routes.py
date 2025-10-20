import base64
import csv
import io
import json
import os
import uuid
from datetime import datetime

from flask import (
    Blueprint,
    Response,
    jsonify,
    redirect,
    render_template,
    request,
    send_file,
    url_for,
)

from . import db
from .models import (
    Survey,
    SurveyAnswer,
    SurveyOption,
    SurveyQuestion,
    SurveyResponse,
    Usuario,
)


FRAMES_FOLDER = os.path.join("app", "static", "frames")
RESULTS_FOLDER = os.path.join("app", "static", "results")
os.makedirs(RESULTS_FOLDER, exist_ok=True)

main = Blueprint('main', __name__)

@main.route("/")
def home():
    return render_template("home.html")


def _get_active_survey():
    survey = (
        Survey.query.filter_by(is_active=True)
        .order_by(Survey.created_at.desc())
        .first()
    )

    if survey is None:
        survey = Survey.query.order_by(Survey.created_at.desc()).first()

    return survey

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


@main.route("/pesquisa", methods=["GET", "POST"])
def survey_form():
    survey = _get_active_survey()

    if survey is None:
        return render_template("survey.html", survey=None)

    if request.method == "POST":
        response = SurveyResponse(survey=survey)
        db.session.add(response)

        for question in survey.questions:
            form_key = f"question_{question.id}"
            answer_value = request.form.get(form_key, "").strip()

            db.session.add(
                SurveyAnswer(
                    response=response,
                    question=question,
                    answer_text=answer_value,
                )
            )

        db.session.commit()

        return redirect(url_for("main.survey_thanks"))

    return render_template("survey.html", survey=survey)


@main.route("/pesquisa/obrigado")
def survey_thanks():
    return render_template("survey_thanks.html")

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


@main.route("/backoffice/pesquisas", methods=["GET", "POST"])
def manage_surveys():
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        questions_data = request.form.get("questions_data", "[]")

        if not title:
            surveys = Survey.query.order_by(Survey.created_at.desc()).all()
            return render_template(
                "survey_admin.html",
                surveys=surveys,
                error="Informe um título para a pesquisa.",
            )

        try:
            questions = json.loads(questions_data)
        except json.JSONDecodeError:
            surveys = Survey.query.order_by(Survey.created_at.desc()).all()
            return render_template(
                "survey_admin.html",
                surveys=surveys,
                error="Formato de perguntas inválido. Tente novamente.",
            )

        if not questions:
            surveys = Survey.query.order_by(Survey.created_at.desc()).all()
            return render_template(
                "survey_admin.html",
                surveys=surveys,
                error="Adicione ao menos uma pergunta à pesquisa.",
            )

        Survey.query.update({Survey.is_active: False})

        survey = Survey(title=title, is_active=True)
        db.session.add(survey)

        for idx, question_data in enumerate(questions):
            question = SurveyQuestion(
                survey=survey,
                text=question_data.get("text", "").strip(),
                question_type=question_data.get("type", "texto"),
                position=idx,
            )

            if not question.text:
                continue

            db.session.add(question)

            if question.question_type == "multipla":
                for option_text in question_data.get("options", []):
                    option_text = option_text.strip()
                    if option_text:
                        db.session.add(
                            SurveyOption(question=question, text=option_text)
                        )

        db.session.commit()

        return redirect(url_for("main.manage_surveys"))

    surveys = Survey.query.order_by(Survey.created_at.desc()).all()
    return render_template("survey_admin.html", surveys=surveys)


@main.route("/backoffice/pesquisas/<int:survey_id>/ativar", methods=["POST"])
def activate_survey(survey_id):
    Survey.query.update({Survey.is_active: False})
    survey = Survey.query.get_or_404(survey_id)
    survey.is_active = True
    db.session.commit()
    return redirect(url_for("main.manage_surveys"))


@main.route("/backoffice/pesquisas/<int:survey_id>/excluir", methods=["POST"])
def delete_survey(survey_id):
    survey = Survey.query.get_or_404(survey_id)
    db.session.delete(survey)
    db.session.commit()
    return redirect(url_for("main.manage_surveys"))


@main.route("/backoffice/pesquisas/<int:survey_id>/download")
def download_survey(survey_id):
    survey = Survey.query.get_or_404(survey_id)

    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow(["Data da resposta", "Pergunta", "Resposta"])

    for response in survey.responses:
        for answer in response.answers:
            writer.writerow(
                [
                    response.created_at.strftime("%d/%m/%Y %H:%M"),
                    answer.question.text,
                    answer.answer_text or "",
                ]
            )

    output.seek(0)

    filename = f"pesquisa_{survey.id}.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "text/csv; charset=utf-8",
        },
    )


