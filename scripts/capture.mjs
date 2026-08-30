import { chromium } from 'playwright';
import { mkdir, rm, writeFile } from 'node:fs/promises';

/**
 * Съёмка локаций для разбора: `npm run capture`.
 *
 * Кадр обязан быть воспроизводим побитово от запуска к запуску. Разбор
 * по нестабильным снимкам хуже отсутствия разбора: он даёт ложную
 * уверенность и сравнение «было и стало» превращает в шум. Отсюда
 * флаги: интерфейс убран, время стоит, толпа не идёт, сид один.
 */
const HOST = process.env.CAPTURE_HOST ?? 'http://127.0.0.1:5200';
const OUT = 'artifacts/review';
const SHOT = { width: 480, height: 270 };

/** Где что снимать: район и, если это комната, её локация. */
const PLACES = [
  ['hills', null], ['downtown', null], ['boulevard', null], ['pier', null],
  ['hills', 'apartment'], ['hills', 'gym'], ['hills', 'phoniatrist'],
  ['downtown', 'vocal_studio'], ['downtown', 'record_studio'], ['downtown', 'clothes_shop'],
  ['boulevard', 'restaurant'], ['boulevard', 'club_vertigo'], ['pier', 'rehearsal_base'],
];

const flags = (extra) => ['bare', 'still', 'hook', ...extra].join(',');

async function open(browser, extra) {
  const page = await browser.newPage({ viewport: SHOT, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${HOST}/?debug=${flags(extra)}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  // Меню: «Новая игра» ставит один и тот же сид на каждый запуск.
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  // Меню: «Новая игра», затем выбор жанра. Первый жанр один и тот же
  // всегда — снимку нужна повторяемость, а не разнообразие.
  await page.mouse.click(240, 113);
  await page.waitForTimeout(900);
  await page.mouse.click(240, 100);
  await page.waitForTimeout(1500);
  await page.waitForFunction(() => typeof window.__vsCapture === 'object', null, { timeout: 15000 });
  return { page, errors };
}

async function shoot(page, district, location, file, mute) {
  await page.evaluate(([d, l]) => window.__vsCapture.go(d, l), [district, location]);
  await page.waitForTimeout(700);
  // Кадр с подписью — испорченный кадр: имя NPC и подсказка действия
  // закрывают ровно ту расстановку, ради которой снимаем. Один раз это
  // уже прошло мимо: `bare` убирал панель и кнопки, а текст мира — нет.
  // Отладочные виды считают номера глубины своей работой и не в счёт.
  if (mute) {
    const labels = await page.evaluate(() => window.__vsCapture.labels());
    if (labels > 0) throw new Error(`${file}: в кадре осталось надписей: ${labels}`);
  }
  await page.screenshot({ path: file, clip: { x: 0, y: 0, ...SHOT } });
}

/** Тот же кадр крупнее, соседним пикселем: мелочь на 480x270 не разглядеть. */
async function zoom(browser, from, to, times) {
  const page = await browser.newPage({ viewport: { width: SHOT.width * times, height: SHOT.height * times } });
  await page.setContent(
    `<style>body{margin:0}img{width:${SHOT.width * times}px;image-rendering:pixelated}</style>` +
    `<img src="data:image/png;base64,${(await import('node:fs')).readFileSync(from).toString('base64')}">`,
  );
  await page.waitForTimeout(200);
  await page.screenshot({ path: to });
  await page.close();
}

/**
 * Контактный лист: все предметы разом, под каждым только номер. Номер
 * ничего не говорит о предмете, поэтому опознание остаётся слепым, а
 * ответы есть чем пронумеровать.
 */
async function sheet(browser, numbers) {
  const { readFileSync } = await import('node:fs');
  const COLUMNS = 7;
  const CELL = { w: 160, h: 150 };
  const ZOOM = 2;
  const rows = Math.ceil(numbers.length / COLUMNS);
  const page = await browser.newPage({
    viewport: { width: COLUMNS * CELL.w * ZOOM, height: rows * (CELL.h * ZOOM + 18) },
  });
  const cells = numbers
    .map((number) => {
      const data = readFileSync(`${OUT}/props/${number}.png`).toString('base64');
      return `<figure><img src="data:image/png;base64,${data}"><figcaption>${number}</figcaption></figure>`;
    })
    .join('');
  await page.setContent(
    `<style>body{margin:0;background:#6a7078;display:grid;` +
    `grid-template-columns:repeat(${COLUMNS},${CELL.w * ZOOM}px)}` +
    `figure{margin:0}img{width:${CELL.w * ZOOM}px;image-rendering:pixelated;display:block}` +
    `figcaption{font:14px monospace;color:#fff;text-align:center;height:18px}</style>${cells}`,
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/props/contact_sheet.png`, fullPage: true });
  await page.close();
}

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? undefined,
});
await rm(OUT, { recursive: true, force: true });

const problems = [];
/** Третье поле — обязан ли вид быть без единой надписи. */
const views = [
  ['native', [], true],
  ['grid', ['iso'], false],
  ['walkable', ['walk'], true],
  ['with_character', ['cast'], true],
];

for (const [name, extra, mute] of views) {
  const { page, errors } = await open(browser, extra);
  for (const [district, location] of PLACES) {
    const id = location ?? district;
    await mkdir(`${OUT}/${id}`, { recursive: true });
    await shoot(page, district, location, `${OUT}/${id}/${name}.png`, mute);
  }
  problems.push(...errors);
  await page.close();
}

for (const [district, location] of PLACES) {
  const id = location ?? district;
  await zoom(browser, `${OUT}/${id}/native.png`, `${OUT}/${id}/zoom3x.png`, 3);
}

/*
 * Предметы поштучно, без подписи на картинке и без имени в файле.
 *
 * Проверка узнаваемости работает только вслепую: под картинкой с
 * подписью «микшерный пульт» пульт опознает кто угодно. Имена лежат в
 * key.json, который открывают уже после ответов.
 */
{
  const { page } = await open(browser, []);
  const kinds = await page.evaluate(() => window.__vsCapture.props);
  await mkdir(`${OUT}/props`, { recursive: true });
  const key = {};
  for (const [i, kind] of kinds.entries()) {
    const number = String(i + 1).padStart(2, '0');
    key[number] = kind;
    await page.evaluate((k) => window.__vsCapture.prop(k), kind);
    await page.waitForTimeout(180);
    await page.screenshot({
      path: `${OUT}/props/${number}.png`,
      clip: { x: 160, y: 60, width: 160, height: 150 },
    });
  }
  await writeFile(`${OUT}/props/key.json`, `${JSON.stringify(key, null, 2)}\n`);
  await page.close();
  await sheet(browser, Object.keys(key));
  process.stdout.write(`Снято предметов: ${kinds.length}\n`);
}

await browser.close();
await writeFile(`${OUT}/places.json`, `${JSON.stringify(PLACES.map(([d, l]) => l ?? d), null, 2)}\n`);

if (problems.length > 0) {
  process.stderr.write(`Ошибки на странице:\n${problems.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Снято локаций: ${PLACES.length}, видов: ${views.length + 1}\n`);
}
