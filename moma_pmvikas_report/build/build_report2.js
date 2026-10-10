// Compact PM VIKAS report (max 10 pages). Run: node build_report2.js <out.docx>
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType,
  ShadingType, AlignmentType, BorderStyle, HeadingLevel, Footer, PageNumber, LevelFormat,
  FootnoteReferenceRun, VerticalAlign
} = require('docx');

const D = __dirname;
const INK = '2E2E38', EY = 'FFE600', BLUE = '188CE5', MUTED = '747480', SOFT = 'F4F4F7', PALEY = 'FFFBD6', RULE = 'E1E1E6';
const FONT = 'Arial';
const TW = 10206; // A4 width 11906 - 2 x 850 margins
const BS = 18;    // body size (9 pt)

const png = f => fs.readFileSync(path.join(D, f));
const dims = f => { const b = png(f); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

// footnotes
const notes = {}; let nId = 0;
function fn(text) { nId += 1; notes[nId] = { children: [new Paragraph({ children: [new TextRun({ text, size: 13, font: FONT, color: '4A4A55' })] })] }; return new FootnoteReferenceRun(nId); }

function runs(parts, size = BS) {
  if (typeof parts === 'string') parts = [parts];
  return parts.map(p => {
    if (p instanceof FootnoteReferenceRun) return p;
    if (typeof p === 'string') return new TextRun({ text: p, font: FONT, size, color: INK });
    return new TextRun(Object.assign({ text: p[0], font: FONT, size, color: INK }, p[1]));
  });
}
const P = (parts, o = {}) => new Paragraph(Object.assign({ children: runs(parts), spacing: { after: 100, line: 264 } }, o));
const Num = parts => new Paragraph({ children: runs(parts), numbering: { reference: 'num', level: 0 }, spacing: { after: 60, line: 259 } });
const Sp = (h = 80) => new Paragraph({ children: [], spacing: { after: h } });

function H1(text, icon, pb = false) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true, pageBreakBefore: pb, spacing: { before: 200, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: EY, space: 4 } },
    children: [new ImageRun({ type: 'png', data: png('icons/' + icon + '_badge.png'), transformation: { width: 22, height: 22 } }), new TextRun({ text: '  ' + text, font: FONT, size: 28, bold: true, color: INK })] });
}
const H2 = text => new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 160, after: 60 }, children: [new TextRun({ text, font: FONT, size: 21, bold: true, color: INK })] });

// chart block: headline, image, note/source
function chart(headline, file, source, frac = 1, noteText) {
  const { w, h } = dims(file); const W = Math.round(680 * frac), H = Math.round(W * h / w);
  const out = [
    new Paragraph({ keepNext: true, spacing: { before: 140, after: 80 }, children: [new TextRun({ text: headline, font: FONT, size: 21, bold: true, color: INK })] }),
    new Paragraph({ keepNext: true, alignment: frac < 1 ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new ImageRun({ type: 'png', data: png(file), transformation: { width: W, height: H } })] }),
  ];
  const small = [];
  if (noteText) small.push(new TextRun({ text: 'Note: ', font: FONT, size: 13, bold: true, color: MUTED }), new TextRun({ text: noteText + ' ', font: FONT, size: 13, color: MUTED }));
  small.push(new TextRun({ text: 'Source: ', font: FONT, size: 13, bold: true, color: MUTED }), new TextRun({ text: source, font: FONT, size: 13, color: MUTED }));
  out.push(new Paragraph({ spacing: { before: 40, after: 140 }, children: small }));
  return out;
}

