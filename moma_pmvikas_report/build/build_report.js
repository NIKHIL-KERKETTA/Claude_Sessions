// Builds the PM VIKAS report (.docx). Run: node build_report.js <out.docx>
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType,
  ShadingType, AlignmentType, BorderStyle, HeadingLevel, PageBreak, Footer, Header,
  PageNumber, LevelFormat, FootnoteReferenceRun, TableOfContents, VerticalAlign, TableLayoutType
} = require('docx');

const D = __dirname;
const FIG = f => fs.readFileSync(path.join(D, 'fig', f));
const ICON = f => fs.readFileSync(path.join(D, 'icons', f + '.png'));
const { imageSize } = (() => ({ imageSize: f => { const b = fs.readFileSync(path.join(D, 'fig', f)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; } }))();

const INK = '2E2E38', EY = 'FFE600', BLUE = '188CE5', MUTED = '747480', SOFT = 'F6F6FA', PALEY = 'FFF9C4', PALEB = 'EAF4FD', RULE = 'E1E1E6';
const FONT = 'Arial';
const TW = 9638; // text width in DXA (A4, 2 cm margins)

// ---------- footnotes
const notes = {}; let nId = 0;
function fn(text) { nId += 1; notes[nId] = { children: [new Paragraph({ children: [new TextRun({ text, size: 15, font: FONT, color: '4A4A55' })] })] }; return new FootnoteReferenceRun(nId); }

// ---------- text helpers
function runs(parts) {
  // parts: string | [string, {bold,italic,color}] | FootnoteReferenceRun
  if (typeof parts === 'string') parts = [parts];
  return parts.map(p => {
    if (p instanceof FootnoteReferenceRun) return p;
    if (typeof p === 'string') return new TextRun({ text: p, font: FONT, size: 20, color: INK });
    return new TextRun(Object.assign({ text: p[0], font: FONT, size: 20, color: INK }, p[1]));
  });
}
const P = (parts, o = {}) => new Paragraph(Object.assign({ children: runs(parts), spacing: { after: 140, line: 288 } }, o));
const Bul = (parts, lvl = 0) => new Paragraph({ children: runs(parts), numbering: { reference: 'bul', level: lvl }, spacing: { after: 80, line: 276 } });
const Num = (parts) => new Paragraph({ children: runs(parts), numbering: { reference: 'num', level: 0 }, spacing: { after: 80, line: 276 } });
const Spacer = (h = 120) => new Paragraph({ children: [], spacing: { after: h } });
const PB = () => new Paragraph({ children: [new PageBreak()] });

function H1(text, icon) {
  const ch = [];
  if (icon) ch.push(new ImageRun({ type: 'png', data: ICON(icon + '_badge'), transformation: { width: 34, height: 34 } }), new TextRun({ text: '  ', font: FONT }));
  ch.push(new TextRun({ text, font: FONT, size: 36, bold: true, color: INK }));
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: ch, spacing: { before: 120, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: EY, space: 6 } } });
}
function H2(text) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, font: FONT, size: 26, bold: true, color: INK })], spacing: { before: 280, after: 120 } }); }
function H3(text) { return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, font: FONT, size: 21, bold: true, color: BLUE })], spacing: { before: 200, after: 80 } }); }

// ---------- exhibits
let exN = 0;
function exhibit(title, file, source, widthFrac = 1) {
  exN += 1;
  const { w, h } = imageSize(file);
  const W = Math.round(640 * widthFrac), Hh = Math.round(W * h / w);
  return [
    new Paragraph({ keepNext: true, spacing: { before: 200, after: 40 }, children: [new TextRun({ text: `Exhibit ${exN}`, font: FONT, size: 16, bold: true, color: BLUE })] }),
    new Paragraph({ keepNext: true, spacing: { after: 100 }, children: [new TextRun({ text: title, font: FONT, size: 22, bold: true, color: INK })] }),
    new Paragraph({ keepNext: true, alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'png', data: FIG(file), transformation: { width: W, height: Hh } })] }),
    new Paragraph({ spacing: { before: 60, after: 220 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 4 } }, children: [new TextRun({ text: 'Source: ', font: FONT, size: 15, bold: true, color: MUTED }), new TextRun({ text: source, font: FONT, size: 15, color: MUTED })] })
  ];
}

// ---------- tables
const border = { style: BorderStyle.SINGLE, size: 4, color: RULE };
const borders = { top: border, bottom: border, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } };
function cell(content, w, o = {}) {
  const paras = (Array.isArray(content) && content.length && content[0] instanceof Paragraph) ? content
    : [new Paragraph({ children: runs(typeof content === 'string' ? [[content, { size: o.size || 17, bold: o.bold, color: o.color || INK }]] : content), spacing: { after: 40 } })];
  return new TableCell({ width: { size: w, type: WidthType.DXA }, borders, shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined, margins: { top: 80, bottom: 80, left: 100, right: 100 }, verticalAlign: o.v || VerticalAlign.TOP, children: paras });
}
function table(headers, rows, widths, o = {}) {
  const sum = widths.reduce((a, b) => a + b, 0);
  const hdr = new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], { bold: true, fill: INK, color: 'FFFFFF', size: 16 })) });
  const body = rows.map((r, ri) => new TableRow({ children: r.map((c, i) => cell(c, widths[i], { fill: (o.zebra && ri % 2) ? SOFT : undefined, bold: o.boldFirst && i === 0 })) }));
  return new Table({ width: { size: sum, type: WidthType.DXA }, columnWidths: widths, rows: [hdr, ...body] });
}
// status tag text
const TAG = { existing: ['Existing scheme', '188CE5'], op: ['Operational mechanism', '0E9A80'], ended: ['Not approved beyond 2021-22', '747480'], proposed: ['Proposed', 'E0620D'], approval: ['Needs approval', '7A55C8'] };
const tag = k => [[TAG[k][0], { bold: true, color: TAG[k][1], size: 16 }]];

