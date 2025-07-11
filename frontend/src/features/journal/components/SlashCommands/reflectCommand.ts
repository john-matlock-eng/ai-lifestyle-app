import {
  Extension,
  InputRule,
  type CommandProps,
  type RawCommands,
} from '@tiptap/core';


const reflectCommand = Extension.create({
  name: 'reflectCommand',

  addCommands() {
    const commands = {
      reflect:
        () =>
        ({ editor }: CommandProps) => {
          editor.view.dom.dispatchEvent(
            new CustomEvent('reflect', { bubbles: true }),
          );
          return true;
        },
    };
    return commands as Partial<RawCommands>;
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\/reflect$/, // triggered when typing '/reflect'
        handler: ({ range, commands }) => {
          commands.deleteRange(range);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (commands as any).reflect();
        },
      }),
    ];
  },
});

export default reflectCommand;