// tables
const rb = { style: BorderStyle.SINGLE, size: 4, color: RULE };
function cell(content, w, o = {}) {
  const sz = o.size || 15;
  const children = [new Paragraph({ spacing: { after: 0, line: 240 }, children: runs(typeof content === 'string' ? [[content, { bold: o.bold, color: o.color || INK }]] : content, sz) })];
  return new TableCell({ width: { size: w, type: WidthType.DXA }, borders: { top: rb, bottom: rb, left: NONE, right: NONE },
    shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined, margins: { top: 50, bottom: 50, left: 80, right: 80 }, verticalAlign: VerticalAlign.TOP, children });
}
function table(headers, rows, widths, o = {}) {
  const hdr = new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], { bold: true, fill: INK, color: 'FFFFFF', size: 14 })) });
  const body = rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], { fill: (o.zebra && ri % 2) ? SOFT : undefined, bold: o.boldFirst && i === 0, size: o.size })) }));
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths, rows: [hdr, ...body] });
}
const TAG = { existing: ['Existing scheme', '188CE5'], op: ['Operational mechanism', INK], ended: ['Not approved beyond 2021-22', MUTED] };
const tag = k => [[TAG[k][0], { bold: true, color: TAG[k][1] }]];

// side-bar note box
function box(icon, title, lines, fill = PALEY, accent = EY) {
  const inner = [new Paragraph({ spacing: { after: 40 }, children: [new ImageRun({ type: 'png', data: png('icons/' + icon + '_dark.png'), transformation: { width: 12, height: 12 } }), new TextRun({ text: '  ' + title, font: FONT, size: 17, bold: true, color: INK })] })];
  lines.forEach(l => inner.push(new Paragraph({ children: runs(l, 16), spacing: { after: 30, line: 250 } })));
  return new Table({ width: { size: TW, type: WidthType.DXA }, columnWidths: [TW], rows: [new TableRow({ cantSplit: true, children: [new TableCell({ width: { size: TW, type: WidthType.DXA }, shading: { fill, type: ShadingType.CLEAR, color: 'auto' }, borders: { top: NONE, bottom: NONE, right: NONE, left: { style: BorderStyle.SINGLE, size: 24, color: accent } }, margins: { top: 90, bottom: 80, left: 180, right: 160 }, children: inner })] })] });
}
// key-number tiles
function tiles(items) {
  const w = Math.floor(TW / items.length);
  return new Table({ width: { size: w * items.length, type: WidthType.DXA }, columnWidths: items.map(() => w), rows: [new TableRow({ children: items.map(([num, txt]) => new TableCell({ width: { size: w, type: WidthType.DXA }, borders: { top: { style: BorderStyle.SINGLE, size: 18, color: EY }, bottom: NONE, left: NONE, right: NONE }, margins: { top: 80, bottom: 40, left: 60, right: 200 }, children: [new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: num, font: FONT, size: 34, bold: true, color: INK })] }), new Paragraph({ children: runs([[txt, { color: '4A4A55' }]], 15) })] })) })] });
}

// =====================================================================================
const body = []; const add = (...x) => x.flat().forEach(e => body.push(e));