// ---------- callouts
function callout(icon, title, lines, fill = PALEB, accent = BLUE) {
  const inner = [new Paragraph({ spacing: { after: 80 }, children: [new ImageRun({ type: 'png', data: ICON(icon + '_dark'), transformation: { width: 16, height: 16 } }), new TextRun({ text: '  ' + title, font: FONT, size: 19, bold: true, color: INK })] })];
  lines.forEach(l => inner.push(new Paragraph({ children: runs(l), spacing: { after: 70, line: 276 } })));
  return new Table({ width: { size: TW, type: WidthType.DXA }, columnWidths: [TW], rows: [new TableRow({ cantSplit: true, children: [new TableCell({ width: { size: TW, type: WidthType.DXA }, shading: { fill, type: ShadingType.CLEAR, color: 'auto' }, borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.SINGLE, size: 24, color: accent } }, margins: { top: 140, bottom: 120, left: 220, right: 200 }, children: inner })] })] });
}
// Data gap box: what is missing / closest published figure / what it may mean / how to collect
function gapBox(id, title, missing, proxy, meaning, collect) {
  const L = [];
  L.push([['What is missing: ', { bold: true }], missing]);
  L.push([['Closest published figure: ', { bold: true }], ...[].concat(proxy)]);
  if (meaning) L.push([['What this may mean: ', { bold: true }], meaning]);
  L.push([['How it can be collected: ', { bold: true }], collect]);
  return [callout('gap', `Data gap ${id}: ${title}`, L, PALEY, EY), Spacer(160)];
}
function placeholder(title, lines) { return [callout('clock', title, lines, 'EEEEF3', '747480'), Spacer(160)]; }

// key-number tiles (row of up to 3)
function tiles(items) {
  const w = Math.floor(TW / items.length);
  return new Table({ width: { size: w * items.length, type: WidthType.DXA }, columnWidths: items.map(() => w), rows: [new TableRow({ children: items.map(([num, txt]) => new TableCell({ width: { size: w, type: WidthType.DXA }, borders: { top: { style: BorderStyle.SINGLE, size: 18, color: EY }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } }, margins: { top: 120, bottom: 80, left: 80, right: 160 }, children: [new Paragraph({ children: [new TextRun({ text: num, font: FONT, size: 40, bold: true, color: INK })], spacing: { after: 40 } }), new Paragraph({ children: runs([[txt, { size: 17, color: '4A4A55' }]]) })] })) })] });
}

// =====================================================================================
// CONTENT
// =====================================================================================
const body = [];
const add = (...x) => x.flat().forEach(e => body.push(e));

// ---------------- Cover
add(
  new Paragraph({ spacing: { before: 600, after: 0 }, children: [new ImageRun({ type: 'png', data: ICON('pmvikas_ybadge'), transformation: { width: 64, height: 64 } })] }),
  new Paragraph({ spacing: { before: 400, after: 120 }, children: [new TextRun({ text: 'MINISTRY OF MINORITY AFFAIRS', font: FONT, size: 20, bold: true, color: MUTED })] }),
  new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Strengthening PM VIKAS', font: FONT, size: 64, bold: true, color: INK })] }),
  new Paragraph({ spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 36, color: EY, space: 12 } }, children: [new TextRun({ text: 'Where the scheme stands, what limits its reach and outcomes, and where the evidence is missing', font: FONT, size: 28, color: '4A4A55' })] }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Report, part 1: assessment and gaps', font: FONT, size: 22, bold: true, color: INK })] }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Covers PM VIKAS and PMJVK. Solutions and the implementation roadmap follow in part 2.', font: FONT, size: 20, color: '4A4A55' })] }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Working draft, October 2026', font: FONT, size: 20, color: MUTED })] }),
  PB()
);

// ---------------- Contents
add(
  new Paragraph({ children: [new TextRun({ text: 'Contents', font: FONT, size: 36, bold: true, color: INK })], spacing: { after: 200 } }),
  new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-2' }),
  PB()
);

// ---------------- Executive summary
add(H1('Executive summary', 'flag'));
add(P('This report assesses the PM VIKAS scheme of the Ministry of Minority Affairs and the Pradhan Mantri Jan Vikas Karyakram (PMJVK), with which its infrastructure component dovetails. It sets out where the schemes stand today, what official evaluations say about access and outcomes, how the six notified minority communities differ in their starting points, and where the data needed to plan and track the schemes is missing. It ends with a numbered list of gaps. Solutions are deliberately held for part 2, so that each one can be mapped to the gaps it addresses.'));
add(tiles([['2025', 'PM VIKAS guidelines approved and the scheme rolled out in January 2025, bringing five earlier schemes into one.'], ['1,300', 'Minority Concentration Areas covered by PMJVK: 870 blocks, 321 towns and 109 district headquarters in 308 districts.'], ['84% vs 16%', 'Share of schemes analysed by NITI Aayog that converge with others at planning, against monitoring and evaluation.']]));
add(Spacer(200));
add(H3('Key messages'));
add(Num([['PM VIKAS is new and its design already contains strong outcome provisions. ', { bold: true }], 'The guidelines set a 75% placement norm for non-traditional skilling, require tracking of placed trainees for at least three months, and require each candidate to be tracked on the Skill India Digital Hub with dashboards by gender, religion, EWS status and disability.', fn('MoMA, Guidelines for PM VIKAS, para 2.3.3.3(b), p. 10; para 6.4.2, p. 27; pp. 12, 25, 28, 32. PM VIKAS Monitoring and Evaluation Guidelines, pp. 8, 25.')]));
add(Num([['Official evaluations point to the same weak steps: awareness, documents and repeat visits. ', { bold: true }], 'About 59% of survey respondents in eight states were unaware of PMJVK facilities, and only 33.1% of beneficiaries surveyed in an earlier evaluation were aware of the 15 Point Programme.', fn('NITI Aayog DMEO (2021), Evaluation of CSS in Social Inclusion, Vol. 4: MoMA, pp. 89-90; CMRSD for MoMA (2016), Evaluation of PM\'s New 15 Point Programme, p. 139.')]));
add(Num([['Convergence happens at planning but rarely in monitoring. ', { bold: true }], 'This matters for PM VIKAS because its outcomes (placement, enterprise, credit) depend on schemes run by other ministries.']));
add(Num([['Starting points differ by community. ', { bold: true }], 'Compared with the all-India value, women\'s labour-force participation is lower in Muslim households (30.2% against 41.7%) and Sikh households (33.0%), while unemployment is higher in Christian (4.7%) and Sikh (5.8%) households than the national 3.2%.', fn('MoSPI, PLFS Annual Report 2023-24, Tables 47-49. Religion is that of the household head.')]));
add(Num([['The communities are concentrated in different places. ', { bold: true }], 'Half of all Sikhs live in 9 districts, half of all Buddhists in 12 and half of all Muslims across 74. Outreach and centre location can therefore be planned district by district for some communities, while others need state-wide channels.']));
add(Num([['Much of the data needed to target and track PM VIKAS is not published by community. ', { bold: true }], 'PLFS does not report Buddhist, Jain or Parsi households separately; UDISE+ does not report dropout or transition by community; time-use and enterprise data by religion are missing or dated. Where only all-community figures exist, this report uses them as a proxy and says so.']));
add(PB());

