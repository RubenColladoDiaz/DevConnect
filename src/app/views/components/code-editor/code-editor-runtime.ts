import {
  autocompletion,
  Completion,
  CompletionContext,
  CompletionSource,
  closeBrackets,
} from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { StreamLanguage } from '@codemirror/language';
import { Compartment, EditorState, Extension } from '@codemirror/state';
import { csharp } from '@codemirror/legacy-modes/mode/clike';
import { monokai } from '@uiw/codemirror-theme-monokai';
import { githubLight } from '@uiw/codemirror-theme-github';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, highlightActiveLine, keymap, lineNumbers } from '@codemirror/view';
import { PostCodeLanguage, PostCodeTheme } from '../../../shared/types/Post';

interface CodeEditorOptions {
  value: string;
  language: PostCodeLanguage;
  theme: PostCodeTheme;
  readOnly: boolean;
}

export class CodeEditorRuntime {
  private editor: EditorView;
  private languageCompartment = new Compartment();
  private themeCompartment = new Compartment();
  private readOnlyCompartment = new Compartment();
  private options: CodeEditorOptions;
  private suppressValueChange = false;

  constructor(
    parent: HTMLElement,
    options: CodeEditorOptions,
    private onValueChange: (value: string) => void,
  ) {
    this.options = options;
    const state = EditorState.create({
      doc: options.value,
      extensions: [
        lineNumbers(),
        history(),
        closeBrackets(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        autocompletion({ override: [this.getCompletions()] }),
        EditorView.lineWrapping,
        this.readOnlyCompartment.of(this.getReadOnly(options.readOnly)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !this.options.readOnly && !this.suppressValueChange) {
            this.onValueChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': { fontSize: '13px', minHeight: 'inherit' },
          '&.cm-focused': { outline: 'none' },
          '.cm-scroller': { fontFamily: 'Consolas, "Courier New", monospace' },
          '.cm-gutters': { borderRight: '1px solid #ffffff18' },
        }),
        this.languageCompartment.of(this.getLanguage(options.language)),
        this.themeCompartment.of(this.getTheme(options.theme)),
      ],
    });

    this.editor = new EditorView({ state, parent });
  }

  update(options: CodeEditorOptions): void {
    const previous = this.options;
    this.options = options;

    if (previous.value !== options.value && this.editor.state.doc.toString() !== options.value) {
      this.suppressValueChange = true;
      this.editor.dispatch({
        changes: {
          from: 0,
          to: this.editor.state.doc.length,
          insert: options.value,
        },
      });
      this.suppressValueChange = false;
    }

    if (previous.language !== options.language) {
      this.editor.dispatch({
        effects: this.languageCompartment.reconfigure(this.getLanguage(options.language)),
      });
    }

    if (previous.theme !== options.theme) {
      this.editor.dispatch({
        effects: this.themeCompartment.reconfigure(this.getTheme(options.theme)),
      });
    }

    if (previous.readOnly !== options.readOnly) {
      this.editor.dispatch({
        effects: this.readOnlyCompartment.reconfigure(this.getReadOnly(options.readOnly)),
      });
    }
  }

  destroy(): void {
    this.editor.destroy();
  }

  private getLanguage(language: PostCodeLanguage): Extension {
    switch (language) {
      case 'TypeScript':
        return javascript({ typescript: true });
      case 'Python':
        return python();
      case 'Java':
        return java();
      case 'C#':
        return StreamLanguage.define(csharp);
      case 'HTML':
        return html();
      case 'CSS':
        return css();
      case 'SQL':
        return sql();
      case 'JavaScript':
        return javascript();
      case 'Text':
        return [];
    }
  }

  private getTheme(theme: PostCodeTheme): Extension {
    switch (theme) {
      case 'light':
        return githubLight;
      case 'monokai':
        return monokai;
      case 'dark':
        return oneDark;
    }
  }

