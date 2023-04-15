import basic_render_pipeline from './basic_render_pipeline/main';
import basic_compute_pipeline from './basic_compute_pipeline/main';
import demo01 from './demo01/main';
import demo02 from './demo02/main';

const pages = {
  basic_render_pipeline: basic_render_pipeline,
  basic_compute_pipeline: basic_compute_pipeline,
  demo01: demo01,
  demo02: demo02,
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