// ---------------- About this report
add(H1('About this report', 'info'));
add(H2('Scope and structure'));
add(P('The report follows the sequence agreed for this assessment: (1) the scheme as it stands, (2) survey findings, (3) key implementation challenges, (4) related schemes and initiatives, (5) data gaps, (6) minority demographics and (7) a consolidated list of gaps. Part 2 will add the solutions framework, the matrix linking each gap to the solutions that address it, and a prioritised roadmap.'));
add(H2('Evidence used'));
add(table(['Type', 'What it covers', 'How it is used here'], [
  [[['Official statistics', { bold: true }]], 'Census 2011, PLFS 2023-24, NSS Report 589, UDISE+ 2024-25, AISHE 2023-24, Sixth Economic Census, Time Use Survey 2024', 'Demographics, education and work outcomes, compared with the all-India value'],
  [[['Ministry documents and Parliament replies', { bold: true }]], 'PM VIKAS guidelines and monitoring guidelines, PIB releases, Lok Sabha replies, list of Minority Concentration Districts', 'Scheme design, coverage and outputs'],
  [[['Evaluations commissioned by government', { bold: true }]], 'NITI Aayog DMEO (2021, 2022), CMRSD (2016), National Productivity Council, NMDFC impact studies', 'Access, convergence and delivery challenges'],
  [[['Primary evidence', { bold: true }]], 'Field survey and stakeholder consultations; the implementation team\'s own experience', 'Held for now; kept separate from official evidence when added'],
], [2300, 4038, 3300], { zebra: true }));
add(Spacer());
add(H2('How to read the labels'));
add(P('Every scheme, mechanism and idea in this report carries one of the following labels, so that existing arrangements are not confused with proposals.'));
add(table(['Label', 'Meaning'], [
  [tag('existing'), 'A scheme that is approved and running.'],
  [tag('op'), 'A process or provision that is already part of how a scheme operates, for example a clause in the guidelines.'],
  [tag('ended'), 'A scheme that has not been approved for implementation beyond 2021-22.'],
  [tag('proposed'), 'An idea put forward for evaluation. It is not an approved arrangement. (Used in part 2.)'],
  [tag('approval'), 'A recommendation that would need approval from the Ministry or another authority before it could be acted on. (Used in part 2.)'],
], [2600, 7038]));
add(Spacer());
add(H2('Comparisons and data gaps'));
add(P('Each community is compared only with the all-India value, never with another community. Where a figure is not published for a community, the report says so and uses the closest published figure, usually one that covers all communities. In such cases, where the community\'s own published indicators are below the all-India value, the report notes that the community may be more affected than the all-community figure suggests. These notes are marked as data gaps and are collected in section 5.'));
add(PB());

// ---------------- 1. As-is
add(H1('1. PM VIKAS and PMJVK as they stand', 'pmvikas'));
add(P('This section describes the two schemes as they are designed and delivered today, using the scheme guidelines, Parliament replies and Ministry releases.'));
add(H2('1.1 How targeting has evolved'));
add(P(['Area-based support for minority communities began with the Multi-sectoral Development Programme (MsDP) in 2008-09, in 90 Minority Concentration Districts: 53 in Category A, 20 in Category B1 and 17 in Category B2.', fn('MoMA, List of Minority Concentration Districts; PIB release relid 112513 (MoMA). Category A: socio-economic and basic-amenity indicators below the national average; B1: socio-economic indicators only; B2: basic amenities only.'), ' Planning moved to blocks and towns in 2013-14, and the Post-Sachar Evaluation Committee (Kundu Committee) reviewed progress in 2014. Since 2018, PMJVK has covered 870 blocks, 321 towns and 109 district headquarters in 308 districts.', fn('Post-Sachar Evaluation Committee (2014); Lok Sabha Unstarred Question 3559, answered 24.03.2022.'), ' PM VIKAS followed in 2025.', fn('MoMA, Guidelines for PM VIKAS; PIB release PRID 2222788 (3 Feb 2026): guidelines approved and scheme rolled out in January 2025.')]));
add(exhibit('Targeting has moved from districts to blocks and towns, and PM VIKAS was added in 2025', 'fig_timeline.png', 'PM\'s High Level Committee (2006); CMRSD for MoMA (2016), p. 12; NITI Aayog DMEO (2021), Vol. 4, p. 54; PIB relid 112513; Post-Sachar Evaluation Committee (2014); Lok Sabha Unstarred Question 3559 (24.03.2022); PIB PRID 2222788.'));
add(exhibit('The 90 Minority Concentration Districts of 2008-09 cluster in the Gangetic plain, the North East and parts of Maharashtra', 'map_mcd.png', 'MoMA, List of Minority Concentration Districts. Districts on the list (2001 census) matched to Census 2011 boundaries. Map not to scale.', 0.82));

add(H2('1.2 PM VIKAS: objectives and components'));
add(P(['PM VIKAS brings five earlier schemes of the Ministry into one scheme with four components.', fn('MoMA, Guidelines for PM VIKAS, paras 1.3 and 1.5.'), ' USTTAD and Hamari Dharohar (traditional arts and crafts) and Seekho aur Kamao (modern-sector skills) become the skilling and training component. Nai Roshni becomes the women\'s leadership and entrepreneurship component, and Nai Manzil becomes the education component. The fourth component, infrastructure development, dovetails with PMJVK.']));
add(exhibit('PM VIKAS combines five earlier schemes into four components', 'fig_pmvikas_structure.png', 'MoMA, Guidelines for PM VIKAS, paras 1.3, 1.5, 1.5.3 and 2.5.1.'));
add(P(['The earlier schemes give a sense of the scale PM VIKAS inherits. By March 2022, 4.60 lakh people had been trained under Seekho aur Kamao, 58% of them women; 98,697 people had enrolled under Nai Manzil; and 23,130 people had been trained under USTTAD since May 2015.', fn('Lok Sabha Unstarred Question 4740, answered 31.03.2022.')]));
add(exhibit('The earlier schemes reached several lakh people, most of them through Seekho aur Kamao', 'fig_legacy.png', 'Lok Sabha Unstarred Question 4740 (31.03.2022). Nai Manzil figure is enrolment; the others are people trained.'));

