import { FieldColorModeId, FieldConfigProperty, PanelPlugin, ThresholdsMode } from '@grafana/data';
import { DockerTreeOptions } from './types';
import { DockerTreePanel } from './components/DockerTreePanel';

export const plugin = new PanelPlugin<DockerTreeOptions>(DockerTreePanel)
  .useFieldConfig({
    standardOptions: {
      [FieldConfigProperty.Unit]: { defaultValue: 'percent' },
      [FieldConfigProperty.Decimals]: { defaultValue: 1 },
      [FieldConfigProperty.Min]: { defaultValue: 0 },
      [FieldConfigProperty.Color]: { defaultValue: { mode: FieldColorModeId.Thresholds } },
      [FieldConfigProperty.Thresholds]: {
        defaultValue: {
          mode: ThresholdsMode.Absolute,
          steps: [
            { value: -Infinity, color: 'green' },
            { value: 5, color: 'yellow' },
            { value: 15, color: 'orange' },
            { value: 25, color: 'red' },
          ],
        },
      },
    },
  })
  .setPanelOptions((builder) =>
    builder
      .addTextInput({
        path: 'sizeQuery',
        name: 'Size & colour query',
        description: 'Query (refId) whose value sets tile size and colour, e.g. container load.',
        defaultValue: 'A',
        category: ['Queries'],
      })
      .addTextInput({
        path: 'memoryQuery',
        name: 'Memory query',
        description: 'Query (refId) giving memory in bytes. Leave empty to hide.',
        defaultValue: 'B',
        category: ['Queries'],
      })
      .addTextInput({
        path: 'networkQuery',
        name: 'Network query',
        description: 'Query (refId) giving network traffic in bits/s, shown on hover. Leave empty to hide.',
        defaultValue: 'C',
        category: ['Queries'],
      })
      .addTextInput({
        path: 'nameField',
        name: 'Name label',
        description: 'Label or column holding the container name.',
        defaultValue: 'name',
        category: ['Queries'],
      })
      .addTextInput({
        path: 'groupField',
        name: 'Group label',
        description: 'Label or column holding the group, e.g. the compose stack.',
        defaultValue: 'stack',
        category: ['Queries'],
      })
      .addBooleanSwitch({
        path: 'groupByStack',
        name: 'Group by stack',
        description: 'Draw one box per group with its containers inside.',
        defaultValue: false,
        category: ['Layout'],
      })
      .addSliderInput({
        path: 'minNameFont',
        name: 'Readable names',
        description: 'Make every tile big enough for its full name at this size (px). 0 = size strictly by value.',
        defaultValue: 11,
        settings: { min: 0, max: 14, step: 1 },
        category: ['Layout'],
      })
      .addTextInput({
        path: 'valueLabel',
        name: 'Value label',
        description: 'Word shown before the value on each tile.',
        defaultValue: 'Load',
        category: ['Tiles'],
      })
      .addBooleanSwitch({
        path: 'showStats',
        name: 'Show value and memory',
        defaultValue: true,
        category: ['Tiles'],
      })
  );
