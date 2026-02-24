import { DATASETS, loadCSV, getMaxSize } from './data.js';
import { getModelParams, getModelColor } from '../models.js';

const INFERENCE_METRIC = 'pass_synth_and_tb';
const ALL_K = Array.from({ length: 40 }, (_, i) => i + 1);
const TABLE_K = [1, 5, 10, 20, 40];

let chartInstance = null;
function getChart() {
  if (!chartInstance) {
    chartInstance = echarts.init(document.getElementById('line-chart'));
  }
  return chartInstance;
}

async function getPreparedData() {
  const config = DATASETS['inference'];
  const data = await loadCSV(config.file);
  const maxSize = getMaxSize();
  const allModels = [...new Set(data.map(d => d.model))];
  const models = allModels
    .map(model => {
      const params = getModelParams(model);
      if (params > maxSize) return null;
      const color = getModelColor(model);
      const rates = ALL_K.map(k =>
        data.find(d => d.model === model && d.metric === INFERENCE_METRIC && d.k === k)?.rate ?? null
      );
      return { model, label: `${model} (${params}B)`, params, color, rates };
    })
    .filter(Boolean);
  return { config, data, models };
}

export async function renderInferenceChart() {
  const chart = getChart();
  const { config, models } = await getPreparedData();
  const series = models.map(m => ({
    name: m.label,
    type: 'line',
    data: m.rates,
    itemStyle: { color: m.color },
    lineStyle: { color: m.color },
    connectNulls: false,
  }));
  chart.setOption({
    title: {
      text: config.title,
      subtext: `Metric: ${INFERENCE_METRIC}`,
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter: params => {
        const k = params[0]?.axisValue;
        let out = `<b>${k}</b><br/>`;
        params.forEach(p => {
          if (p.value != null) {
            out += `${p.marker} ${p.seriesName}: ${(p.value * 100).toFixed(1)}%<br/>`;
          }
        });
        return out;
      },
    },
    legend: { data: series.map(s => s.name), type: 'scroll', bottom: 0 },
    grid: { bottom: 120, top: 70 },
    xAxis: {
      type: 'category',
      name: 'k',
      nameLocation: 'middle',
      nameGap: 30,
      data: ALL_K.map(k => `pass@${k}`),
      axisLabel: {
        interval: (index, value) => [1, 5, 10, 20, 40].includes(ALL_K[index]),
      },
    },
    yAxis: { type: 'value', name: 'Pass Rate (synth & tb)', min: 0, max: 1 },
    series,
  }, true);
}

export async function renderInferenceTable() {
  const { data, models } = await getPreparedData();
  const container = document.getElementById('data-table');
  let html = '<table><thead><tr><th>Model</th>';
  TABLE_K.forEach(k => { html += `<th>pass@${k}</th>`; });
  html += '</tr></thead><tbody>';
  models.forEach(m => {
    html += `<tr>
      <td style="border-left:4px solid ${m.color}; padding-left:8px;">
        <strong>${m.model}</strong> (${m.params}B)
      </td>`;
    TABLE_K.forEach(k => {
      const r = m.rates[k - 1];
      html += `<td>${r != null ? (r * 100).toFixed(1) + '%' : '—'}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}
