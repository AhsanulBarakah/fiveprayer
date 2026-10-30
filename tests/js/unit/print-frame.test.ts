/**
 * Unit tests for the timetable's print path (PrintCalendar.js).
 *
 * The print button no longer hides the page and prints it: it builds its own
 * document in an off-screen frame, so what reaches the printer is the timetable
 * and the plugin's styles and nothing else. These tests pin that down — the
 * frame holds one node (the timetable), the month picker and print button are
 * gone from it, the plugin's styles are copied, the theme's styles are not, and
 * the frame is cleaned up so the button can be used again.
 *
 * The suite runs in the node environment, so the script is executed against a
 * small DOM stub that implements exactly the surface PrintCalendar.js touches.
 * That keeps the test dependency-free while still exercising the shipped file
 * rather than a copy of its logic.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SCRIPT_PATH = fileURLToPath(
  new URL('../../../php/classes/core/Calendar/JS/PrintCalendar.js', import.meta.url)
);

type Listener = () => void;

/** A `<link>`/`<style>` entry as `document.styleSheets` exposes it. */
type FakeStyleSheet = {
  href: string | null;
  ownerNode: { id: string; textContent: string };
  cssRules: Array<{ cssText: string }> | null;
};

class FakeElement {
  readonly tagName: string;
  id = '';
  className = '';
  textContent = '';
  /** `<base>` only: browsers expose the resolved href as a property. */
  href: string | null = null;
  style = { cssText: '' };
  attributes = new Map<string, string>();
  children: FakeElement[] = [];
  parentNode: FakeElement | null = null;
  private frameWindow: FakeWindow | null = null;

  constructor(tagName: string) {
    this.tagName = tagName.toLowerCase();
  }

  get classList() {
    const names = this.className.split(/\s+/).filter(Boolean);
    return { contains: (name: string) => names.includes(name) };
  }

  /** An `<iframe>`'s window, created the first time the script asks for it. */
  get contentWindow(): FakeWindow {
    if (!this.frameWindow) {
      this.frameWindow = new FakeWindow(new FakeDocument());
    }
    return this.frameWindow;
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }

  appendChild<T extends FakeElement>(child: T): T {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  remove() {
    if (!this.parentNode) {
      return;
    }
    const index = this.parentNode.children.indexOf(this);
    if (index !== -1) {
      this.parentNode.children.splice(index, 1);
    }
    this.parentNode = null;
  }

  cloneNode(deep = false): FakeElement {
    const copy = new FakeElement(this.tagName);
    copy.id = this.id;
    copy.className = this.className;
    copy.textContent = this.textContent;
    copy.href = this.href;
    copy.style = { cssText: this.style.cssText };
    copy.attributes = new Map(this.attributes);
    if (deep) {
      for (const child of this.children) {
        copy.appendChild(child.cloneNode(true));
      }
    }
    return copy;
  }

  /** Supports the selector shapes the script uses: `#id`, `.class`, a tag, `*`. */
  querySelectorAll(selectors: string): FakeElement[] {
    const matchers = selectors
      .split(',')
      .map((selector) => selector.trim())
      .filter(Boolean)
      .map((selector) => {
        if (selector === '*') {
          return () => true;
        }
        if (selector.startsWith('#')) {
          const id = selector.slice(1);
          return (element: FakeElement) => element.id === id;
        }
        if (selector.startsWith('.')) {
          const name = selector.slice(1);
          return (element: FakeElement) => element.classList.contains(name);
        }
        const tagName = selector.toLowerCase();
        return (element: FakeElement) => element.tagName === tagName;
      });

    const found: FakeElement[] = [];
    const walk = (node: FakeElement) => {
      for (const child of node.children) {
        if (matchers.some((matches) => matches(child))) {
          found.push(child);
        }
        walk(child);
      }
    };
    walk(this);
    return found;
  }
}

class FakeWindow {
  readonly document: FakeDocument;
  print = vi.fn();
  focus = vi.fn();
  location = { href: 'http://example.test/timetable/', search: '', pathname: '/timetable/' };
  private listeners = new Map<string, Listener[]>();

  constructor(document: FakeDocument) {
    this.document = document;
  }

