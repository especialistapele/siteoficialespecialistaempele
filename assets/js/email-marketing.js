import { supabase } from "./supabase-client.js";

const CONSENT_TEXT = "Autorizo receber novidades, conteúdos e ofertas da Especialista em Pele por e-mail.";
document.querySelectorAll("[data-email-marketing-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const emailInput = form.querySelector('input[name="email"]');
    const checkbox = form.querySelector('input[name="consent"]');
    const button = form.querySelector('button[type="submit"]');
    const feedback = form.querySelector("[data-email-marketing-feedback]");
    const email = (emailInput?.value || "").trim().toLowerCase();
    if (!email || !checkbox?.checked) {
      feedback.textContent = "Informe um e-mail válido e marque a autorização para continuar.";
      return;
    }
    button.disabled = true;
    feedback.textContent = "Registrando sua autorização…";
    const { error } = await supabase.from("email_marketing_subscribers").insert({
      email,
      consent_text: CONSENT_TEXT,
      consent_source: location.pathname === "/cookies.html" ? "site_cookies" : "site_home"
    });
    if (error) {
      if (error.code === "23505") {
        feedback.textContent = "Este e-mail já consta no cadastro. Se desejar cancelar, solicite pelo WhatsApp (21) 99219-7518.";
      } else {
        feedback.textContent = "Não foi possível concluir agora. Tente novamente mais tarde.";
        console.error("Falha no cadastro de e-mail marketing:", error);
      }
      button.disabled = false;
      return;
    }
    form.reset();
    feedback.textContent = "Autorização registrada. Obrigada por se cadastrar!";
    button.disabled = false;
  });
});
