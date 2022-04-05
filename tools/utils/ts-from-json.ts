import { InputData, jsonInputForTargetLanguage, quicktype } from 'quicktype-core'

export async function tsFromJson(typeName: string, samples: string[]) {
  const jsonInput = jsonInputForTargetLanguage('typescript');
  await jsonInput.addSource({
    name: typeName,
    samples: samples,
  });

  const inputData = new InputData();
  inputData.addInput(jsonInput);

  return await quicktype({
    inputData,
    lang: 'typescript',
    inferEnums: false,
    inferBooleanStrings: false,
    inferDateTimes: false,
    inferIntegerStrings: false,
    inferMaps: false,
    inferUuids: false,
    alphabetizeProperties: true,
    rendererOptions: {
      'just-types': true as any
    }
  });
}
