import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CodeEditor } from './code-editor';

describe('CodeEditor', () => {
  let fixture: ComponentFixture<CodeEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CodeEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeEditor);
    fixture.componentRef.setInput('value', 'const answer = 42;');
    fixture.componentRef.setInput('language', 'JavaScript');
    fixture.componentRef.setInput('readOnly', true);
    fixture.detectChanges();
    await fixture.whenStable();
    await waitForEditor();
  });

  it('loads a highlighted read-only editor', () => {
    const editor = fixture.nativeElement.querySelector('.cm-editor');
    const codeLine = fixture.nativeElement.querySelector('.cm-line');
    const editableContent = fixture.nativeElement.querySelector('.cm-content');

    expect(editor).toBeTruthy();
    expect(codeLine.textContent).toBe('const answer = 42;');
    expect(codeLine.querySelector('span')).toBeTruthy();
    expect(editableContent.getAttribute('contenteditable')).toBe('false');
  });

  function waitForEditor(): Promise<void> {
    if (fixture.nativeElement.querySelector('.cm-editor')) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const observer = new MutationObserver(() => {
        if (fixture.nativeElement.querySelector('.cm-editor')) {
          observer.disconnect();
          if (timeout) clearTimeout(timeout);
          resolve();
        }
      });

      observer.observe(fixture.nativeElement, { childList: true, subtree: true });
      timeout = setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 1000);
    });
  }
});
