import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const auth = readFileSync("painel/assets/js/painel-auth.js", "utf8");
const loginHtml = readFileSync("painel/index.html", "utf8");
const inlineScript = loginHtml.match(/<script>([\s\S]*?)<\/script>/i)?.[1];

assert.ok(inlineScript, "login precisa manter o script de autenticação");
new vm.Script(inlineScript, { filename: "painel/index.html:inline-script" });

const resolver = auth.match(/export async function resolverDestino\(userId\) \{([\s\S]*?)\n\}/)?.[1];
assert.ok(resolver, "resolverDestino deve existir");
assert.match(resolver, /if \(typeof userId !== "string" \|\| !userId\.trim\(\)\) return null/);
assert.match(resolver, /if \(erroPerfil\) return null/);
assert.match(resolver, /if \(erroPaciente \|\| !paciente \|\| paciente\.acesso_painel === false\) return null/);
assert.match(resolver, /\.maybeSingle\(\)/);
assert.doesNotMatch(resolver, /acesso_painel !== false/, "cadastro ausente nunca pode ser interpretado como paciente autorizado");

const adminGuard = auth.match(/export async function exigirAdmin\(\) \{([\s\S]*?)\n\}/)?.[1];
const patientGuard = auth.match(/export async function exigirPaciente\(\) \{([\s\S]*?)\n\}/)?.[1];
assert.ok(adminGuard && patientGuard, "os dois guards devem existir");
assert.match(adminGuard, /if \(error\) \{\s*redirecionar\(TEMPORARY_ERROR_URL\)/);
assert.match(adminGuard, /perfil\.role !== "admin"/);
assert.doesNotMatch(adminGuard, /auth\.signOut/, "falha temporária do guard administrativo não encerra a sessão");
assert.match(patientGuard, /if \(error\) \{\s*redirecionar\(TEMPORARY_ERROR_URL\)/);
assert.match(patientGuard, /!paciente \|\| paciente\.acesso_painel === false/);
assert.doesNotMatch(patientGuard, /auth\.signOut/, "falha temporária do guard de paciente não encerra a sessão");

const logout = auth.match(/export function configurarBotaoSair\([\s\S]*?(?=\nexport function mostrarFlash)/)?.[0];
assert.ok(logout, "logout deve existir");
assert.match(logout, /await supabase\.auth\.signOut\(\)/);
assert.match(logout, /logoutPending/);
assert.match(logout, /signOut\(\{ scope: "local" \}\)/);
assert.match(logout, /data-private-content/);

assert.match(loginHtml, /signInWithPassword/);
assert.match(loginHtml, /Não foi possível entrar com essas credenciais/);
assert.match(loginHtml, /botao\.disabled = false/);
assert.match(loginHtml, /sistema de login não conseguiu carregar/);
assert.doesNotMatch(loginHtml, /console\.error\(/, "login não deve despejar objetos de erro no console");
assert.doesNotMatch(auth, /SUPABASE_SERVICE_ROLE_KEY\\s*=|sb_secret_[A-Za-z0-9]+/i, "segredos privilegiados não podem aparecer no frontend");

console.log("Segurança estática da autenticação: OK — guards, fail-closed, login, logout e ausência de chaves privilegiadas.");
