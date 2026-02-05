const barChart = echarts.init(document.getElementById("bar-chart"));
const lineChart = echarts.init(document.getElementById("line-chart"));

const DATASETS = {
  main: "pass_rates_zero_shot_main.csv",
  dataflow: "pass_rates_zero_shot_dataflow.csv",
  loop_tile: "pass_rates_zero_shot_loop_tile.csv",
  label: "pass_rates_zero_shot_label.csv",
  fpx: "pass_rates_zero_shot_fpx.csv"
};

async function loadCSV(file) {
  const text = await fetch(`data/${file}`).then(r => r.text());
  const [header, ...rows] = text.trim().split("\n");
  return rows.map(r => {
    const [model, metric, k, rate] = r.split(",");
    return { model, metric, k: Number(k), rate: Number(rate) };
  });
}

async function renderBarChart(datasetKey) {
  const data = await loadCSV(DATASETS[datasetKey]);

  const metrics = [...new Set(data.map(d => d.metric))];
  const models = [...new Set(data.map(d => d.model))];

  const series = models.map(model => {
    const pass1Data = metrics.map(metric =>
      data.find(d => d.model === model && d.metric === metric && d.k === 1)?.rate ?? 0
    );
    const pass5Data = metrics.map(metric =>
      data.find(d => d.model === model && d.metric === metric && d.k === 5)?.rate ?? 0
    );

    return [
      {
        name: `${model} (pass@1)`,
        type: "bar",
        data: pass1Data
      },
      {
        name: `${model} (pass@5)`,
        type: "bar",
        data: pass5Data
      }
    ];
  }).flat();

  barChart.setOption({
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

async function renderLineChart(datasetKey) {
  const data = await loadCSV(DATASETS[datasetKey]);

  const metrics = [...new Set(data.map(d => d.metric))];
  const models = [...new Set(data.map(d => d.model))];

  const series = models.map(model => {
    const pass1Data = metrics.map(metric =>
      data.find(d => d.model === model && d.metric === metric && d.k === 1)?.rate ?? 0
    );
    const pass5Data = metrics.map(metric =>
      data.find(d => d.model === model && d.metric === metric && d.k === 5)?.rate ?? 0
    );

    return [
      {
        name: `${model} (pass@1)`,
        type: "line",
        data: pass1Data
      },
      {
        name: `${model} (pass@5)`,
        type: "line",
        data: pass5Data
      }
    ];
  }).flat();

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

document.querySelectorAll("input[name=dataset]").forEach(radio => {
  radio.addEventListener("change", () => {
    renderBarChart(radio.id);
    renderLineChart(radio.id);
  });
});

renderBarChart("main");
renderLineChart("main");
