export const MODEL_INFO = {
  "Qwen/Qwen2.5-Coder-32B-Instruct": {
    params_billion: 32,
    color: '#5470c6'
  },
  "deepseek-ai/DeepSeek-V3": {
    params_billion: 671,
    active_params_billion: 37,
    color: '#91cc75'
  },
  "meta-llama/Llama-3-70b-chat-hf": {
    params_billion: 70,
    color: '#fac858'
  },
  "meta-llama/Llama-3-8b-chat-hf": {
    params_billion: 8,
    color: '#ee6666'
  },
  "openai/gpt-oss-20b": {
    params_billion: 20,
    color: '#9900CC',
  },
  "openai/gpt-oss-120b": {
    params_billion: 120,
    color: '#FFA500',
  },
};

export function getModelParams(modelName) {
  const info = MODEL_INFO[modelName];
  if (!info) return Infinity;
  return info.active_params_billion ?? info.params_billion;
}

export function getModelColor(modelName) {
  const info = MODEL_INFO[modelName];
  return info?.color || '#999999';
}