  private getReadOnly(readOnly: boolean): Extension {
    return [EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)];
  }

  private getCompletions(): CompletionSource {
    return (context: CompletionContext) => {
      const isHtml = this.options.language === 'HTML';
      const word = isHtml ? context.matchBefore(/<?[\w-]*/) : context.matchBefore(/[\w.$]*/);
      if (!word || (!context.explicit && word.from === word.to)) return null;

      const prefix = word.text.toLowerCase().replace('<', '');
      const options = this.completionsForLanguage().filter((completion) =>
        completion.label.toLowerCase().startsWith(prefix),
      );

      return { from: word.from, options };
    };
  }

  private completionsForLanguage(): Completion[] {
    const suggestions: Record<PostCodeLanguage, Completion[]> = {
      JavaScript: [
        { label: 'const', type: 'keyword' },
        { label: 'let', type: 'keyword' },
        { label: 'function', type: 'keyword' },
        { label: 'return', type: 'keyword' },
        { label: 'console.log()', type: 'function' },
        { label: 'document.querySelector()', type: 'function' },
        { label: 'addEventListener()', type: 'function' },
        { label: 'async', type: 'keyword' },
        { label: 'await', type: 'keyword' },
        { label: 'Promise', type: 'class' },
      ],
      TypeScript: [
        { label: 'const', type: 'keyword' },
        { label: 'let', type: 'keyword' },
        { label: 'function', type: 'keyword' },
        { label: 'interface', type: 'keyword' },
        { label: 'type', type: 'keyword' },
        { label: 'string', type: 'type' },
        { label: 'number', type: 'type' },
        { label: 'boolean', type: 'type' },
        { label: 'Promise', type: 'class' },
        { label: 'console.log()', type: 'function' },
      ],
      Python: [
        { label: 'def', type: 'keyword' },
        { label: 'class', type: 'keyword' },
        { label: 'return', type: 'keyword' },
        { label: 'import', type: 'keyword' },
        { label: 'from', type: 'keyword' },
        { label: 'print()', type: 'function' },
        { label: 'self', type: 'variable' },
        { label: 'if', type: 'keyword' },
        { label: 'for', type: 'keyword' },
        { label: 'while', type: 'keyword' },
      ],
      Java: [
        { label: 'public', type: 'keyword' },
        { label: 'private', type: 'keyword' },
        { label: 'class', type: 'keyword' },
        { label: 'static', type: 'keyword' },
        { label: 'void', type: 'keyword' },
        { label: 'String', type: 'type' },
        { label: 'System.out.println()', type: 'function' },
        { label: 'main', type: 'function' },
        { label: 'return', type: 'keyword' },
      ],
      'C#': [
        { label: 'using', type: 'keyword' },
        { label: 'namespace', type: 'keyword' },
        { label: 'public', type: 'keyword' },
        { label: 'class', type: 'keyword' },
        { label: 'static', type: 'keyword' },
        { label: 'void', type: 'keyword' },
        { label: 'string', type: 'type' },
        { label: 'Console.WriteLine()', type: 'function' },
      ],
      HTML: [
        { label: 'div', apply: '<div></div>', type: 'keyword' },
        { label: 'section', apply: '<section></section>', type: 'keyword' },
        { label: 'article', apply: '<article></article>', type: 'keyword' },
        { label: 'button', apply: '<button></button>', type: 'keyword' },
        { label: 'input', apply: '<input />', type: 'keyword' },
        { label: 'p', apply: '<p></p>', type: 'keyword' },
        { label: 'a', apply: '<a href=""></a>', type: 'keyword' },
      ],
      CSS: [
        { label: 'display', type: 'property' },
        { label: 'position', type: 'property' },
        { label: 'color', type: 'property' },
        { label: 'background', type: 'property' },
        { label: 'margin', type: 'property' },
        { label: 'padding', type: 'property' },
        { label: 'grid-template-columns', type: 'property' },
        { label: 'flex-direction', type: 'property' },
      ],
      SQL: [
        { label: 'SELECT', type: 'keyword' },
        { label: 'FROM', type: 'keyword' },
        { label: 'WHERE', type: 'keyword' },
        { label: 'JOIN', type: 'keyword' },
        { label: 'INSERT INTO', type: 'keyword' },
        { label: 'UPDATE', type: 'keyword' },
        { label: 'CREATE TABLE', type: 'keyword' },
        { label: 'ORDER BY', type: 'keyword' },
      ],
      Text: [
        { label: 'TODO', type: 'text' },
        { label: 'NOTE', type: 'text' },
        { label: 'FIXME', type: 'text' },
      ],
    };

    return suggestions[this.options.language];
  }
}