add(H2('1.3 PM VIKAS: provisions that shape delivery'));
add(P('The guidelines contain several provisions that already link training to outcomes and to other schemes. They are listed here because the challenges in section 3 and the solutions in part 2 build on them.'));
add(table(['Provision', 'What the guidelines provide', 'Label'], [
  [[['Placement norm', { bold: true }]], ['A 75% placement norm for the non-traditional skilling component.', fn('MoMA, Guidelines for PM VIKAS, para 2.3.3.3(b), p. 10.')], tag('op')],
  [[['Post-placement tracking', { bold: true }]], ['In non-traditional skilling, agencies must track placed trainees for at least three months after training.', fn('MoMA, Guidelines for PM VIKAS, para 6.4.2, p. 27.')], tag('op')],
  [[['Counselling on other schemes', { bold: true }]], 'Agencies must tell each trainee about other welfare schemes and the documents needed to apply.', tag('op')],
  [[['Biz Sakhis', { bold: true }]], 'Ten per cent of women entrepreneurship trainees become Biz Sakhis, who support other women entrepreneurs at their doorstep.', tag('op')],
  [[['One candidate record', { bold: true }]], 'Each candidate is to be tracked on the Skill India Digital Hub, with dashboards by gender, religion, EWS status and disability.', tag('op')],
  [[['Education for dropouts', { bold: true }]], ['Open schooling through NIOS for Class 8, 10 and 12 for school dropouts, at least half of them women.', fn('MoMA, Guidelines for PM VIKAS, paras 1.5.3 and 2.5.1.')], tag('op')],
], [2300, 5838, 1500], { zebra: true }));
add(P([['Source for the counselling, Biz Sakhi and candidate-record provisions: MoMA, Guidelines for PM VIKAS, pp. 12, 25, 28, 32; PM VIKAS Monitoring and Evaluation Guidelines, pp. 8, 25.', { size: 15, color: MUTED }]], { spacing: { before: 60, after: 200 } }));
add(placeholder('To be added: delivery architecture and implementation process', [
  'The roles of the Ministry, States, Project Implementing Agencies (PIAs), the selection and payment process for PIAs, fund flow and the monitoring structure will be described from the PM VIKAS guidelines and monitoring guidelines. The guidelines could not be opened again in this session, so these details are not yet included.',
  'Current progress figures for PM VIKAS (sanctions, batches, trainees, placement) are not yet included. An official source, such as a Lok Sabha reply or a Ministry release, is needed for each one.',
]));

add(H2('1.4 PMJVK: coverage and what evaluations found'));
add(P(['PMJVK is an area-based scheme that funds community infrastructure in Minority Concentration Areas. It covers 1,300 areas, made up of 870 blocks, 321 towns and 109 district headquarters in 308 districts, and 33% to 40% of its resources are earmarked for women-centric projects.', fn('Lok Sabha Unstarred Questions 3559 (24.03.2022) and 2951 (06.08.2025).')]));
add(P(['The 2021 NITI Aayog evaluation found that about 59% of survey respondents in eight states were unaware of PMJVK facilities, and 55% said that no PMJVK meetings were held.', fn('NITI Aayog DMEO (2021), Vol. 4: MoMA, pp. 89-90. 608 households in 8 states; fieldwork 2019-20, report February 2021.'), ' These findings matter for PM VIKAS because its infrastructure component dovetails with PMJVK, and PMJVK assets such as hostels and skill centres can serve PM VIKAS trainees only if communities know about them.']));
add(exhibit('Locations in the Ministry\'s district and block list are spread across 329 districts, with the largest numbers in West Bengal and Assam', 'map_blockfile.png', 'District and block list provided by the Ministry of Minority Affairs (19,636 entries). Analysis: entries counted by district and placed on Census 2011 boundaries; districts created after 2011 are shown within their 2011 parent district; 97 entries without a district name are not shown. Map not to scale.', 0.82));
add(placeholder('To be confirmed', [
  'The exact nature of the district and block list (for example, whether each entry is a sanctioned PMJVK project) and its date. The map caption will be revised once confirmed.',
  'Reforms to PMJVK planned for the 16th Finance Commission cycle will be added only if an official document can be cited.',
]));

add(H2('1.5 Where PM VIKAS sits among the Ministry\'s schemes'));
add(P(['Within the Ministry, PM VIKAS now carries most of the support for skills and the move into work. The Pre-Matric, Post-Matric and Merit-cum-Means scholarships have not been approved for implementation beyond 2021-22.', fn('Lok Sabha Unstarred Question 2951, answered 06.08.2025.'), ' NMDFC provides credit and has disbursed ₹9,632 crore to 25.86 lakh beneficiaries since 1994-95.', fn('Lok Sabha Unstarred Question 2840, answered 06.08.2025 (cumulative to 31.3.2025).'), ' The Prime Minister\'s New 15 Point Programme earmarks 15% of targets in line-ministry schemes for minorities, where possible.', fn('CMRSD for MoMA (2016), Evaluation of PM\'s New 15 Point Programme, p. 12.')]));
add(PB());

// ---------------- 2. Survey
add(H1('2. Survey findings', 'survey'));
add(placeholder('This section will be completed when the survey response sheet is shared', [
  'Survey results will be reported separately from official statistics and labelled as primary evidence. Each figure will give the number of respondents it is based on.',
  'Planned structure: who responded; barriers named by beneficiaries, non-beneficiaries and PIAs; experience of training and placement; awareness of schemes; women\'s participation; mobility.',
]));
add(PB());

