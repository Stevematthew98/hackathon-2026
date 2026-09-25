// Idea 5 · Structured Case Report export.
//
// Generates a clean, judge-ready markdown report from the SAME decision object
// the page renders — never a parallel data source. Downloaded via a Blob URL;
// nothing is uploaded anywhere.

export function buildReport(decision) {
  const { graphCase: g } = decision;
  const now = new Date();
  const when = now.toLocaleString([], {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const L = [];
  const h = (t, lvl = 2) => L.push(`${'#'.repeat(lvl)} ${t}`, '');
  const kv = (k, val) => L.push(`- **${k}:** ${val}`);
  const relsOf = (t) => decision.baseRels.filter((r) => (r.effectiveType || r.type) === t);

  L.push('# TRUSTGUARD — STRUCTURED CASE REPORT', '');
  L.push('*Evidence & Assessment Report — AI-assisted, not an official determination.*', '');
  kv('Case ID', decision.caseLabel);
  kv('Case type', decision.caseType);
  kv('Report generated', when);
  kv('Source', g.caseType);
  L.push('');

  h('Final assessment');
  L.push(`**${decision.verdict}**`, '');
  L.push(decision.verdictMeta.note, '');
  L.push(`*Assessment based on available evidence.*`, '');

  h('Evidence inventory');
  g.evidence.forEach((e) => L.push(`- ${e}`));
  L.push('');

  h('Extracted claims');
  g.claims.forEach((c) => L.push(`- **${c.label}:** ${c.value} — *${c.source} (${c.status})*`));
  L.push('');

  const sections = [
    ['CONFLICT relationships', 'CONFLICT'],
    ['ANOMALY relationships', 'ANOMALY'],
    ['UNKNOWN relationships', 'UNKNOWN'],
    ['SUPPORT relationships', 'SUPPORT'],
  ];
  sections.forEach(([title, type]) => {
    h(title);
    const rs = relsOf(type);
    if (!rs.length) { L.push('_None._', ''); return; }
    rs.forEach((r) => {
      L.push(`- **${r.id} — ${r.title}**`);
      L.push(`  - Claim A: ${r.claimA} (${r.sourceA})`);
      L.push(`  - Claim B: ${r.claimB} (${r.sourceB})`);
      L.push(`  - Check: ${r.check} · Method: ${r.method}`);
      L.push(`  - Result: ${r.result}`);
      if (r.confidence && r.confidence !== '—') L.push(`  - Confidence: ${r.confidence}`);
      L.push(`  - Uncertainty: ${r.uncertainty}`);
    });
    L.push('');
  });

  h('Independent verification history');
  if (!decision.checks.length) {
    L.push('_No independent verification has been performed on this case yet._', '');
  } else {
    decision.checks.forEach((c, i) => {
      L.push(`**Verification #${i + 1} — ${c.state}** (${c.at})`);
      kv('Question', c.question);
      kv('Independent source', c.sourceType || '—');
      kv('Method', c.method || 'Independent source check');
      kv('Result', c.resultText || '—');
      if (c.edgeAfter) kv('Graph update', `UNKNOWN → ${c.edgeAfter}`);
      L.push('');
    });
  }

  h('Why this decision');
  decision.reasons.forEach((r, i) => {
    if (r.kind === 'verified') {
      const v = r.record;
      L.push(`${i + 1}. **Independent check — ${r.rel.title}** [${v.previousStatus} → ${v.newStatus}]: ${v.result}`);
    } else {
      const rel = r.rel;
      L.push(`${i + 1}. **${rel.id} — ${rel.title}** [${rel.effectiveType || rel.type}]: ${rel.why}`);
    }
  });
  L.push('');

  h('Uncertainty');
  if (decision.noUncertainty) {
    L.push('No material unresolved uncertainty identified from the available evidence.', '');
  } else {
    decision.uncertainties.forEach((u) => L.push(`- **${u.label}:** ${u.text}`));
    L.push('');
  }

  h('Recommended next action');
  L.push(`**${decision.nextAction}**`, '');

  h('Important disclaimer');
  L.push(
    'This report is an AI-assisted assessment based on the available evidence. ' +
    'It is not proof of criminal activity and does not replace independent ' +
    'investigation or official determination.',
    ''
  );
  L.push('Prototype verification results shown here are simulated and labeled as such in the live demonstration.', '');

  return {
    filename: `trustguard-case-report-${decision.caseLabel.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`,
    text: L.join('\n'),
  };
}

export function downloadReport(decision) {
  const { filename, text } = buildReport(decision);
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return filename;
}
