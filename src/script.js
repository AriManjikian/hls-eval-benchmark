import { MODEL_INFO, getModelParams, getModelColor } from './models.js';

const METRIC_ORDER = [
  "pass_parse",
  "pass_compile",
  "pass_tb",
  "pass_synth_and_tb",
  "pass_synth"
];

const DATASETS = {
  main: {
    file: "pass_rates_gen_zero_shot__main.csv",
    title: "Pass Rate of Zero-Shot Kernel Generation by Model",
    yAxisLabel: "Pass Rate"
  },
  dataflow: {
    file: "pass_rates_edit_zero_shot__dataflow.csv",
    title: "Pass Rate of Zero-Shot Ediding by Model: Dataflow Refactoring",
    yAxisLabel: "Pass Rate"
  },
  loop_tile: {
    file: "pass_rates_edit_zero_shot__loop_tile.csv",
    title: "Pass Rate of Zero-Shot Ediding by Model: Loop Tiling",
    yAxisLabel: "Pass Rate"
  },
  label: {
    file: "pass_rates_edit_zero_shot__label.csv",
    title: "Pass Rate of Zero-Shot Ediding by Model: Loop Labeling",
    yAxisLabel: "Pass Rate"
  },
  fpx: {
    file: "pass_rates_edit_zero_shot__fpx.csv",
    title: "Pass Rate of Zero-Shot Ediding by Model: Arbitrary Precision and Fixed-Point Type Translation",
    yAxisLabel: "Pass Rate"
  },
  inference: {
    file: "pass_rates_inference_training.csv",
    title: "Pass Rate by Model: Inference Training",
    yAxisLabel: "Pass Rate",
  },
  agent: {
    file: "pass_rates_gen_agent.csv",
    title: "Pass Rate by Model: Agent",
    yAxisLabel: "Pass Rate",
  },
};

async function loadCSV(file) {
  const text = await fetch(`./pass_rate_data/${file}`).then(r => r.text());
  const [header, ...rows] = text.trim().split("\n");
  return rows.map(r => {
    const [model, metric, k, rate] = r.split(",");
    return { model, metric, k: Number(k), rate: Number(rate) };
  });
}

async function getPreparedData(datasetKey, passK) {
  const config = DATASETS[datasetKey];
  const data = await loadCSV(config.file);

  const metrics = METRIC_ORDER.filter(m =>
    data.some(d => d.metric === m)
  );

  const allModels = [...new Set(data.map(d => d.model))];

  const sizeSlider = document.getElementById("sizeSlider");
  const maxSize = Number(sizeSlider.value);

  const models = allModels
    .map(model => {
      const params = getModelParams(model);
      if (params > maxSize) return null;

      const color = getModelColor(model);
      const rates = metrics.map(metric =>
        data.find(d =>
          d.model === model &&
          d.metric === metric &&
          d.k === passK
        )?.rate ?? 0
      );

      return {
        model,
        label: `${model} (${params}B)`,
        params,
        color,
        rates,
      };
    })
    .filter(Boolean);

  return {
    config,
    metrics,
    models,
  };
}

async function renderLineChart(datasetKey, passK) {

  const lineChart = echarts.init(document.getElementById("line-chart"));
  const { config, metrics, models } = await getPreparedData(datasetKey, passK);


  const series = models.map(m => ({
    name: m.label,
    rawModel: m.model,
    type: "line",
    data: m.rates,
    itemStyle: { color: m.color },
    lineStyle: { color: m.color },
  }));

  const title = passK ? `${config.title} (pass@${passK})` : config.title;

  lineChart.setOption({
    title: {
      text: title,
      subtext: config.subtitle || '',
      left: 'center'
    },
    tooltip: { trigger: "axis" },
    legend: {
      data: series.map(s => s.name),
      type: 'scroll',
      bottom: 0
    },
    grid: { bottom: 120, top: config.subtitle ? 80 : 60 },
    xAxis: {
      type: "category",
      data: metrics,
      axisLabel: { rotate: 30, interval: 0 }
    },
    yAxis: {
      type: "value",
      name: config.yAxisLabel || "Pass Rate",
      min: 0,
      max: config.yAxisMax || 1
    },
    series: series,
  },
    true
  );
}

async function renderTable(datasetKey, passK) {
  const { metrics, models } = await getPreparedData(datasetKey, passK);
  const tableContainer = document.getElementById("data-table");

  let html = '<table><thead><tr><th>Model</th>';
  metrics.forEach(metric => {
    html += `<th>${metric}</th>`;
  });
  html += '</tr></thead><tbody>';

  models.forEach(m => {
    html += `
      <tr>
        <td style="border-left: 4px solid ${m.color}; padding-left: 8px;">
          <strong>${m.model}</strong> (${m.params}B)
        </td>
    `;

    m.rates.forEach(rate => {
      html += `<td>${(rate * 100).toFixed(1)}%</td>`;
    });

    html += '</tr>';
  });

  html += '</tbody></table>';
  tableContainer.innerHTML = html;
}

// Slider
const sizeSlider = document.getElementById("sizeSlider");
const sizeValue = document.getElementById("sizeValue");

const sizeValues = [...new Set(Object.values(MODEL_INFO)
  .map(info => info.active_params_billion ?? info.params_billion))]
  .sort((a, b) => a - b);

sizeSlider.min = Math.min(...sizeValues);
sizeSlider.max = Math.max(...sizeValues);
sizeSlider.step = 1;
sizeSlider.value = sizeSlider.max;
sizeValue.textContent = sizeSlider.value;

// Events
function updateCharts() {
  const selected = document.querySelector("input[name=dataset]:checked");
  const [dataset, pass] = selected.value.split("-");
  const passK = Number(pass);
  renderLineChart(dataset, passK);
  renderTable(dataset, passK);
}

sizeSlider.addEventListener("input", function() {
  const closestSize = sizeValues.reduce((prev, curr) => {
    return (Math.abs(curr - sizeSlider.value) < Math.abs(prev - sizeSlider.value) ? curr : prev);
  });
  sizeSlider.value = closestSize;
  sizeValue.textContent = closestSize;
  updateCharts();
});

document.querySelectorAll("input[name=dataset]").forEach(radio => {
  radio.addEventListener("change", updateCharts);
});

// Initial Render
renderLineChart("main", 1);
renderTable("main", 1);
