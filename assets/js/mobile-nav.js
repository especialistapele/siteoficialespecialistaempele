(function(){
  function setup(navRoot){
    if(!navRoot) return;
    var toggle = navRoot.querySelector('.nav-toggle');
    if(!toggle) return;
    var controlled = Array.from(navRoot.querySelectorAll('.nav-links, .nav-links-interna, .nav-login, .nav-login-interna'));
    function syncInert(){
      var collapsed = window.innerWidth <= 900 && !navRoot.classList.contains('nav-open');
      controlled.forEach(function(el){
        if(collapsed) el.setAttribute('inert','');
        else el.removeAttribute('inert');
      });
    }
    function close(restoreFocus){
      var wasOpen = navRoot.classList.contains('nav-open');
      navRoot.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Abrir menu');
      document.body.classList.remove('nav-scroll-lock');
      syncInert();
      if(restoreFocus && wasOpen) toggle.focus();
    }
    function open(){
      navRoot.classList.add('nav-open');
      toggle.setAttribute('aria-expanded','true');
      toggle.setAttribute('aria-label','Fechar menu');
      document.body.classList.add('nav-scroll-lock');
      syncInert();
    }
    syncInert();
    toggle.addEventListener('click', function(){
      if(navRoot.classList.contains('nav-open')) close(false); else open();
    });
    navRoot.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ close(false); });
    });
    document.addEventListener('click', function(e){
      if(navRoot.classList.contains('nav-open') && !navRoot.contains(e.target)) close(false);
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') close(true);
    });
    window.addEventListener('resize', function(){
      if(window.innerWidth > 900) close(false);
      else syncInert();
    });
  }
  document.addEventListener('DOMContentLoaded', function(){
    setup(document.querySelector('.site-nav'));
    setup(document.querySelector('.site-nav-interna'));
  });
})();
