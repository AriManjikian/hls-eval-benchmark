import { DATASETS, loadCSV, buildModels, METRIC_ORDER } from './data.js';

let chartInstance = null;

function getChart() {
  if (!chartInstance) {
    chartInstance = echarts.init(document.getElementById('line-chart'));
  }
  return chartInstance;
}

async function getPreparedData(passK) {
  const config = DATASETS['agent'];
  const data = await loadCSV(config.file);
  const metrics = METRIC_ORDER.filter(m => data.some(d => d.metric === m));
  const models = buildModels(data, metrics, passK);
  return { config, metrics, models };
}

export async function renderAgentChart(datasetKey, passK) {
  const chart = getChart();
  const { config, metrics, models } = await getPreparedData(passK);

  const series = models.map(m => ({
    name: m.label,
    type: 'line',
    data: m.rates,
    itemStyle: { color: m.color },
    lineStyle: { color: m.color },
  }));

  chart.setOption({
    title: {
      text: `${config.title} (pass@${passK})`,
      left: 'center',
    },
    tooltip: { trigger: 'axis' },
    legend: {
      data: series.map(s => s.name),
      type: 'scroll',
      bottom: 0,
    },
    grid: { bottom: 120, top: 60 },
    xAxis: {
      type: 'category',
      data: metrics,
      axisLabel: { rotate: 30, interval: 0 },
    },
    yAxis: {
      type: 'value',
      name: config.yAxisLabel ?? 'Pass Rate',
      min: 0,
      max: 1,
    },
    series,
  }, true);
}

export async function renderAgentTable(datasetKey, passK) {
  const { metrics, models } = await getPreparedData(passK);
  const container = document.getElementById('data-table');

  let html = '<table><thead><tr><th>Model</th>';
  metrics.forEach(m => { html += `<th>${m}</th>`; });
  html += '</tr></thead><tbody>';

  models.forEach(m => {
    html += `<tr>
      <td style="border-left:4px solid ${m.color}; padding-left:8px;">
        <strong>${m.model}</strong> (${m.params}B)
      </td>`;
    m.rates.forEach(r => { html += `<td>${(r * 100).toFixed(1)}%</td>`; });
    html += '</tr>';
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}
