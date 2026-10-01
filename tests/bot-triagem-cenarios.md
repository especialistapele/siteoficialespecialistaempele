# Matriz de testes — Bot de Triagem

Baseada nos 19 casos obrigatórios do documento de especificação.

| Caso | Cenário | Resultado esperado | Status |
|---|---|---|---|
| 1 | Entrar em Acne | Saudação contextual sobre acne, sem presumir diagnóstico | Pendente |
| 2 | Acne → muda para manchas | Contexto muda para manchas | Pendente |
| 3 | Informa Araruama | Rota presencial / Fazendinha; sem endereço completo | Pendente |
| 4 | Informa Cabo Frio | Rota presencial / Riviera; sem endereço completo | Pendente |
| 5 | Informa Copacabana | Rota presencial / Siqueira Campos; sem endereço completo | Pendente |
| 6 | Outra cidade do Brasil | Apresenta Consultoria Online | Pendente |
| 7 | Pede endereço completo | Informa apenas região e diz que endereço completo vem após agendamento | Pendente |
| 8 | Pergunta preço presencial | Não informa preço; encaminha para WhatsApp | Pendente |
| 9 | Pergunta preço online | Essencial R$ 220 / Premium R$ 350 | Pendente |
| 10 | Quer agendar | Encaminha para WhatsApp sem cadastro excessivo | Pendente |
| 11 | Pergunta taxa | Explica regra sem inventar valor | Pendente |
| 12 | Reagendamento | Informa mínimo de 24h | Pendente |
| 13 | Atraso | Informa tolerância máxima de 10 min | Pendente |
| 14 | Devolução da taxa | Informa que não há devolução | Pendente |
| 15 | Paciente existente | Direciona para Login do Paciente | Pendente |
| 16 | Só quer informação | Responde sem pressionar | Pendente |
| 17 | Várias informações de uma vez | Aproveita localização/intenção e evita repetir perguntas | Pendente |
| 18 | Muda completamente de assunto | Atualiza contexto e continua pelo novo assunto | Pendente |
| 19 | Informal/abreviações/erros | Normalização básica reconhece a intenção | Pendente |

## Regra de aprovação

A branch só deve ser promovida para main depois de:

1. validação automática de sintaxe;
2. execução dos 19 cenários;
3. teste mobile;
4. verificação das páginas públicas;
5. confirmação de que nenhum fluxo existente foi quebrado;
6. revisão final do comportamento e dos textos.
