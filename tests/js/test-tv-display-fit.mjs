// Regression test: the TV Display Mode engine must keep a page that is taller
// than its chosen canvas fully on the screen, and must land its theme-spacing
// trim before the first frame the viewer sees.
//
// Two rules are guarded here:
//
//  1. A page taller than its chosen box is fitted by its real height, so every
//     row is on the screen (see the cases below).
//  2. The pass that removes the theme's top margins (the empty band above the
//     design) must have run before the canvas is revealed. It used to skip the
//     first pass, because `isShown()` read the engine's own no-flash hiding
//     (`visibility: hidden` on the canvas until the first fit lands) as "the
//     page hid this" and found no content root; the trim then ran on the first
//     restage, moving the design up by a margin's height while the screen was
//     already showing it. The second fixture reproduces that structure and
//     records the very first revealed frame.
//
// Why a browser test: the rule that broke ("the box's height is a floor, not a
// ceiling") is a measurement rule — the engine reads the page's real height and
// picks a scale from it — so nothing short of real layout can check it. This
// test loads the *real* engine (php/classes/core/Assets/JS/tv-display.js) and the
// *real* stylesheet (php/classes/core/Assets/CSS/tv-display.css) into a fixture
// page, points them at a table taller than the canvas, and asserts that every
// row is on the screen afterwards.
//
// The bug it guards: a display page is scroll-locked (a television has no
// pointer), so when the fit was computed from the chosen box height alone the
// page's extra content ran past the bottom edge of the screen and could never be
// reached. Measured on this plugin's own display page, a 1230 px page against a
// 1024 px box left the last four prayer rows off a 1080p TV.
//
// Runs without WordPress: the fixture supplies `window.fiveprayerTV` itself. It
// does need Chrome (found via CHROME_PATH or the usual install locations);
// without it the test reports SKIP rather than failing.
//
// Usage: node tests/js/test-tv-display-fit.mjs

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(here, '..', '..');
// TV_ENGINE_PATH lets the same test be pointed at a variant of the engine (used
// to prove the test fails on the behaviour it guards against).
const ENGINE =
  process.env.TV_ENGINE_PATH || path.join(pluginRoot, 'php/classes/core/Assets/JS/tv-display.js');
const STYLES = path.join(pluginRoot, 'php/classes/core/Assets/CSS/tv-display.css');

let failures = 0;

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  failures++;
  console.log(`FAIL: ${message}`);
}

/** Locate a Chrome binary, or null when there is none. */
function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const candidates =
    process.platform === 'win32'
      ? [
          'C:/Program Files/Google/Chrome/Application/chrome.exe',
          'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
          path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
        ]
      : process.platform === 'darwin'
        ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
        : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * The trim fixture: a block-theme shaped page.
 *
 * `<html>` carries the boot class, so the real stylesheet holds the canvas at
 * `visibility: hidden` during the first measurement exactly as it does on a
 * television. The wrappers carry the top margin the leading-space trim exists
 * to remove, so a trim that misses the first pass is visible in the numbers.
 */
function buildTrimFixture() {
  const engine = fs.readFileSync(ENGINE, 'utf8');
  const styles = fs.readFileSync(STYLES, 'utf8');

  return `<!doctype html>
<html class="fiveprayer-tv-js">
<head>
<meta charset="utf-8">
<style>${styles}
/* The theme's own spacing around the design: 19px on each wrapper, the same
   numbers Twenty Twenty-Five gives its main and post-content wrappers. */
main { margin-top: 19px; }
.entry-content { margin-top: 19px; }
td { height: 40px; }
</style>
</head>
<body class="fiveprayer-tv-active">
<div class="wp-site-blocks">
<main class="wp-block-group is-layout-flow">
<div class="entry-content"><table><tbody id="rows"></tbody></table></div>
</main>
</div>
<script>
(function () {
  var body = document.getElementById('rows');

  for (var i = 0; i < 8; i++) {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.textContent = 'Row ' + i;
    tr.appendChild(td);
    body.appendChild(tr);
  }

  window.fiveprayerTV = {
    canvasHeight: '1080',
    canvasWidth: '1920',
    canvasForce: '1',
    baselineWidth: 1920,
    baselineHeight: 1080,
    contentSelectors: ['.wp-site-blocks', '.entry-content'],
    overscanPercent: 0,
    report: false
  };
})();
</script>
<script>${engine}</script>
</body>
</html>
`;
}

