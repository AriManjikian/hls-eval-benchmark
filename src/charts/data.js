import { getModelParams, getModelColor } from '../models.js';

const METRIC_ORDER = [
  'pass_parse',
  'pass_compile',
  'pass_tb',
  'pass_synth',
  'pass_synth_and_tb',
];

export const DATASETS = {
  main: {
    file: 'pass_rates_gen_zero_shot__main.csv',
    title: 'Pass Rate of Zero-Shot Kernel Generation by Model',
    yAxisLabel: 'Pass Rate',
  },
  dataflow: {
    file: 'pass_rates_edit_zero_shot__dataflow.csv',
    title: 'Pass Rate of Zero-Shot Editing by Model: Dataflow Refactoring',
    yAxisLabel: 'Pass Rate',
  },
  loop_tile: {
    file: 'pass_rates_edit_zero_shot__loop_tile.csv',
    title: 'Pass Rate of Zero-Shot Editing by Model: Loop Tiling',
    yAxisLabel: 'Pass Rate',
  },
  label: {
    file: 'pass_rates_edit_zero_shot__label.csv',
    title: 'Pass Rate of Zero-Shot Editing by Model: Loop Labeling',
    yAxisLabel: 'Pass Rate',
  },
  fpx: {
    file: 'pass_rates_edit_zero_shot__fpx.csv',
    title: 'Pass Rate of Zero-Shot Editing by Model: Arbitrary Precision & Fixed-Point Type Translation',
    yAxisLabel: 'Pass Rate',
  },
  inference: {
    file: 'pass_rates_inference_training.csv',
    title: 'Pass Rate by Model: Inference Training',
    yAxisLabel: 'Pass Rate',
  },
  agent: {
    file: 'pass_rates_gen_agent.csv',
    title: 'Pass Rate by Model: Agent',
    yAxisLabel: 'Pass Rate',
  },
};

export async function loadCSV(file) {
  const text = await fetch(`./pass_rate_data/${file}`).then(r => r.text());
  const [, ...rows] = text.trim().split('\n');
  return rows.map(r => {
    const [model, metric, k, rate] = r.split(',');
    return { model, metric, k: Number(k), rate: Number(rate) };
  });
}

export function getMaxSize() {
  return Number(document.getElementById('sizeSlider').value);
}

export function buildModels(data, metrics, passK) {
  const maxSize = getMaxSize();
  const allModels = [...new Set(data.map(d => d.model))];

  return allModels
    .map(model => {
      const params = getModelParams(model);
      if (params > maxSize) return null;
      const color = getModelColor(model);
      const rates = metrics.map(metric =>
        data.find(d => d.model === model && d.metric === metric && d.k === passK)?.rate ?? 0
      );
      return { model, label: `${model} (${params}B)`, params, color, rates };
    })
    .filter(Boolean);
}

export { METRIC_ORDER };
