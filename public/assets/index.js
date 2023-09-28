
const fadeElement = document.querySelector('#skill-container');

function fadeInOnScroll() {
  const elementPosition = fadeElement.getBoundingClientRect().top;
  const windowHeight = window.innerHeight;

  if (elementPosition < windowHeight) {
    fadeElement.classList.add('animate__backInLeft');
  }
  else {
    fadeElement.classList.remove('animate__backInLeft');
  }

}

window.addEventListener('scroll', fadeInOnScroll);

const animateElements = document.querySelectorAll('.animate');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate__animated', 'animate__fadeInDown');
    }
   
  });
}, {
  threshold: 0,
  root: null
});
animateElements.forEach(element => {
  observer.observe(element);
});






