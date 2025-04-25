/**
 * РљРѕРЅС„РёРіСѓСЂР°С†РёСЏ РјРѕРґРµР»РµР№ РґР»СЏ СЂР°Р·РЅС‹С… С‚РёРїРѕРІ РїРѕРґРїРёСЃРѕРє
 * РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РєР°Рє СЂРµР·РµСЂРІРЅС‹Р№ РІР°СЂРёР°РЅС‚, РµСЃР»Рё РїРµСЂРµРјРµРЅРЅС‹Рµ РѕРєСЂСѓР¶РµРЅРёСЏ РЅРµРґРѕСЃС‚СѓРїРЅС‹
 */

// РњРѕРґРµР»Рё РґР»СЏ Р±РµСЃРїР»Р°С‚РЅРѕРіРѕ С‚Р°СЂРёС„Р°
const FREE_MODELS = process.env.OPENAI_MODELS_FREE
  ? process.env.OPENAI_MODELS_FREE.split(',')
  : ['chatgpt-4o-latest', 'gemini-2.0-flash'];

// РњРѕРґРµР»Рё РґР»СЏ С‚Р°СЂРёС„Р° MINI
const MINI_MODELS = process.env.OPENAI_MODELS_MINI
  ? process.env.OPENAI_MODELS_MINI.split(',')
  : ['gpt-4.1', 'gpt-4.5-preview', 'o3-mini'];

// РњРѕРґРµР»Рё РґР»СЏ СЃС‚Р°РЅРґР°СЂС‚РЅРѕРіРѕ С‚Р°СЂРёС„Р°
const STANDARD_MODELS = process.env.OPENAI_MODELS_STANDARD
  ? process.env.OPENAI_MODELS_STANDARD.split(',')
  : ['gpt-4o-mini', 'gemini-2.5-pro-exp-03-25'];

// РњРѕРґРµР»Рё РґР»СЏ PRO С‚Р°СЂРёС„Р°
const PRO_MODELS = process.env.OPENAI_MODELS_PRO
  ? process.env.OPENAI_MODELS_PRO.split(',')
  : ['gpt-4o', 'gpt-4-turbo', 'claude-3-opus', 'gemini-pro-vision'];

// РљР°СЂС‚Р° СЃРѕРѕС‚РІРµС‚СЃС‚РІРёСЏ С‚РёРїРѕРІ РїРѕРґРїРёСЃРѕРє Рё РґРѕСЃС‚СѓРїРЅС‹С… РјРѕРґРµР»РµР№
const SUBSCRIPTION_MODELS = {
  FREE: FREE_MODELS,
  MINI: MINI_MODELS,
  STANDARD: STANDARD_MODELS,
  PRO: PRO_MODELS,
};

// Р¤СѓРЅРєС†РёСЏ РґР»СЏ РїРѕР»СѓС‡РµРЅРёСЏ РјРѕРґРµР»РµР№ РїРѕ С‚РёРїСѓ РїРѕРґРїРёСЃРєРё
function getModelsForPlan(planKey = 'FREE') {
  const key = planKey.toUpperCase();
  return SUBSCRIPTION_MODELS[key] || FREE_MODELS;
}

// Р­РєСЃРїРѕСЂС‚РёСЂСѓРµРј РєРѕРЅСЃС‚Р°РЅС‚С‹ Рё С„СѓРЅРєС†РёРё
module.exports = {
  FREE_MODELS,
  MINI_MODELS,
  STANDARD_MODELS,
  PRO_MODELS,
  getModelsForPlan,
}; 