/** The fixture page: a table of rows, the engine's config, then the engine. */
function buildFixture() {
  const engine = fs.readFileSync(ENGINE, 'utf8');
  const styles = fs.readFileSync(STYLES, 'utf8');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${styles}</style>
</head>
<body class="fiveprayer-tv-active">
<div id="stage"><table><tbody id="rows"></tbody></table></div>
<script>
(function () {
  var q = new URLSearchParams(location.search);
  var rows = Number(q.get('rows') || 30);
  var rowHeight = Number(q.get('rowHeight') || 40);
  var body = document.getElementById('rows');

  for (var i = 0; i < rows; i++) {
    var tr = document.createElement('tr');
    tr.setAttribute('data-row', String(i));
    var td = document.createElement('td');
    td.textContent = 'Row ' + i;
    td.style.height = rowHeight + 'px';
    tr.appendChild(td);
    body.appendChild(tr);
  }

  // Written before the engine runs: it reads this object when it loads.
  window.fiveprayerTV = {
    canvasHeight: q.get('canvas') || '0',
    canvasWidth: q.get('width') || '0',
    canvasForce: '1',
    baselineWidth: 1920,
    baselineHeight: 1080,
    contentSelectors: ['#stage'],
    overscanPercent: Number(q.get('overscan') || 0),
    report: false
  };
})();
</script>
<script>${engine}</script>
</body>
</html>
`;
}

/** Minimal CDP client over the browser's page target. */
async function connect(port) {
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = list.find((target) => target.type === 'page');
  if (!page) {
    throw new Error('no page target in the test browser');
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  let id = 0;
  const pending = new Map();

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
    }
  });

  const send = (method, params = {}) => {
    const mid = ++id;
    ws.send(JSON.stringify({ id: mid, method, params }));
    return new Promise((resolve, reject) => pending.set(mid, { resolve, reject }));
  };

  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || 'evaluation failed');
    }
    return result.result.value;
  };

  return { ws, send, evaluate };
}

/** Wait until the engine has revealed the canvas, or give up. */
async function waitForReady(evaluate) {
  const deadline = Date.now() + 5000;

  while (Date.now() < deadline) {
    const ready = await evaluate(
      `!!document.documentElement && document.documentElement.classList.contains('fiveprayer-tv-ready')`,
    );
    if (ready) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return false;
}

/** Read what the engine actually did to the stage. */
async function readStage(evaluate) {
  return JSON.parse(
    await evaluate(`(function () {
      var stage = document.querySelector('.fiveprayer-tv-stage');
      if (!stage) {
        return JSON.stringify({ staged: false });
      }

      var box = stage.getBoundingClientRect();
      var rows = [].slice.call(stage.querySelectorAll('[data-row]'));
      var below = 0;
      var worst = 0;
      var lastRowBottom = 0;

      rows.forEach(function (row) {
        var rect = row.getBoundingClientRect();
        lastRowBottom = Math.max(lastRowBottom, rect.bottom);
        if (rect.bottom > window.innerHeight + 1) {
          below++;
          worst = Math.max(worst, rect.bottom - window.innerHeight);
        }
      });

      return JSON.stringify({
        staged: true,
        viewport: [window.innerWidth, window.innerHeight],
        scale: new DOMMatrixReadOnly(getComputedStyle(stage).transform).a,
        stageWidth: stage.offsetWidth,
        stageBottom: box.bottom,
        contentHeight: stage.scrollHeight,
        rows: rows.length,
        lastRowBottom: lastRowBottom,
        rowsBelowScreen: below,
        worstRowOverflow: worst,
        scrollLocked: getComputedStyle(document.documentElement).overflow
      });
    })()`),
  );
}

/**
 * Runs before the page's own scripts: records what the first revealed frame
 * looks like.
 *
 * The observer fires as soon as the engine writes `fiveprayer-tv-ready` on
 * <html> — the class the stylesheet unhides the canvas on — and that is a
 * microtask, so the snapshot describes the frame that is about to be painted.
 */
const FIRST_FRAME_PROBE = `
  window.__fiveprayerFirstFrame = null;
  document.addEventListener('DOMContentLoaded', function () {
    var root = document.documentElement;

    var snapshot = function () {
      if (window.__fiveprayerFirstFrame) {
        return;
      }

      var stage = document.querySelector('.fiveprayer-tv-stage');
      if (!stage) {
        return;
      }

      var content = stage.querySelector('.entry-content');
      var main = stage.querySelector('main');
      var box = content ? content.getBoundingClientRect() : null;

      window.__fiveprayerFirstFrame = {
        trimmedContent: !!(content && content.classList.contains('fiveprayer-tv-trim')),
        trimmedMain: !!(main && main.classList.contains('fiveprayer-tv-trim')),
        top: box ? Math.round(box.top) : null,
        pageH: stage.scrollHeight,
        contentH: content ? content.scrollHeight : null
      };
    };

    new MutationObserver(function () {
      if (root.classList.contains('fiveprayer-tv-ready')) {
        snapshot();
      }
    }).observe(root, { attributes: true, attributeFilter: ['class'] });
  });
`;

/** The same numbers, read after everything has settled. */
const TRIM_STATE = `(function () {
  var stage = document.querySelector('.fiveprayer-tv-stage');
  var content = stage.querySelector('.entry-content');
  var main = stage.querySelector('main');

  return JSON.stringify({
    trimmedContent: content.classList.contains('fiveprayer-tv-trim'),
    trimmedMain: main.classList.contains('fiveprayer-tv-trim'),
    top: Math.round(content.getBoundingClientRect().top),
    pageH: stage.scrollHeight,
    contentH: content.scrollHeight,
    scale: new DOMMatrixReadOnly(getComputedStyle(stage).transform).a
  });
})()`;

const APPROX = (a, b, tolerance = 0.02) => Math.abs(a - b) <= tolerance;

const cases = [
  {
    name: 'tall page on a 16:9 canvas',
    query: 'canvas=1080&width=1920&rows=30&rowHeight=40',
    viewport: { width: 1920, height: 1080 },
    expect: (stage) => {
      // The fit is driven by the page's real height, less the bottom inset the
      // engine keeps under the last row (3% of the height, clamped to 12-60px),
      // so the whole page fits and its last row stays off the screen edge.
      const inset = Math.min(60, Math.max(12, Math.round(stage.viewport[1] * 0.03)));
      const expected = Math.min(
        stage.viewport[0] / stage.stageWidth,
        (stage.viewport[1] - inset) / Math.max(1080, stage.contentHeight),
      );
      const clearBelow = stage.viewport[1] - stage.lastRowBottom;
      return [
        [APPROX(stage.scale, expected), `scale ${stage.scale.toFixed(3)} matches the page's own height less the ${inset}px inset (${expected.toFixed(3)})`],
        [stage.scale < 1, 'the page is scaled down rather than run past the screen'],
        [
          clearBelow >= inset - 1,
          `the last row keeps ${Math.round(clearBelow)} px clear below it (inset ${inset} px)`,
        ],
      ];
    },
  },
  {
    name: 'tall page on a portrait canvas on a short screen',
    query: 'canvas=1024&width=768&rows=30&rowHeight=40',
    viewport: { width: 768, height: 432 },
    expect: (stage) => [
      [stage.scale < 0.4, `scale ${stage.scale.toFixed(3)} fits the 1024 px box into a 432 px screen`],
    ],
  },
  {
    name: 'older TV with overscan: the safe-area band is the clearance',
    query: 'canvas=1080&width=1920&rows=30&rowHeight=40&overscan=5',
    viewport: { width: 1920, height: 1080 },
    expect: (stage) => {
      // The design is fitted inside the safe area, so it already ends one
      // overscan band above the bottom edge. The bottom inset must not be
      // asked for a second time on top of that band.
      const safe = 1 - (2 * 5) / 100;
      const expected = Math.min(
        (stage.viewport[0] * safe) / stage.stageWidth,
        (stage.viewport[1] * safe) / Math.max(1080, stage.contentHeight),
      );
      const band = (stage.viewport[1] * 5) / 100;
      const clearBelow = stage.viewport[1] - stage.lastRowBottom;

      return [
        [
          APPROX(stage.scale, expected, 0.005),
          `scale ${stage.scale.toFixed(3)} is the 5% safe area's own fit (${expected.toFixed(3)}), with no inset taken twice`,
        ],
        [
          clearBelow >= band - 1,
          `the last row keeps the ${Math.round(band)} px overscan band below it (${Math.round(clearBelow)} px)`,
        ],
      ];
    },
  },
  {
    name: 'page shorter than the box keeps the box scale',
    query: 'canvas=1080&width=1920&rows=4&rowHeight=40',
    viewport: { width: 1920, height: 1080 },
    expect: (stage) => [
      [APPROX(stage.scale, 1, 0.001), `scale ${stage.scale.toFixed(3)} is the box's own 1.000, not an enlargement`],
      [stage.contentHeight < 1080, `the fixture is shorter than the box (${stage.contentHeight} px)`],
    ],
  },
];

