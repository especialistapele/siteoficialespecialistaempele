(function(){
  function setup(navRoot){
    if(!navRoot) return;
    var toggle = navRoot.querySelector('.nav-toggle');
    if(!toggle) return;

    function close(){
      navRoot.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded','false');
      document.body.classList.remove('nav-scroll-lock');
    }
    function open(){
      navRoot.classList.add('nav-open');
      toggle.setAttribute('aria-expanded','true');
      document.body.classList.add('nav-scroll-lock');
    }
    toggle.addEventListener('click', function(){
      if(navRoot.classList.contains('nav-open')){ close(); } else { open(); }
    });

    // Fecha o menu ao clicar em qualquer link do menu
    navRoot.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', close);
    });

    // Fecha com ESC
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') close();
    });

    // Fecha automaticamente se a tela for redimensionada para desktop
    window.addEventListener('resize', function(){
      if(window.innerWidth > 900) close();
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    setup(document.querySelector('.site-nav'));
    setup(document.querySelector('.site-nav-interna'));
  });
})();
