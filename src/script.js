import { MODEL_INFO, getModelParams, getModelColor } from './models.js';
import { renderZeroShotChart, renderZeroShotTable } from './charts/zero-shot.js';
import { renderInferenceChart, renderInferenceTable } from './charts/inference.js';
import { renderAgentChart, renderAgentTable } from './charts/agents.js';

const tabs = document.querySelectorAll('.section-tab');
const sections = document.querySelectorAll('.dataset-section');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.section;
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    sections.forEach(sec => {
      sec.classList.toggle('active', sec.id === `section-${target}`);
    });

    const activeSection = document.getElementById(`section-${target}`);
    const radios = activeSection.querySelectorAll('input[type="radio"]');
    const anyChecked = [...radios].some(r => r.checked);
    if (!anyChecked && radios.length > 0) {
      radios[0].checked = true;
    }

    updateCharts();
  });
});

const sizeSlider = document.getElementById('sizeSlider');
const sizeValue = document.getElementById('sizeValue');

const sizeValues = [...new Set(
  Object.values(MODEL_INFO).map(info => info.active_params_billion ?? info.params_billion)
)].sort((a, b) => a - b);

sizeSlider.min = Math.min(...sizeValues);
sizeSlider.max = Math.max(...sizeValues);
sizeSlider.step = 1;
sizeSlider.value = sizeSlider.max;
sizeValue.textContent = sizeSlider.value;

sizeSlider.addEventListener('input', () => {
  const closest = sizeValues.reduce((prev, curr) =>
    Math.abs(curr - sizeSlider.value) < Math.abs(prev - sizeSlider.value) ? curr : prev
  );
  sizeSlider.value = closest;
  sizeValue.textContent = closest;
  updateCharts();
});

export function getMaxSize() {
  return Number(sizeSlider.value);
}

export { getModelParams, getModelColor };

function getActiveSelection() {
  const selected = document.querySelector("input[name=dataset]:checked");
  if (!selected) return null;
  const [dataset, pass] = selected.value.split('-');
  return { dataset, passK: Number(pass) };
}

function getActiveSection() {
  return document.querySelector('.section-tab.active')?.dataset.section ?? 'zero-shot';
}

export function updateCharts() {
  const sel = getActiveSelection();
  if (!sel) return;
  const { dataset, passK } = sel;
  const section = getActiveSection();

  if (section === 'zero-shot') {
    renderZeroShotChart(dataset, passK);
    renderZeroShotTable(dataset, passK);
  } else if (section === 'inference') {
    renderInferenceChart(dataset);
    renderInferenceTable(dataset);
  } else if (section === 'agents') {
    renderAgentChart(dataset, passK);
    renderAgentTable(dataset, passK);
  }
}

document.querySelectorAll("input[name=dataset]").forEach(radio => {
  radio.addEventListener('change', updateCharts);
});

renderZeroShotChart('main', 1);
renderZeroShotTable('main', 1);
