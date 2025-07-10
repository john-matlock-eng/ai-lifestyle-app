import { Node, mergeAttributes } from '@tiptap/core';

export interface TemplateSectionOptions {
  defaultPrivacy: 'private' | 'ai' | 'shared' | 'public';
}

export const TemplateSection = Node.create<TemplateSectionOptions>({
  name: 'template_section',
  group: 'block',
  content: 'block*',
  isolating: true,
  draggable: false,

  addAttributes() {
    return {
      id: { default: '' },
      title: { default: '' },
      privacy: { default: this.options.defaultPrivacy },
    };
  },

  parseHTML() {
    return [
      { tag: 'template-section' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['template-section', mergeAttributes(HTMLAttributes), 0];
  },
});

export default TemplateSection;
