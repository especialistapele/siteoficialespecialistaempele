/**
 * SkinMap Regenerativo — Decision Engine
 * Portado de backend/core/skinmap/engines/decision_engine.py (fase31)
 *
 * Núcleo de decisão do DiagnosticEngine: aplicação das regras
 * contextuais (`rules/decisionRules.js`) sobre o perfil, e o cálculo
 * do score de confiança estrutural do assessment.
 *
 * Nenhuma regra de decisão foi alterada nesta migração — os valores,
 * limiares (0.75, 0.40, /20) e a ordem de avaliação são exatamente
 * os mesmos do código Python original.
 */

import { evaluate_rule, get_decision_rule } from '../rules/decisionRules.js';
import { ASSESSMENT_CONFIDENCE } from '../schema/assessment.js';
import * as result_builder from './resultBuilder.js';

// =====================================================
// DECISION RULES
// =====================================================

/** Aplica as regras contextuais do SkinMap. */
export function apply_decision_rules(decision_rules, profile, assessment) {
  // equivalente a profile.model_dump() no Python: os campos já são
  // valores primitivos (strings) no objeto JS, então um spread simples basta.
  const profile_data = { ...profile };

  for (const rule_key of decision_rules) {
    if (!evaluate_rule(rule_key, profile_data)) continue;

    const rule = get_decision_rule(rule_key);
    if (!rule) continue;

    const title = rule.title;
    const insight = rule.insight;

    if (title) {
      result_builder.add_consultation_dimension(assessment, title);
    }

    if (insight) {
      result_builder.add_observation(assessment.regenerative_context, insight);
      result_builder.add_observation(assessment.recommendation_context, insight);
    }
  }
}

// =====================================================
// CONFIDENCE CALCULATION
// =====================================================

/**
 * Calcula o score de confiança estrutural.
 * Não representa certeza clínica — apenas a quantidade de informação
 * estruturada disponível durante o processamento do SkinMap.
 */
export function calculate_confidence(assessment) {
  let score = 0;

  if (assessment.analysis_dimensions && assessment.analysis_dimensions.length) {
    score += assessment.analysis_dimensions.length;
  }

  if (assessment.identified_patterns && assessment.identified_patterns.length) {
    score += assessment.identified_patterns.length;
  }

  if (assessment.reported_characteristics && assessment.reported_characteristics.length) {
    score += 1;
  }

  if (assessment.reported_observations && assessment.reported_observations.length) {
    score += 1;
  }

  if (score === 0) {
    assessment.confidence_score = 0.0;
    return;
  }

  const normalized_score = Math.min(score / 20, 1.0);
  assessment.confidence_score = Math.round(normalized_score * 100) / 100;

  // Suporte à classificação
  if (normalized_score >= 0.75) {
    assessment.confidence_level = ASSESSMENT_CONFIDENCE.HIGH;
  } else if (normalized_score >= 0.4) {
    assessment.confidence_level = ASSESSMENT_CONFIDENCE.MODERATE;
  } else {
    assessment.confidence_level = ASSESSMENT_CONFIDENCE.LOW;
  }
}
