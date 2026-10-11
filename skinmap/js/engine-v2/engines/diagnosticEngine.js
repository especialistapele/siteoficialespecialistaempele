/**
 * SkinMap Regenerativo — Diagnostic Engine
 * Portado de backend/core/skinmap/engines/diagnostic_engine.py (fase31)
 *
 * Transforma dados de SkinProfile em informação estruturada de
 * SkinAssessment. Aplica as regras de interpretação do SkinMap e
 * organiza padrões de pele percebidos.
 *
 * Não gera diagnóstico, tratamento, prescrições, recomendações ou
 * relatórios finais. `analyze()` apenas orquestra, em ordem, os
 * componentes extraídos (assessment_context, decision_engine,
 * dimension_analyzers, result_builder) — nenhuma lógica de decisão
 * vive nesta classe.
 */

import { SkinAssessment, ASSESSMENT_STATUS } from '../schema/assessment.js';
import * as assessment_context from './assessmentContext.js';
import * as decision_engine from './decisionEngine.js';
import * as dimension_analyzers from './dimensionAnalyzers.js';
import * as result_builder from './resultBuilder.js';

export class DiagnosticEngine {
  static ENGINE_VERSION = '2.0';

  constructor() {
    this.decision_rules = [
      'oiliness_with_low_hydration',
      'sensitivity_with_barrier_attention',
      'dryness_with_texture_variation',
      'appearance_goal_alignment',
      'regenerative_consultation_interest',
      'skin_quality_evolution_interest',
      'long_term_skin_strategy_interest',
    ];
  }

  // =====================================================
  // MAIN EXECUTION
  // =====================================================

  /**
   * Gera um SkinAssessment a partir de um SkinProfile.
   * Este método apenas orquestra a interpretação.
   */
  analyze(profile) {
    if (!profile) {
      throw new Error('SkinProfile cannot be empty.');
    }

    const assessment = new SkinAssessment({
      status: ASSESSMENT_STATUS.GENERATED,
      profile_id: profile.id,
    });

    // Extração de contexto primário
    assessment.skin_type = result_builder.extract_value(profile.skin_type);
    assessment.hydration_level = result_builder.extract_value(profile.hydration_level);
    assessment.sensitivity_level = result_builder.extract_value(profile.sensitivity_level);
    assessment.barrier_status = result_builder.extract_value(profile.barrier_level);

    assessment_context.register_dimensions(profile, assessment);

    dimension_analyzers.analyze_skin_type(profile, assessment);
    dimension_analyzers.analyze_hydration(profile, assessment);
    dimension_analyzers.analyze_sensitivity(profile, assessment);
    dimension_analyzers.analyze_barrier(profile, assessment);
    dimension_analyzers.analyze_texture(profile, assessment);
    dimension_analyzers.analyze_appearance(profile, assessment);
    dimension_analyzers.analyze_context(profile, assessment);

    decision_engine.apply_decision_rules(this.decision_rules, profile, assessment);
    decision_engine.calculate_confidence(assessment);

    assessment_context.normalize_assessment(assessment);
    assessment_context.attach_metadata(assessment, 'DiagnosticEngine', DiagnosticEngine.ENGINE_VERSION);

    return assessment;
  }
}

// =====================================================
// FACTORY
// =====================================================

/** Cria uma instância de DiagnosticEngine. */
export function create_diagnostic_engine() {
  return new DiagnosticEngine();
}
