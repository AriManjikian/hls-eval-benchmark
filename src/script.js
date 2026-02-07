const lineChart = echarts.init(document.getElementById("line-chart"));

const METRIC_ORDER = [
  "pass_parse",
  "pass_compile",
  "pass_tb",
  "pass_synth_and_tb",
  "pass_synth"
];

const DATASETS = {
  main: "pass_rates_gen_zero_shot__main.csv",
  dataflow: "pass_rates_edit_zero_shot__dataflow.csv",
  loop_tile: "pass_rates_edit_zero_shot__loop_tile.csv",
  label: "pass_rates_edit_zero_shot__label.csv",
  fpx: "pass_rates_edit_zero_shot__fpx.csv",
  inference: "pass_rates_inference_training.csv",
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
  const data = await loadCSV(DATASETS[datasetKey]);
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

  lineChart.setOption({
    tooltip: { trigger: "axis" },
    legend: {
      data: series.map(s => s.name),
      type: 'scroll',
      bottom: 0
    },
    grid: { bottom: 120, top: 40 },
    xAxis: {
      type: "category",
      data: metrics,
      axisLabel: { rotate: 30, interval: 0 }
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 1
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