// ---------------- 3. Challenges
add(H1('3. Key implementation challenges', 'challenge'));
add(P('This section brings together the challenges that official evaluations and statistics point to. For each one it gives the evidence, the cause where the evidence states it, and the stage of the PM VIKAS journey it affects. Causes that rest on judgement rather than published evidence are marked to be confirmed with the implementation team.'));
add(exhibit('Evaluations show that many eligible people do not know about the schemes, and borrowers report procedural difficulties', 'fig_access.png', 'NITI Aayog DMEO (2021), Vol. 4: MoMA, pp. 89-90; NMDFC (2019), Impact Study of Beneficiaries Financed 2016-17, p. 42; CMRSD for MoMA (2016), p. 139.'));
add(H2('3.1 Challenges and their causes'));
add(table(['Challenge', 'Evidence', 'Cause stated in the evidence', 'Journey stage'], [
  [[['C1. Low awareness of schemes and facilities', { bold: true }]], 'About 59% unaware of PMJVK facilities; 55% said no PMJVK meetings were held; 33.1% of beneficiaries aware of the 15 Point Programme.', 'Few community meetings held (DMEO). Other causes to be confirmed.', 'Mobilisation'],
  [[['C2. Documents and repeat visits', { bold: true }]], ['56% of NMDFC borrowers (2016-17) reported difficulties. In the 2014-16 cohort, 7.2% reported difficulty, most often documents (42%) and repeat visits (31%).', fn('NMDFC (2018), Impact Study of Beneficiaries Financed 2014-2016, pp. 13, 31; NMDFC (2019), p. 42.')], 'Documents and repeat visits to offices.', 'Application'],
  [[['C3. Working capital and markets after the loan', { bold: true }]], ['38% of NMDFC micro-finance beneficiaries report difficulty with working capital, and 28% with marketing their products.', fn('NMDFC (2019), Socio-economic Impact Study of Beneficiaries Financed during 2016-17, prepared by CMRSD, p. 15.')], 'Working capital and market access.', 'Enterprise'],
  [[['C4. Training does not always lead to work, especially for women', { bold: true }]], ['41.9% of formally trained women are outside the labour force, against 11.3% of trained men (all communities).', fn('MoSPI, PLFS 2023-24, Table 12 (p. A-39) and Table 14 (p. A-50).')], 'Not stated in the source. To be confirmed.', 'Placement'],
  [[['C5. Convergence weakens after planning', { bold: true }]], ['Of 92 schemes analysed by stage, 84% converged in planning and 16% in monitoring and evaluation.', fn('NITI Aayog DMEO (2022), Convergence: Unlocking Synergies with other Government Programmes, pp. 15, 29.')], 'Not stated in the source. To be confirmed.', 'Monitoring'],
  [[['C6. Household finances lead to early exit from school', { bold: true }]], ['92% of families whose children dropped out cite parental poverty; early marriage of girls is cited by 40% of families in Bihar and 19% in Maharashtra.', fn('National Productivity Council for MoMA (undated; data 2014-15 to 2016-17), Examining the Reasons for High Drop-Out Rates among All Minority Communities, printed pp. viii, 161-162.')], 'Parental poverty, parental illiteracy, early marriage.', 'Education'],
  [[['C7. Wages and jobs differ sharply between states', { bold: true }]], ['Regular salaried workers earned ₹27,606 a month in Telangana and ₹17,559 in West Bengal (April-June 2024, all communities). Youth unemployment is 29.9% in Kerala and 18.8% in Punjab, against 10.2% nationally.', fn('MoSPI, PLFS 2023-24, Table 38 (p. A-235) and Table 18 (p. A-70).')], 'Local labour markets differ.', 'Placement and mobility'],
], [2150, 3600, 2300, 1588], { zebra: false }));
add(Spacer());
add(exhibit('Four in ten formally trained women are outside the labour force, against one in ten trained men', 'fig_skills.png', 'MoSPI, PLFS Annual Report 2023-24, Table 14 (p. A-50). Persons with formal vocational training; all communities.'));
add(exhibit('Youth unemployment is highest in Kerala, the North East and some northern states', 'map_youth_ur.png', 'MoSPI, PLFS Annual Report 2023-24, Table 18 (p. A-70). Usual status, age 15-29, all communities. Map not to scale.', 0.82));
add(exhibit('Most schemes converge with others at the planning stage; few do so in monitoring and evaluation', 'fig_convergence.png', 'NITI Aayog DMEO (2022), Convergence: Unlocking Synergies with other Government Programmes, pp. 15, 29. 92 schemes analysed by stage.'));
add(placeholder('To be added: the implementation team\'s experience', [
  'Challenges seen while implementing PM VIKAS will be added here and labelled as implementation experience, kept apart from official evidence. Each one will be linked to the challenges above or added as a new challenge.',
  'Root causes marked "to be confirmed" in the table above will be completed from the same input.',
]));
add(PB());

