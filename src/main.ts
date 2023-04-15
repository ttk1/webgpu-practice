import demo01 from './demo01/main';
import original from './original/main';

const pages = {
  original: original,
  demo01: demo01,
};

function index() {
  const ul = document.body.appendChild(document.createElement('ul'));
  for (const page in pages) {
    const a = ul.appendChild(document.createElement('li')).appendChild(document.createElement('a'));
    a.href = './index.html?page=' + page;
    a.textContent = page;
  }
}

window.onload = async () => {
  (pages[new URL(window.location.href).searchParams.get('page')] || index)();
};
