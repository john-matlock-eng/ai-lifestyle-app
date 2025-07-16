// extensions.ts
import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";

interface CharacterCountStorage {
  characters: () => number;
  words: () => number;
}

export const CharacterCount = Extension.create<object, CharacterCountStorage>({
  name: "characterCount",

  addStorage() {
    return {
      characters: () => 0,
      words: () => 0,
    };
  },

  onUpdate(this: { editor: Editor; storage: CharacterCountStorage }) {
    const text = this.editor.state.doc.textContent;

    this.storage.characters = () => text.length;
    this.storage.words = () => {
      const words = text.split(/\s+/).filter((word: string) => word.length > 0);
      return words.length;
    };
  },
});