// ---------------- 4. Related schemes
add(H1('4. Related schemes and initiatives', 'schemes'));
add(P('PM VIKAS covers one part of a longer journey, from school to skills, work and enterprise. The table lists the schemes that serve the same people at each stage. It shows where PM VIKAS already links to them through its guidelines, and where a link exists only as a possibility. Details of line-ministry schemes are limited to their name, ministry and the stage they serve; their provisions will be checked against their own guidelines before part 2.'));
add(table(['Stage', 'Scheme', 'Ministry', 'Link with PM VIKAS today', 'Label'], [
  ['School (Class 9-12)', [['PM VIKAS education component', { bold: true }]], 'Minority Affairs', 'Part of PM VIKAS', tag('op')],
  ['School (Class 9-12)', 'Pre-Matric Scholarship', 'Minority Affairs', 'None', tag('ended')],
  ['School (Class 9-12)', 'Samagra Shiksha; PM POSHAN; KGBV; NIOS', 'Education', 'NIOS delivers the PM VIKAS education component', tag('existing')],
  ['Higher education', 'Post-Matric and Merit-cum-Means scholarships', 'Minority Affairs', 'None', tag('ended')],
  ['Higher education', 'NMDFC education loans', 'Minority Affairs (NMDFC)', 'No link stated in the guidelines', tag('existing')],
  ['Skills and transition to work', [['PM VIKAS skilling and training', { bold: true }]], 'Minority Affairs', 'Core of PM VIKAS', tag('op')],
  ['Skills and transition to work', 'Skill India Digital Hub (SIDH)', 'Skill Development and Entrepreneurship', 'Candidate tracking under the guidelines', tag('op')],
  ['Skills and transition to work', 'PMKVY; apprenticeship schemes (including NAPS); ITIs', 'Skill Development and Entrepreneurship', 'No link stated in the guidelines', tag('existing')],
  ['Skills and transition to work', 'DDU-GKY', 'Rural Development', 'No link stated in the guidelines', tag('existing')],
  ['Skills and transition to work', 'National Career Service', 'Labour and Employment', 'No link stated in the guidelines', tag('existing')],
  ['Work and enterprise', 'NMDFC credit', 'Minority Affairs (NMDFC)', 'No link stated in the guidelines', tag('existing')],
  ['Work and enterprise', 'DAY-NRLM', 'Rural Development', 'No link stated in the guidelines', tag('existing')],
  ['Work and enterprise', ['PM Vishwakarma: 30 lakh artisans registered and 23.09 lakh trained by 1 December 2025 (all communities)', fn('Ministry of Finance, Economic Survey 2025-26, para 12.54 (p. 503).')], 'MSME', 'No link stated in the guidelines', tag('existing')],
  ['Work and enterprise', 'MUDRA; PMEGP; PM SVANidhi', 'Finance; MSME; Housing and Urban Affairs', 'No link stated in the guidelines', tag('existing')],
  ['Community infrastructure', [['PMJVK', { bold: true }]], 'Minority Affairs', 'Infrastructure component dovetails with PMJVK', tag('existing')],
  ['All stages', 'Prime Minister\'s New 15 Point Programme', 'Several ministries', '15% of line-scheme targets, where possible', tag('existing')],
], [1650, 2700, 1700, 2238, 1350], { zebra: true }));
add(Spacer());
add(P(['Minority reach in line-ministry schemes is not routinely published, so it is not possible to say from official data how far these schemes already serve PM VIKAS candidates. This is recorded as data gap D8 in section 5.']));
add(P(['Twenty-five of the 90 Minority Concentration Districts are also Aspirational Districts, where district teams are already in place.', fn('Name-matched analysis of MoMA\'s 90 Minority Concentration Districts and NITI Aayog\'s 112 Aspirational Districts. Some districts have since been split, so the count may change.')]));
add(PB());

// ---------------- 5. Data gaps
add(H1('5. Data gaps', 'data'));
add(P('Planning and tracking PM VIKAS needs data on the people it serves, by community, sex and place. This section lists the main gaps in official data. For each gap it gives the closest published figure and how the gap can be filled. Where the closest figure covers all communities, it is used as a proxy and labelled as such.'));
add(gapBox('D1', 'Population by community and district', 'A population count of each community after Census 2011, including by district.', ['Census 2011, Table C-01.', fn('Office of the Registrar General of India, Census of India 2011, Table C-01.')], null, 'Use the next Census when it is published; until then, use PM VIKAS registration data to see where demand is.'));
add(gapBox('D2', 'Work outcomes for Buddhist, Jain and Parsi households', 'Labour-force participation, unemployment, NEET and formal vocational training for Buddhist, Jain and Parsi households, by sex.', ['PLFS reports Hindu, Muslim, Christian and Sikh households only; NSS Report 589 groups Buddhist, Jain and Parsi households together.', fn('MoSPI, PLFS 2023-24, Appendix C para 2.33; NSS Report 589, pp. 39, 66.')], null, 'Request MoSPI for tabulations of PLFS unit-level data for these communities, with sample sizes stated.'));
add(gapBox('D3', 'Training-to-work outcomes by community', 'The share of trained people, especially women, who are in work, by community.', 'All communities: 41.9% of formally trained women and 11.3% of trained men are outside the labour force (PLFS 2023-24, Table 14). Figures used here cover all communities.', 'Women\'s labour-force participation in Muslim households (30.2%) and Sikh households (33.0%) is below the all-India value of 41.7%. It is therefore possible that trained women in these households are more affected than the all-community figure shows.', 'Tabulate PLFS unit-level data by religion of household head, sex and vocational training; use PM VIKAS placement and post-placement tracking data once available.'));
add(gapBox('D4', 'School dropout and transition by community', 'Dropout and transition rates to Class 11-12 and to higher education, for each of the six communities.', ['UDISE+ reports enrolment shares by community (for Muslim students: 17.7% at primary, 12.0% at higher secondary) and AISHE reports Muslim students as 5.0% of higher-education enrolment; neither reports dropout or transition by community.', fn('MoE, UDISE+ 2023-24 Report, section 2.2; UDISE+ 2024-25, Table 6.9; MoE, AISHE 2023-24.')], 'The Muslim share of enrolment falls below the population share of 14.2% from Class 11. It is possible that dropout before Class 11 is higher among Muslim students than the all-India rate, but this is not published.', 'Request the Ministry of Education for UDISE+ and AISHE tables by community, including dropout and transition rates.'));
add(gapBox('D5', 'Unpaid care work by community', 'Time spent on unpaid domestic and care work by women of each community.', ['All communities: on a given day, 41 in 100 women and 21 in 100 men aged 15-59 give unpaid care to household members (Time Use Survey 2024). Figures used here cover all communities.', fn('MoSPI, Time Use Survey 2024; PIB release PRID 2106113 (25 Feb 2025).')], 'Since women\'s labour-force participation in Muslim and Sikh households is below the all-India value, it is possible that unpaid care limits women\'s participation in PM VIKAS training more in these households.', 'Request MoSPI for TUS 2024 tabulations by religion; include short time-use questions in PM VIKAS baseline surveys.'));
add(gapBox('D6', 'Enterprise and credit by community', 'Current data on enterprises and access to credit by community of the owner.', ['The latest data by religion of owner are from the Sixth Economic Census, 2013-14: 13.8% of proprietary establishments are Muslim-owned.', fn('MoSPI, Sixth Economic Census (2013-14), All India Report: Highlights.')], null, 'Use NMDFC and PM VIKAS women\'s enterprise data; request owner-religion tables from the next Economic Census.'));
add(gapBox('D7', 'Wages and migration by community', 'Earnings and migration for work by community and state.', 'Salaried earnings by state cover all communities (PLFS 2023-24, Table 38). Migration by religion is available only from NSS Report 589 (2020-21): 23.8% of people in Muslim households live away from their last usual residence, against 29.1% nationally.', null, 'Tabulate PLFS earnings by religion and state; track where PM VIKAS candidates are placed and at what wage.'));
add(gapBox('D8', 'Minority reach of other ministries\' schemes', 'The number of minority beneficiaries of line-ministry schemes, by community and state.', 'Not routinely published. The 15 Point Programme earmarks 15% of targets where possible, but achievement by community is not published.', null, 'Request line ministries to report minority beneficiaries of schemes covered by the 15 Point Programme.'));
add(gapBox('D9', 'PM VIKAS progress and outcomes', 'Sanctions, batches, trainees, placement, retention and earnings under PM VIKAS, by component, community, sex and state.', 'Not yet published. The guidelines provide for dashboards on the Skill India Digital Hub by gender, religion, EWS status and disability.', null, 'Publish the dashboard data that the guidelines already provide for, at regular intervals.'));
add(placeholder('PLFS 2025 comparison (to follow)', [
  'MoSPI\'s eSankhyiki service publishes PLFS indicators by religion only in the annual series, which ends at 2023-24; religion is not available in the quarterly or monthly series from 2025. A comparison of PLFS 2025 with 2023-24 by religion will therefore be built from the unit-level data once the files are shared, and the change in survey design from 2025 will be noted.',
]));
add(PB());

