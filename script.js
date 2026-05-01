// Small interactions: year, mobile nav, modal, smooth scroll, simple form handlers
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
navToggle && navToggle.addEventListener('click', () => {
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!expanded));
  if (mobileMenu.hasAttribute('hidden')) mobileMenu.removeAttribute('hidden'); else mobileMenu.setAttribute('hidden', '');
});

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const href = a.getAttribute('href');
    if(!href || href === '#') return;
    const target = document.querySelector(href);
    if(target){ e.preventDefault(); target.scrollIntoView({behavior:'smooth', block:'start'});
      if(!mobileMenu.hasAttribute('hidden')) mobileMenu.setAttribute('hidden','');
      navToggle && navToggle.setAttribute('aria-expanded','false');
    }
  });
});

// Modal register
const openRegister = document.getElementById('openRegister');
const openRegisterMobile = document.getElementById('openRegisterMobile');
const openRegisterHero = document.getElementById('openRegisterHero');
const modalBackdrop = document.getElementById('modalBackdrop');
const closeModal = document.getElementById('closeModal');
const cancelRegister = document.getElementById('cancelRegister');

function openModal(){
  modalBackdrop && modalBackdrop.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  const firstInput = modalBackdrop.querySelector('input');
  firstInput && firstInput.focus();
}
function closeModalFn(){
  modalBackdrop && modalBackdrop.setAttribute('hidden','');
  document.body.style.overflow = '';
}

openRegister && openRegister.addEventListener('click', openModal);
openRegisterMobile && openRegisterMobile.addEventListener('click', openModal);
openRegisterHero && openRegisterHero.addEventListener('click', openModal);
closeModal && closeModal.addEventListener('click', closeModalFn);
cancelRegister && cancelRegister.addEventListener('click', closeModalFn);
modalBackdrop && modalBackdrop.addEventListener('click', (e)=>{
  if(e.target === modalBackdrop) closeModalFn();
});

// Contact form handler (simulate)
const contactForm = document.getElementById('contactForm');
const contactStatus = document.getElementById('contactStatus');
if(contactForm){
  contactForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(contactForm);
    const name = (fd.get('name')||'').toString().trim();
    const email = (fd.get('email')||'').toString().trim();
    const message = (fd.get('message')||'').toString().trim();
    if(!name || !email || !message){ contactStatus.textContent = 'Please complete all fields.'; return; }
    contactStatus.textContent = 'Sending...';
    setTimeout(()=>{ contactStatus.textContent = 'Thanks — we received your message.'; contactForm.reset(); }, 900);
  });
}

// Register form handler (simulate)
const registerForm = document.getElementById('registerForm');
const registerStatus = document.getElementById('registerStatus');
if(registerForm){
  registerForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(registerForm);
    const fullname = (fd.get('fullname')||'').toString().trim();
    const email = (fd.get('regemail')||'').toString().trim();
    const pass = (fd.get('password')||'').toString().trim();
    if(!fullname || !email || !pass){ registerStatus.textContent = 'Please fill all fields.'; return; }
    registerStatus.textContent = 'Creating account...';
    setTimeout(()=>{ registerStatus.textContent = 'Account created. Welcome!'; registerForm.reset(); setTimeout(closeModalFn, 900); }, 900);
  });
}
