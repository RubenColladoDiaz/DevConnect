import {
  AfterViewInit,
  Component,
  ElementRef,
  ErrorHandler,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { PostCodeLanguage, PostCodeTheme } from '../../../shared/types/Post';
import type { CodeEditorRuntime } from './code-editor-runtime';

@Component({
  selector: 'app-code-editor',
  standalone: false,
  template: '<div #editor class="code-editor"></div>',
  styleUrl: './code-editor.css',
})
export class CodeEditor implements AfterViewInit, OnChanges, OnDestroy {
  @Input() value = '';
  @Input() language: PostCodeLanguage = 'JavaScript';
  @Input() theme: PostCodeTheme = 'dark';
  @Input() readOnly = false;
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('editor', { static: true }) editorElement!: ElementRef<HTMLDivElement>;

  private runtime?: CodeEditorRuntime;
  private destroyed = false;

  constructor(private errorHandler: ErrorHandler) {}

  @HostBinding('class.read-only')
  get readOnlyClass(): boolean {
    return this.readOnly;
  }

  ngAfterViewInit(): void {
    void this.loadEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.runtime) return;
    if (changes['value'] || changes['language'] || changes['theme'] || changes['readOnly']) {
      this.runtime.update(this.getOptions());
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.runtime?.destroy();
  }

  private async loadEditor(): Promise<void> {
    try {
      const { CodeEditorRuntime } = await import('./code-editor-runtime');
      if (this.destroyed) return;
      this.runtime = new CodeEditorRuntime(
        this.editorElement.nativeElement,
        this.getOptions(),
        (value) => this.valueChange.emit(value),
      );
    } catch (error) {
      this.editorElement.nativeElement.textContent = 'The code editor could not be loaded.';
      this.errorHandler.handleError(error);
    }
  }

  private getOptions() {
    return {
      value: this.value,
      language: this.language,
      theme: this.theme,
      readOnly: this.readOnly,
    };
  }
}