// ---------------- 6. Demographics
add(H1('6. Minority demographics', 'demo'));
add(P(['The six notified minority communities number 23.4 crore people, about one in five Indians (19.3%), at Census 2011.', fn('Census of India 2011, Table C-01; MoMA, PIB release PRID 1797307 (10 Feb 2022): Muslims 17.22 crore, Christians 2.78 crore, Sikhs 2.08 crore, Buddhists 0.84 crore, Jains 0.45 crore; Parsis 57,264 (PRID 1807702). Together 23.38 crore, 19.3% of 121.09 crore.'), ' Half of them live in 95 of India\'s 640 districts, and another 11.4 crore people live in districts where minorities are under a quarter of the population.', fn('Analysis of Census 2011 district-level C-01 counts for Muslims, Christians, Sikhs, Buddhists and Jains (640 districts).')]));
add(exhibit('Minority communities form a majority in districts of Jammu and Kashmir, Punjab, the North East and parts of Kerala and West Bengal', 'map_minority_share.png', 'Census of India 2011, Table C-01, district level; Muslims, Christians, Sikhs, Buddhists and Jains. Map not to scale.', 0.82));
add(H2('6.1 Each community has its own footprint'));
add(P(['Half of all Sikhs live in 9 districts, all of them in Punjab. Half of all Buddhists live in 12 districts and 77.36% of Buddhists live in Maharashtra. Half of all Jains live in 21 districts and half of all Christians in 34. Half of all Muslims live across 74 districts in 13 states and union territories.', fn('Analysis of Census 2011 district-level C-01 counts: the smallest number of districts that together hold half of each community; Census 2011, as reported in NITI Aayog DMEO (2021), Vol. 4: MoMA, p. 35.')]));
add(exhibit('Half of each community lives in a small number of districts, which differ by community', 'map_half_communities.png', 'Analysis of Census of India 2011, Table C-01, district level. Shaded districts are the smallest set that together hold half of each community. Parsis are not shown separately in district tables. Maps not to scale.'));
add(callout('map', 'What this means for PM VIKAS outreach', [
  'For Sikh, Buddhist and Jain communities, a small number of districts covers half of the population, so centre location and outreach can be planned district by district. For Muslim and Christian communities, a district list covers less, and state-wide channels are also needed.',
]));
add(Spacer(160));
add(H2('6.2 Starting points compared with the all-India value'));
add(exhibit('Each community differs from the all-India value in its own way', 'fig_profile.png', 'Census 2011 literacy: MoMA, PIB PRID 1814470 (7 Apr 2022) and PRID 2109862 (10 Mar 2025); graduate level: NITI Aayog DMEO (2021), Vol. 4, p. 47, Figure 12 (Census 2011 and KPMG analysis); PLFS Annual Report 2023-24, Tables 47-49 (religion of household head). PLFS does not publish Buddhist and Jain values.'));
add(P('Christian, Sikh and Jain literacy is above the all-India value. Muslim literacy is below it, but the gap narrowed from 4.5 points in Census 2011 to 1.4 points in PLFS 2023-24. In work, men\'s participation is close to the all-India value in all three communities that PLFS reports. Women\'s participation shows the largest difference: it is below the all-India value in Muslim and Sikh households and above it in Christian households.'));
add(exhibit('Women\'s labour-force participation differs from the all-India value far more than men\'s', 'fig_lfpr.png', 'MoSPI, PLFS Annual Report 2023-24, Statement 20 (p. 27) and Table 48. Age 15+, usual status; religion of household head.'));
add(H2('6.3 Education journey'));
add(P(['Muslim students are 17.7% of primary enrolment, above the Muslim population share of 14.2%. The share falls at each stage, to 12.0% at higher secondary and 5.0% in higher education. At higher secondary, Muslim girls are 12.9% of all girls enrolled and Muslim boys 11.2% of all boys.', fn('Ministry of Education, UDISE+ 2024-25, Table 6.9; MoE, AISHE 2023-24 (2026); Census 2011, C-01.'), ' Minority enrolment in higher education grew by 52.6%, from 21.8 lakh in 2014-15 to 33.3 lakh in 2023-24.']));
add(exhibit('The Muslim share of enrolment falls at each stage and is below the population share from Class 11', 'fig_udise.png', 'Ministry of Education, UDISE+ 2024-25, Table 6.9 (school levels); AISHE 2023-24 (higher education); Census 2011, C-01 (population share).'));
add(P('This matters for PM VIKAS because the education component offers open schooling for Class 8, 10 and 12 to school dropouts, and the skilling component draws on young people who have left school.'));
add(PB());

