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

  renderHTML({ node, HTMLAttributes }) {
    return [
      'template-section',
      mergeAttributes(HTMLAttributes),
      ['div', { contenteditable: 'false', 'data-role': 'header' }, node.attrs.title],
      ['div', { 'data-role': 'content' }, 0],
    ];
  },
});

export default TemplateSection;
