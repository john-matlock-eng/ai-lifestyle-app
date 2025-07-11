import { Extension, InputRule } from '@tiptap/core';

const reflectCommand = Extension.create({
  name: 'reflectCommand',

  addCommands() {
    return {
      reflect: () => ({ editor }) => {
        editor.view.dom.dispatchEvent(new CustomEvent('reflect', { bubbles: true }));
        return true;
      },
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\/reflect$/, // triggered when typing '/reflect'
        handler: ({ range, commands }) => {
          commands.deleteRange(range);
          commands.reflect();
        },
      }),
    ];
  },
});

export default reflectCommand;