// ---------- Title and executive summary
add(
  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'MINISTRY OF MINORITY AFFAIRS  |  PM VIKAS AND PMJVK', font: FONT, size: 15, bold: true, color: MUTED })] }),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Strengthening PM VIKAS', font: FONT, size: 48, bold: true, color: INK })] }),
  new Paragraph({ spacing: { after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 24, color: EY, space: 6 } }, children: [new TextRun({ text: 'Where the scheme stands, what limits its reach and outcomes, and where the evidence is missing', font: FONT, size: 22, color: '4A4A55' })] }),
);
add(H1('Executive summary', 'flag'));
add(P('This report assesses PM VIKAS and the Pradhan Mantri Jan Vikas Karyakram (PMJVK), with which its infrastructure component dovetails. It sets out where the schemes stand, what official evaluations say about access and outcomes, how the six notified minority communities differ in their starting points, and where the data needed to plan and track the schemes is missing. It ends with a numbered list of gaps; solutions will be mapped to these gaps in the next stage.'));
add(tiles([['2025', 'PM VIKAS guidelines approved and the scheme rolled out in January 2025, combining five earlier schemes.'], ['1,300', 'Minority Concentration Areas covered by PMJVK: 870 blocks, 321 towns and 109 district headquarters.'], ['84% vs 16%', 'Schemes converging with others at planning, against monitoring and evaluation (92 schemes).']]));
add(Sp(100));
add(Num([['PM VIKAS already has strong outcome provisions. ', { bold: true }], 'Its guidelines set a 75% placement norm for non-traditional skilling, require tracking of placed trainees for at least three months, and require each candidate to be tracked on the Skill India Digital Hub.', fn('MoMA, Guidelines for PM VIKAS, para 2.3.3.3(b), p. 10; para 6.4.2, p. 27; pp. 12, 25, 28, 32. PM VIKAS Monitoring and Evaluation Guidelines, pp. 8, 25.')]));
add(Num([['Evaluations point to awareness, documents and repeat visits as the weak steps. ', { bold: true }], 'About 59% of survey respondents in eight states were unaware of PMJVK facilities, and 33.1% of beneficiaries in an earlier evaluation were aware of the 15 Point Programme.', fn('NITI Aayog DMEO (2021), Evaluation of CSS in Social Inclusion, Vol. 4: MoMA, pp. 89-90 (608 households, 8 states; fieldwork 2019-20); CMRSD for MoMA (2016), Evaluation of PM\'s New 15 Point Programme, p. 139.')]));
add(Num([['Convergence is planned but rarely monitored. ', { bold: true }], 'PM VIKAS outcomes in placement, enterprise and credit depend on schemes run by other ministries, so this matters directly for the scheme.']));
add(Num([['Starting points differ by community. ', { bold: true }], 'Women\'s labour-force participation is below the all-India value of 41.7% in Muslim (30.2%) and Sikh (33.0%) households, while unemployment is above the all-India 3.2% in Christian (4.7%) and Sikh (5.8%) households.', fn('MoSPI, PLFS Annual Report 2023-24, Tables 47-49. Religion is that of the household head.')]));
add(Num([['Each community lives in a different set of places. ', { bold: true }], 'Half of all Sikhs live in 9 districts and half of all Buddhists in 12, while half of all Muslims live across 74. Outreach can be planned by district for some communities, while others also need state-wide channels.']));
add(Num([['Much of the data needed to target and track PM VIKAS is not published by community. ', { bold: true }], 'Where only all-community figures exist, this report uses them as a proxy and says so.']));
add(P([['How to read this report. ', { bold: true }], 'Official statistics, Ministry documents and government-commissioned evaluations are cited in footnotes. Primary evidence (the field survey and the implementation team\'s experience) will be reported separately. Each scheme or provision carries a label: ', ['Existing scheme', { bold: true, color: BLUE }], ', ', ['Operational mechanism', { bold: true }], ' (already part of how a scheme runs) or ', ['Not approved beyond 2021-22', { bold: true, color: MUTED }], '. Each community is compared only with the all-India value.'], { spacing: { before: 120, after: 80 } }));