// ---------------- 7. Gap list
add(H1('7. Consolidated list of gaps', 'list'));
add(P('The gaps below bring together the challenges in section 3 and the data gaps in section 5. Each has an identifier so that part 2 can map solutions to it. One solution may address several gaps.'));
add(table(['ID', 'Gap', 'Type', 'Evidence (section)'], [
  ['G1', 'Many eligible people do not know about PM VIKAS, PMJVK facilities or related schemes.', 'Delivery', 'C1 (3.1)'],
  ['G2', 'Documents and repeat visits make it hard to apply and to receive benefits.', 'Delivery', 'C2 (3.1)'],
  ['G3', 'Enterprises supported by credit face working-capital and marketing difficulties after the loan.', 'Outcomes', 'C3 (3.1)'],
  ['G4', 'Training does not always lead to work, and the gap is largest for women.', 'Outcomes', 'C4 (3.1); D3, D5 (5)'],
  ['G5', 'Convergence with other schemes is planned but rarely monitored.', 'Governance', 'C5 (3.1); D8 (5)'],
  ['G6', 'Household finances and early marriage lead to early exit from school, before PM VIKAS can reach young people.', 'Outcomes', 'C6 (3.1); D4 (5)'],
  ['G7', 'Jobs and wages differ sharply between states, so local placement and moving for work both carry costs.', 'Outcomes', 'C7 (3.1); D7 (5)'],
  ['G8', 'Outreach must work both in a few districts (Sikh, Buddhist, Jain) and across whole states (Muslim, Christian).', 'Targeting', '6.1'],
  ['G9', 'Work, education and enterprise outcomes are not published for every community.', 'Data', 'D2, D4, D6 (5)'],
  ['G10', 'PM VIKAS progress and outcome data are not yet published, although the guidelines provide for dashboards.', 'Data', 'D9 (5)'],
  ['G11', 'Population data by community and district date from 2011.', 'Data', 'D1 (5)'],
], [700, 5338, 1400, 2200], { zebra: true, boldFirst: true }));
add(Spacer());
add(placeholder('Gaps to be added from inputs still to come', [
  'Survey findings (section 2) and the implementation team\'s experience (section 3) may confirm these gaps or add new ones. They will be added with their own identifiers and labelled as primary evidence.',
]));
add(PB());

// ---------------- Part 2 placeholder
add(H1('Part 2: Solutions and roadmap (to follow)', 'route'));
add(P('Part 2 will set out the proposed solutions, each labelled as a proposal to be evaluated, and a matrix that maps each gap (G1 to G11, and any added later) to the solutions that address it. It will close with a prioritised roadmap that separates immediate operational improvements from medium- and long-term reforms, and lists the questions that need further work.'));
add(PB());

// ---------------- Annex: method and sources
add(H1('Annex: Method and sources', 'doc'));
add(H2('Method'));
add(Bul('PLFS and NSS assign the religion of the household head to all members, so this report says "Muslim households", "Christian households" and so on.'));
add(Bul('Census 2011 is the latest population count by religion. Maps use Census 2011 district boundaries and are not to scale.'));
add(Bul('The number of districts holding half of each community is the smallest set of districts that together hold half of that community, computed from Census 2011 district counts.'));
add(Bul('The district and block map counts entries in the list provided by the Ministry, by district. Districts created after 2011 are shown within their 2011 parent district.'));
add(Bul('Figures are reproduced as published. Computed figures are described as analysis.'));
add(H2('Sources'));
const SRC = [
  ['Official statistics', ['Office of the Registrar General of India. Census of India 2011, Table C-01.', 'MoSPI. Annual Report, Periodic Labour Force Survey 2023-24.', 'MoSPI. NSS Report No. 589, Multiple Indicator Survey in India, 2020-21.', 'MoSPI. Time Use Survey 2024; PIB release PRID 2106113 (25 Feb 2025).', 'MoSPI. Sixth Economic Census 2013-14, All India Report.', 'Ministry of Education. UDISE+ 2023-24 Report; UDISE+ 2024-25, Table 6.9.', 'Ministry of Education. All India Survey on Higher Education 2023-24.', 'Ministry of Finance. Economic Survey 2025-26, para 12.54.']],
  ['Ministry documents and Parliament replies', ['Ministry of Minority Affairs. Guidelines for PM VIKAS; PM VIKAS Monitoring and Evaluation Guidelines; List of Minority Concentration Districts.', 'Ministry of Minority Affairs. PIB releases PRID 1797307, 1807702, 1814470, 2109862, 2222788; relid 112513.', 'Lok Sabha Unstarred Questions No. 2840 and No. 2951 (06.08.2025); No. 4740 (31.03.2022); No. 3559 (24.03.2022).', 'NITI Aayog. List of 112 Aspirational Districts.', 'Ministry of Minority Affairs. District and block list (file provided by the Ministry).']],
  ['National reviews', ['Prime Minister\'s High Level Committee (Sachar Committee) (2006).', 'National Commission for Religious and Linguistic Minorities (Ranganath Misra Commission) (2007).', 'Post-Sachar Evaluation Committee (Kundu Committee) (2014).']],
  ['Evaluations commissioned by government', ['NITI Aayog DMEO (2021). Evaluation of Centrally Sponsored Schemes in Social Inclusion, Law and Order and Justice Delivery, Vol. 4: Ministry of Minority Affairs.', 'NITI Aayog DMEO (2022). Convergence: Unlocking Synergies with other Government Programmes.', 'National Productivity Council for MoMA. Examining the Reasons for High Drop-Out Rates among All Minority Communities.', 'CMRSD for MoMA (2016). Evaluation of Prime Minister\'s New 15 Point Programme.', 'NMDFC (2018, 2019). Socio-economic impact studies of beneficiaries financed 2014-16 and 2016-17.']],
];
SRC.forEach(([h, items]) => { add(H3(h)); items.forEach(i => add(Bul(i))); });

// =====================================================================================
const doc = new Document({
  features: { updateFields: true }, creator: 'EY', title: 'Strengthening PM VIKAS: assessment and gaps',
  styles: {
    default: { document: { run: { font: FONT, size: 20, color: INK } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 36, bold: true, font: FONT, color: INK }, paragraph: { spacing: { before: 120, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, font: FONT, color: INK }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 21, bold: true, font: FONT, color: BLUE }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ]
  },
  numbering: { config: [
    { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 260 } } } }, { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 800, hanging: 260 } } } }] },
    { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { run: { bold: true, color: BLUE }, paragraph: { indent: { left: 400, hanging: 360 } } } }] },
  ] },
  footnotes: notes,
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } }, titlePage: true },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Strengthening PM VIKAS  |  Part 1: assessment and gaps', font: FONT, size: 15, color: MUTED })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: MUTED })] })] }) },
    children: body
  }]
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(process.argv[2], b); console.log('written', process.argv[2], 'exhibits', exN, 'footnotes', nId); });
