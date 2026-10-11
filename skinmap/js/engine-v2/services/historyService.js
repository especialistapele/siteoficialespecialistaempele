/**
 * SkinMap Regenerativo — History Service
 * Portado de backend/core/skinmap/services/history_service.py (fase31)
 *
 * Gerencia o histórico de assessments gerados durante o processo de
 * consulta do SkinMap. A persistência permanece desacoplada — este
 * serviço só gerencia o ciclo de vida do assessment em memória.
 *
 * Nota: em JS puro (frontend/localStorage), esta classe serve como
 * a estrutura em memória de uma sessão; a persistência entre sessões
 * é responsabilidade do localStorage (assets/js/storage.js), assim
 * como já era responsabilidade do frontend antes desta migração.
 */

export class HistoryService {
  constructor() {
    this._history = [];
  }

  // =================================================
  // Storage
  // =================================================

  /** Armazena um assessment. Evita identificadores duplicados. */
  add(assessment) {
    const existing = this.get_by_id(assessment.assessment_id);
    if (existing) return existing;

    this._history.push(assessment);
    return assessment;
  }

  // =================================================
  // Retrieval
  // =================================================

  list_all() {
    return [...this._history];
  }

  /** Encontra um assessment pelo identificador. */
  get_by_id(assessment_id) {
    for (const assessment of this._history) {
      if (assessment.assessment_id === assessment_id) {
        return assessment;
      }
    }
    return null;
  }

  exists(assessment_id) {
    return this.get_by_id(assessment_id) !== null;
  }

  /** Retorna todos os assessments de um perfil. */
  get_by_profile(profile_id) {
    return this._history.filter((assessment) => assessment.profile_id === profile_id);
  }

  /** Retorna o assessment mais recente do perfil (ordem de inserção). */
  get_latest(profile_id) {
    const assessments = this.get_by_profile(profile_id);
    if (!assessments.length) return null;
    return assessments[assessments.length - 1];
  }

  // =================================================
  // Statistics
  // =================================================

  count() {
    return this._history.length;
  }

  count_by_profile(profile_id) {
    return this.get_by_profile(profile_id).length;
  }

  // =================================================
  // Removal
  // =================================================

  /** Remove um assessment pelo ID. */
  remove(assessment_id) {
    const assessment = this.get_by_id(assessment_id);
    if (!assessment) return false;

    const index = this._history.indexOf(assessment);
    this._history.splice(index, 1);
    return true;
  }

  clear() {
    this._history.length = 0;
  }
}

// =====================================================
// Factory
// =====================================================

export function create_history_service() {
  return new HistoryService();
}
