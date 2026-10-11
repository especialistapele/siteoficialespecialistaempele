/**
 * SkinMap Regenerativo — Questionnaire Validator
 * Portado de backend/core/skinmap/validators/questionnaire_validator.py (fase31)
 *
 * Valida payloads de resposta de questionário.
 * Não interpreta características de pele, nem gera
 * assessments ou recomendações.
 */

export class QuestionnaireValidationResult {
  constructor(valid, errors = null, warnings = null) {
    this.valid = valid;
    this.errors = errors || [];
    this.warnings = warnings || [];
  }
}

/** Valida uma resposta individual do usuário. */
export function validate_answer(answer) {
  const errors = [];
  const warnings = [];

  if (answer === null || answer === undefined) {
    return new QuestionnaireValidationResult(false, ['Answer cannot be empty.']);
  }

  // Identificador da pergunta
  if (!answer.question_id) {
    errors.push('Answer question_id is required.');
  }

  // Conteúdo da resposta
  const hasSelectedValues = Boolean(answer.selected_values && answer.selected_values.length);
  const hasTextResponse = Boolean(answer.text_response);
  const hasNumericValue = answer.numeric_value !== null && answer.numeric_value !== undefined;

  if (!(hasSelectedValues || hasTextResponse || hasNumericValue)) {
    errors.push('Answer cannot be empty.');
  }

  // Valores selecionados
  if (answer.selected_values) {
    if (!Array.isArray(answer.selected_values)) {
      errors.push('Selected values must be a list.');
    } else {
      for (const value of answer.selected_values) {
        if (typeof value !== 'string') {
          errors.push('Selected values must contain only strings.');
        }
      }
    }
  }

  // Resposta em texto
  if (answer.text_response !== null && answer.text_response !== undefined && typeof answer.text_response !== 'string') {
    errors.push('Text response must be a string.');
  }

  // Resposta numérica
  if (
    answer.numeric_value !== null &&
    answer.numeric_value !== undefined &&
    typeof answer.numeric_value !== 'number'
  ) {
    errors.push('Numeric value must be a number.');
  }

  return new QuestionnaireValidationResult(errors.length === 0, errors, warnings);
}

/** Valida o payload de resposta do questionário. */
export function validate_questionnaire(questionnaire) {
  const errors = [];
  const warnings = [];

  if (questionnaire === null || questionnaire === undefined) {
    return new QuestionnaireValidationResult(false, ['Questionnaire response cannot be empty.']);
  }

  // Identidade do questionário
  if ('questionnaire_id' in questionnaire && !questionnaire.questionnaire_id) {
    warnings.push('Questionnaire identifier is missing.');
  }

  // Coleção de respostas
  if (!('answers' in questionnaire)) {
    errors.push('Questionnaire answers field is missing.');
    return new QuestionnaireValidationResult(false, errors, warnings);
  }

  if (!Array.isArray(questionnaire.answers)) {
    errors.push('Questionnaire answers must be a list.');
    return new QuestionnaireValidationResult(false, errors, warnings);
  }

  if (questionnaire.answers.length === 0) {
    errors.push('At least one answer is required.');
  }

  // Validar cada resposta
  for (const answer of questionnaire.answers) {
    const result = validate_answer(answer);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return new QuestionnaireValidationResult(errors.length === 0, errors, warnings);
}

/** Checagem rápida de validade. */
export function is_questionnaire_valid(questionnaire) {
  return validate_questionnaire(questionnaire).valid;
}
