import { SchemaBase } from './base.js';
export const SKIN_TYPE = Object.freeze({ NORMAL: 'normal', DRY: 'dry', OILY: 'oily', COMBINATION: 'combination' });
export const SENSITIVITY_LEVEL = Object.freeze({ LOW: 'low', MODERATE: 'moderate', HIGH: 'high' });
export const HYDRATION_LEVEL = Object.freeze({ ADEQUATE: 'adequate', LOW: 'low', VERY_LOW: 'very_low' });
export const BARRIER_LEVEL = Object.freeze({ BALANCED: 'balanced', ATTENTION: 'attention', SUPPORT_NEEDED: 'support_needed' });
export const TEXTURE_LEVEL = Object.freeze({ SMOOTH: 'smooth', MODERATE_VARIATION: 'moderate_variation', IRREGULAR: 'irregular' });
export const APPEARANCE_LEVEL = Object.freeze({ BALANCED: 'balanced', MODERATE_ATTENTION: 'moderate_attention', HIGH_ATTENTION: 'high_attention' });
export const PROFILE_STATUS = Object.freeze({ STARTED: 'started', PARTIAL: 'partial', COMPLETED: 'completed' });
export const PROFILE_SOURCE = Object.freeze({ QUESTIONNAIRE: 'questionnaire', CONSULTATION: 'consultation', MANUAL: 'manual' });

export class SkinProfile extends SchemaBase {
  constructor(data = {}) {
    super(data);
    this.id = data.id !== undefined ? data.id : (() => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()))();
    this.profile_id = data.profile_id !== undefined ? data.profile_id : (() => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()))();
    this.profile_version = data.profile_version !== undefined ? data.profile_version : '3.1';
    this.source = data.source !== undefined ? data.source : PROFILE_SOURCE.QUESTIONNAIRE;
    this.status = data.status !== undefined ? data.status : PROFILE_STATUS.STARTED;
    this.created_at = data.created_at !== undefined ? data.created_at : (() => new Date().toISOString())();
    this.updated_at = data.updated_at !== undefined ? data.updated_at : null;
    this.completion_percentage = data.completion_percentage !== undefined ? data.completion_percentage : null;
    this.age_range = data.age_range !== undefined ? data.age_range : null;
    this.consultation_intention = data.consultation_intention !== undefined ? data.consultation_intention : null;
    this.additional_notes = data.additional_notes !== undefined ? data.additional_notes : null;
    this.professional_notes = data.professional_notes !== undefined ? data.professional_notes : null;
    this.skin_type = data.skin_type !== undefined ? data.skin_type : null;
    this.sensitivity_level = data.sensitivity_level !== undefined ? data.sensitivity_level : null;
    this.hydration_level = data.hydration_level !== undefined ? data.hydration_level : null;
    this.barrier_level = data.barrier_level !== undefined ? data.barrier_level : null;
    this.texture_level = data.texture_level !== undefined ? data.texture_level : null;
    this.appearance_level = data.appearance_level !== undefined ? data.appearance_level : null;
    this.characteristics = data.characteristics !== undefined ? data.characteristics : [];
    this.skin_observations = data.skin_observations !== undefined ? data.skin_observations : [];
    this.reported_context = data.reported_context !== undefined ? data.reported_context : [];
    this.reported_characteristics = data.reported_characteristics !== undefined ? data.reported_characteristics : [];
    this.goals = data.goals !== undefined ? data.goals : [];
    this.priority_goals = data.priority_goals !== undefined ? data.priority_goals : [];
    this.regenerative_context = data.regenerative_context !== undefined ? data.regenerative_context : [];
    this.regenerative_interests = data.regenerative_interests !== undefined ? data.regenerative_interests : [];
    this.clinical_restrictions = data.clinical_restrictions !== undefined ? data.clinical_restrictions : [];
    this.routine_patterns = data.routine_patterns !== undefined ? data.routine_patterns : [];
    this.current_products = data.current_products !== undefined ? data.current_products : [];
    this.product_usage_notes = data.product_usage_notes !== undefined ? data.product_usage_notes : null;
    this.routine_consistency = data.routine_consistency !== undefined ? data.routine_consistency : null;
    this.lifestyle_factors = data.lifestyle_factors !== undefined ? data.lifestyle_factors : [];
    this.environmental_factors = data.environmental_factors !== undefined ? data.environmental_factors : [];
    this.photoaging_context = data.photoaging_context !== undefined ? data.photoaging_context : [];
    this.interpretation_ready = data.interpretation_ready !== undefined ? data.interpretation_ready : false;
    this.normalized = data.normalized !== undefined ? data.normalized : false;
  }

  /** Atualiza o timestamp de modificação do perfil. */
  touch() {
    this.updated_at = new Date().toISOString();
  }

  /** Retorna o percentual de conclusão normalizado entre 0 e 1. */
  completion_ratio() {
    if (this.completion_percentage === null || this.completion_percentage === undefined) {
      return 0.0;
    }
    return this.completion_percentage / 100.0;
  }

  /** Indica se o perfil contém as informações mínimas exigidas pelo DiagnosticEngine. */
  is_ready_for_assessment() {
    const requiredFields = [
      this.skin_type,
      this.hydration_level,
      this.sensitivity_level,
      this.barrier_level,
    ];
    return requiredFields.every((f) => f !== null && f !== undefined);
  }

  /** Exporta a estrutura normalizada consumida pelo DiagnosticEngine e serviços downstream. */
  to_assessment_context() {
    return {
      skin_type: this.skin_type ?? null,
      hydration_level: this.hydration_level ?? null,
      sensitivity_level: this.sensitivity_level ?? null,
      barrier_level: this.barrier_level ?? null,
      texture_level: this.texture_level ?? null,
      appearance_level: this.appearance_level ?? null,
      characteristics: [...this.characteristics],
      skin_observations: [...this.skin_observations],
      reported_context: [...this.reported_context],
      goals: [...this.goals],
      priority_goals: [...this.priority_goals],
      routine_patterns: [...this.routine_patterns],
      current_products: [...this.current_products],
      lifestyle_factors: [...this.lifestyle_factors],
      environmental_factors: [...this.environmental_factors],
      photoaging_context: [...this.photoaging_context],
      regenerative_context: [...this.regenerative_context],
      consultation_intention: this.consultation_intention,
      additional_notes: this.additional_notes,
    };
  }
}