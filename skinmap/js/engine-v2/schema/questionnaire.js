import { SchemaBase } from './base.js';
export const QUESTIONNAIRE_STATUS = Object.freeze({ CREATED: 'created', IN_PROGRESS: 'in_progress', COMPLETED: 'completed', PROCESSED: 'processed' });
export const QUESTION_TYPE = Object.freeze({ SINGLE_CHOICE: 'single_choice', MULTIPLE_CHOICE: 'multiple_choice', TEXT: 'text', SCALE: 'scale' });
export const QUESTION_CATEGORY = Object.freeze({ SKIN_TYPE: 'skin_type', CHARACTERISTICS: 'characteristics', SENSITIVITY: 'sensitivity', HYDRATION: 'hydration', BARRIER: 'barrier', TEXTURE: 'texture', APPEARANCE: 'appearance', GOALS: 'goals', ROUTINE: 'routine', PRODUCT_USAGE: 'product_usage', LIFESTYLE: 'lifestyle', REGENERATIVE: 'regenerative', AGE_CONTEXT: 'age_context', PHOTOAGING: 'photoaging', CONSULTATION_INTENTION: 'consultation_intention' });

export class AnswerOption extends SchemaBase {
  constructor(data = {}) {
    super(data);
    this.label = data.label !== undefined ? data.label : null;
    this.value = data.value !== undefined ? data.value : null;
    this.score = data.score !== undefined ? data.score : null;
  }
}

export class Question extends SchemaBase {
  constructor(data = {}) {
    super(data);
    this.question_id = data.question_id !== undefined ? data.question_id : (() => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()))();
    this.key = data.key !== undefined ? data.key : null;
    this.text = data.text !== undefined ? data.text : null;
    this.category = data.category !== undefined ? data.category : null;
    this.question_type = data.question_type !== undefined ? data.question_type : null;
    this.order = data.order !== undefined ? data.order : 0;
    this.weight = data.weight !== undefined ? data.weight : 1.0;
    this.stage = data.stage !== undefined ? data.stage : null;
    this.options = data.options !== undefined ? data.options : [];
    this.required = data.required !== undefined ? data.required : true;
    this.depends_on = data.depends_on !== undefined ? data.depends_on : null;
  }
}

export class UserAnswer extends SchemaBase {
  constructor(data = {}) {
    super(data);
    this.answer_id = data.answer_id !== undefined ? data.answer_id : (() => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()))();
    this.question_id = data.question_id !== undefined ? data.question_id : null;
    this.key = data.key !== undefined ? data.key : null;
    this.selected_values = data.selected_values !== undefined ? data.selected_values : [];
    this.text_response = data.text_response !== undefined ? data.text_response : null;
    this.numeric_value = data.numeric_value !== undefined ? data.numeric_value : null;
    this.answered_at = data.answered_at !== undefined ? data.answered_at : (() => new Date().toISOString())();
  }
}

export class Questionnaire extends SchemaBase {
  constructor(data = {}) {
    super(data);
    this.questionnaire_id = data.questionnaire_id !== undefined ? data.questionnaire_id : (() => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()))();
    this.title = data.title !== undefined ? data.title : 'SkinMap Regenerativo';
    this.description = data.description !== undefined ? data.description : null;
    this.version = data.version !== undefined ? data.version : '2.0';
    this.status = data.status !== undefined ? data.status : QUESTIONNAIRE_STATUS.CREATED;
    this.created_at = data.created_at !== undefined ? data.created_at : (() => new Date().toISOString())();
    this.completed_at = data.completed_at !== undefined ? data.completed_at : null;
    this.metadata = data.metadata !== undefined ? data.metadata : {};
    this.questions = data.questions !== undefined ? data.questions : [];
    this.answers = data.answers !== undefined ? data.answers : [];
    this.completion_percentage = data.completion_percentage !== undefined ? data.completion_percentage : 0.0;
    this.journey_context = data.journey_context !== undefined ? data.journey_context : [];
  }
}

export class QuestionnaireValidationRequest extends SchemaBase {
  constructor(data = {}) {
    super(data);
    this.answers = data.answers !== undefined ? data.answers : [];
  }
}