// ---------- 1. As-is
add(H1('1. PM VIKAS and PMJVK as they stand', 'pmvikas'));
add(P(['Area-based support began in 2008-09 with the Multi-sectoral Development Programme in 90 Minority Concentration Districts: 53 in Category A, 20 in B1 and 17 in B2.', fn('MoMA, List of Minority Concentration Districts; PIB release relid 112513. Category A: socio-economic and basic-amenity indicators below the national average; B1: socio-economic only; B2: basic amenities only.'), ' Planning moved to blocks and towns in 2013-14, and the Post-Sachar Evaluation Committee (Kundu Committee) reviewed progress in 2014. Since 2018, PMJVK has covered 870 blocks, 321 towns and 109 district headquarters in 308 districts.', fn('Post-Sachar Evaluation Committee (2014); Lok Sabha Unstarred Question 3559, answered 24.03.2022.'), ' PM VIKAS guidelines were approved and the scheme rolled out in January 2025.', fn('PIB release PRID 2222788 (3 Feb 2026).')]));
add(chart('Targeting has moved from districts to blocks and towns, and PM VIKAS was added in 2025', 'fig2/t_timeline.png', 'PM\'s High Level Committee (2006); CMRSD for MoMA (2016), p. 12; NITI Aayog DMEO (2021), Vol. 4, p. 54; PIB relid 112513; Post-Sachar Evaluation Committee (2014); Lok Sabha USQ 3559 (24.03.2022); PIB PRID 2222788.'));
add(H2('PM VIKAS: components and provisions'));
add(P(['PM VIKAS brings five earlier schemes of the Ministry into four components.', fn('MoMA, Guidelines for PM VIKAS, paras 1.3, 1.5, 1.5.3 and 2.5.1.'), ' The earlier schemes give a sense of the scale it inherits: by March 2022, 4.60 lakh people had been trained under Seekho aur Kamao (58% of them women), 98,697 had enrolled under Nai Manzil, and 23,130 had been trained under USTTAD since May 2015.', fn('Lok Sabha Unstarred Question 4740, answered 31.03.2022.')]));
add(chart('PM VIKAS combines five earlier schemes into four components', 'fig2/t_pmvikas.png', 'MoMA, Guidelines for PM VIKAS, paras 1.3, 1.5, 1.5.3 and 2.5.1.'));
add(table(['Provision in the guidelines', 'What it provides', 'Label'], [
  [[['Placement norm', { bold: true }]], '75% placement for the non-traditional skilling component (para 2.3.3.3(b), p. 10).', tag('op')],
  [[['Post-placement tracking', { bold: true }]], 'Placed trainees in non-traditional skilling tracked for at least three months (para 6.4.2, p. 27).', tag('op')],
  [[['Counselling on other schemes', { bold: true }]], 'Each trainee told about other welfare schemes and the documents needed.', tag('op')],
  [[['Biz Sakhis', { bold: true }]], '10% of women entrepreneurship trainees become Biz Sakhis who support other women entrepreneurs at their doorstep.', tag('op')],
  [[['One candidate record', { bold: true }]], 'Each candidate tracked on the Skill India Digital Hub, with dashboards by gender, religion, EWS status and disability.', tag('op')],
  [[['Education for dropouts', { bold: true }]], 'Open schooling (NIOS) for Class 8, 10 and 12, at least half of learners women (paras 1.5.3, 2.5.1).', tag('op')],
], [2500, 6106, 1600], { zebra: true }));
add(P([['Source: MoMA, Guidelines for PM VIKAS, pp. 10, 12, 25, 27, 28, 32; PM VIKAS Monitoring and Evaluation Guidelines, pp. 8, 25.', { size: 13, color: MUTED }]], { spacing: { before: 40, after: 120 } }));
add(H2('PMJVK: coverage and what evaluations found'));
add(P(['PMJVK funds community infrastructure in 1,300 Minority Concentration Areas, and 33% to 40% of its resources are earmarked for women-centric projects.', fn('Lok Sabha Unstarred Questions 3559 (24.03.2022) and 2951 (06.08.2025).'), ' The 2021 NITI Aayog evaluation found that about 59% of respondents in eight states were unaware of PMJVK facilities and 55% said no PMJVK meetings were held. Because PM VIKAS dovetails with PMJVK, assets such as hostels and skill centres can serve PM VIKAS trainees only if communities know about them. Within the Ministry, the Pre-Matric, Post-Matric and Merit-cum-Means scholarships have not been approved beyond 2021-22,', fn('Lok Sabha Unstarred Question 2951, answered 06.08.2025.'), ' and NMDFC has disbursed ₹9,632 crore to 25.86 lakh beneficiaries since 1994-95.', fn('Lok Sabha Unstarred Question 2840, answered 06.08.2025 (cumulative to 31.3.2025).')]));
add(chart('Minority Concentration Districts cluster in the Gangetic plain and the North East; the Ministry\'s district and block list reaches 329 districts', 'fig2/t_maps_targeting.png', 'MoMA, List of Minority Concentration Districts (2001 census districts matched to Census 2011 boundaries); district and block list provided by MoMA (19,636 entries; districts created after 2011 shown within their 2011 parent district; 97 entries without a district not shown). Maps not to scale.'));
add(box('clock', 'Still to be added to this section', [
  'The delivery architecture (roles of the Ministry, States and PIAs, PIA selection, fund flow and monitoring) and current PM VIKAS progress figures, each from an official source.',
]));

// ---------- 2. Survey
add(H1('2. Survey findings', 'survey'));
add(P('Survey results will be added when the response sheet is shared. They will be reported separately from official statistics, labelled as primary evidence, and give the number of respondents behind each figure.'));

