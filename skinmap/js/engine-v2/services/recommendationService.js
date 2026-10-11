/**
 * SkinMap Regenerativo — Recommendation Service
 * Portado de backend/core/skinmap/services/recommendation_service.py (fase31)
 *
 * Coordena a geração de recomendações de consulta a partir de dados de
 * SkinAssessment e SkinProfile. Conecta o fluxo da aplicação com o
 * builder de recomendação (consultation_guidance_builder).
 *
 * Não gera diagnóstico, tratamento ou prescrições.
 */

import { build_guidance } from '../builders/consultationGuidanceBuilder.js';
import {
  SkinRecommendation,
  RecommendationItem,
  RECOMMENDATION_SOURCE,
  RECOMMENDATION_STATUS,
  RECOMMENDATION_CATEGORY,
  RECOMMENDATION_TYPE,
  RECOMMENDATION_PRIORITY,
  RECOMMENDATION_CONFIDENCE,
} from '../schema/recommendation.js';

export class RecommendationService {
  /** Gera uma recomendação estruturada. */
  generate(profile, assessment) {
    const guidance = build_guidance(assessment);

    const recommendation = new SkinRecommendation({
      source: RECOMMENDATION_SOURCE.ASSESSMENT,
      status: RECOMMENDATION_STATUS.GENERATED,
      profile_id: profile.id,
      assessment_id: assessment.assessment_id,
      assessment_version: assessment.assessment_version,
    });

    // Itens de recomendação estruturados
    recommendation.recommendations = this._build_recommendation_items(assessment, guidance);

    // Mapeamento de guidance
    recommendation.consultation_directions = guidance.consultation_directions || [];
    recommendation.strategic_focus = guidance.strategic_focus || [];
    recommendation.insights = guidance.insights || [];
    recommendation.regenerative_focus = guidance.regenerative_focus || [];

    recommendation.metadata = {
      service_version: '2.0',
      generated_from: 'assessment',
      builder_schema_version: guidance.schema_version || 'unknown',
      items_generated: recommendation.recommendations.length,
    };

    // Transferência de contexto do assessment
    recommendation.reported_context = this._clean_unique(assessment.profile_context);
    recommendation.recommendation_context = this._clean_unique(assessment.recommendation_context);
    recommendation.focus_dimensions = this._clean_unique(assessment.analysis_dimensions);

    // Apresentação da recomendação
    recommendation.priority_areas = this._clean_unique(assessment.consultation_dimensions);
    recommendation.summary = this._build_summary(assessment);
    recommendation.recommendation_message = this._build_message(assessment);
    recommendation.long_term_strategy = this._build_long_term_strategy(assessment);

    // Preserva o guidance no assessment
    assessment.consultation_guidance = guidance;

    return recommendation;
  }

  // =================================================
  // Build Recommendation Items
  // =================================================

  /**
   * Converte o guidance de consulta em itens de recomendação estruturados.
   * O serviço não interpreta dados — apenas organiza a saída do builder.
   */
  _build_recommendation_items(assessment, guidance) {
    const items = [];

    const directions = guidance.consultation_directions || [];
    const dimensions = this._clean_unique(assessment.consultation_dimensions);
    const evidence = this._clean_unique(guidance.pattern_context || []);

    for (const direction of directions) {
      if (!direction) continue;

      const item = new RecommendationItem({
        category: RECOMMENDATION_CATEGORY.ROUTINE_ORGANIZATION,
        type: RECOMMENDATION_TYPE.CONSULTATION_PREPARATION,
        priority: RECOMMENDATION_PRIORITY.PRIMARY,
        confidence: RECOMMENDATION_CONFIDENCE.MODERATE,
        title: 'Área de atenção SkinMap',
        description: direction,
        related_dimensions: dimensions,
        evidence_context: evidence,
      });

      items.push(item);
    }

    return items;
  }

  // =================================================
  // Presentation Summary
  // =================================================

  /** Cria o resumo da recomendação. */
  _build_summary(assessment) {
    const dimensions = this._clean_unique(assessment.consultation_dimensions);

    if (!dimensions.length) {
      return 'A orientação personalizada será organizada considerando as informações fornecidas.';
    }

    return (
      'A orientação personalizada considera as dimensões: ' +
      dimensions.join(', ') +
      ' como base para construção da estratégia de consulta.'
    );
  }

  // =================================================
  // Recommendation Message
  // =================================================

  /** Cria a mensagem de apresentação ao usuário. */
  _build_message(_assessment) {
    return (
      'As informações da análise SkinMap foram organizadas para apoiar uma ' +
      'consulta personalizada considerando as características atuais da pele.'
    );
  }

  // =================================================
  // Long Term Strategy
  // =================================================

  /** Cria o texto de orientação de longo prazo. */
  _build_long_term_strategy(_assessment) {
    return (
      'A estratégia de longo prazo será organizada considerando objetivos ' +
      'individuais e evolução das características percebidas.'
    );
  }

  // =================================================
  // Helpers
  // =================================================

  /** Remove valores vazios e duplicados. */
  static _clean_unique(values) {
    if (!values || !values.length) return [];

    const ignored = new Set(['', 'string', 'null', 'none']);
    const result = [];

    for (const value of values) {
      if (value === null || value === undefined) continue;

      const text = String(value).trim();
      if (ignored.has(text.toLowerCase())) continue;

      if (!result.includes(text)) {
        result.push(text);
      }
    }

    return result;
  }

  /** Converte um enum para seu valor simples. */
  static _enum_value(value) {
    if (value === null || value === undefined) return null;
    return typeof value === 'object' && 'value' in value ? value.value : value;
  }

  // Métodos de instância que delegam para os estáticos (espelha o uso interno do Python)
  _clean_unique(values) {
    return RecommendationService._clean_unique(values);
  }
}

// =====================================================
// Factory
// =====================================================

export function create_recommendation_service() {
  return new RecommendationService();
}