  addEventListener(type: string, listener: Listener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter((entry) => entry !== listener));
  }

  /** Test helper: behaves like the browser firing `afterprint`/`load`. */
  fire(type: string) {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener();
    }
  }

  setTimeout(callback: () => void, delay?: number) {
    return setTimeout(callback, delay);
  }

  clearTimeout(handle: unknown) {
    clearTimeout(handle as number);
  }
}

class FakeDocument {
  body = new FakeElement('body');
  head = new FakeElement('head');
  images: FakeElement[] = [];
  styleSheets: FakeStyleSheet[] = [];
  baseURI = 'http://example.test/timetable/';

  createElement(tagName: string) {
    return new FakeElement(tagName);
  }

  getElementById(id: string) {
    return this.querySelectorAll(`#${id}`)[0] ?? null;
  }

  querySelectorAll(selector: string) {
    return this.body.querySelectorAll(selector);
  }

  addEventListener() {
    // DOMContentLoaded/load wiring is not part of these tests.
  }

  open() {
    this.body = new FakeElement('body');
    this.head = new FakeElement('head');
  }

  write() {
    // The stub document is already the empty document `open()` produced.
  }

  close() {
    // Nothing to flush.
  }
}

/** The page as the script finds it: timetable wrapper, picker, plugin styles. */
const buildTimetablePage = (document: FakeDocument) => {
  document.styleSheets = [
    {
      // The plugin's combined stylesheet bundle.
      href: 'http://example.test/wp-content/uploads/fiveprayer-cache/fiveprayer-combined-abc.css',
      ownerNode: { id: 'fiveprayer-default-style-css', textContent: '' },
      cssRules: [{ cssText: '.fiveprayer__printer{--fiveprayer-bg-first:rgb(1,2,3);}' }],
    },
    {
      // The plugin's inline variables block.
      href: null,
      ownerNode: {
        id: 'fiveprayer-default-style-inline-css',
        textContent: ':root{--fiveprayer-bg-first:rgb(1,2,3);}',
      },
      cssRules: [{ cssText: ':root{--fiveprayer-bg-first:rgb(1,2,3);}' }],
    },
    {
      // The template's own <style>, which has no id — the script recognises it
      // by the plugin's class names inside it.
      href: null,
      ownerNode: {
        id: '',
        textContent: '.fiveprayer-default-layout table{width:100%;}',
      },
      cssRules: [{ cssText: '.fiveprayer-default-layout table{width:100%;}' }],
    },
    {
      // Theme inline styles: must stay out of the print document.
      href: null,
      ownerNode: { id: 'global-styles-inline-css', textContent: 'body{font-family:serif;}' },
      cssRules: [{ cssText: '.theme-only{color:blue;}' }],
    },
    {
      // Theme stylesheet link: must stay out as well.
      href: 'http://example.test/wp-content/themes/bloghash/style.css',
      ownerNode: { id: 'theme-styles-css', textContent: '' },
      cssRules: null,
    },
  ];

  const wrapper = new FakeElement('div');
  wrapper.id = 'fiveprayer-div-to';
  wrapper.className = 'fiveprayer__printer fiveprayer-default-layout';

  const optionBar = new FakeElement('div');
  optionBar.className = 'fiveprayer__printer_option fiveprayer-hide-on-print';
  const picker = new FakeElement('form');
  picker.id = 'fiveprayer-no-print';
  optionBar.appendChild(picker);

  const table = new FakeElement('table');
  table.id = 'fiveprayer-div-to-print';
  const hiddenRow = new FakeElement('tr');
  hiddenRow.className = 'fiveprayer-hide-on-print';
  table.appendChild(hiddenRow);

  wrapper.appendChild(optionBar);
  wrapper.appendChild(table);
  document.body.appendChild(wrapper);

  return { wrapper, optionBar, table };
};

