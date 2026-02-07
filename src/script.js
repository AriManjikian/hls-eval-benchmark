const lineChart = echarts.init(document.getElementById("line-chart"));
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
};
async function loadCSV(file) {
  const text = await fetch(`./pass_rate_data/${file}`).then(r => r.text());
  const [header, ...rows] = text.trim().split("\n");
  return rows.map(r => {
    const [model, metric, k, rate] = r.split(",");
    return { model, metric, k: Number(k), rate: Number(rate) };
  });
}
async function renderLineChart(datasetKey, passK) {
  const config = DATASETS[datasetKey];
  const data = await loadCSV(config.file);
  const metrics = METRIC_ORDER.filter(m =>
    data.some(d => d.metric === m)
  );
  const models = [...new Set(data.map(d => d.model))];
  const series = models.map(model => {
    const passData = metrics.map(metric =>
      data.find(d => d.model === model && d.metric === metric && d.k === passK)?.rate ?? 0
    );
    return {
      name: model,
      type: "line",
      data: passData
    };
  });

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
    series: series
  });
}
function updateCharts() {
  const selected = document.querySelector("input[name=dataset]:checked");
  const [dataset, pass] = selected.value.split("-");
  const passK = Number(pass);
  renderLineChart(dataset, passK);
}
document.querySelectorAll("input[name=dataset]").forEach(radio => {
  radio.addEventListener("change", updateCharts);
});
renderLineChart("main", 1);