// ---------- 3. Challenges
add(H1('3. Key implementation challenges', 'challenge', true));
add(P('The challenges below are those that official evaluations and statistics point to. Causes are given only where the evidence states them; others are marked to be confirmed with the implementation team, whose experience will be added as a separate source.'));
add(chart('Many eligible people do not know about the schemes, and borrowers report procedural difficulties', 'fig2/t_access.png', 'NITI Aayog DMEO (2021), Vol. 4: MoMA, pp. 89-90; NMDFC (2019), Impact Study of Beneficiaries Financed 2016-17, p. 42; CMRSD for MoMA (2016), p. 139.', 1, 'Share of respondents in each study, %.'));
add(table(['Challenge', 'Evidence', 'Cause stated in the evidence', 'Stage'], [
  [[['C1. Low awareness', { bold: true }]], 'About 59% unaware of PMJVK facilities; 55% said no meetings held; 33.1% of beneficiaries aware of the 15 Point Programme.', 'Few community meetings held. Others to be confirmed.', 'Mobilisation'],
  [[['C2. Documents and repeat visits', { bold: true }]], ['56% of NMDFC borrowers (2016-17) reported difficulties. In the 2014-16 cohort, 7.2% did, most often over documents (42%) and repeat visits (31%).', fn('NMDFC (2018), Impact Study of Beneficiaries Financed 2014-2016, pp. 13, 31; NMDFC (2019), p. 42.')], 'Documents and repeat visits.', 'Application'],
  [[['C3. Working capital and markets', { bold: true }]], ['38% of NMDFC micro-finance beneficiaries report difficulty with working capital and 28% with marketing.', fn('NMDFC (2019), Socio-economic Impact Study of Beneficiaries Financed during 2016-17, prepared by CMRSD, p. 15.')], 'Working capital and market access.', 'Enterprise'],
  [[['C4. Training does not always lead to work', { bold: true }]], ['41.9% of formally trained women are outside the labour force, against 11.3% of trained men (all communities).', fn('MoSPI, PLFS 2023-24, Table 12 (p. A-39) and Table 14 (p. A-50).')], 'To be confirmed.', 'Placement'],
  [[['C5. Convergence weakens after planning', { bold: true }]], ['84% of 92 schemes converged in planning, 16% in monitoring and evaluation.', fn('NITI Aayog DMEO (2022), Convergence: Unlocking Synergies with other Government Programmes, pp. 15, 29.')], 'To be confirmed.', 'Monitoring'],
  [[['C6. Early exit from school', { bold: true }]], ['92% of families whose children dropped out cite parental poverty; early marriage of girls is cited by 40% of families in Bihar and 19% in Maharashtra.', fn('National Productivity Council for MoMA (undated; data 2014-15 to 2016-17), Examining the Reasons for High Drop-Out Rates among All Minority Communities, printed pp. viii, 161-162.')], 'Parental poverty and illiteracy; early marriage.', 'Education'],
  [[['C7. Jobs and wages differ by state', { bold: true }]], ['Salaried workers earned ₹27,606 a month in Telangana and ₹17,559 in West Bengal (April-June 2024). Youth unemployment is 29.9% in Kerala against 10.2% nationally (all communities).', fn('MoSPI, PLFS 2023-24, Table 38 (p. A-235) and Table 18 (p. A-70).')], 'Local labour markets differ.', 'Placement and mobility'],
], [2200, 4606, 2100, 1300], { zebra: true }));
add(chart('Four in ten trained women are outside the labour force, convergence fades after planning, and youth unemployment varies widely by state', 'fig2/t_training.png', 'MoSPI, PLFS Annual Report 2023-24, Tables 14 and 18 (all communities); NITI Aayog DMEO (2022), pp. 15, 29. Map not to scale.'));