/** Run the shipped script against the stub DOM and return its public surface. */
const loadPrintCalendar = (document: FakeDocument, window: FakeWindow) => {
  const sandbox: Record<string, unknown> = {
    document,
    window,
    console,
    setTimeout: (callback: () => void, delay?: number) => setTimeout(callback, delay),
    clearTimeout: (handle: unknown) => clearTimeout(handle as number),
    URL,
    URLSearchParams,
    FormData: class {},
    Event: class {},
    MutationObserver: class {
      observe() {}
    },
    fetch: () => Promise.reject(new Error('no network in this test')),
  };
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(readFileSync(SCRIPT_PATH, 'utf8'), sandbox);

  return sandbox as unknown as { FP_printTimetable: () => void };
};

const findIn = (root: FakeElement, selector: string) => root.querySelectorAll(selector);

describe('FP_printTimetable', () => {
  let page: FakeDocument;
  let pageWindow: FakeWindow;
  let calendar: { FP_printTimetable: () => void };

  const openFrame = () => {
    const frame = page.getElementById('FP-print-frame');
    expect(frame).not.toBeNull();
    return frame as FakeElement;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    page = new FakeDocument();
    pageWindow = new FakeWindow(page);
    buildTimetablePage(page);
    calendar = loadPrintCalendar(page, pageWindow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('puts the timetable and the plugin styles in the frame, and nothing else', () => {
    calendar.FP_printTimetable();
    vi.advanceTimersByTime(100);

    const frameWindow = openFrame().contentWindow;
    const frameDocument = frameWindow.document;

    // The frame document holds exactly one node: a copy of the timetable
    // wrapper. No page shell, header, sidebar or footer can be printed.
    expect(frameDocument.body.children).toHaveLength(1);
    const printed = frameDocument.body.children[0];
    expect(printed.id).toBe('fiveprayer-div-to');
    expect(printed.className).toBe('fiveprayer__printer fiveprayer-default-layout');
    expect(findIn(printed, '#fiveprayer-div-to-print')).toHaveLength(1);

    // The month picker, the print button's option bar and anything marked
    // fiveprayer-hide-on-print are page controls, not timetable content.
    expect(findIn(printed, '#fiveprayer-no-print')).toHaveLength(0);
    expect(findIn(printed, '.fiveprayer__printer_option')).toHaveLength(0);
    expect(findIn(printed, '.fiveprayer-hide-on-print')).toHaveLength(0);

    // The page itself is untouched: the picker is still there to be used.
    expect(page.getElementById('fiveprayer-no-print')).not.toBeNull();

    // The plugin's styles came across — the stylesheet bundle, the inline
    // variables and the template's own <style>.
    const styles = frameDocument.head.children.filter((element) => element.id === 'FP-print-timetable-styles');
    expect(styles).toHaveLength(1);
    expect(styles[0].textContent).toContain('.fiveprayer__printer{--fiveprayer-bg-first:rgb(1,2,3);}');
    expect(styles[0].textContent).toContain(':root{--fiveprayer-bg-first:rgb(1,2,3);}');
    expect(styles[0].textContent).toContain('.fiveprayer-default-layout table{width:100%;}');

    // No theme CSS: neither its inline styles nor its stylesheet link.
    expect(styles[0].textContent).not.toContain('.theme-only');
    expect(frameDocument.head.children.filter((element) => element.tagName === 'link')).toHaveLength(0);

    // Only the plugin's own rules plus the print frame's base rules.
    const styleIds = frameDocument.head.children
      .filter((element) => element.tagName === 'style')
      .map((element) => element.id);
    expect(styleIds).toEqual(['FP-print-timetable-styles', 'FP-print-frame-styles']);

    // Relative image sources (the printer logo) resolve against the page.
    const base = frameDocument.head.children.find((element) => element.tagName === 'base');
    expect(base?.href).toBe('http://example.test/timetable/');
  });

  it('prints the frame once and removes it so the button can print again', () => {
    calendar.FP_printTimetable();

    const frame = openFrame();
    vi.advanceTimersByTime(100);
    expect(frame.contentWindow.print).toHaveBeenCalledTimes(1);

    // The browser reports the closed dialog on the frame's window.
    frame.contentWindow.fire('afterprint');
    expect(page.getElementById('FP-print-frame')).toBeNull();

    vi.advanceTimersByTime(600);
    calendar.FP_printTimetable();
    expect(page.getElementById('FP-print-frame')).not.toBeNull();
  });
});
