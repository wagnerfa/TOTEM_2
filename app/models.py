from datetime import datetime

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
        return f"<Usuario {self.nome}>"


class Survey(db.Model):
    __tablename__ = "surveys"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    questions = db.relationship(
        "SurveyQuestion",
        backref="survey",
        cascade="all, delete-orphan",
        lazy=True,
        order_by="SurveyQuestion.position",
    )
    responses = db.relationship(
        "SurveyResponse", backref="survey", cascade="all, delete-orphan", lazy=True
    )

    def __repr__(self):
        return f"<Survey {self.title}>"


class SurveyQuestion(db.Model):
    __tablename__ = "survey_questions"

    id = db.Column(db.Integer, primary_key=True)
    survey_id = db.Column(db.Integer, db.ForeignKey("surveys.id"), nullable=False)
    text = db.Column(db.String(500), nullable=False)
    question_type = db.Column(db.String(20), nullable=False)
    position = db.Column(db.Integer, nullable=False, default=0)

    options = db.relationship(
        "SurveyOption",
        backref="question",
        cascade="all, delete-orphan",
        lazy=True,
        order_by="SurveyOption.id",
    )
    answers = db.relationship(
        "SurveyAnswer", backref="question", cascade="all, delete-orphan", lazy=True
    )

    def __repr__(self):
        return f"<SurveyQuestion {self.text[:20]}>"


class SurveyOption(db.Model):
    __tablename__ = "survey_options"

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(
        db.Integer, db.ForeignKey("survey_questions.id"), nullable=False
    )
    text = db.Column(db.String(255), nullable=False)

    def __repr__(self):
        return f"<SurveyOption {self.text}>"


class SurveyResponse(db.Model):
    __tablename__ = "survey_responses"

    id = db.Column(db.Integer, primary_key=True)
    survey_id = db.Column(db.Integer, db.ForeignKey("surveys.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    answers = db.relationship(
        "SurveyAnswer", backref="response", cascade="all, delete-orphan", lazy=True
    )

    def __repr__(self):
        return f"<SurveyResponse {self.id} - {self.survey_id}>"


class SurveyAnswer(db.Model):
    __tablename__ = "survey_answers"

    id = db.Column(db.Integer, primary_key=True)
    response_id = db.Column(
        db.Integer, db.ForeignKey("survey_responses.id"), nullable=False
    )
    question_id = db.Column(
        db.Integer, db.ForeignKey("survey_questions.id"), nullable=False
    )
    answer_text = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f"<SurveyAnswer {self.id}>"