// ---------- 4. Related schemes
add(H1('4. Related schemes and initiatives', 'schemes', true));
add(P(['PM VIKAS covers one part of a longer journey from school to work and enterprise. The table shows the schemes that serve the same people at each stage and whether the PM VIKAS guidelines already link to them. Minority reach in line-ministry schemes is not routinely published (data gap D8). Twenty-five of the 90 Minority Concentration Districts are also Aspirational Districts, where district teams are already in place.', fn('Name-matched analysis of MoMA\'s 90 Minority Concentration Districts and NITI Aayog\'s 112 Aspirational Districts; some districts have since been split, so the count may change.')]));
add(table(['Stage', 'Scheme', 'Ministry', 'Link with PM VIKAS today', 'Label'], [
  ['School', [['PM VIKAS education component', { bold: true }]], 'Minority Affairs', 'Part of PM VIKAS', tag('op')],
  ['School', 'Samagra Shiksha; PM POSHAN; KGBV; NIOS', 'Education', 'NIOS delivers the education component', tag('existing')],
  ['School and higher education', 'Pre-Matric, Post-Matric and Merit-cum-Means scholarships', 'Minority Affairs', 'None', tag('ended')],
  ['Higher education', 'NMDFC education loans', 'Minority Affairs (NMDFC)', 'None stated in the guidelines', tag('existing')],
  ['Skills', [['PM VIKAS skilling and training', { bold: true }]], 'Minority Affairs', 'Core of PM VIKAS', tag('op')],
  ['Skills', 'Skill India Digital Hub', 'Skill Development and Entrepreneurship', 'Candidate tracking under the guidelines', tag('op')],
  ['Skills', 'PMKVY; apprenticeship schemes (including NAPS); ITIs', 'Skill Development and Entrepreneurship', 'None stated in the guidelines', tag('existing')],
  ['Skills', 'DDU-GKY', 'Rural Development', 'None stated in the guidelines', tag('existing')],
  ['Skills', 'National Career Service', 'Labour and Employment', 'None stated in the guidelines', tag('existing')],
  ['Work and enterprise', 'NMDFC credit; DAY-NRLM', 'Minority Affairs; Rural Development', 'None stated in the guidelines', tag('existing')],
  ['Work and enterprise', ['PM Vishwakarma: 30 lakh artisans registered, 23.09 lakh trained by 1 Dec 2025 (all communities)', fn('Ministry of Finance, Economic Survey 2025-26, para 12.54 (p. 503).')], 'MSME', 'None stated in the guidelines', tag('existing')],
  ['Work and enterprise', 'MUDRA; PMEGP; PM SVANidhi', 'Finance; MSME; Housing and Urban Affairs', 'None stated in the guidelines', tag('existing')],
  ['Infrastructure', [['PMJVK', { bold: true }]], 'Minority Affairs', 'Infrastructure component dovetails with PMJVK', tag('existing')],
  ['All stages', ['Prime Minister\'s New 15 Point Programme', fn('CMRSD for MoMA (2016), Evaluation of PM\'s New 15 Point Programme, p. 12.')], 'Several ministries', '15% of line-scheme targets, where possible', tag('existing')],
], [1500, 3200, 1950, 2156, 1400], { zebra: true }));

