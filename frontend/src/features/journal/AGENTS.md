# Journal Feature Notes

- Components reside in folders with an `index.ts` barrel.
- `TemplateSectionView` is the React node view for `TemplateSection`.
- `ReflectButton` renders within this header when `privacy === 'ai'`.
- Slash command extensions live under `components/SlashCommands/`.
- `useReflect` manages section-level AI calls via `useAi()`; tests can mock this.