async function main() {
  const chrome = findChrome();
  if (!chrome) {
    console.log('SKIP: Chrome was not found (set CHROME_PATH to run this test)');
    return;
  }

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fiveprayer-tv-fit-'));
  const fixturePath = path.join(workDir, 'fixture.html');
  const profileDir = path.join(workDir, 'profile');
  fs.writeFileSync(fixturePath, buildFixture(), 'utf8');

  const browser = spawn(
    chrome,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--hide-scrollbars',
      '--allow-file-access-from-files',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  let client = null;

  try {
    // Chrome writes the port it chose into DevToolsActivePort in its profile.
    const portFile = path.join(profileDir, 'DevToolsActivePort');
    const deadline = Date.now() + 20000;
    let port = 0;

    while (Date.now() < deadline && !port) {
      if (fs.existsSync(portFile)) {
        try {
          const raw = fs.readFileSync(portFile, 'utf8').split('\n')[0].trim();
          port = Number(raw) || 0;
        } catch (error) {
          // On Windows Chrome has the file open while it writes it; retry.
          port = 0;
        }
      }
      if (!port) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (!port) {
      throw new Error('Chrome did not open a debugging port');
    }

    client = await connect(port);
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    await client.send('Emulation.setFocusEmulationEnabled', { enabled: true });

    for (const testCase of cases) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: testCase.viewport.width,
        height: testCase.viewport.height,
        deviceScaleFactor: 1,
        mobile: false,
      });

      await client.send('Page.navigate', {
        url: `file:///${fixturePath.replace(/\\/g, '/')}?${testCase.query}`,
      });

      if (!(await waitForReady(client.evaluate))) {
        fail(`${testCase.name}: the engine never revealed the canvas`);
        continue;
      }

      const stage = await readStage(client.evaluate);

      if (!stage.staged) {
        fail(`${testCase.name}: the engine did not stage the page`);
        continue;
      }

      const checks = [
        [
          stage.rowsBelowScreen === 0,
          `${stage.rowsBelowScreen} of ${stage.rows} rows below the screen (worst ${Math.round(stage.worstRowOverflow)} px)`,
        ],
        [
          stage.stageBottom <= testCase.viewport.height + 1,
          `stage bottom ${Math.round(stage.stageBottom)} px within the ${testCase.viewport.height} px screen`,
        ],
        [stage.scrollLocked === 'hidden', 'the document stays scroll-locked'],
        ...testCase.expect(stage),
      ];

      for (const [ok, detail] of checks) {
        if (ok) {
          pass(`${testCase.name}: ${detail}`);
        } else {
          fail(`${testCase.name}: ${detail}`);
        }
      }
    }
    // --- the theme-spacing trim must be in place before the first frame ---
    const trimFixturePath = path.join(workDir, 'trim-fixture.html');
    fs.writeFileSync(trimFixturePath, buildTrimFixture(), 'utf8');

    await client.send('Page.addScriptToEvaluateOnNewDocument', { source: FIRST_FRAME_PROBE });
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await client.send('Page.navigate', {
      url: `file:///${trimFixturePath.replace(/\\/g, '/')}`,
    });

    if (!(await waitForReady(client.evaluate))) {
      fail('theme-spacing trim: the engine never revealed the canvas');
    } else {
      // Well past the 400ms / 1200ms retries, so any late trim would show up.
      await new Promise((resolve) => setTimeout(resolve, 1600));

      const first = JSON.parse(
        await client.evaluate('JSON.stringify(window.__fiveprayerFirstFrame)'),
      );
      const settled = JSON.parse(await client.evaluate(TRIM_STATE));

      if (!first) {
        fail('theme-spacing trim: the first revealed frame was not captured');
      } else {
        const checks = [
          [
            first.trimmedContent,
            'the content root already carries the trim class on the first revealed frame',
          ],
          [first.trimmedMain, 'the wrapper above it is trimmed too'],
          [
            first.top === 0,
            `the theme's top margin is already gone when the page is revealed (content top ${first.top}px)`,
          ],
          [
            Math.abs(first.pageH - first.contentH) <= 2,
            `the revealed page box is the content alone (${first.pageH}px vs ${first.contentH}px of content)`,
          ],
          [
            settled.pageH === first.pageH,
            `page height unchanged since the reveal (${first.pageH} -> ${settled.pageH}px)`,
          ],
          [
            settled.top === first.top,
            `nothing moved after the reveal (top ${first.top} -> ${settled.top}px)`,
          ],
        ];

        for (const [ok, detail] of checks) {
          if (ok) {
            pass(`theme-spacing trim: ${detail}`);
          } else {
            fail(`theme-spacing trim: ${detail}`);
          }
        }
      }
    }
  } catch (error) {
    fail(`the test could not run: ${error.message}`);
  } finally {
    if (client) {
      client.ws.close();
    }

    if (process.platform === 'win32' && browser.pid) {
      spawn('taskkill', ['/pid', String(browser.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      browser.kill('SIGKILL');
    }

    // Chrome can still be releasing the profile; a failed cleanup is not a test
    // failure.
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch (error) {
      /* ignore */
    }
  }

  console.log(
    failures === 0
      ? '\nPASS: the TV engine keeps a too-tall page on screen and trims before the first frame'
      : `\nFAIL: ${failures} check(s) failed`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