// ---------- 5. Data gaps
add(H1('5. Data gaps', 'data', true));
add(P('Planning and tracking PM VIKAS needs data by community, sex and place. Where only an all-community figure exists, it is used as a proxy and labelled. Where a community\'s own published indicator is below the all-India value, the table notes that the community may be more affected than the proxy shows.'));
add(table(['ID', 'What is missing', 'Closest published figure', 'What this may mean', 'How it can be collected'], [
  ['D1', 'Population by community and district after 2011', ['Census 2011, Table C-01', fn('Office of the Registrar General of India, Census of India 2011, Table C-01.')], '-', 'Next Census; PM VIKAS registration data in the meantime'],
  ['D2', 'Work outcomes for Buddhist, Jain and Parsi households', ['PLFS reports Hindu, Muslim, Christian and Sikh households only; NSS 589 groups Buddhist, Jain and Parsi households', fn('MoSPI, PLFS 2023-24, Appendix C para 2.33; NSS Report 589, pp. 39, 66.')], '-', 'MoSPI tabulations of PLFS unit-level data, with sample sizes'],
  ['D3', 'Training-to-work outcomes by community', 'All communities: 41.9% of trained women outside the labour force', 'Women\'s participation in Muslim (30.2%) and Sikh (33.0%) households is below the all-India 41.7%, so trained women in these households may be more affected', 'PLFS unit-level tables by religion, sex and training; PM VIKAS placement tracking'],
  ['D4', 'Dropout and transition by community', ['UDISE+ and AISHE give enrolment shares only (Muslim: 17.7% primary, 12.0% higher secondary, 5.0% higher education)', fn('MoE, UDISE+ 2023-24 Report, section 2.2; UDISE+ 2024-25, Table 6.9; MoE, AISHE 2023-24.')], 'The Muslim share falls below the population share of 14.2% from Class 11, so dropout before Class 11 may be higher; not published', 'Ministry of Education tables by community, including dropout and transition'],
  ['D5', 'Unpaid care work by community', ['All communities: 41 in 100 women and 21 in 100 men give unpaid care on a given day', fn('MoSPI, Time Use Survey 2024; PIB release PRID 2106113 (25 Feb 2025).')], 'Where women\'s participation is below the all-India value, care work may limit training participation more', 'TUS 2024 tables by religion; time-use questions in PM VIKAS baselines'],
  ['D6', 'Enterprise and credit by community', ['Sixth Economic Census (2013-14): 13.8% of proprietary establishments Muslim-owned', fn('MoSPI, Sixth Economic Census (2013-14), All India Report: Highlights.')], '-', 'NMDFC and PM VIKAS enterprise data; owner-religion tables in the next Economic Census'],
  ['D7', 'Wages and migration by community', ['Wages by state cover all communities; NSS 589: 23.8% of people in Muslim households live away from their last usual residence (29.1% nationally)', fn('MoSPI, NSS Report 589, Multiple Indicator Survey 2020-21, Statement 31, p. 46.')], '-', 'PLFS earnings by religion and state; PM VIKAS placement location and wage'],
  ['D8', 'Minority reach of line-ministry schemes', 'Not routinely published', '-', 'Line ministries to report minority beneficiaries of 15 Point Programme schemes'],
  ['D9', 'PM VIKAS progress and outcomes', 'Not yet published; the guidelines provide for dashboards', '-', 'Publish dashboard data at regular intervals'],
], [500, 2000, 2900, 2700, 2106], { zebra: true, boldFirst: true }));

// ---------- 6. Demographics
add(H1('6. Minority demographics', 'demo', true));
add(P(['The six notified minority communities number 23.4 crore people, about one in five Indians (19.3%), at Census 2011.', fn('Census of India 2011, Table C-01; MoMA, PIB PRID 1797307 (10 Feb 2022): Muslims 17.22 crore, Christians 2.78 crore, Sikhs 2.08 crore, Buddhists 0.84 crore, Jains 0.45 crore; Parsis 57,264 (PRID 1807702). Together 23.38 crore, 19.3% of 121.09 crore.'), ' Half of them live in 95 of India\'s 640 districts. Half of all Sikhs live in 9 districts, all in Punjab; 77.36% of Buddhists live in Maharashtra.', fn('Analysis of Census 2011 district-level C-01 counts (640 districts): the smallest set of districts that together hold half of each community; NITI Aayog DMEO (2021), Vol. 4: MoMA, p. 35.'), ' For Sikh, Buddhist and Jain communities, outreach and centre location can be planned district by district; for Muslim and Christian communities, state-wide channels are also needed.']));
add(chart('Each community lives in its own set of districts: half of all Sikhs in 9, half of all Muslims across 74', 'fig2/t_demography.png', 'Analysis of Census of India 2011, Table C-01, district level (Muslims, Christians, Sikhs, Buddhists and Jains; Parsis are not shown separately in district tables). Maps not to scale.'));
add(chart('Each community differs from the all-India value in its own way', 'fig2/t_profile.png', 'Census 2011 literacy: MoMA, PIB PRID 1814470 and PRID 2109862; graduate level: NITI Aayog DMEO (2021), Vol. 4, p. 47, Figure 12 (Census 2011 and KPMG analysis); PLFS Annual Report 2023-24, Tables 47-49.', 1, 'PLFS records the religion of the household head and does not publish Buddhist and Jain values.'));
add(P(['Muslim literacy is below the all-India value, but the gap narrowed from 4.5 points in Census 2011 to 1.4 points in 2023-24. The Muslim share of enrolment falls at each stage, from 17.7% at primary to 12.0% at higher secondary and 5.0% in higher education, while minority enrolment in higher education grew by 52.6% between 2014-15 and 2023-24.', fn('Ministry of Education, UDISE+ 2024-25, Table 6.9; MoE, AISHE 2023-24 (2026): minority enrolment 33.3 lakh, up from 21.8 lakh in 2014-15.'), ' This matters for PM VIKAS because its education component serves school dropouts and its skilling component draws on young people who have left school.']));
add(chart('The Muslim share of enrolment falls below the population share from Class 11; women\'s participation differs from the all-India value far more than men\'s', 'fig2/t_edu_work.png', 'Ministry of Education, UDISE+ 2024-25, Table 6.9; AISHE 2023-24; Census 2011, C-01; MoSPI, PLFS Annual Report 2023-24, Statement 20 and Table 48 (religion of household head).'));

// ---------- 7. Gap list
add(H1('7. Consolidated list of gaps', 'list'));
add(P('These gaps bring together sections 3, 5 and 6. Solutions will be mapped to them in the next stage; one solution may address several gaps. Gaps from the survey and the implementation team\'s experience will be added with their own identifiers.'));
add(table(['ID', 'Gap', 'Type', 'Evidence'], [
  ['G1', 'Many eligible people do not know about PM VIKAS, PMJVK facilities or related schemes.', 'Delivery', 'C1'],
  ['G2', 'Documents and repeat visits make it hard to apply and to receive benefits.', 'Delivery', 'C2'],
  ['G3', 'Enterprises supported by credit face working-capital and marketing difficulties after the loan.', 'Outcomes', 'C3'],
  ['G4', 'Training does not always lead to work, and the gap is largest for women.', 'Outcomes', 'C4; D3, D5'],
  ['G5', 'Convergence with other schemes is planned but rarely monitored.', 'Governance', 'C5; D8'],
  ['G6', 'Household finances and early marriage lead to early exit from school.', 'Outcomes', 'C6; D4'],
  ['G7', 'Jobs and wages differ sharply between states, so local placement and moving for work both carry costs.', 'Outcomes', 'C7; D7'],
  ['G8', 'Outreach must work both in a few districts (Sikh, Buddhist, Jain) and across whole states (Muslim, Christian).', 'Targeting', 'Section 6'],
  ['G9', 'Work, education and enterprise outcomes are not published for every community.', 'Data', 'D2, D4, D6'],
  ['G10', 'PM VIKAS progress and outcome data are not yet published, although the guidelines provide for dashboards.', 'Data', 'D9'],
  ['G11', 'Population data by community and district date from 2011.', 'Data', 'D1'],
], [700, 6806, 1300, 1400], { zebra: true, boldFirst: true }));
add(P([['Method. ', { bold: true, size: 14, color: MUTED }], ['PLFS and NSS assign the household head\'s religion to all members, so the report says "Muslim households" and so on. Maps use Census 2011 district boundaries and are not to scale. Computed figures are described as analysis; all other figures are reproduced as published.', { size: 14, color: MUTED }]], { spacing: { before: 160 } }));

// =====================================================================================
const doc = new Document({
  features: { updateFields: true }, creator: 'EY', title: 'Strengthening PM VIKAS',
  styles: {
    default: { document: { run: { font: FONT, size: BS, color: INK } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, font: FONT, color: INK }, paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 21, bold: true, font: FONT, color: INK }, paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 1 } },
    ]
  },
  numbering: { config: [{ reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { run: { bold: true, color: BLUE }, paragraph: { indent: { left: 340, hanging: 340 } } } }] }] },
  footnotes: notes,
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 850, bottom: 850, left: 850, right: 850, footer: 400 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 15, color: MUTED })] })] }) },
    children: body
  }]
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(process.argv[2], b); console.log('written', process.argv[2], 'footnotes', nId); });
